import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { decodeRecording, MAX_RECORDING_BYTES, recordingToWav } from "./recording";

test("recording boundary rejects malformed or oversized base64", () => {
  for (const input of ["", "data:audio/wav;base64,abc", "???=", "YWJj", "A".repeat(16 * 1024 * 1024 + 4)]) {
    assert.throws(() => decodeRecording(input));
  }
  const audio = Buffer.alloc(64, 7);
  assert.deepEqual(decodeRecording(audio.toString("base64")), audio);
  assert.equal(MAX_RECORDING_BYTES, 12 * 1024 * 1024);
});

for (const format of ["wav", "webm", "mp4"] as const) {
  test(`${format} recordings convert to a mono WAV without temporary files`, async () => {
    const args = ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.15"];
    if (format === "mp4") args.push("-c:a", "aac", "-movflags", "frag_keyframe+empty_moov");
    args.push("-f", format, "pipe:1");
    const source = execFileSync("ffmpeg", args);
    const wav = await recordingToWav(decodeRecording(source.toString("base64")));
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.toString("ascii", 8, 12), "WAVE");
    assert.equal(wav.readUInt16LE(22), 1);
    assert.equal(wav.readUInt32LE(24), 16000);
  });
}

test("invalid audio fails explicitly", async () => {
  await assert.rejects(recordingToWav(Buffer.alloc(128)), /could not be read/);
});
