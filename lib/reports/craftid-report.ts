"use client";

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
  craftScore: number; // 0-100
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
  if (score >= 75) return "STRONG";
  if (score >= 55) return "GOOD";
  if (score >= 40) return "FAIR";
  return "DEVELOPING";
}

function scoreBar(score: number) {
  const blocks = 12;
  const filled = Math.round((clamp(score, 0, 100) / 100) * blocks);
  return "█".repeat(filled) + "░".repeat(blocks - filled);
}

type PdfMakeModule = {
  createPdf: (docDefinition: any) => {
    download: (fileName: string) => void;
  };
  vfs?: Record<string, string>;
  fonts?: Record<
    string,
    { normal: string; bold: string; italics: string; bolditalics: string }
  >;
};

export async function generateCraftIDReport(craftData: CraftData) {
  const [pdfMakeMod, vfsFontsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const pdf = ((pdfMakeMod as any)?.default ?? pdfMakeMod) as PdfMakeModule;

  const vfs =
    (vfsFontsMod as any)?.pdfMake?.vfs ??
    (vfsFontsMod as any)?.default?.pdfMake?.vfs ??
    (vfsFontsMod as any)?.vfs ??
    (vfsFontsMod as any)?.default?.vfs;

  if (vfs) {
    pdf.vfs = vfs;
  }

  // Ensure pdfmake knows how to resolve the default font family.
  // Without this, bold text often looks for Roboto-Medium.ttf and can crash if fonts weren't attached.
  pdf.fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  };

  if (
    !pdf.vfs ||
    !pdf.vfs["Roboto-Regular.ttf"] ||
    !pdf.vfs["Roboto-Medium.ttf"]
  ) {
    throw new Error(
      "PDF fonts failed to load. Please refresh and try again (Roboto vfs missing).",
    );
  }

  const generated = new Date();
  const reportId = `CID-2026-${craftData.craftIdNumber}`;
  const verifyUrl = `https://craftid.ng/verify/${craftData.craftIdNumber}`;

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
                  {
                    text: "[QR CODE]",
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
                text: `${clamp(Math.round(craftData.craftScore), 0, 100)} / 100`,
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
    ],
    defaultStyle: {
      font: "Roboto",
    },
  };

  const fileName = `CraftID-Report-${craftData.craftIdNumber}.pdf`;
  pdf.createPdf(docDefinition).download(fileName);
}
