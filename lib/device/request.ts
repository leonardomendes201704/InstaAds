import {
  currentPeriodStartDate,
  DEVICE_ID_COOKIE,
  DEVICE_ID_HEADER,
  isValidDeviceId,
} from "@/lib/device/constants";

export function getDeviceIdFromRequest(request: Request): string | null {
  const header = request.headers.get(DEVICE_ID_HEADER);
  if (isValidDeviceId(header)) return header;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${DEVICE_ID_COOKIE}=([^;]+)`),
  );
  const cookieValue = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (isValidDeviceId(cookieValue)) return cookieValue;

  return null;
}

export function deviceCookieHeader(deviceId: string): string {
  const maxAge = 60 * 60 * 24 * 365 * 2;
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
      ? "; Secure"
      : "";
  return `${DEVICE_ID_COOKIE}=${encodeURIComponent(deviceId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export { currentPeriodStartDate };
