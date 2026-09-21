import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";

const domains = (process.env.REPLIT_DOMAINS ?? process.env.REPLIT_DEV_DOMAIN ?? "")
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean)
  .map((domain) => (domain.startsWith("http") ? domain : `https://${domain}`));

export const trustedOrigins = [
  ...domains,
  "http://localhost:5173",
  "http://localhost:19683",
];

export const auth = betterAuth({
  baseURL: trustedOrigins[0],
  basePath: "/api/auth",
  secret: process.env.SESSION_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  trustedOrigins,
  plugins: [bearer()],
});