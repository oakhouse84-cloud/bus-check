const { getAll, kind } = require("../lib/store");
const { authorized, send } = require("../lib/http");

module.exports = async (req, res) => {
  if (!authorized(req)) return send(res, 401, { error: "locked" });
  try {
    const s = await getAll();
    send(res, 200, { store: kind, ...s });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "store_unavailable" });
  }
};
