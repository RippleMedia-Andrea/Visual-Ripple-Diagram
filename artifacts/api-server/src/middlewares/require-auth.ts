import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { db, user } from "@workspace/db";
import { auth } from "../lib/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: "Sign in is required." });
    return;
  }

  res.locals.user = session.user;
  res.locals.session = session.session;
  next();
}

export async function requireAiConsent(_req: Request, res: Response, next: NextFunction) {
  const [currentUser] = await db
    .select({ aiConsentAt: user.aiConsentAt })
    .from(user)
    .where(eq(user.id, res.locals.user.id as string));

  if (!currentUser?.aiConsentAt) {
    res.status(403).json({ error: "AI processing consent is required." });
    return;
  }

  next();
}