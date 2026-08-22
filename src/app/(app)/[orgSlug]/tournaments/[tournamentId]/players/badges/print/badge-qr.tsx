"use client";

import { QRCodeSVG } from "qrcode.react";

export function BadgeQr({ url }: { url: string }) {
  return <QRCodeSVG value={url} size={72} />;
}
