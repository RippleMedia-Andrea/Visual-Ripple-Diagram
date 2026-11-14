// Development-only checks. Creates its own temporary account and deletes it.
// Does not call password recovery, send email, or use a paid AI model.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain || !domain.endsWith(".replit.dev")) throw new Error("Run only inside the development workspace.");
const base = `https://${domain}`;
const password = `${randomUUID()}Aa9!`;
let cookie = "";
let created = false;
async function request(path, method = "GET", data, authenticated = true) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      Origin: base,
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(authenticated && cookie ? { Cookie: cookie } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { response, data: await response.json().catch(() => null) };
}
try {
  assert.equal((await request("/openai/transcriptions", "POST", { audio: "broken" }, false)).response.status, 401);
  const signup = await request("/auth/sign-up/email", "POST", { email: `guided-check-${randomUUID()}@example.com`, name: "Guided checks", password }, false);
  assert.equal(signup.response.status, 200);
  cookie = signup.response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.ok(cookie, "Signup should create a session");
  created = true;
  const personal = (await request("/journeys/current")).data;
  const practice = (await request("/journeys/current?practice=true")).data;
  assert.notEqual(personal.id, practice.id);
  assert.equal(personal.isPractice, false);
  assert.equal(practice.isPractice, true);
  assert.equal((await request(`/journeys/${personal.id}`, "PATCH", { currentStageIdx: 1 })).response.status, 400);
  assert.equal((await request(`/journeys/${personal.id}`, "PATCH", { patternDiscovery: { actionWords: [], adjectives: [], impact: "", confirmed: true } })).response.status, 400);
  assert.equal((await request(`/journeys/${practice.id}`, "PATCH", { currentStageIdx: 2 })).response.status, 200);
  assert.equal((await request(`/journeys/${personal.id}`, "PATCH", { drafts: { reveal: "My unsent story", reveal__transcript: "My editable transcript" } })).response.status, 200);
  assert.equal((await request(`/journeys/${personal.id}`, "PATCH", { drafts: { identify: "My observations" } })).response.status, 200);
  const restored = (await request("/journeys/current")).data;
  assert.equal(restored.drafts.reveal, "My unsent story");
  assert.equal(restored.drafts.reveal__transcript, "My editable transcript");
  assert.equal(restored.drafts.identify, "My observations");
  assert.equal(restored.currentStageIdx, 0);
  assert.equal((await request(`/journeys/${personal.id}`, "PATCH", { drafts: { unrecognizedStage: "No" } })).response.status, 400);
  assert.equal((await request("/openai/transcriptions", "POST", { audio: "broken" })).response.status, 403);
  assert.equal((await request("/account/consent", "PATCH", {})).response.status, 200);
  assert.equal((await request("/openai/transcriptions", "POST", { audio: "broken" })).response.status, 400);
  if (process.argv[2]) {
    const audio = (await readFile(process.argv[2])).toString("base64");
    const transcript = await request("/openai/transcriptions", "POST", { audio });
    assert.equal(transcript.response.status, 200, JSON.stringify(transcript.data));
    assert.ok(transcript.data.text.trim(), "A spoken recording should produce a transcript");
    console.log("Passed: a real spoken recording reached OpenAI and returned a nonempty review transcript.");
  }
  console.log("Passed: recording authentication/consent/validation, practice separation, two-story gate, action/impact gate, draft merging and reload.");
} finally {
  if (created) {
    const cleanup = await request("/auth/delete-user", "POST", { password });
    assert.equal(cleanup.response.status, 200, "Temporary account cleanup failed");
    console.log("Removed the temporary check account and its journeys.");
  }
}
