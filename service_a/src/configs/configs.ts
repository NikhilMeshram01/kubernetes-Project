import dotenv from "dotenv";
dotenv.config();
import type { SignOptions } from "jsonwebtoken";

// TypeScript utility that safely retrieves environment variables
// and throws an error if the variable is missing.
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const CLIENT_URL = getEnvVar("CLIENT_URL");
export const NODE_ENV = getEnvVar("NODE_ENV");
export const PORT = Number(process.env.PORT) || 5000; // ensure PORT is a number

export const MONGODB_URI = getEnvVar("MONGODB_URI");

export const JWT_ACCESS_SECRET_KEY = getEnvVar("JWT_ACCESS_SECRET_KEY");
export const JWT_ACCESS_EXPIRES_IN: SignOptions["expiresIn"] = (process.env
  .JWT_ACCESS_EXPIRES_IN || "5m") as SignOptions["expiresIn"];

export const JWT_REFRESH_SECRET_KEY = getEnvVar("JWT_REFRESH_SECRET_KEY");
export const JWT_REFRESH_EXPIRES_IN: SignOptions["expiresIn"] = (process.env
  .JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export const REDIS_PASSWORD = getEnvVar("REDIS_PASSWORD");
export const REDIS_HOST = getEnvVar("REDIS_HOST");
export const REDIS_PORT = getEnvVar("REDIS_PORT");

export const MINIO_ENDPOINT = getEnvVar("MINIO_ENDPOINT");
export const MINIO_PORT = getEnvVar("MINIO_PORT");
export const MINIO_USE_SSL = getEnvVar("MINIO_USE_SSL");
export const MINIO_ACCESS_KEY = getEnvVar("MINIO_ACCESS_KEY");
export const MINIO_SECRET_KEY = getEnvVar("MINIO_SECRET_KEY");
export const MINIO_BUCKET = getEnvVar("MINIO_BUCKET");
