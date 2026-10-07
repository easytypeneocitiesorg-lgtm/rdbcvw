const { upstash, checkAuth } = require("./_upstash");

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (req.method === "POST") {
    try {
      const command = req.body;
      if (!command || typeof command !== "object") {
        res.status(400).json({ error: "invalid command" });
        return;
      }
      await upstash(["LPUSH", "command_queue", JSON.stringify(command)]);
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === "GET") {
    try {
      const raw = await upstash(["RPOP", "command_queue"]);
      res.status(200).json({ command: raw ? JSON.parse(raw) : null });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
};
