import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/auth/permissions";

// Same Gemini call the old prototype made in server.ts's /api/ai/summarize —
// that part of the old app was already correct (key stays server-side, never
// shipped to the browser). What's added here: an auth check, and writing the
// result back through Supabase (so RLS decides who's allowed to update this
// row) instead of mutating an in-memory array that resets on every deploy.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!can.useAiDrafting(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId, docName, category } = await req.json();
  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  const prompt = `You are an expert legal assistant specialized in Middle Eastern
commercial litigation and Sharia-compliant corporate contracts.
Summarize the legal significance of a document named "${docName}" categorized as "${category}".
Provide: 1) key legal issues, 2) recommended action points, 3) 3-4 comma-separated tags.
Respond as clean JSON with 'summary' and 'tags' fields only, no markdown fences.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(response.text.trim());

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .update({ ai_summary: parsed.summary, ai_tags: parsed.tags })
      .eq("id", documentId)
      .select()
      .single();

    // RLS ("documents: attorneys update") rejects this if the caller isn't
    // staffed on the document's matter — `error` here can mean that.
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Gemini summarize failed:", err);
    return NextResponse.json({ error: "AI summarization failed" }, { status: 500 });
  }
}
