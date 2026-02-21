#!/usr/bin/env node
/**
 * Smoke Test — Office Visualization MVP
 * Basic compilation and export verification
 */

const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// === Build Artifacts ===
console.log("\n📦 Build Output Verification\n");

test("Build output exists (.next directory)", () => {
  const nextDir = path.join(
    __dirname,
    "..",
    ".next"
  );
  assert(fs.existsSync(nextDir), ".next directory should exist after build");
});

test("Source files exist - types.ts", () => {
  const typesFile = path.join(__dirname, "..", "lib", "types.ts");
  assert(fs.existsSync(typesFile), "lib/types.ts should exist");
  const content = fs.readFileSync(typesFile, "utf-8");
  assert(content.includes("interface Message"), "Message type should be defined");
  assert(content.includes("interface Session"), "Session type should be defined");
  assert(content.includes("interface Agent"), "Agent type should be defined");
});

test("Source files exist - gateway-adapter.ts", () => {
  const adapterFile = path.join(
    __dirname,
    "..",
    "lib",
    "gateway-adapter.ts"
  );
  assert(fs.existsSync(adapterFile), "lib/gateway-adapter.ts should exist");
  const content = fs.readFileSync(adapterFile, "utf-8");
  assert(
    content.includes("listSessions"),
    "listSessions function should be defined"
  );
  assert(
    content.includes("getSessionHistory"),
    "getSessionHistory function should be defined"
  );
  assert(
    content.includes("sendToSession"),
    "sendToSession function should be defined"
  );
  assert(
    content.includes("listAgents"),
    "listAgents function should be defined"
  );
});

test("App components exist", () => {
  const components = [
    "components/MessagePanel.tsx",
    "components/OfficePanel.tsx",
    "components/SessionList.tsx",
    "components/Sidebar.tsx",
  ];
  components.forEach((comp) => {
    const compPath = path.join(__dirname, "..", comp);
    assert(fs.existsSync(compPath), `${comp} should exist`);
  });
});

test("App pages exist", () => {
  const files = ["app/layout.tsx", "app/page.tsx"];
  files.forEach((file) => {
    const filePath = path.join(__dirname, "..", file);
    assert(fs.existsSync(filePath), `${file} should exist`);
  });
});

// === API Routes ===
console.log("\n🔌 API Routes\n");

test("API routes directory exists", () => {
  const apiDir = path.join(__dirname, "..", "app", "api");
  assert(fs.existsSync(apiDir), "app/api directory should exist");
});

test("API route files are present", () => {
  const expectedRoutes = [
    "app/api/agents/route.ts",
    "app/api/sessions/route.ts",
    "app/api/sessions/[key]/history/route.ts",
    "app/api/sessions/[key]/send/route.ts",
    "app/api/stream/route.ts",
  ];
  expectedRoutes.forEach((route) => {
    const routePath = path.join(__dirname, "..", route);
    assert(fs.existsSync(routePath), `${route} should exist`);
  });
});

// === Configuration ===
console.log("\n⚙️  Configuration\n");

test("package.json has required scripts", () => {
  const pkgFile = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
  assert(pkg.scripts.dev, "dev script should exist");
  assert(pkg.scripts.build, "build script should exist");
  assert(pkg.scripts.start, "start script should exist");
  assert(pkg.scripts.lint, "lint script should exist");
});

test("TypeScript configuration is valid", () => {
  const tsConfigFile = path.join(__dirname, "..", "tsconfig.json");
  assert(fs.existsSync(tsConfigFile), "tsconfig.json should exist");
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigFile, "utf-8"));
  assert(tsConfig.compilerOptions, "compilerOptions should exist");
});

test("Next.js configuration is valid", () => {
  const nextConfigFile = path.join(__dirname, "..", "next.config.ts");
  assert(fs.existsSync(nextConfigFile), "next.config.ts should exist");
});

// === Type Checking (via file content) ===
console.log("\n✓ Type Definitions\n");

test("Message type structure is correct", () => {
  const typesFile = path.join(__dirname, "..", "lib", "types.ts");
  const content = fs.readFileSync(typesFile, "utf-8");
  assert(
    content.includes('role: "user" | "assistant" | "system"'),
    "Message.role should have correct union type"
  );
  assert(
    content.includes("content: string"),
    "Message.content should be string"
  );
});

test("Session type structure is correct", () => {
  const typesFile = path.join(__dirname, "..", "lib", "types.ts");
  const content = fs.readFileSync(typesFile, "utf-8");
  assert(
    content.includes("key: string"),
    "Session.key should be string"
  );
  assert(
    content.includes("messages?: Message[]"),
    "Session.messages should be optional Message array"
  );
});

// === Summary ===
console.log(`\n${"=".repeat(50)}`);
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log(`${"=".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✓ All smoke tests passed!\n");
  process.exit(0);
}
