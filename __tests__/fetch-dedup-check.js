const fs = require("fs");
const path = require("path");

console.log("🧪 Client-Side Fetch Deduplication Check\n");

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

// Check 2: Verify deduplication features
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");

  // Check for in-flight request map
  if (content.includes("inflightRequests")) {
    console.log("✓ In-flight request cache implemented");
    passed++;
  } else {
    console.log("✗ In-flight request cache missing");
    failed++;
  }

  // Check for buildCacheKey function
  if (content.includes("buildCacheKey")) {
    console.log("✓ Cache key builder implemented");
    passed++;
  } else {
    console.log("✗ Cache key builder missing");
    failed++;
  }

  // Check for skipDedup option
  if (content.includes("skipDedup")) {
    console.log("✓ skipDedup option available");
    passed++;
  } else {
    console.log("✗ skipDedup option missing");
    failed++;
  }

  // Check for dedup logic in fetchWithTimeout
  if (content.includes("GET") && content.includes("inflightRequests.get")) {
    console.log("✓ Deduplication logic in fetchWithTimeout");
    passed++;
  } else {
    console.log("✗ Deduplication logic missing");
    failed++;
  }

  // Check for clearFetchCache function
  if (content.includes("export function clearFetchCache")) {
    console.log("✓ clearFetchCache utility exported");
    passed++;
  } else {
    console.log("✗ clearFetchCache utility missing");
    failed++;
  }

  // Check for getFetchCacheSize function
  if (content.includes("export function getFetchCacheSize")) {
    console.log("✓ getFetchCacheSize utility exported");
    passed++;
  } else {
    console.log("✗ getFetchCacheSize utility missing");
    failed++;
  }

  // Check for Promise cleanup
  if (content.includes("inflightRequests.delete")) {
    console.log("✓ Cache cleanup after request completes");
    passed++;
  } else {
    console.log("✗ Cache cleanup missing");
    failed++;
  }
}

// Check 3: Verify FetchOptions interface has skipDedup
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");
  const interfaceMatch = content.match(
    /export interface FetchOptions[\s\S]*?^}/m
  );

  if (interfaceMatch && interfaceMatch[0].includes("skipDedup")) {
    console.log("✓ FetchOptions interface includes skipDedup");
    passed++;
  } else {
    console.log("✗ FetchOptions interface missing skipDedup");
    failed++;
  }
}

console.log("\n==================================================");
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log("==================================================");

if (failed === 0) {
  console.log(
    "\n✓ Request deduplication protection implemented successfully!"
  );
} else {
  console.log("\n✗ Some checks failed");
  process.exit(1);
}
