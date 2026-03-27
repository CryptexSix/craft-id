// lib/interswitch.ts
const AUTH_URL = process.env.INTERSWITCH_AUTH_URL!;
const BVN_URL = process.env.INTERSWITCH_BVN_URL!;
const CLIENT_ID = process.env.INTERSWITCH_CLIENT_ID!;
const SECRET_KEY = process.env.INTERSWITCH_SECRET_KEY!;
const BASE_URL = process.env.INTERSWITCH_BASE_URL!;

export async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${CLIENT_ID}:${SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "profile",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auth failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function verifyBVN(bvn: string) {
  const token = await getAccessToken();

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
    `&amount=${amountInKobo}`
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Payment verification failed (${res.status}): ${errorText}`);
  }

  return res.json();
}