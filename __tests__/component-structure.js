#!/usr/bin/env node
/**
 * Component Structure Verification Test
 * Ensures all React components have proper exports and structure
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

console.log("\n🧩 Component Structure Tests\n");

// Check components
const components = [
  { path: "components/MessagePanel.tsx", exportName: "MessagePanel" },
  { path: "components/OfficePanel.tsx", exportName: "OfficePanel" },
  { path: "components/SessionList.tsx", exportName: "SessionList" },
  { path: "components/Sidebar.tsx", exportName: "Sidebar" },
];

components.forEach(({ path: componentPath, exportName }) => {
  test(`${componentPath} exists and exports ${exportName}`, () => {
    const filePath = path.join(
      __dirname,
      "..",
      componentPath
    );
    assert(fs.existsSync(filePath), `${componentPath} should exist`);
    const content = fs.readFileSync(filePath, "utf-8");
    assert(
      content.includes(`export`) && content.includes(exportName),
      `${componentPath} should export ${exportName}`
    );
  });
});

console.log("\n📄 Page Structure Tests\n");

test("app/page.tsx is a client component", () => {
  const filePath = path.join(__dirname, "..", "app", "page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes('"use client"'),
    'page.tsx should have "use client" directive'
  );
});

test("app/page.tsx has useEffect for data fetching", () => {
  const filePath = path.join(__dirname, "..", "app", "page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("useEffect"),
    "page.tsx should use useEffect"
  );
});

test("app/page.tsx has mock fallback data", () => {
  const filePath = path.join(__dirname, "..", "app", "page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("mockSessions") || content.includes("mockAgents"),
    "page.tsx should have mock fallback data"
  );
});

test("app/layout.tsx exports metadata", () => {
  const filePath = path.join(__dirname, "..", "app", "layout.tsx");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("export const metadata"),
    "layout.tsx should export metadata"
  );
});

console.log("\n🔌 API Route Tests\n");

const apiRoutes = [
  "app/api/agents/route.ts",
  "app/api/sessions/route.ts",
  "app/api/sessions/[key]/history/route.ts",
  "app/api/sessions/[key]/send/route.ts",
  "app/api/stream/route.ts",
];

apiRoutes.forEach((routePath) => {
  test(`${routePath} exports GET or POST handler`, () => {
    const fullPath = path.join(__dirname, "..", routePath);
    assert(fs.existsSync(fullPath), `${routePath} should exist`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert(
      content.includes("export async function GET") ||
      content.includes("export async function POST"),
      `${routePath} should export GET or POST handler`
    );
  });

  test(`${routePath} has error handling`, () => {
    const fullPath = path.join(__dirname, "..", routePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert(
      content.includes("try") && content.includes("catch"),
      `${routePath} should have try-catch error handling`
    );
  });
});

console.log("\n🔌 Gateway Adapter Tests\n");

test("gateway-adapter exports all required functions", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  const requiredExports = [
    "listSessions",
    "getSessionHistory",
    "sendToSession",
    "listAgents",
    "healthCheck",
  ];
  requiredExports.forEach((fn) => {
    assert(
      content.includes(`export async function ${fn}`),
      `Should export ${fn}`
    );
  });
});

test("gateway-adapter has auth headers", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("Authorization") || content.includes("GATEWAY_TOKEN"),
    "Should use Authorization headers with token"
  );
});

test("gateway-adapter has error handling", () => {
  const filePath = path.join(__dirname, "..", "lib", "gateway-adapter.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    content.includes("!response.ok") || content.includes("throw"),
    "Should handle fetch errors"
  );
});

console.log("\n📦 Dependencies Check\n");

test("package.json has required dependencies", () => {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert(pkg.dependencies.next, "Should have next dependency");
  assert(pkg.dependencies.react, "Should have react dependency");
  assert(pkg.dependencies["react-dom"], "Should have react-dom dependency");
});

test("package.json has required devDependencies", () => {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert(pkg.devDependencies.typescript, "Should have typescript");
  assert(pkg.devDependencies["@types/react"], "Should have @types/react");
});

console.log(`\n${"=".repeat(50)}`);
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log(`${"=".repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
