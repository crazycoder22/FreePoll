"use client";

import { useCallback, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QrCodeModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function QrCodeModal({ url, title, onClose }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [title]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div ref={canvasRef} className="flex justify-center mb-4">
          <QRCodeCanvas
            value={url}
            size={200}
            level="M"
            marginSize={2}
          />
        </div>

        <p className="text-xs text-gray-500 text-center mb-4 break-all">{url}</p>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Download PNG
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
            }}
            className="flex-1 py-2 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
