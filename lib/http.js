const crypto = require("crypto");

// 입장 코드: 환경변수 ACCESS_CODE. 비워 두면 누구나 열 수 있음(권장하지 않음).
function authorized(req) {
  const code = process.env.ACCESS_CODE;
  if (!code) return true;
  const given = String(req.headers["x-access-code"] || "");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(code).digest();
  return crypto.timingSafeEqual(a, b);
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { authorized, send };
