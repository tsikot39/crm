// Simple logger without winston for now
export const logger = {
  info: (message: string | object) => {
    console.log(new Date().toISOString(), "[INFO]", message);
  },
  error: (message: string | object) => {
    console.error(new Date().toISOString(), "[ERROR]", message);
  },
  warn: (message: string | object) => {
    console.warn(new Date().toISOString(), "[WARN]", message);
  },
  debug: (message: string | object) => {
    if (process.env.NODE_ENV === "development") {
      console.log(new Date().toISOString(), "[DEBUG]", message);
    }
  },
};
