#!/usr/bin/env node
/**
 * Gera JWT service_role para PostgREST (compatível com @supabase/supabase-js).
 * Uso: node deploy/generate-service-jwt.mjs <JWT_SECRET>
 */
import { createHmac } from "node:crypto";

const secret = process.argv[2];
if (!secret || secret.length < 32) {
  console.error("Uso: node deploy/generate-service-jwt.mjs <JWT_SECRET com 32+ chars>");
  process.exit(1);
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = base64url(
  JSON.stringify({
    role: "service_role",
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10,
  }),
);
const signature = createHmac("sha256", secret)
  .update(`${header}.${payload}`)
  .digest("base64url");

process.stdout.write(`${header}.${payload}.${signature}`);
