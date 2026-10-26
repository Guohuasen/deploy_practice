import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createAppServer } from "../server.mjs";

let server;
let base;

before(async () => {
  server = createAppServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("网页和所有静态资源可访问，服务器文件不可访问", async () => {
  for (const path of ["/", "/style.css", "/app.js", "/favicon.svg"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 0);
  }
  for (const path of ["/server.mjs", "/package.json", "/.env", "/missing"]) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});

test("GET 返回后端状态、运行环境和有效的服务器时间", async () => {
  const response = await fetch(base + "/api/hello");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.message, "后端已连接");
  assert.ok(["local", "vercel"].includes(data.environment));
  assert.ok(Math.abs(Date.now() - Date.parse(data.serverTime)) < 10000);
});

test("POST 接收中文名字并生成问候，去除两端空格", async () => {
  const response = await fetch(base + "/api/hello", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ name: " 小明 " }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "你好，小明！这是后端发来的问候。");
});

test("绕过前端检查的空名字、错误类型和超长名字被后端拒绝", async () => {
  for (const body of [{}, null, { name: " " }, { name: 123 }, { name: "长".repeat(51) }]) {
    const response = await fetch(base + "/api/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("无效 JSON、错误内容格式和不支持的方法有明确错误状态", async () => {
  const invalid = await fetch(base + "/api/hello", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken",
  });
  assert.equal(invalid.status, 400);
  const text = await fetch(base + "/api/hello", { method: "POST", body: "hello" });
  assert.equal(text.status, 415);
  const wrongMethod = await fetch(base + "/api/hello", { method: "DELETE" });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET, POST");
});
