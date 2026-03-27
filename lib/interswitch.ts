// lib/interswitch.ts
const AUTH_URL = process.env.INTERSWITCH_AUTH_URL!;
const BVN_URL = process.env.INTERSWITCH_BVN_URL!;
const CLIENT_ID = process.env.INTERSWITCH_CLIENT_ID!;
const SECRET_KEY = process.env.INTERSWITCH_SECRET_KEY!;
const BASE_URL = process.env.INTERSWITCH_BASE_URL!;

const PAYMENTGATEWAY_BASE_URL =
  process.env.INTERSWITCH_PAYMENTGATEWAY_BASE_URL ??
  "https://qa.interswitchng.com/paymentgateway";
const INVOICE_DETAIL_BASE_URL =
  process.env.INTERSWITCH_INVOICE_DETAIL_BASE_URL ?? PAYMENTGATEWAY_BASE_URL;

type AccessTokenOptions = {
  authUrl?: string;
  scope?: string;
  clientId?: string;
  secretKey?: string;
  resourceId?: string;
};

export async function getAccessToken(
  options: AccessTokenOptions = {},
): Promise<string> {
  const clientId = options.clientId ?? CLIENT_ID;
  const secretKey = options.secretKey ?? SECRET_KEY;
  const credentials = Buffer.from(`${clientId}:${secretKey}`).toString(
    "base64",
  );

  const authUrl = options.authUrl ?? AUTH_URL;
  const scope =
    options.scope ?? process.env.INTERSWITCH_AUTH_SCOPE ?? "profile";
  const resourceId =
    options.resourceId ?? process.env.INTERSWITCH_AUTH_RESOURCE_ID;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  // Some Interswitch-protected resources require a resource/audience in the token request.
  // This is intentionally optional to avoid breaking BVN verification.
  if (resourceId) body.set("resource", resourceId);

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auth failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function verifyBVN(bvn: string) {
  const token = await getAccessToken({
    authUrl: process.env.INTERSWITCH_BVN_AUTH_URL,
    scope: process.env.INTERSWITCH_BVN_SCOPE,
    clientId: process.env.INTERSWITCH_BVN_CLIENT_ID,
    secretKey: process.env.INTERSWITCH_BVN_SECRET_KEY,
  });

  const res = await fetch(BVN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: bvn }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`BVN verification failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data;
}

export async function verifyPayment(txnRef: string, amountInKobo: number) {
  const merchantCode = process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE;

  const res = await fetch(
    `${BASE_URL}/collections/api/v1/gettransaction.json` +
      `?merchantcode=${merchantCode}` +
      `&transactionreference=${txnRef}` +
      `&amount=${amountInKobo}`,
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Payment verification failed (${res.status}): ${errorText}`,
    );
  }

  return res.json();
}

export type CreateInvoiceInput = {
  amountKobo: number;
  customerName: string;
  customerEmail: string;
  merchantCode?: string;
  payableCode?: string;
  dueDateMs?: number;
  discountPercent?: number;
  shippingFeeKobo?: number;
  address?: string;
  description?: string;
};

export async function createInvoice(input: CreateInvoiceInput) {
  const token = await getAccessToken({
    authUrl: process.env.INTERSWITCH_INVOICE_AUTH_URL,
    scope: process.env.INTERSWITCH_INVOICE_SCOPE,
    clientId: process.env.INTERSWITCH_INVOICE_CLIENT_ID,
    secretKey: process.env.INTERSWITCH_INVOICE_SECRET_KEY,
    resourceId: process.env.INTERSWITCH_INVOICE_RESOURCE_ID,
  });

  const merchantCode =
    input.merchantCode ??
    process.env.INTERSWITCH_MERCHANT_CODE ??
    process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE;
  const payableCode =
    input.payableCode ||
    process.env.INTERSWITCH_PAYABLE_CODE ||
    process.env.NEXT_PUBLIC_ISW_PAY_ITEM_ID;

  if (!merchantCode) throw new Error("Missing merchantCode");
  if (!payableCode) throw new Error("Missing payableCode");

  const res = await fetch(
    `${PAYMENTGATEWAY_BASE_URL}/api/v1/merchant/invoice/create`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(Math.trunc(input.amountKobo)),
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        merchantCode,
        payableCode,
        dueDate: String(
          Math.trunc(
            input.dueDateMs ??
              Date.now() +
                Number(process.env.INTERSWITCH_INVOICE_DUE_DAYS ?? 7) *
                  24 *
                  60 *
                  60 *
                  1000,
          ),
        ),
        discountPercent: String(input.discountPercent ?? 0),
        shippingFee: String(Math.trunc(input.shippingFeeKobo ?? 0)),
        address: input.address ?? "",
        description: input.description ?? "",
      }),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 403 && /resource id/i.test(errorText)) {
      throw new Error(
        `Invoice create failed (${res.status}): ${errorText}. ` +
          `Hint: your OAuth token must include the merchant resource audience (e.g. project-x-merchant). ` +
          `Set INTERSWITCH_INVOICE_RESOURCE_ID=project-x-merchant and ensure your invoice OAuth client (INTERSWITCH_INVOICE_CLIENT_ID/SECRET_KEY) is the correct one for the invoice product.`,
      );
    }
    throw new Error(`Invoice create failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function getInvoice(reference: string) {
  const token = await getAccessToken({
    authUrl: process.env.INTERSWITCH_INVOICE_AUTH_URL,
    scope: process.env.INTERSWITCH_INVOICE_SCOPE,
    clientId: process.env.INTERSWITCH_INVOICE_CLIENT_ID,
    secretKey: process.env.INTERSWITCH_INVOICE_SECRET_KEY,
    resourceId: process.env.INTERSWITCH_INVOICE_RESOURCE_ID,
  });

  const res = await fetch(
    `${INVOICE_DETAIL_BASE_URL}/api/v1/merchant/invoice/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Invoice fetch failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function listInvoices(params: {
  merchantCode?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const token = await getAccessToken({
    authUrl: process.env.INTERSWITCH_INVOICE_AUTH_URL,
    scope: process.env.INTERSWITCH_INVOICE_SCOPE,
    clientId: process.env.INTERSWITCH_INVOICE_CLIENT_ID,
    secretKey: process.env.INTERSWITCH_INVOICE_SECRET_KEY,
    resourceId: process.env.INTERSWITCH_INVOICE_RESOURCE_ID,
  });
  const merchantCode =
    params.merchantCode ??
    process.env.INTERSWITCH_MERCHANT_CODE ??
    process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE;
  if (!merchantCode) throw new Error("Missing merchantCode");

  const pageNum = Math.max(1, Math.trunc(params.pageNum ?? 1));
  const pageSize = Math.max(
    1,
    Math.min(200, Math.trunc(params.pageSize ?? 100)),
  );

  const url =
    `${PAYMENTGATEWAY_BASE_URL}/api/v1/merchant/invoice/all/${encodeURIComponent(merchantCode)}` +
    `?pageNum=${pageNum}&pageSize=${pageSize}&merchantCode=${encodeURIComponent(merchantCode)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Invoice list failed (${res.status}): ${errorText}`);
  }

  return res.json();
}
