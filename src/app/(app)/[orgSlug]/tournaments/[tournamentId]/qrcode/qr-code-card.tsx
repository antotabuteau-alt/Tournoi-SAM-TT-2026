"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeCard({ url }: { url: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-white p-6">
      <QRCodeSVG value={url} size={220} />
    </div>
  );
}
