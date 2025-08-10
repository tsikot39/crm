import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { emailService } from "../utils/emailService";
import { logger } from "../utils/logger";

const router = express.Router();

// In-memory stores for demo (in production, use database)
const passwordResetTokens = new Map<string, { email: string; expires: Date }>();
const users = new Map<
  string,
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    id: string;
  }
>(); // Temporary user store for demo

// Demo users
users.set("demo@example.com", {
  email: "demo@example.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
  firstName: "Demo",
  lastName: "User",
  id: "demo-user-1",
});

// Login endpoint
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = users.get(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      logger.error(
        `Login error: ${error instanceof Error ? error.message : String(error)}`
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Forgot password endpoint
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const user = users.get(email);

      // Always return success to prevent email enumeration
      res.json({
        message:
          "If an account with that email exists, we have sent a password reset link.",
      });

      // Only send email if user exists
      if (user) {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token
        passwordResetTokens.set(resetToken, { email, expires });

        // Send email
        const emailSent = await emailService.sendPasswordResetEmail(
          email,
          resetToken,
          `${user.firstName} ${user.lastName}`
        );

        if (!emailSent) {
          logger.error(`Failed to send password reset email to ${email}`);
        } else {
          logger.info(`Password reset email sent to ${email}`);
        }
      }
    } catch (error) {
      logger.error(
        `Forgot password error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Reset password endpoint
router.post(
  "/reset-password",
  [body("token").notEmpty().trim(), body("password").isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      const tokenData = passwordResetTokens.get(token);

      if (!tokenData) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      if (new Date() > tokenData.expires) {
        passwordResetTokens.delete(token);
        return res.status(400).json({ error: "Reset token has expired" });
      }

      const user = users.get(tokenData.email);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      users.set(tokenData.email, {
        ...user,
        password: hashedPassword,
      });

      // Remove used token
      passwordResetTokens.delete(token);

      logger.info(`Password reset successful for ${tokenData.email}`);
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.error(
        `Reset password error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Verify reset token endpoint
router.get(
  "/verify-reset-token/:token",
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const tokenData = passwordResetTokens.get(token);

      if (!tokenData) {
        return res
          .status(400)
          .json({ valid: false, error: "Invalid reset token" });
      }

      if (new Date() > tokenData.expires) {
        passwordResetTokens.delete(token);
        return res
          .status(400)
          .json({ valid: false, error: "Reset token has expired" });
      }

      res.json({ valid: true });
    } catch (error) {
      logger.error(
        `Verify reset token error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { router as authRouter };
