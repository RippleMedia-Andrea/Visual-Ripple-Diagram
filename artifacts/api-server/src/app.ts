import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { toNodeHandler } from "better-auth/node";
import router from "./routes";
import { logger } from "./lib/logger";
import { auth, trustedOrigins } from "./lib/auth";
import {
  passwordResetEnabled,
  passwordResetUnavailableMessage,
} from "./lib/password-reset";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || trustedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"));
    },
    credentials: true,
    exposedHeaders: ["set-auth-token"],
  }),
);
app.post("/api/auth/request-password-reset", (_req, res, next) => {
  if (passwordResetEnabled) {
    next();
    return;
  }

  res.status(503).json({ message: passwordResetUnavailableMessage });
});
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err }, "Unhandled request error");
    res.status(500).json({ error: "Something went wrong." });
  },
);

export default app;
