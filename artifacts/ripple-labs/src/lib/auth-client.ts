import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth`,
});