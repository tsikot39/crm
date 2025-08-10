import React, { useState } from "react";
import { useAuthStore } from "../stores/authStore";

export const LoginDebug: React.FC = () => {
  const [testEmail, setTestEmail] = useState("invalid@test.com");
  const [testPassword, setTestPassword] = useState("wrongpassword");
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const { login } = useAuthStore();

  const addLog = (message: string) => {
    setDebugLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testLogin = async () => {
    setDebugLog([]);
    addLog("🚀 Starting login test...");

    try {
      addLog(`📝 Testing with email: ${testEmail}, password: ${testPassword}`);
      await login({ email: testEmail, password: testPassword });
      addLog("✅ Login successful (unexpected)");
    } catch (error) {
      addLog(
        `❌ Login failed as expected: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      addLog(`🔍 Error type: ${typeof error}`);
      addLog(
        `🔍 Error constructor: ${
          error instanceof Error ? error.constructor.name : "unknown"
        }`
      );
    }

    addLog("✅ Test completed");
  };

  const testValidLogin = async () => {
    setDebugLog([]);
    addLog("🚀 Starting valid login test...");

    try {
      addLog(
        "📝 Testing with valid credentials: test@example.com / password123"
      );
      await login({ email: "test@example.com", password: "password123" });
      addLog("✅ Valid login successful");
    } catch (error) {
      addLog(
        `❌ Valid login failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    addLog("✅ Valid test completed");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Login Debug Tool
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Invalid Login</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Test Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Test Password
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
              />
            </div>
            <div className="space-x-4">
              <button
                onClick={testLogin}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Test Invalid Login
              </button>
              <button
                onClick={testValidLogin}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Test Valid Login
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {debugLog.length === 0 && (
              <div className="text-gray-500">
                No logs yet. Click a test button to start.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
