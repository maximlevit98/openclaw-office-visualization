const fs = require("fs");
const path = require("path");

console.log("🧪 Client-Side Fetch Timeout Protection Check\n");

let passed = 0;
let failed = 0;

// Check 1: client-fetch.ts exists
const clientFetchPath = path.join(__dirname, "../lib/client-fetch.ts");
if (fs.existsSync(clientFetchPath)) {
  console.log("✓ lib/client-fetch.ts exists");
  passed++;
} else {
  console.log("✗ lib/client-fetch.ts missing");
  failed++;
}

// Check 2: Verify exports
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");
  const exports = [
    "fetchWithTimeout",
    "fetchJSON",
    "postJSON",
    "isServiceHealthy",
    "fetchWithFallback",
  ];

  for (const exp of exports) {
    if (content.includes(`export ${/^fetch|^is|^post/.test(exp) ? "async function" : "function"} ${exp}`)) {
      console.log(`✓ Exports ${exp}`);
      passed++;
    } else {
      console.log(`✗ Missing export: ${exp}`);
      failed++;
    }
  }
}

// Check 3: Verify timeout protection in code
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");
  if (content.includes("AbortController")) {
    console.log("✓ Uses AbortController for timeout");
    passed++;
  } else {
    console.log("✗ Missing AbortController implementation");
    failed++;
  }

  if (content.includes("timeoutMs")) {
    console.log("✓ Has timeout parameter");
    passed++;
  } else {
    console.log("✗ Missing timeout parameter");
    failed++;
  }

  if (content.includes("retries")) {
    console.log("✓ Has retry logic");
    passed++;
  } else {
    console.log("✗ Missing retry logic");
    failed++;
  }
}

// Check 4: Verify page.tsx uses client-fetch
const pagePath = path.join(__dirname, "../app/page.tsx");
if (fs.existsSync(pagePath)) {
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  if (pageContent.includes("from @/lib/client-fetch")) {
    console.log("✓ page.tsx imports client-fetch");
    passed++;
  } else {
    console.log("✗ page.tsx doesn't import client-fetch");
    failed++;
  }

  if (pageContent.includes("fetchWithFallback")) {
    console.log("✓ page.tsx uses fetchWithFallback");
    passed++;
  } else {
    console.log("✗ page.tsx doesn't use fetchWithFallback");
    failed++;
  }

  if (pageContent.includes("isServiceHealthy")) {
    console.log("✓ page.tsx uses isServiceHealthy");
    passed++;
  } else {
    console.log("✗ page.tsx doesn't use isServiceHealthy");
    failed++;
  }

  if (pageContent.includes("fetchJSON") || pageContent.includes("postJSON")) {
    console.log("✓ page.tsx uses fetchJSON or postJSON");
    passed++;
  } else {
    console.log("✗ page.tsx doesn't use fetch helpers");
    failed++;
  }
}

// Check 5: Verify TypeScript types in client-fetch
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");
  if (content.includes("interface FetchOptions")) {
    console.log("✓ Defines FetchOptions interface");
    passed++;
  } else {
    console.log("✗ Missing FetchOptions interface");
    failed++;
  }

  if (content.includes("Generic")) {
    console.log("✓ Uses generic types for responses");
    passed++;
  } else {
    console.log("✗ Missing generic type support");
    failed++;
  }
}

console.log("\n==================================================");
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log("==================================================");

if (failed === 0) {
  console.log("\n✓ Client-side fetch timeout protection implemented!");
} else {
  console.log("\n✗ Some checks failed");
  process.exit(1);
}
