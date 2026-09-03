"use client";

import {
  DEVICE_ID_HEADER,
  DEVICE_ID_STORAGE_KEY,
  isValidDeviceId,
} from "@/lib/device/constants";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (isValidDeviceId(existing)) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  return id;
}

export function getDeviceHeaders(): Record<string, string> {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return {};
  return { [DEVICE_ID_HEADER]: deviceId };
}
