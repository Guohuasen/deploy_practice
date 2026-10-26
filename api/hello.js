// 这个文件在服务器上执行，不会作为前端 JavaScript 发给浏览器。
// Vercel 会把 api/hello.js 自动部署为 /api/hello 接口。

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export default {
  async fetch(request) {
    // GET：读取后端状态。可以直接在浏览器打开 /api/hello。
    if (request.method === "GET") {
      return json({
        message: "后端已连接",
        serverTime: new Date().toISOString(),
        environment: process.env.VERCEL ? "vercel" : "local",
      });
    }

    // 这个接口只接受 GET 和 POST，其他请求方式返回 405。
    if (request.method !== "POST") {
      return json({ error: "请使用 GET 或 POST 请求。" }, 405, {
        Allow: "GET, POST",
      });
    }

    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "请使用 application/json 格式提交。" }, 415);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "请求内容不是有效的 JSON。" }, 400);
    }

    // 浏览器的输入限制可以被绕过，所以后端也要检查。
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 50) {
      return json({ error: "请输入 1～50 个字符的名字。" }, 400);
    }

    // POST：处理浏览器提交的名字，返回真正由后端生成的数据。
    return json({
      message: `你好，${name}！这是后端发来的问候。`,
      serverTime: new Date().toISOString(),
      environment: process.env.VERCEL ? "vercel" : "local",
    });
  },
};
