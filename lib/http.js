const crypto = require("crypto");
const { getCode } = require("./store");

// 입장 코드: 환경변수 ACCESS_CODE가 있으면 그것을, 없으면 앱에서 처음 명단을 올릴 때 정한 코드를 씁니다.
async function currentCode() {
  return process.env.ACCESS_CODE || (await getCode());
}

async function authorized(req) {
  const code = await currentCode();
  if (!code) return true; // 아직 처음 설정 전
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

module.exports = { authorized, currentCode, send };
