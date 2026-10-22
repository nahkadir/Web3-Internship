import { runSlaSweep } from "../services/sla.service.js";
import { logger } from "../utils/logger.js";

export const startSlaWorker = (intervalMs = 60_000) => {
  const tick = () =>
    runSlaSweep().catch((err) =>
      logger.error("SLA sweep failed:", err.message),
    );
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  tick();
  return timer;
};
