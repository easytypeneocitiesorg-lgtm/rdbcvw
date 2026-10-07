// Must match WIDTH/HEIGHT in agent.py
const REMOTE_WIDTH = 1280;
const REMOTE_HEIGHT = 800;
const POLL_MS = 700;

const screenEl = document.getElementById("screen");
const statusEl = document.getElementById("status");
const tokenInput = document.getElementById("token-input");
const keyCapture = document.getElementById("key-capture");

let token = localStorage.getItem("remote_token") || "";
tokenInput.value = token;

document.getElementById("save-token").addEventListener("click", () => {
  token = tokenInput.value.trim();
  localStorage.setItem("remote_token", token);
  statusEl.textContent = "connecting...";
});

function authHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function sendCommand(cmd) {
  if (!token) return;
  try {
    await fetch("/api/command", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(cmd),
    });
  } catch (e) {
    console.error("sendCommand failed", e);
  }
}

async function pollScreenshot() {
  if (!token) return;
  try {
    const res = await fetch("/api/screenshot", { headers: authHeaders() });
    if (res.status === 401) {
      statusEl.textContent = "bad token";
      return;
    }
    const data = await res.json();
    if (data.image) {
      screenEl.src = `data:image/jpeg;base64,${data.image}`;
      statusEl.textContent = "live";
    } else {
      statusEl.textContent = "waiting for agent...";
    }
  } catch (e) {
    statusEl.textContent = "error";
  }
}
setInterval(pollScreenshot, POLL_MS);
pollScreenshot();

// --- Mouse ---
screenEl.addEventListener("click", (e) => {
  const rect = screenEl.getBoundingClientRect();
  const xPct = (e.clientX - rect.left) / rect.width;
  const yPct = (e.clientY - rect.top) / rect.height;
  sendCommand({
    type: "click",
    x: Math.round(xPct * REMOTE_WIDTH),
    y: Math.round(yPct * REMOTE_HEIGHT),
  });
  keyCapture.focus();
});

screenEl.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    sendCommand({ type: "scroll", deltaY: e.deltaY });
  },
  { passive: false }
);

// --- Keyboard ---
const SPECIAL_KEYS = {
  Enter: "ENTER",
  Backspace: "BACK_SPACE",
  Tab: "TAB",
  Escape: "ESCAPE",
  ArrowUp: "ARROW_UP",
  ArrowDown: "ARROW_DOWN",
  ArrowLeft: "ARROW_LEFT",
  ArrowRight: "ARROW_RIGHT",
  Delete: "DELETE",
  " ": "SPACE",
};

keyCapture.addEventListener("keydown", (e) => {
  e.preventDefault();
  if (SPECIAL_KEYS[e.key]) {
    sendCommand({ type: "key", key: SPECIAL_KEYS[e.key] });
  } else if (e.key.length === 1) {
    sendCommand({ type: "type", text: e.key });
  }
  keyCapture.value = "";
});

// --- Navigation ---
document.getElementById("go-btn").addEventListener("click", () => {
  const url = document.getElementById("url-input").value.trim();
  if (url) sendCommand({ type: "navigate", url });
});
document.getElementById("back-btn").addEventListener("click", () => {
  sendCommand({ type: "back" });
});
document.getElementById("refresh-btn").addEventListener("click", () => {
  sendCommand({ type: "refresh" });
});
