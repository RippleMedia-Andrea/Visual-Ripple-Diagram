import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";
import { ReplitConnectors } from "@replit/connectors-sdk";

const domains = (process.env.REPLIT_DOMAINS ?? process.env.REPLIT_DEV_DOMAIN ?? "")
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean)
  .map((domain) => (domain.startsWith("http") ? domain : `https://${domain}`));
const expoOrigins = (process.env.REPLIT_EXPO_DEV_DOMAIN ?? "")
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean)
  .map((domain) => (domain.startsWith("http") ? domain : `https://${domain}`));
const appOrigins = (process.env.APP_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);

export const trustedOrigins = [
  ...domains,
  ...expoOrigins,
  ...appOrigins,
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
    sendResetPassword: async ({ user, url }) => {
      const connectors = new ReplitConnectors();
      const response = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESET_EMAIL_FROM ?? "Purpose Lab <admin@ripplemedia.space>",
          to: [user.email],
          subject: "Reset your Purpose Lab password",
          text: `We received a request to reset your password. Tap the link below to choose a new one. If you didn't ask for this, you can ignore this email.\n\n${url}`,
        }),
      });
      if (!response.ok) throw new Error(`Reset email delivery failed (${response.status}).`);
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  trustedOrigins,
  plugins: [bearer()],
});