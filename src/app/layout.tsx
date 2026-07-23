import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/contexts/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wakeely Pro | وكيلك المحترف",
  description: "Bilingual legal practice & litigation management platform.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the saved language from a cookie ON THE SERVER so the very first
  // HTML sent to the browser already has the correct dir/lang attributes —
  // this avoids the "flash of wrong direction" you'd get from a client-only
  // localStorage approach (which is what the old prototype did).
  const cookieStore = await cookies();
  const lang = cookieStore.get("wakeely_lang")?.value === "ar" ? "ar" : "en";
  const isRtl = lang === "ar";

  return (
    <html lang={lang} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={isRtl ? "font-arabic" : "font-latin"}>
        <LanguageProvider initialLanguage={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
