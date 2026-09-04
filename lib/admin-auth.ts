import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "instaads_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

function useSecureCookies(): boolean {
  return process.env.AUTH_URL?.startsWith("https://") ?? false;
}

function signPayload(payload: string): string {
  const secret = getAdminPassword();
  if (!secret) throw new Error("ADMIN_PASSWORD não configurado.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function buildSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function parseSessionToken(token: string): boolean {
  const secret = getAdminPassword();
  if (!secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = signPayload(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const { exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return parseSessionToken(token);
}

export function attachAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE, buildSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    maxAge: 0,
    path: "/",
  });
}

export async function requireAdminSession(): Promise<NextResponse | null> {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD não configurado." },
      { status: 503 },
    );
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return null;
}
