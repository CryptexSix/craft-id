"use client";

import { getAppOrigin } from "@/lib/utils";

export type CraftData = {
  name: string;
  skill: string;
  craftIdNumber: string;
  location: string;
  phone: string;
  memberSince: string;
  reportPeriod: { from: string; to: string; days: number };
  totalRevenue: number;
  totalTransactions: number;
  uniqueClients: number;
  averageTransaction: number;
  highestTransaction: number;
  craftScore: number; // 0-850
  transactions: {
    date: string;
    clientRef: string;
    description: string;
    amount: number;
  }[];
};

const PRIMARY = "#1A1A2E";
const ACCENT = "#00A86B";
const SECTION_BG = "#F0F0F0";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatNaira(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₦ ${safe.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function scoreLabel(score: number) {
  if (score >= 650) return "EXCELLENT";
  if (score >= 500) return "GOOD STANDING";
  if (score >= 350) return "FAIR";
  return "BUILDING";
}

function scoreBar(score: number) {
  const blocks = 12;
  const filled = Math.round((clamp(score, 0, 850) / 850) * blocks);
  return "=".repeat(filled) + "-".repeat(blocks - filled);
}

export async function generateCraftIDReport(craftData: CraftData) {
  // Dynamic imports for better browser compatibility
  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const vfsFontsMod = await import("pdfmake/build/vfs_fonts");

  const pdfMake = ((pdfMakeMod as any)?.default ?? pdfMakeMod) as any;

  // Extract VFS from the fonts module (shape varies by bundler)
  const vfs =
    (vfsFontsMod as any)?.pdfMake?.vfs ??
    (vfsFontsMod as any)?.default?.pdfMake?.vfs ??
    (vfsFontsMod as any)?.vfs ??
    (vfsFontsMod as any)?.default?.vfs ??
    (vfsFontsMod as any)?.default ??
    (vfsFontsMod as any);

  // Assign VFS to pdfMake
  if (vfs && typeof vfs === "object" && vfs["Roboto-Regular.ttf"]) {
    pdfMake.vfs = vfs;
  }

  // Configure Roboto font family - fall back to Regular if Medium variants unavailable
  const hasFullRoboto =
    pdfMake.vfs &&
    pdfMake.vfs["Roboto-Regular.ttf"] &&
    pdfMake.vfs["Roboto-Medium.ttf"] &&
    pdfMake.vfs["Roboto-Italic.ttf"] &&
    pdfMake.vfs["Roboto-MediumItalic.ttf"];

  pdfMake.fonts = {
    Roboto: hasFullRoboto
      ? {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        }
      : {
          // Fallback: use Regular for all variants if Medium not available
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Regular.ttf",
          italics: "Roboto-Regular.ttf",
          bolditalics: "Roboto-Regular.ttf",
        },
  };

  if (!pdfMake.vfs || !pdfMake.vfs["Roboto-Regular.ttf"]) {
    throw new Error(
      "PDF fonts failed to load. Please refresh and try again (Roboto vfs missing).",
    );
  }

  const generated = new Date();
  const reportId = `CID-2026-${craftData.craftIdNumber}-${String(Date.now()).slice(-4)}`;
  const origin = getAppOrigin();
  const verifyUrl = origin
    ? `${origin}/verify/${craftData.craftIdNumber}`
    : `/verify/${craftData.craftIdNumber}`;

  let qrDataUrl: string | null = null;
  try {
    const qrcodeMod = await import("qrcode");
    const QRCode = ((qrcodeMod as any)?.default ?? qrcodeMod) as any;
    if (QRCode?.toDataURL) {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
    }
  } catch {
    qrDataUrl = null;
  }

  const identityRows = [
    ["Full Name", craftData.name],
    ["Craft/Skill", craftData.skill],
    ["CraftID Number", craftData.craftIdNumber],
    ["Location", craftData.location],
    ["Phone", craftData.phone],
    ["Member Since", craftData.memberSince],
  ];

  const summaryRows = [
    [
      "Reporting Period",
      `${craftData.reportPeriod.from} → ${craftData.reportPeriod.to} (${craftData.reportPeriod.days} days)`,
    ],
    ["Total Revenue", formatNaira(craftData.totalRevenue)],
    ["Total Transactions", String(craftData.totalTransactions)],
    ["Unique Clients Served", String(craftData.uniqueClients)],
    ["Average Transaction Value", formatNaira(craftData.averageTransaction)],
    ["Highest Single Transaction", formatNaira(craftData.highestTransaction)],
  ];

  const ledgerBody: any[] = [
    [
      { text: "DATE", color: "white", bold: true, fontSize: 10 },
      { text: "CLIENT REF", color: "white", bold: true, fontSize: 10 },
      { text: "DESCRIPTION", color: "white", bold: true, fontSize: 10 },
      {
        text: "AMOUNT",
        color: "white",
        bold: true,
        fontSize: 10,
        alignment: "right",
      },
    ],
  ];

  let ledgerTotal = 0;
  for (const tx of craftData.transactions) {
    const amount = Number(tx.amount) || 0;
    ledgerTotal += amount;
    ledgerBody.push([
      { text: tx.date, fontSize: 9, color: PRIMARY },
      { text: tx.clientRef, fontSize: 9, color: PRIMARY },
      { text: tx.description, fontSize: 9, color: PRIMARY },
      {
        text: formatNaira(amount),
        fontSize: 9,
        color: PRIMARY,
        alignment: "right",
      },
    ]);
  }

  ledgerBody.push([
    { text: "TOTAL", colSpan: 3, bold: true, fontSize: 10, color: PRIMARY },
    {},
    {},
    {
      text: formatNaira(ledgerTotal),
      bold: true,
      fontSize: 10,
      color: PRIMARY,
      alignment: "right",
    },
  ]);

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],

    footer: (currentPage: number, pageCount: number) => {
      return {
        margin: [40, 10, 40, 20],
        columns: [
          {
            width: "*",
            stack: [
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 380,
                    y2: 0,
                    lineWidth: 0.8,
                    lineColor: "#D7D7D7",
                  },
                ],
              },
              {
                text: "This report was automatically generated by CraftID and is backed by transaction data processed through Interswitch Payment Infrastructure.",
                fontSize: 8,
                color: PRIMARY,
                margin: [0, 6, 0, 0],
              },
              {
                text: `Verify this document: ${verifyUrl}`,
                fontSize: 8,
                color: PRIMARY,
                margin: [0, 2, 0, 0],
              },
              {
                text: "CraftID is not a licensed lender. This document serves as an income verification instrument only.",
                fontSize: 7,
                italics: true,
                color: PRIMARY,
                margin: [0, 2, 0, 0],
              },
              {
                text: `Page ${currentPage} of ${pageCount}`,
                fontSize: 7,
                color: "#777777",
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            width: 110,
            table: {
              widths: ["*"] as any,
              body: [
                [
                  qrDataUrl
                    ? {
                        image: qrDataUrl,
                        alignment: "center",
                        fit: [90, 90],
                        margin: [0, 6, 0, 6],
                      }
                    : {
                        text: "QR unavailable",
                        alignment: "center",
                        fontSize: 9,
                        bold: true,
                        color: PRIMARY,
                        margin: [0, 18, 0, 18],
                      },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => "#D7D7D7",
              vLineColor: () => "#D7D7D7",
            },
          },
        ],
      };
    },

    content: [
      {
        columns: [
          {
            width: "*",
            text: "CraftID",
            color: PRIMARY,
            bold: true,
            fontSize: 20,
            margin: [0, 0, 0, 0],
          },
          {
            width: 240,
            stack: [
              {
                text: "INCOME VERIFICATION REPORT",
                alignment: "right",
                color: PRIMARY,
                bold: true,
                fontSize: 12,
              },
              {
                text: `Report ID: ${reportId}`,
                alignment: "right",
                color: PRIMARY,
                fontSize: 9,
                margin: [0, 4, 0, 0],
              },
              {
                text: `Generated: ${formatDateISO(generated)}`,
                alignment: "right",
                color: PRIMARY,
                fontSize: 9,
              },
              {
                text: "Valid for: 90 days",
                alignment: "right",
                color: ACCENT,
                bold: true,
                fontSize: 9,
              },
            ],
          },
        ],
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 12,
            x2: 515,
            y2: 12,
            lineWidth: 1,
            lineColor: "#D7D7D7",
          },
        ],
        margin: [0, 0, 0, 18],
      },

      // SECTION 1
      {
        table: {
          widths: ["*"] as any,
          body: [
            [
              {
                text: "ARTISAN IDENTITY",
                fillColor: SECTION_BG,
                color: PRIMARY,
                bold: true,
                fontSize: 10,
                margin: [8, 6, 8, 6],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        table: {
          widths: [140, "*"] as any,
          body: identityRows.map(([label, value]) => [
            {
              text: label,
              fontSize: 9,
              color: "#444444",
              margin: [0, 5, 0, 5],
            },
            { text: value, fontSize: 9, color: PRIMARY, margin: [0, 5, 0, 5] },
          ]),
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E6E6E6",
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
        margin: [0, 8, 0, 14],
      },

      // SECTION 2
      {
        table: {
          widths: ["*"] as any,
          body: [
            [
              {
                text: "INCOME SUMMARY",
                fillColor: SECTION_BG,
                color: PRIMARY,
                bold: true,
                fontSize: 10,
                margin: [8, 6, 8, 6],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        table: {
          widths: [220, "*"] as any,
          body: summaryRows.map(([label, value]) => [
            {
              text: label,
              fontSize: 9,
              color: "#444444",
              margin: [0, 5, 0, 5],
            },
            {
              text: value,
              fontSize: 9,
              color: PRIMARY,
              bold: true,
              alignment: "right",
              margin: [0, 5, 0, 5],
            },
          ]),
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E6E6E6",
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
        margin: [0, 8, 0, 14],
      },

      // SECTION 3
      {
        table: {
          widths: ["*"] as any,
          body: [
            [
              {
                text: "TRANSACTION LEDGER",
                fillColor: SECTION_BG,
                color: PRIMARY,
                bold: true,
                fontSize: 10,
                margin: [8, 6, 8, 6],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        table: {
          headerRows: 1,
          widths: [70, 90, "*", 90] as any,
          body: ledgerBody,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return PRIMARY;
            if (rowIndex === ledgerBody.length - 1) return SECTION_BG;
            // alternating rows (excluding header)
            return rowIndex % 2 === 0 ? "#FAFAFA" : null;
          },
          hLineColor: () => "#E6E6E6",
          vLineColor: () => "#E6E6E6",
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 8, 0, 14],
      },

      // SECTION 4
      {
        table: {
          widths: ["*"] as any,
          body: [
            [
              {
                text: "CRAFTSCORE",
                fillColor: SECTION_BG,
                color: PRIMARY,
                bold: true,
                fontSize: 10,
                margin: [8, 6, 8, 6],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: `${clamp(Math.round(craftData.craftScore), 0, 850)} / 850`,
                fontSize: 26,
                bold: true,
                color: PRIMARY,
                margin: [0, 10, 0, 6],
              },
              {
                text: scoreBar(craftData.craftScore),
                fontSize: 16,
                color: PRIMARY,
                margin: [0, 0, 0, 8],
              },
              {
                text: scoreLabel(craftData.craftScore),
                fontSize: 11,
                bold: true,
                color: ACCENT,
                margin: [0, 0, 0, 8],
              },
              {
                text: "This individual has demonstrated consistent, verifiable digital income over the reported period. Transaction records are authenticated via the Interswitch payment network.",
                fontSize: 9,
                color: PRIMARY,
                lineHeight: 1.3,
              },
            ],
          },
        ],
      },

      // VERIFICATION SECTION AT BOTTOM
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 12,
            x2: 515,
            y2: 12,
            lineWidth: 1,
            lineColor: "#D7D7D7",
          },
        ],
        margin: [0, 20, 0, 14],
      },
      {
        table: {
          widths: ["*"] as any,
          body: [
            [
              {
                text: "DOCUMENT VERIFICATION",
                fillColor: SECTION_BG,
                color: PRIMARY,
                bold: true,
                fontSize: 10,
                margin: [8, 6, 8, 6],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "Verification Link:",
                fontSize: 9,
                bold: true,
                color: PRIMARY,
                margin: [0, 0, 0, 4],
              },
              {
                text: verifyUrl,
                fontSize: 8,
                color: "#0079BE",
                margin: [0, 0, 0, 10],
              },
              {
                text: "Banks and lenders can use this link or scan the QR code below to verify this report.",
                fontSize: 8,
                italics: true,
                color: PRIMARY,
                lineHeight: 1.3,
              },
            ],
          },
          {
            width: 100,
            stack: [
              qrDataUrl
                ? {
                    image: qrDataUrl,
                    alignment: "center",
                    fit: [90, 90],
                  }
                : {
                    text: "QR Code",
                    alignment: "center",
                    fontSize: 10,
                    color: PRIMARY,
                    margin: [0, 30, 0, 30],
                  },
            ],
          },
        ],
      },
    ],
    defaultStyle: {
      font: "Roboto",
    },
  };

  const fileName = `CraftID-Report-${craftData.craftIdNumber}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}
