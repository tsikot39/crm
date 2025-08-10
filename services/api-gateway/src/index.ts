import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  connectToDatabase,
  DatabaseHelper,
} from "../../../shared/database/mongodb";
import { authRouter } from "./routes/auth";
import { contactsRouter } from "./routes/contacts";
import { dealsRouter } from "./routes/deals";
import { activitiesRouter } from "./routes/activities";
import { usersRouter } from "./routes/users";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

// Load environment variables
config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
  })
);

// Rate limiting with enhanced security
app.use(apiLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Health check routes (no auth required)
app.use("/health", healthRouter);

// Authentication routes (no auth required)
app.use("/api/auth", authRouter);

// Protected API routes
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/contacts", authMiddleware, contactsRouter);
app.use("/api/deals", authMiddleware, dealsRouter);
app.use("/api/activities", authMiddleware, activitiesRouter);

// Socket.io for real-time features
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    // Verify JWT token here
    // For now, we'll skip verification
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  logger.info("User connected", { socketId: socket.id });

  socket.on("join-organization", (organizationId: string) => {
    socket.join(`org-${organizationId}`);
    logger.info("User joined organization room", {
      socketId: socket.id,
      organizationId,
    });
  });

  socket.on("disconnect", () => {
    logger.info("User disconnected", { socketId: socket.id });
  });
});

// Export io for use in other modules
export { io };

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info("✅ Connected to MongoDB Atlas");

    // Initialize database indexes
    await DatabaseHelper.initializeDatabase();
    logger.info("📊 Database initialized");

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 API Gateway server running on port ${PORT}`);
      logger.info(`📡 Socket.IO server ready for real-time connections`);

      if (process.env.NODE_ENV === "development") {
        logger.info(`🔗 API Documentation: http://localhost:${PORT}/health`);
        logger.info(
          `🔗 Frontend URL: ${
            process.env.FRONTEND_URL || "http://localhost:5174"
          }`
        );
      }
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received, shutting down gracefully");
  httpServer.close(() => {
    logger.info("💤 Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("🛑 SIGINT received, shutting down gracefully");
  httpServer.close(() => {
    logger.info("💤 Process terminated");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();
