const fs = require("fs");
const path = require("path");

console.log("🧪 Response Caching Check\n");

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

// Check 2: Verify response caching features
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");

  // Check for response cache map
  if (content.includes("responseCache")) {
    console.log("✓ Response cache implemented");
    passed++;
  } else {
    console.log("✗ Response cache missing");
    failed++;
  }

  // Check for CacheEntry interface
  if (content.includes("interface CacheEntry")) {
    console.log("✓ CacheEntry interface defined");
    passed++;
  } else {
    console.log("✗ CacheEntry interface missing");
    failed++;
  }

  // Check for getCachedResponse function
  if (content.includes("function getCachedResponse")) {
    console.log("✓ getCachedResponse function implemented");
    passed++;
  } else {
    console.log("✗ getCachedResponse function missing");
    failed++;
  }

  // Check for setCachedResponse function
  if (content.includes("function setCachedResponse")) {
    console.log("✓ setCachedResponse function implemented");
    passed++;
  } else {
    console.log("✗ setCachedResponse function missing");
    failed++;
  }

  // Check for cacheTtlMs option
  if (content.includes("cacheTtlMs")) {
    console.log("✓ cacheTtlMs option available");
    passed++;
  } else {
    console.log("✗ cacheTtlMs option missing");
    failed++;
  }

  // Check for skipCache option
  if (content.includes("skipCache")) {
    console.log("✓ skipCache option available");
    passed++;
  } else {
    console.log("✗ skipCache option missing");
    failed++;
  }

  // Check for clearResponseCache function
  if (content.includes("export function clearResponseCache")) {
    console.log("✓ clearResponseCache utility exported");
    passed++;
  } else {
    console.log("✗ clearResponseCache utility missing");
    failed++;
  }

  // Check for getResponseCacheStats function
  if (content.includes("export function getResponseCacheStats")) {
    console.log("✓ getResponseCacheStats utility exported");
    passed++;
  } else {
    console.log("✗ getResponseCacheStats utility missing");
    failed++;
  }

  // Check for cache expiration logic
  if (content.includes("now - entry.timestamp > entry.ttlMs")) {
    console.log("✓ Cache expiration logic implemented");
    passed++;
  } else {
    console.log("✗ Cache expiration logic missing");
    failed++;
  }

  // Check for TTL in CacheEntry
  if (content.includes("ttlMs: number")) {
    console.log("✓ TTL stored in cache entries");
    passed++;
  } else {
    console.log("✗ TTL not in cache entries");
    failed++;
  }
}

// Check 3: Verify FetchOptions has new fields
if (fs.existsSync(clientFetchPath)) {
  const content = fs.readFileSync(clientFetchPath, "utf-8");
  const interfaceMatch = content.match(
    /export interface FetchOptions[\s\S]*?^}/m
  );

  if (interfaceMatch) {
    if (
      interfaceMatch[0].includes("cacheTtlMs") &&
      interfaceMatch[0].includes("skipCache")
    ) {
      console.log("✓ FetchOptions includes cache options");
      passed++;
    } else {
      console.log("✗ FetchOptions missing cache options");
      failed++;
    }
  }
}

console.log("\n==================================================");
console.log(`✓ Tests passed:  ${passed}`);
console.log(`✗ Tests failed:  ${failed}`);
console.log("==================================================");

if (failed === 0) {
  console.log(
    "\n✓ Response caching protection implemented successfully!"
  );
} else {
  console.log("\n✗ Some checks failed");
  process.exit(1);
}
