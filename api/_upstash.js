// Thin helper around the Upstash Redis REST API, plus a simple
// shared-secret auth check used by both API routes.

async function upstash(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars"
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function checkAuth(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return Boolean(token) && token === process.env.AUTH_TOKEN;
}

module.exports = { upstash, checkAuth };
