import { spawn } from "node:child_process";

export const MAX_RECORDING_BYTES = 12 * 1024 * 1024;
export const MAX_WAV_BYTES = 300 * 16000 * 2 + 1024;

export function decodeRecording(audio: string): Buffer {
  if (!audio || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio) || audio.length % 4 !== 0) throw new Error("Invalid recording.");
  const buffer = Buffer.from(audio, "base64");
  if (buffer.length < 12 || buffer.length > MAX_RECORDING_BYTES) throw new Error("Please keep recordings under 12 MB.");
  return buffer;
}

// Convert every container, including browser WebM and native M4A, in memory.
// Never write a raw recording to the filesystem, database, or App Storage.
export async function recordingToWav(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-t", "301", "-vn", "-f", "wav", "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", "pipe:1"]);
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) { child.kill("SIGKILL"); reject(error); }
      else resolve(Buffer.concat(chunks));
    };
    const timeout = setTimeout(() => finish(new Error("Recording could not be read. Please try a shorter recording.")), 30000);
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_WAV_BYTES) finish(new Error("Please keep recordings under five minutes."));
      else chunks.push(chunk);
    });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", () => finish(new Error("Audio conversion is temporarily unavailable. You can still type.")));
    child.on("close", code => code === 0 && size > 44 ? finish() : finish(new Error("That recording could not be read. Please try again or type instead.")));
    child.stdin.end(buffer);
  });
}
