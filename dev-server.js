#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting CRM SaaS Development Servers...\n");

const services = [
  {
    name: "Frontend",
    path: "apps/frontend",
    command: "npm",
    args: ["run", "dev"],
    port: "5173",
  },
  // TODO: Add backend services when dependencies are resolved
  // {
  //   name: 'Auth Service',
  //   path: 'services/auth-service',
  //   command: 'npm',
  //   args: ['run', 'dev'],
  //   port: '3001'
  // }
];

const processes = [];

// Function to start a service
function startService(service) {
  console.log(`📦 Starting ${service.name}...`);

  const proc = spawn(service.command, service.args, {
    cwd: path.join(__dirname, service.path),
    stdio: "inherit",
    shell: true,
  });

  proc.on("error", (error) => {
    console.error(`❌ Error starting ${service.name}:`, error.message);
  });

  proc.on("close", (code) => {
    console.log(`🔴 ${service.name} exited with code ${code}`);
  });

  processes.push(proc);
  return proc;
}

// Start all services
services.forEach((service) => {
  startService(service);
});

console.log("\n✅ All servers are starting...");
console.log("🌐 URLs:");
services.forEach((service) => {
  console.log(`   ${service.name}: http://localhost:${service.port}`);
});
console.log("\n💡 Press Ctrl+C to stop all servers");

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping all servers...");

  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      proc.kill("SIGTERM");
    }
  });

  setTimeout(() => {
    processes.forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill("SIGKILL");
      }
    });
    process.exit(0);
  }, 5000);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      proc.kill("SIGKILL");
    }
  });
  process.exit(1);
});
