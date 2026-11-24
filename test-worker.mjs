import worker from "./worker.js";

const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    failures.push(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Mock fetch 测试
const calls = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const req = input instanceof Request ? input : new Request(input, init);
  const bodyText = req.body ? await req.clone().text() : null;
  calls.push({
    url: req.url,
    method: req.method,
    bodyText,
    contentType: req.headers.get("content-type"),
    xTest: req.headers.get("x-test"),
    host: new URL(req.url).host,
  });
  return new Response("ok", { status: 200 });
};

async function runTests() {
  // 测试 1: 透传 - 其他路径
  calls.length = 0;
  const passthroughReq = new Request("https://blog.atschx.me/other-path?q=1", {
    method: "GET",
    headers: { "x-test": "passthrough" },
  });
  await worker.fetch(passthroughReq);
  assertEqual(calls.length, 1, "passthrough call count");
  assertEqual(calls[0].url, passthroughReq.url, "passthrough URL unchanged");
  assertEqual(calls[0].host, "blog.atschx.me", "passthrough host");

  // 测试 2: 代理 - 精确前缀
  calls.length = 0;
  await worker.fetch(
    new Request("https://blog.atschx.me/cosmic-elements-xbit?foo=bar", {
      method: "GET",
      headers: { "x-test": "proxy" },
    }),
  );
  assertEqual(calls.length, 1, "proxy call count");
  assertEqual(
    calls[0].url,
    "https://atschx.github.io/cosmic-elements-xbit?foo=bar",
    "proxy URL rewritten",
  );
  assertEqual(calls[0].host, "atschx.github.io", "proxy host");
  assertEqual(calls[0].xTest, "proxy", "proxy header preserved");

  // 测试 3: 代理 - 子路径
  calls.length = 0;
  await worker.fetch(
    new Request("https://blog.atschx.me/cosmic-elements-xbit/page.html", {
      method: "GET",
    }),
  );
  assertEqual(
    calls[0].url,
    "https://atschx.github.io/cosmic-elements-xbit/page.html",
    "proxy subpath",
  );

  // 测试 4: POST body 保留
  calls.length = 0;
  const body = JSON.stringify({ test: "data" });
  await worker.fetch(
    new Request("https://blog.atschx.me/cosmic-elements-xbit/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
  assertEqual(calls[0].method, "POST", "POST method preserved");
  assertEqual(calls[0].bodyText, body, "POST body preserved");
  assertEqual(calls[0].contentType, "application/json", "POST content-type preserved");

  // 测试 5: 首页透传
  calls.length = 0;
  await worker.fetch(new Request("https://blog.atschx.me/"));
  assertEqual(calls[0].url, "https://blog.atschx.me/", "homepage passthrough");

  // 测试 6: startsWith 变体（也会被代理）
  calls.length = 0;
  await worker.fetch(new Request("https://blog.atschx.me/cosmic-elements-xbit-other"));
  assertEqual(
    calls[0].url,
    "https://atschx.github.io/cosmic-elements-xbit-other",
    "startsWith variant proxied",
  );

  // 测试 7: 不同 hostname 不代理
  calls.length = 0;
  await worker.fetch(new Request("https://other.example.com/cosmic-elements-xbit"));
  assertEqual(calls[0].url, "https://other.example.com/cosmic-elements-xbit", "different hostname passthrough");
}

await runTests();
globalThis.fetch = originalFetch;

if (failures.length) {
  console.error("FAILED");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("PASS");
console.log("测试通过：透传、代理、query 保留、POST body、startsWith 语义");
