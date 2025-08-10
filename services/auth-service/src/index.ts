import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});

export default app;
