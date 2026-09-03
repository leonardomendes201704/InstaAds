import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedApiPrefixes = [
  "/api/generate-ad",
  "/api/generations",
  "/api/suggest-text",
  "/api/device/sync",
  "/api/device/access-request",
];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  const isProtectedApi = protectedApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtectedApi && !request.auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/generate-ad",
    "/api/generations",
    "/api/suggest-text",
    "/api/device/sync",
    "/api/device/access-request",
  ],
};
