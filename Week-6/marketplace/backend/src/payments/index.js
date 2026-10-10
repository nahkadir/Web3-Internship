import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { mockProvider } from "./mock/mock.provider.js";

const providers = { mock: mockProvider };

export const getProvider = () => {
  const provider = providers[env.payment.provider];
  if (!provider)
    throw new AppError(
      `Unsupported payment provider: ${env.payment.provider}`,
      500,
    );
  if (provider.name === "mock" && env.nodeEnv === "production") {
    throw new AppError(
      "The mock payment provider cannot be used in production",
      500,
    );
  }
  return provider;
};
