export class BankError extends Error {
  constructor(public code: string) {
    super("Bank sync failed. Try again or reconnect your bank.");
  }
}
export type Credentials = {
  clientId: string;
  secret: string;
  environment: "production" | "sandbox";
};
export async function plaid<T>(
  credentials: Credentials,
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(
    `https://${credentials.environment}.plaid.com${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Plaid-Version": "2020-09-14",
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        secret: credentials.secret,
        ...body,
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    let code = "API_ERROR";
    try {
      code = (await response.json()).error_code || code;
    } catch {}
    throw new BankError(code);
  }
  return response.json();
}
