import React, { useState, useEffect } from "react";

// Global error state that persists across component mounts
let globalLoginError: string = "";
const errorListeners: Array<(error: string) => void> = [];

export const setGlobalLoginError = (error: string) => {
  globalLoginError = error;
  errorListeners.forEach((listener) => listener(error));
};

export const clearGlobalLoginError = () => {
  globalLoginError = "";
  errorListeners.forEach((listener) => listener(""));
};

export const ErrorDisplay: React.FC = () => {
  const [error, setError] = useState(globalLoginError);

  useEffect(() => {
    const listener = (newError: string) => {
      setError(newError);
    };

    errorListeners.push(listener);

    return () => {
      const index = errorListeners.indexOf(listener);
      if (index > -1) {
        errorListeners.splice(index, 1);
      }
    };
  }, []);

  if (!error) return null;

  return (
    <div
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative"
      role="alert"
    >
      <span>{error}</span>
    </div>
  );
};
