import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send reset email");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to send reset email:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a password reset link to{" "}
              <span className="font-semibold text-gray-900">{email}</span>
            </p>

            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 mb-2">
                <strong>📧 Email Sent Successfully!</strong>
              </p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Check your email inbox for the password reset link</li>
                <li>If you don't see it, check your spam/junk folder</li>
                <li>The link will expire in 1 hour for security</li>
                <li>Click the link in the email to reset your password</li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Didn't receive the email? Check your spam folder or try again with
              a different email address.
            </p>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-primary-300 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h2>

          <p className="text-gray-600 leading-relaxed">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your email address"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400 focus:border-primary-500"
              }`}
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Link
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
