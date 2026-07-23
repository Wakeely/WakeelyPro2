"use server";

import { cookies } from "next/headers";

export async function setLanguageCookie(lang: "en" | "ar") {
  const cookieStore = await cookies();
  cookieStore.set("wakeely_lang", lang, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}
