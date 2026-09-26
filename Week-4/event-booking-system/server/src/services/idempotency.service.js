import crypto from "crypto";
import IdempotencyKey from "../models/IdempotencyKey.js";
import AppError from "../utils/AppError.js";

export const hashRequest = (payload) =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

/**
 * Wraps a handler with idempotency-key protection.
 * Returns { replay: boolean, statusCode, body }.
 */
export const withIdempotency = async (
  userId,
  idempotencyKey,
  payload,
  handler,
) => {
  const requestHash = hashRequest(payload);

  let record;
  try {
    // Attempt the insert first - the unique index is the actual guarantee,
    // not this line succeeding or failing per se.
    record = await IdempotencyKey.create({
      userId,
      idempotencyKey,
      requestHash,
      status: "PENDING",
    });
  } catch (err) {
    if (err.code !== 11000) throw err;

    const existing = await IdempotencyKey.findOne({ userId, idempotencyKey });
    if (!existing)
      throw new AppError("Idempotency key conflict, please retry", 409);

    if (existing.requestHash !== requestHash) {
      throw new AppError(
        "Idempotency key was already used for a different request",
        422,
      );
    }

    if (existing.status === "COMPLETED") {
      return {
        replay: true,
        statusCode: existing.statusCode,
        body: existing.responseData,
      };
    }

    if (existing.status === "PENDING") {
      throw new AppError(
        "A request with this idempotency key is already being processed",
        409,
      );
    }

    // FAILED: safe to retry using the same record
    record = existing;
    record.status = "PENDING";
    await record.save();
  }

  try {
    const { statusCode, body } = await handler();
    record.status = "COMPLETED";
    record.statusCode = statusCode;
    record.responseData = body;
    await record.save();
    return { replay: false, statusCode, body };
  } catch (err) {
    record.status = "FAILED";
    await record.save().catch(() => {}); // best-effort; don't mask the real error
    throw err;
  }
};
