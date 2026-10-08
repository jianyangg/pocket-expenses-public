import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { scryptSync, randomBytes } from "node:crypto";
function hidden(prompt) {
  if (!process.stdin.isTTY) throw new Error("Run this in your own terminal.");
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const handle = (chunk) => {
      for (const char of chunk.toString()) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value.trim());
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", handle);
      process.stdout.write("\n");
    }
    process.stdin.on("data", handle);
  });
}
try {
  const clientId = await hidden("Plaid client ID (hidden): ");
  const secret = await hidden("Plaid Production secret (hidden): ");
  if (!/^[a-f0-9]{24}$/i.test(clientId) || !/^[a-f0-9]{30,64}$/i.test(secret))
    throw new Error("The Plaid credentials do not have the expected format.");
  const password = await hidden(
    "New Pocket password (12+ characters, hidden): ",
  );
  if (password.length < 12)
    throw new Error("Use at least 12 characters for Pocket bank access.");
  const confirm = await hidden("Repeat Pocket password: ");
  if (password !== confirm) throw new Error("Passwords do not match.");
  const salt = randomBytes(16).toString("hex");
  const passwordHash =
    salt + ":" + scryptSync(password, salt, 64).toString("hex");
  let source = existsSync(".env.local")
    ? readFileSync(".env.local", "utf8")
    : "";
  const storedKey = source
    .split("\n")
    .find((line) => line.startsWith("POCKET_BANK_KEY="))
    ?.slice("POCKET_BANK_KEY=".length);
  const bankKey = storedKey
    ? JSON.parse(storedKey)
    : randomBytes(32).toString("hex");
  const values = {
    PLAID_CLIENT_ID: clientId,
    PLAID_SECRET: secret,
    PLAID_ENV: "production",
    POCKET_PASSWORD_HASH: passwordHash,
    POCKET_BANK_KEY: bankKey,
    NEON_AUTH_COOKIE_SECRET: randomBytes(32).toString("hex"),
  };
  for (const [name, value] of Object.entries(values)) {
    source =
      source
        .split("\n")
        .filter((line) => !line.startsWith(name + "="))
        .join("\n")
        .trimEnd() +
      "\n" +
      name +
      "=" +
      JSON.stringify(value) +
      "\n";
  }
  writeFileSync(".env.local", source, { mode: 0o600 });
  chmodSync(".env.local", 0o600);
  for (const [name, value] of Object.entries(values)) {
    const result = spawnSync(
      "vercel",
      [
        "env",
        "add",
        name,
        "production",
        "--force",
        "--yes",
        ...(name === "PLAID_ENV" ? [] : ["--sensitive"]),
      ],
      { input: value, stdio: ["pipe", "pipe", "pipe"] },
    );
    if (result.status !== 0)
      throw new Error(
        "Local setup saved, but Vercel configuration failed. Check Vercel login/project and rerun.",
      );
  }
  console.log(
    "Private bank configuration saved locally and in Vercel. Redeploy Pocket, then connect Chase.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Setup failed.");
  process.exitCode = 1;
}
