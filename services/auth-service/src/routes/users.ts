// Simple user routes without full dependencies
export const userRouter = {
  get: (path: string, handler: Function) => {
    console.log(`USER GET route registered: ${path}`);
  },
  put: (path: string, handler: Function) => {
    console.log(`USER PUT route registered: ${path}`);
  },
};
