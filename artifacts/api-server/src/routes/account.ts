import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, user } from "@workspace/db";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();
const supportEmail = "admin@ripplemedia.space";

router.get("/password-reset-availability", async (_req, res) => {
  try {
    const connectors = new ReplitConnectors();
    const connections = await connectors.listConnections({ connector_names: "resend" });
    res.json({
      available: connections.length > 0 && Boolean(process.env.PUBLIC_APP_URL || process.env.APP_ORIGINS),
      supportEmail,
    });
  } catch {
    res.json({ available: false, supportEmail });
  }
});

router.get("/account", requireAuth, async (_req, res, next) => {
  try {
    const [currentUser] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        aiConsentAt: user.aiConsentAt,
        welcomeSeenAt: user.welcomeSeenAt,
      })
      .from(user)
      .where(eq(user.id, res.locals.user.id as string));
    if (!currentUser) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    res.json(currentUser);
  } catch (error) {
    next(error);
  }
});

router.patch("/account/consent", requireAuth, async (_req, res, next) => {
  try {
    const [updated] = await db
      .update(user)
      .set({ aiConsentAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, res.locals.user.id as string))
      .returning({ aiConsentAt: user.aiConsentAt });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch("/account/welcome", requireAuth, async (_req, res, next) => {
  try {
    const [updated] = await db
      .update(user)
      .set({ welcomeSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, res.locals.user.id as string))
      .returning({ welcomeSeenAt: user.welcomeSeenAt });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;