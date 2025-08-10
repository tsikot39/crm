import { Router } from "express";
import { DatabaseHelper } from "../../../../shared/database/mongodb";

const router = Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const isHealthy = await DatabaseHelper.healthCheck();

    res.status(200).json({
      success: true,
      message: "API Gateway is healthy",
      timestamp: new Date().toISOString(),
      database: isHealthy ? "connected" : "disconnected",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// Detailed health check
router.get("/detailed", async (req, res) => {
  try {
    const dbHealth = await DatabaseHelper.healthCheck();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      message: "Detailed health information",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? "healthy" : "unhealthy",
        api: "healthy",
      },
      system: {
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
        platform: process.platform,
        nodeVersion: process.version,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };
