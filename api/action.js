const { put } = require("../lib/store");
const { authorized, send } = require("../lib/http");

const PATH_RE = /^(checks|extras|removed|log)\/([A-Za-z0-9_\-]{1,80})$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!(await authorized(req))) return send(res, 401, { error: "locked" });

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (e) { data = null; }
  }
  const m = data && typeof data.path === "string" && data.path.match(PATH_RE);
  if (!m) return send(res, 400, { error: "bad_path" });

  const body = data.body ?? null;
  if (body !== null && (typeof body !== "object" || Array.isArray(body) || JSON.stringify(body).length > 2000)) {
    return send(res, 400, { error: "bad_body" });
  }

  try {
    await put(m[1], m[2], body);
    send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "store_unavailable" });
  }
};
