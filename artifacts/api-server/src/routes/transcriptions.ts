import { Router, json } from "express";
import { toFile } from "openai";
import { TranscribeRecordingBody } from "@workspace/api-zod";
import { requireAiConsent, requireAuth } from "../middlewares/require-auth";
import { openai } from "../lib/openai-client";
import { decodeRecording, recordingToWav } from "../lib/recording";

const router = Router();
const calls = new Map<string, number[]>();
const active = new Set<string>();
router.post("/openai/transcriptions", requireAuth, requireAiConsent, json({ limit: "17mb" }), async (req, res): Promise<void> => {
  const parsed = TranscribeRecordingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Please try a recording under five minutes and 12 MB." }); return; }
  const userId = res.locals.user.id as string;
  const now = Date.now();
  const recent = (calls.get(userId) ?? []).filter(time => now - time < 3600000);
  if (recent.length >= 30 || active.has(userId)) { res.status(429).json({ error: "Please wait before transcribing another recording." }); return; }
  let audio: Buffer;
  try { audio = decodeRecording(parsed.data.audio); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Invalid recording." }); return; }
  recent.push(now); calls.set(userId, recent); active.add(userId);
  try {
    const wav = await recordingToWav(audio);
    const result = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: await toFile(wav, "recording.wav", { type: "audio/wav" }),
      response_format: "json",
    }, { timeout: 90000 });
    res.json({ text: result.text });
  } catch (error) {
    // Never log the raw audio, transcript, or SDK request body.
    req.log.warn({ category: "transcription_failed" }, "Recording transcription failed");
    const message = error instanceof Error && /recording|conversion|five minutes/i.test(error.message)
      ? error.message : "We couldn't transcribe that recording. You can try again or type instead.";
    res.status(400).json({ error: message });
  } finally { active.delete(userId); }
});
export default router;
