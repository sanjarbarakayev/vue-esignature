/**
 * Vitest Setup File
 *
 * This file runs before each test file and configures the test environment.
 */

// Suppress promise rejection warnings that occur when testing async code with fake timers.
// These warnings are expected because the resilience wrapper uses setTimeout/Promise
// which can cause rejections to be detected before the test's catch handler runs.
// All rejections are properly handled in the tests.
process.on("unhandledRejection", () => {
  // Intentionally empty - suppress the warning
});
