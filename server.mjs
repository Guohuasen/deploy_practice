// 仅用于本地开发：把网页和同一个后端接口一起运行起来。
// 部署后由 Vercel 提供这些能力，不需要在 Vercel 启动此文件。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import hello from "./api/hello.js";

// 只公开这几个前端文件，避免把服务器代码和配置当网页暴露出去。
const pages = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]],
]);

export function createAppServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");

      if (url.pathname === "/api/hello") {
        // 将本地 Node.js 请求转换成后端使用的标准 Request。
        const options = { method: req.method, headers: req.headers };
        if (req.method !== "GET" && req.method !== "HEAD") {
          options.body = Readable.toWeb(req);
          options.duplex = "half";
        }
        const response = await hello.fetch(new Request(url, options));
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }

      const page = pages.get(url.pathname);
      if (!page) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("页面不存在");
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
      }

      const [file, type] = page;
      const content = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      console.error("本地服务器出错：", error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("服务器出错，请查看终端。");
    }
  });
}

// 被测试文件导入时不启动；用 node server.mjs 运行时才启动。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const server = createAppServer();
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE"
      ? `端口 ${port} 已被占用。请关闭之前启动的服务器，或换一个 PORT。`
      : error);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`\n  项目已启动：http://localhost:${port}\n  按 Ctrl + C 停止服务。\n`);
  });
}
