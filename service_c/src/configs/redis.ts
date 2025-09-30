import { Redis } from "ioredis";
import dotenv from "dotenv";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "./configs.js";

dotenv.config();

const redis = new Redis({
  host: REDIS_HOST || "127.0.0.1",
  port: Number(REDIS_PORT) || 6379,
  password: REDIS_PASSWORD,
  db: 0, // optional, default DB index
  // tls: {}, // uncomment if using Redis over TLS (e.g. AWS, Redis Cloud)
  maxRetriesPerRequest: null,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));
redis.ping().then(console.log); // should log "PONG"

export default redis;
