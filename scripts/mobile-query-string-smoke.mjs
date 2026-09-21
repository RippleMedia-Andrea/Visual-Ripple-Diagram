import { createRequire } from "node:module";
import path from "node:path";

const mobileRoot = path.resolve("artifacts/purpose-lab-mobile");
const mobileRequire = createRequire(path.join(mobileRoot, "package.json"));
const expoRouterEntry = mobileRequire.resolve("expo-router");
const expoRequire = createRequire(expoRouterEntry);
const queryString = expoRequire("query-string");

const parsed = queryString.parse("name=hello%20world&tag=one&tag=two");
if (
  parsed.name !== "hello world" ||
  !Array.isArray(parsed.tag) ||
  parsed.tag[1] !== "two"
) {
  throw new Error("query-string failed to parse repeated and encoded values");
}

const routerRoot = path.dirname(expoRequire.resolve("expo-router/package.json"));
const { getStateFromPath } = expoRequire(
  path.join(routerRoot, "build/react-navigation/core/getStateFromPath.js"),
);
const state = getStateFromPath(
  "/details?name=hello%20world&tag=one&tag=two",
  { screens: { details: "details" } },
);
const routeParams = state?.routes?.[0]?.params;

if (
  routeParams?.name !== "hello world" ||
  !Array.isArray(routeParams.tag) ||
  routeParams.tag[1] !== "two"
) {
  throw new Error("Expo Router failed to parse deep-link query parameters");
}

console.log("Mobile query parsing smoke test passed.");