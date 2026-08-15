interface QrCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QrCode({ url, size = 300, className }: QrCodeProps) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  return <img className={className} src={src} alt="QR code" width={size} height={size} />;
}
