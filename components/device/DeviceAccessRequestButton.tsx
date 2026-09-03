"use client";

import { useState } from "react";
import { getDeviceHeaders, getOrCreateDeviceId } from "@/lib/device/client";

interface DeviceAccessRequestButtonProps {
  onSuccess?: () => void;
}

export function DeviceAccessRequestButton({ onSuccess }: DeviceAccessRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/device/access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDeviceHeaders(),
        },
        body: JSON.stringify({ deviceId, message }),
      });

      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar solicitação.");

      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar solicitação.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-2 text-xs text-green-700">
        Solicitação enviada. Você será liberado após aprovação do administrador.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Opcional: explique por que precisa de acesso neste dispositivo"
        rows={2}
        className="w-full rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs"
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSubmit()}
        className="rounded-lg bg-accent-purple px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar solicitação de acesso"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
