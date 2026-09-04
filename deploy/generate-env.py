#!/usr/bin/env python3
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

def main() -> None:
    deploy_dir = Path(__file__).resolve().parent
    postgres_password = secrets.token_hex(16)
    jwt_secret = secrets.token_hex(32)
    auth_secret = base64.b64encode(secrets.token_bytes(32)).decode()
    admin_password = secrets.token_urlsafe(12)
    s3_access = "instaads_minio"
    s3_secret = secrets.token_hex(24)

    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = b64url(
        json.dumps(
            {
                "role": "service_role",
                "iss": "supabase",
                "iat": int(time.time()),
                "exp": int(time.time()) + 60 * 60 * 24 * 365 * 10,
            },
            separators=(",", ":"),
        ).encode()
    )
    signature = b64url(
        hmac.new(jwt_secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    service_jwt = f"{header}.{payload}.{signature}"

    env = f"""POSTGRES_PASSWORD={postgres_password}
JWT_SECRET={jwt_secret}
SUPABASE_SERVICE_ROLE_KEY={service_jwt}
S3_ACCESS_KEY={s3_access}
S3_SECRET_KEY={s3_secret}
AUTH_URL=http://179.199.144.9
AUTH_SECRET={auth_secret}
ADMIN_PASSWORD={admin_password}
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
GOOGLE_AI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
"""
    (deploy_dir / ".env").write_text(env, encoding="utf-8")
    secrets_path = Path("/root/instaads-secrets.txt")
    secrets_path.write_text(
        f"ADMIN_PASSWORD={admin_password}\nJWT_SECRET={jwt_secret}\n",
        encoding="utf-8",
    )
    os.chmod(secrets_path, 0o600)
    print(f"ADMIN_PASSWORD={admin_password}")

if __name__ == "__main__":
    main()
