export const DEVICE_ID_HEADER = "x-device-id";
export const DEVICE_ID_COOKIE = "instaads_did";
export const DEVICE_ID_STORAGE_KEY = "instaads_device_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function currentPeriodStartDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
