// 체크 상태 저장소
// - Upstash Redis 환경변수가 있으면 Redis 사용 (Vercel 권장)
// - 없으면 일반 서버(Railway, 로컬 등)에서는 JSON 파일에 저장
// - Vercel에서 Redis가 없으면 메모리에만 임시 저장 (재시작 시 사라짐)
const fs = require("fs");
const path = require("path");

const COLS = ["checks", "extras", "removed"];
const R_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const PREFIX = process.env.STORE_PREFIX || "buscheck2026:";

const FILE = process.env.VERCEL
  ? null
  : path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "state.json");

const kind = R_URL && R_TOKEN ? "redis" : FILE ? "file" : "memory";

async function redis(cmds) {
  const r = await fetch(R_URL.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + R_TOKEN, "content-type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis http " + r.status);
  const out = await r.json();
  return out.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

let mem = null;
function loadMem() {
  if (mem) return mem;
  mem = { checks: {}, extras: {}, removed: {} };
  if (FILE) {
    try {
      Object.assign(mem, JSON.parse(fs.readFileSync(FILE, "utf8")));
    } catch (e) {}
  }
  return mem;
}
function saveMem() {
  if (!FILE) return;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(mem));
  fs.renameSync(tmp, FILE);
}

function parseHash(res) {
  const o = {};
  if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i += 2) {
      try { o[res[i]] = JSON.parse(res[i + 1]); } catch (e) {}
    }
  } else if (res && typeof res === "object") {
    for (const [k, v] of Object.entries(res)) {
      try { o[k] = typeof v === "string" ? JSON.parse(v) : v; } catch (e) {}
    }
  }
  return o;
}

async function getAll() {
  if (kind === "redis") {
    const res = await redis([...COLS.map((c) => ["HGETALL", PREFIX + c]), ["GET", PREFIX + "roster"]]);
    const out = {};
    COLS.forEach((c, i) => (out[c] = parseHash(res[i])));
    try { out.roster = JSON.parse(res[COLS.length] || "[]"); } catch (e) { out.roster = []; }
    return out;
  }
  const m = loadMem();
  return { checks: m.checks, extras: m.extras, removed: m.removed, roster: m.roster || [] };
}

async function getCode() {
  if (kind === "redis") return (await redis([["GET", PREFIX + "code"]]))[0] || "";
  return loadMem().code || "";
}
async function putCode(code) {
  if (kind === "redis") {
    await redis([["SET", PREFIX + "code", code]]);
    return;
  }
  loadMem().code = code;
  saveMem();
}

async function putRoster(roster) {
  if (kind === "redis") {
    await redis([["SET", PREFIX + "roster", JSON.stringify(roster)]]);
    return;
  }
  loadMem().roster = roster;
  saveMem();
}

async function put(col, id, body) {
  if (kind === "redis") {
    await redis([body ? ["HSET", PREFIX + col, id, JSON.stringify(body)] : ["HDEL", PREFIX + col, id]]);
    return;
  }
  const m = loadMem();
  if (body) m[col][id] = body;
  else delete m[col][id];
  saveMem();
}

module.exports = { getAll, put, putRoster, getCode, putCode, kind, COLS };
