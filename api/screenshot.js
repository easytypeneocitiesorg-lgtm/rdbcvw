const { upstash, checkAuth } = require("./_upstash");

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const image = await upstash(["GET", "latest_screenshot"]);
      const ts = await upstash(["GET", "latest_screenshot_ts"]);
      res.status(200).json({ image: image || null, ts: ts ? Number(ts) : null });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      const { image } = req.body || {};
      if (!image) {
        res.status(400).json({ error: "missing image" });
        return;
      }
      // Expire after 30s so a dead agent doesn't leave a stale frozen frame
      // looking "live" forever.
      await upstash(["SET", "latest_screenshot", image, "EX", "30"]);
      await upstash(["SET", "latest_screenshot_ts", Date.now().toString(), "EX", "30"]);
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
};
