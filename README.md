# Remote Firefox Control

Control a Firefox browser running on your own computer from any web
browser. Your PC runs a small Python agent that drives real Firefox via
Selenium; the Vercel site shows a live screenshot stream and forwards your
clicks/keystrokes back to the agent through Upstash Redis.

**Latency note:** this polls every ~0.5–1s rather than streaming true
video, so it feels more like a slow screen-share than a local mouse. Good
enough for browsing, filling forms, clicking around — not for anything
that needs frame-perfect timing.

## 1. Create a free Redis store (Upstash)

1. Go to https://upstash.com, sign up, create a Redis database (any free
   region is fine).
2. From the database's REST API section, copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 2. Deploy the site to Vercel

1. Push this folder to a GitHub repo (or `vercel --prod` directly from the
   folder with the Vercel CLI).
2. Import the repo in Vercel.
3. In the project's Environment Variables, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `AUTH_TOKEN` — make up a long random string (this is your password,
     e.g. generate one with `openssl rand -hex 32`)
4. Deploy. Note your site's URL, e.g. `https://your-app.vercel.app`.

## 3. Run the agent on your computer

1. Install Firefox if you don't already have it.
2. Install geckodriver and put it on your PATH:
   https://github.com/mozilla/geckodriver/releases
3. `cd agent && pip install -r requirements.txt`
4. Set the same secret and your site's URL as environment variables, then
   run it:

   ```bash
   export REMOTE_SERVER_URL="https://your-app.vercel.app"
   export REMOTE_AUTH_TOKEN="the-same-long-random-string"
   python agent.py
   ```

   A Firefox window will open on your machine (this is the window you're
   remote-controlling — leave it running).

## 4. Control it from anywhere

Open `https://your-app.vercel.app` in any browser, paste in the same
token, hit Connect. Click the screen to focus it and click/scroll/type as
normal. Use the toolbar to navigate, go back, or refresh.

## Security notes — please read

- Anyone with your `AUTH_TOKEN` has full control of that Firefox window
  (and, indirectly, your network access through it, your logged-in
  sessions, anything you type). Treat it like a root password: long,
  random, never committed to the repo, never shared.
- The token travels as a header over HTTPS (Vercel terminates TLS for
  you), so it isn't sent in plaintext — but it never expires and there's
  no rate limiting or lockout here. Don't leave the agent running for
  long unattended periods on a sensitive account.
- There's no multi-user concept — anyone with the token can send
  commands, and they'll collide with each other if two people connect at
  once.
- If you want to go further: rotate the token periodically, add IP
  allow-listing in Vercel, or put the whole thing behind Vercel's
  password protection (Pro plans) as a second layer.
