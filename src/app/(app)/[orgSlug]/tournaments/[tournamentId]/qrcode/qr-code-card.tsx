"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeCard({ url }: { url: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <QRCodeSVG value={url} size={220} />
    </div>
  );
}
