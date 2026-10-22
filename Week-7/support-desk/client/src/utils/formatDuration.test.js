import { describe, it, expect } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("formats minutes, hours and days", () => {
    expect(formatDuration(5 * 60000)).toBe("5m");
    expect(formatDuration(90 * 60000)).toBe("1h 30m");
    expect(formatDuration(50 * 3600000)).toBe("2d 2h");
  });

  it("uses the absolute value and handles missing values", () => {
    expect(formatDuration(-10 * 60000)).toBe("10m");
    expect(formatDuration(null)).toBe("—");
  });
});
