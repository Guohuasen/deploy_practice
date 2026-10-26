// 这个文件在浏览器里执行：读取输入 → 调用后端 → 把结果写到页面。
const form = document.querySelector("#hello-form");
const input = document.querySelector("#name");
const button = document.querySelector("#submit-button");
const buttonText = document.querySelector("#button-text");
const errorBox = document.querySelector("#form-error");
const retryButton = document.querySelector("#retry-button");

function setConnection(online) {
  document.querySelector("#status-dot").className = `status-dot ${online ? "online" : "offline"}`;
  document.querySelector("#connection-status").textContent = online ? "后端已连接" : "暂时无法连接后端";
  retryButton.hidden = online;
}

async function checkConnection() {
  retryButton.disabled = true;
  try {
    const response = await fetch("/api/hello", { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    setConnection(response.ok && typeof data.serverTime === "string");
  } catch {
    setConnection(false);
  } finally {
    retryButton.disabled = false;
  }
}

retryButton.addEventListener("click", checkConnection);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  const name = input.value.trim();
  if (!name) {
    errorBox.textContent = "请先输入你的名字，名字不能只有空格。";
    errorBox.hidden = false;
    input.focus();
    return;
  }

  button.disabled = true;
  buttonText.textContent = "等待服务器回信…";
  document.querySelector("#result").setAttribute("aria-busy", "true");
  const payload = { name };
  document.querySelector("#request-json").textContent = JSON.stringify(payload, null, 2);
  document.querySelector("#response-json").textContent = "等待回复…";

  try {
    // 使用相对路径：本地请求本地后端，上线后请求同一个域名下的后端。
    const response = await fetch("/api/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    document.querySelector("#response-json").textContent = JSON.stringify(data, null, 2);
    setConnection(true);
    if (!response.ok) throw new Error(data.error || "服务器暂时无法处理，请稍后重试。");

    // textContent 把名字当作文字显示，避免把输入内容当成 HTML 执行。
    document.querySelector("#greeting").textContent = data.message;
    document.querySelector("#server-time").textContent = new Date(data.serverTime).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });
    document.querySelector("#environment").textContent = data.environment === "vercel" ? "Vercel 云端" : "你的电脑 · 本地开发";
    document.querySelector("#empty-state").hidden = true;
    document.querySelector("#result").hidden = false;
  } catch (error) {
    const connectionError = error.name === "TimeoutError" || error.name === "TypeError" || error.name === "SyntaxError";
    errorBox.textContent = connectionError ? "没有收到有效回复。请确认服务已启动、网络正常，然后重试。" : error.message;
    errorBox.hidden = false;
    if (connectionError) {
      setConnection(false);
      document.querySelector("#response-json").textContent = errorBox.textContent;
    }
  } finally {
    button.disabled = false;
    buttonText.textContent = "再打一次招呼";
    document.querySelector("#result").removeAttribute("aria-busy");
  }
});

checkConnection();
