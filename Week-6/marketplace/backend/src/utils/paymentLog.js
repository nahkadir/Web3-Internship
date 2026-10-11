import { logger } from "./logger.js";

export const paymentLog = (event, fields = {}) => {
  logger.info(event, { scope: "payment", ...fields });
};
