import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/authRoutes.js";
import { financeRouter } from "./routes/financeRoutes.js";
import { memberRouter } from "./routes/memberRoutes.js";
import { organizationRouter } from "./routes/organizationRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  app.use(helmet());
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 500,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "bazm-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/organization", organizationRouter);
  app.use("/api/members", memberRouter);
  app.use("/api/finance", financeRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
