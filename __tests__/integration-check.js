#!/usr/bin/env node
/**
 * Integration Check — Verifies new features added in Cycle 4
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

console.log("\n🔄 Cycle 4 — Integration Check\n");

console.log("📚 New Utilities\n");

test("lib/api-utils.ts exists", () => {
  const filePath = path.join(__dirname, "..", "lib", "api-utils.ts");
  assert(fs.existsSync(filePath), "api-utils.ts should exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("successResponse") && content.includes("errorResponse"),
    "Should export response helpers"
  );
});

test("lib/utils.ts exists", () => {
  const filePath = path.join(__dirname, "..", "lib", "utils.ts");
  assert(fs.existsSync(filePath), "utils.ts should exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("formatTimestamp") && content.includes("formatDuration"),
    "Should export format helpers"
  );
});

test("lib/design-tokens.ts exists", () => {
  const filePath = path.join(__dirname, "..", "lib", "design-tokens.ts");
  assert(fs.existsSync(filePath), "design-tokens.ts should exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("COLORS") && content.includes("TYPOGRAPHY"),
    "Should export design tokens"
  );
});

console.log("\n🔌 Enhanced Gateway Adapter\n");

test("gateway-adapter has retry logic", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("RETRY_CONFIG") && content.includes("maxRetries"),
    "Should have retry configuration"
  );
});

test("gateway-adapter has timeout handling", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("AbortController") && content.includes("timeoutMs"),
    "Should have timeout handling"
  );
});

test("gateway-adapter exports type definitions", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export interface Session") &&
    content.includes("export interface Message") &&
    content.includes("export interface Agent"),
    "Should export type definitions"
  );
});

console.log("\n🛣️ Updated API Routes\n");

test("API routes use successResponse/errorResponse", () => {
  const routePath = path.join(__dirname, "..", "app", "api", "agents", "route.ts");
  const content = fs.readFileSync(routePath, "utf-8");
  assert(
    content.includes("successResponse") && content.includes("errorResponse"),
    "Routes should use utility helpers"
  );
});

test("API routes import api-utils", () => {
  const routePath = path.join(__dirname, "..", "app", "api", "agents", "route.ts");
  const content = fs.readFileSync(routePath, "utf-8");
  assert(
    content.includes('from "@/lib/api-utils"'),
    "Routes should import api-utils"
  );
});

test("Sessions route uses query param helper", () => {
  const routePath = path.join(__dirname, "..", "app", "api", "sessions", "route.ts");
  const content = fs.readFileSync(routePath, "utf-8");
  assert(
    content.includes("getQueryParam"),
    "Sessions route should use query param helper"
  );
});

console.log("\n✅ Type Exports\n");

test("gateway-adapter exports Session type", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export interface Session {") &&
    content.includes("key: string"),
    "Should export Session type"
  );
});

test("gateway-adapter exports Agent type", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export interface Agent {") &&
    content.includes("id: string"),
    "Should export Agent type"
  );
});

test("gateway-adapter exports Message type", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export interface Message {") &&
    content.includes("content: string"),
    "Should export Message type"
  );
});

console.log("\n📋 Health Check Function\n");

test("healthCheck function exists and has retry logic", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export async function healthCheck") &&
    content.includes("maxAttempts"),
    "healthCheck should exist and have retry"
  );
});

console.log(`\n${"=".repeat(50)}`);
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log(`${"=".repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
