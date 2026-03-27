"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getAppOrigin } from "@/lib/utils";

type PaymentLinkCardProps = {
  link: string;
  name: string;
};

export function PaymentLinkCard({ link, name }: PaymentLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const fullLink = useMemo(() => {
    if (link.startsWith("http://") || link.startsWith("https://")) {
      return link;
    }

    if (link.startsWith("/")) {
      const origin = getAppOrigin();
      return origin ? `${origin}${link}` : link;
    }

    return `https://${link}`;
  }, [link]);

  const shareText = encodeURIComponent(`Pay ${name} securely via CraftID: ${fullLink}`);
  const waHref = `https://wa.me/?text=${shareText}`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex items-center gap-4 rounded-lg border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="rounded-md p-2" style={{ background: "white" }}>
        <QRCodeSVG value={fullLink} size={80} fgColor="#09090E" bgColor="#FFFFFF" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate text-sm" style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}>
          {link}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-[10px] border px-3 py-2 text-xs"
            style={{ borderColor: "var(--border-light)", color: "var(--text-1)", background: "var(--surface-2)" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>

          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-[10px] px-3 py-2 text-xs font-medium"
            style={{ background: "var(--green)", color: "white" }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          Every payment builds your CraftScore
        </p>
      </div>
    </div>
  );
}
