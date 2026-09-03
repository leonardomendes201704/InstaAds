import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "instaads_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreateSessionId(): Promise<{
  sessionId: string;
  isNew: boolean;
}> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    return { sessionId: existing, isNew: false };
  }

  return { sessionId: crypto.randomUUID(), isNew: true };
}

export function attachSessionCookie(
  response: NextResponse,
  sessionId: string,
  isNew: boolean,
) {
  if (!isNew) return;

  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
}
