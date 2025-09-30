import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { isIPv6 } from "node:net";

// Safe IP key generator that normalizes IPv6 addresses
function safeIpKeyGenerator(req: Request): string {
  const rawIp = req.ip ?? "";
  const ip = rawIp.trim();

  if (ip === "::1") return "127.0.0.1";

  if (isIPv6(ip)) {
    const cleanedIp = ip.split("%")[0] || ""; // ✅ No error
    return cleanedIp.replace(/:\d+$/, "");
  }

  return ip;
}

interface RateLimiterOptions {
  windowMs: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string; // Optional function to generate a unique key per client (defaults to IP)
}

export const createRateLimiter = ({
  windowMs = 60 * 1000, // 1 minute
  max = 60, // 60 requests per window
  message = "Too many requests, please try again.",
  keyGenerator,
}: RateLimiterOptions) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Send rate limit info in standard headers (RateLimit-*)
    legacyHeaders: false, // Disable legacy rate limit headers (X-RateLimit-*)
    keyGenerator:
      keyGenerator ?? ((req) => req.body?.email || safeIpKeyGenerator(req)),
    // Uses email from request body if available; otherwise defaults to IP address
    handler: ((req: Request, res: Response, next: NextFunction) => {
      console.warn(`Rate limit exceeded for: ${safeIpKeyGenerator(req)}`);
      res.status(429).json({
        success: false,
        message,
      });
    }) as RequestHandler,
  });
};

export const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1  minute
  max: 100,
});
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15  minute
  max: 100,
  message: "Too many attempts. Please try again later",
});
