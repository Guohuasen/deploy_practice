# hello, deploy

用于第一次部署的极简前后端项目：输入名字，浏览器调用后端，显示问候和服务器时间。

## 本地运行

使用 Node.js 24，在项目根目录执行：

```sh
npm install
npm run dev
```

然后打开 http://localhost:3000。按 Ctrl + C 停止。修改前端文件后刷新浏览器；修改后端文件后本地服务会自动重启。

## 文件

- `public/`：浏览器使用的 HTML、CSS、JavaScript。
- `api/hello.js`：后端。GET 查询状态，POST 提交 `{ "name": "小明" }` 并返回问候。
- `server.mjs`：本地服务器，调用同一个后端处理函数。
- `vercel.json`：Vercel 部署配置，前端目录为 `public`，无需构建。
- `package.json` / `package-lock.json`：项目信息、命令和依赖记录。本项目没有第三方依赖。
- `test/`：接口集成测试，使用 `npm test` 运行。

## Vercel

把整个项目上传到你自己的 GitHub 仓库，在 Vercel 导入仓库。框架选 **Other**，Root Directory 保持仓库根目录，Output Directory 为 **public**，Build Command 留空。无需环境变量或数据库。不要把 Root Directory 改为 public，否则后端目录不会包含在部署中。

Vercel 使用 `api/hello.js` 提供后端，不通过 `npm start` 运行本地服务器。

这个示例不保存名字或问候，不包含账号、数据库等业务功能。适合练习完整的前后端请求和部署流程。

参考：[Vercel Node.js 函数](https://vercel.com/docs/functions/runtimes/node-js)、[部署配置](https://vercel.com/docs/project-configuration/vercel-json)。
