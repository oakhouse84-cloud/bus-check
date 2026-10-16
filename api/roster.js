// 명단 저장: 앱 화면에서 엑셀을 읽어 보낸 명단을 저장소에 넣습니다.
// 명단(이름·연락처)은 코드 저장소(GitHub)에 들어가지 않습니다.
const { putRoster, putCode } = require("../lib/store");
const { authorized, currentCode, send } = require("../lib/http");

const str = (v, n) => (v == null ? "" : String(v).slice(0, n));

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!(await authorized(req))) return send(res, 401, { error: "locked" });

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (e) { data = null; }
  }
  const list = data && Array.isArray(data.roster) ? data.roster : null;
  if (!list || list.length === 0 || list.length > 500) return send(res, 400, { error: "bad_roster" });

  const seen = new Set();
  const roster = [];
  for (const p of list) {
    const n = Number(p && p.n);
    const name = str(p && p.name, 30).trim();
    if (!Number.isInteger(n) || n < 1 || n > 100000 || !name || seen.has(n)) return send(res, 400, { error: "bad_row" });
    seen.add(n);
    roster.push({
      k: "b" + n, n, name,
      ph: str(p.ph, 20), grp: str(p.grp, 20), days: str(p.days, 20), stay: str(p.stay, 10),
      rep: str(p.rep, 30) || name, note: str(p.note, 120), warn: !!p.warn,
    });
  }

  // 처음 설정: 입장 코드를 함께 정합니다
  let newCode = "";
  if (!(await currentCode())) {
    newCode = str(data.code, 40).trim();
    if (newCode.length < 4) return send(res, 400, { error: "need_code" });
  }

  try {
    if (newCode) await putCode(newCode);
    await putRoster(roster);
    send(res, 200, { ok: true, count: roster.length });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "store_unavailable" });
  }
};
