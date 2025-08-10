import nodemailer from "nodemailer";
import { logger } from "./logger";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailTemplateData {
  userName: string;
  resetUrl?: string;
  resetToken?: string;
  loginUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.sendgrid.net",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    // Check if email is properly configured
    this.isConfigured = !!(
      (config.auth.user &&
        config.auth.pass &&
        config.auth.user !== "your-email@gmail.com" &&
        config.auth.user !== "apikey") ||
      config.auth.pass !== "your-sendgrid-api-key"
    );

    if (!this.isConfigured) {
      logger.warn(
        "Email service not properly configured. Please set SMTP credentials in environment variables."
      );
    } else {
      logger.info(`Email service configured with ${config.host}`);
    }

    return nodemailer.createTransporter(config);
  }

  private createEmailTemplate(
    type: "password-reset" | "welcome",
    data: EmailTemplateData
  ): EmailTemplate {
    const baseStyle = `
      body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { padding: 40px 30px; }
      .content h2 { color: #333; font-size: 24px; margin-bottom: 20px; }
      .content p { margin-bottom: 20px; color: #666; }
      .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; margin: 20px 0; }
      .security-info { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 0 6px 6px 0; }
      .security-info h3 { margin-top: 0; color: #333; font-size: 16px; }
      .security-info ul { margin: 10px 0; padding-left: 20px; color: #666; }
      .footer { padding: 30px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #eee; }
      .token { font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; letter-spacing: 1px; }
    `;

    switch (type) {
      case "password-reset":
        return {
          subject: "🔐 Reset Your CRM Password",
          html: `
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><style>${baseStyle}</style></head><body>
              <div class="container">
                <div class="header"><h1>🔐 Password Reset</h1></div>
                <div class="content">
                  <h2>Hi ${data.userName},</h2>
                  <p>We received a request to reset your password for your CRM account. If you made this request, click the button below:</p>
                  <div style="text-align: center;">
                    <a href="${
                      data.resetUrl
                    }" class="button">Reset My Password</a>
                  </div>
                  <p>Or copy this link: <span style="word-break: break-all; color: #667eea;">${
                    data.resetUrl
                  }</span></p>
                  <div class="security-info">
                    <h3>🛡️ Security Information:</h3>
                    <ul>
                      <li>This link expires in 1 hour for your security</li>
                      <li>You can only use this link once</li>
                      <li>If you didn't request this, please ignore this email</li>
                    </ul>
                  </div>
                  <p>Token: <span class="token">${data.resetToken}</span></p>
                </div>
                <div class="footer">
                  <p><strong>${
                    process.env.EMAIL_FROM_NAME || "CRM Platform"
                  }</strong></p>
                  <p>© ${new Date().getFullYear()} All rights reserved.</p>
                </div>
              </div>
            </body></html>
          `,
          text: `Hi ${data.userName},\n\nReset your password: ${
            data.resetUrl
          }\n\nToken: ${data.resetToken}\n\nThis link expires in 1 hour.\n\n${
            process.env.EMAIL_FROM_NAME || "CRM Platform"
          }`,
        };

      case "welcome":
        return {
          subject: "🎉 Welcome to CRM Platform!",
          html: `
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><style>${baseStyle}</style></head><body>
              <div class="container">
                <div class="header"><h1>🎉 Welcome!</h1></div>
                <div class="content">
                  <h2>Hi ${data.userName},</h2>
                  <p>Welcome to CRM Platform! Your account is ready.</p>
                  <div style="text-align: center;">
                    <a href="${
                      data.loginUrl
                    }" class="button">Sign In to Your Account</a>
                  </div>
                  <p>Start exploring: Dashboard, Contacts, Companies, and Deals management.</p>
                </div>
                <div class="footer">
                  <p><strong>${
                    process.env.EMAIL_FROM_NAME || "CRM Platform"
                  }</strong></p>
                  <p>© ${new Date().getFullYear()} All rights reserved.</p>
                </div>
              </div>
            </body></html>
          `,
          text: `Hi ${data.userName},\n\nWelcome to CRM Platform!\n\nSign in: ${
            data.loginUrl
          }\n\n${process.env.EMAIL_FROM_NAME || "CRM Platform"}`,
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  async sendEmail(
    options: SendEmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      logger.warn(
        `Email not sent - service not configured. Would send to: ${options.to}`
      );
      return { success: false, error: "Email service not configured" };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "CRM Platform"}" <${
          process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
        }>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email sent successfully to ${options.to}. Message ID: ${info.messageId}`
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to send email to ${options.to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const template = this.createEmailTemplate("password-reset", {
      userName,
      resetUrl,
      resetToken,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const template = this.createEmailTemplate("welcome", {
      userName,
      loginUrl,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      await this.transporter.verify();
      logger.info("Email service connection verified successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Email service connection failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  getConfiguration(): { configured: boolean; provider?: string } {
    return {
      configured: this.isConfigured,
      provider: this.isConfigured ? process.env.SMTP_HOST : undefined,
    };
  }
}

export const emailService = new EmailService();
