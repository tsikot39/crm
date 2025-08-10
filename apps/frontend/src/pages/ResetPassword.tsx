import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Key, CheckCircle, Eye, EyeOff } from "lucide-react";

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from URL params (e.g., /reset-password?token=xyz)
  const token = searchParams.get("token");

  useEffect(() => {
    // Validate the token with the API
    const validateToken = async () => {
      if (!token) {
        setError("Invalid or missing reset token");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-reset-token/${token}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || "Invalid or expired reset token");
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setError("Unable to validate reset token");
      }
    };

    validateToken();
  }, [token]);

  const validateForm = () => {
    if (!formData.password) {
      return "Password is required";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords don't match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reset password");
      }

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError(null);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Password Reset Successfully!
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>

            <p className="text-sm text-gray-500 mb-8">
              Redirecting to login page in 3 seconds...
            </p>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 font-medium transition-colors"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Key className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>

            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 font-medium transition-colors"
              >
                Request New Reset Link
              </Link>

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
            <Key className="w-8 h-8 text-primary-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your new password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading || !formData.password || !formData.confirmPassword
            }
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resetting Password...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
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
