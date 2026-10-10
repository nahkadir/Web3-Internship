import crypto from "crypto";

const TOLERANCE_SECONDS = 300; // rejects replayed old messages

const hmac = (secret, timestamp, body) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

export const signPayload = (
  body,
  secret,
  timestamp = Math.floor(Date.now() / 1000),
) => `t=${timestamp},v1=${hmac(secret, timestamp, body)}`;

export const verifySignature = (rawBody, header, secret) => {
  if (!header || typeof header !== "string") return false;

  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const timestamp = Number(parts.t);
  if (!timestamp || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const body = Buffer.isBuffer(rawBody)
    ? rawBody.toString("utf8")
    : String(rawBody);
  const expected = Buffer.from(hmac(secret, timestamp, body));
  const received = Buffer.from(parts.v1);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  ); // constant-time compare
};
