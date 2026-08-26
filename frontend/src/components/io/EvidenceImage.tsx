"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

/**
 * Fetches an evidence image with the officer's auth token and renders it.
 * The native <img> element cannot send Authorization headers,
 * so we fetch the binary as a blob and create an object URL.
 */
export function EvidenceImage({
  incidentId,
  evidenceId,
  token,
  alt,
  className,
}: {
  incidentId: string;
  evidenceId: string;
  token: string | null;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token || !evidenceId) return;
    let revoked = false;
    const url = `${API_URL}/api/officer/incidents/${incidentId}/evidence/${evidenceId}/file`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!revoked) {
          setSrc(URL.createObjectURL(blob));
        }
      })
      .catch(() => {
        if (!revoked) setError(true);
      });

    return () => {
      revoked = true;
      if (src) URL.revokeObjectURL(src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, evidenceId, token]);

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center rounded-control border border-white/10 bg-black/20 text-xs text-white/40">
        Image could not be loaded
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex h-32 items-center justify-center rounded-control border border-white/10 bg-black/20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className ?? "max-h-48 w-full object-contain"}
      loading="lazy"
    />
  );
}
