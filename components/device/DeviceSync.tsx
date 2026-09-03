"use client";

import { useEffect } from "react";
import { getDeviceHeaders, getOrCreateDeviceId } from "@/lib/device/client";

export function DeviceSync() {
  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;

    void fetch("/api/device/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getDeviceHeaders(),
      },
      body: JSON.stringify({ deviceId }),
    });
  }, []);

  return null;
}
