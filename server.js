// 일반 서버용 실행 파일 (Railway, Render, 내 컴퓨터 등): `node server.js`
// Vercel에서는 이 파일을 쓰지 않고 public/ 과 api/ 를 바로 사용합니다.
const http = require("http");
const fs = require("fs");
const path = require("path");

const routes = {
  "/api/state": require("./api/state"),
  "/api/action": require("./api/action"),
  "/api/roster": require("./api/roster"),
};
const PUBLIC = path.join(__dirname, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const handler = routes[url.pathname];
    if (handler) {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
        if (raw.length > 300000) req.destroy();
      });
      req.on("end", () => {
        try { req.body = raw ? JSON.parse(raw) : null; } catch (e) { req.body = null; }
        handler(req, res);
      });
      return;
    }
    let file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
    if (!file.startsWith(PUBLIC)) file = path.join(PUBLIC, "index.html");
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.statusCode = 404;
        return res.end("Not found");
      }
      res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
      res.end(buf);
    });
  })
  .listen(process.env.PORT || 3000, () => {
    console.log("버스 탑승 체크: http://localhost:" + (process.env.PORT || 3000));
  });
