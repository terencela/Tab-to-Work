#!/usr/bin/env node
/**
 * Generate voice (edge-tts neural TTS), tech BGM (ffmpeg), SFX, audio_meta.json,
 * and patch index.html scene timings + GSAP + audio elements.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIO_DIR = join(ROOT, "assets", "audio");
const VENV_DIR = join(ROOT, ".venv-audio");
const EDGE_TTS = join(VENV_DIR, "bin", "edge-tts");
const INDEX = join(ROOT, "index.html");
const FFMPEG = ffmpegInstaller.path;
const FFPROBE = ffprobeInstaller.path;

const VOICE = "en-US-GuyNeural";
const TTS_RATE = "-5%";
/** Silence between voice lines (seconds). Keep tight to avoid dead air. */
const VOICE_GAP = 0.1;
const BGM_BPM = 120;
const BGM_VOLUME = 0.28;
const SFX_LIB = join(process.env.HOME, ".agents/skills/hyperframes-media/assets/sfx");

/** Pixabay SFX bundled with hyperframes-media — trimmed on import. */
const SFX_CATALOG = {
  "whoosh-short": { file: "whoosh-short.mp3", trim: 0.55, volume: 0.9 },
  "impact-bass-1": { file: "impact-bass-1.mp3", trim: 0.72, volume: 0.95 },
  "glitch-1": { file: "glitch-1.mp3", trim: 0.48, volume: 0.85 },
  sparkle: { file: "sparkle.mp3", trim: 1.15, volume: 0.8 },
  click: { file: "click.mp3", trim: 0.35, volume: 0.95 },
  pop: { file: "pop.mp3", trim: 0.68, volume: 0.85 },
  notification: { file: "notification.mp3", trim: 0.95, volume: 0.78 },
  "impact-bass-2": { file: "impact-bass-2.mp3", trim: 0.88, volume: 0.95 },
};

const SCENES = [
  {
    id: 1,
    voice: "Be honest. Your phone is drowning in tabs.",
    sfx: [{ id: "whoosh-short", when: "preEnd", offset: -0.08 }],
  },
  {
    id: 2,
    voice: "You hit OneTab. Tabs gone. Brain still fried.",
    sfx: [{ id: "impact-bass-1", when: "start", offset: 0.32 }],
  },
  {
    id: 3,
    voice: "Cool. A cemetery of links nobody will ever open.",
    sfx: [{ id: "glitch-1", when: "start", offset: 0.42 }],
  },
  {
    id: 4,
    voice: "What if it read every tab, then did the work?",
    sfx: [{ id: "sparkle", when: "fraction", value: 0.78 }],
  },
  {
    id: 5,
    voice: "One click. Eighty nine tabs gone. Shortlist ready.",
    sfx: [
      { id: "click", when: "fraction", value: 0.22 },
      { id: "pop", when: "fraction", value: 0.38 },
    ],
  },
  {
    id: 6,
    voice: "Your boss thinks you're organized. Don't mention the agent.",
    sfx: [{ id: "notification", when: "start", offset: 0.28 }],
  },
  {
    id: 7,
    voice: "Tab to Work. Chaos to done.",
    sfx: [{ id: "impact-bass-2", when: "start", offset: 0.12 }],
  },
];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
  }
  return r;
}

function probeDuration(file) {
  const r = run(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return parseFloat(r.stdout.trim());
}

function ensureEdgeTts() {
  if (existsSync(EDGE_TTS)) return;
  console.log("Bootstrapping edge-tts venv (one-time)...");
  run("python3", ["-m", "venv", VENV_DIR]);
  run(join(VENV_DIR, "bin", "pip"), ["install", "-q", "edge-tts"]);
}

function edgeTtsToWav(text, outWav) {
  ensureEdgeTts();
  const mp3 = outWav.replace(/\.wav$/, ".mp3");
  const rawWav = outWav.replace(/\.wav$/, ".raw.wav");
  run(EDGE_TTS, [
    "--voice", VOICE,
    `--rate=${TTS_RATE}`,
    "--text", text,
    "--write-media", mp3,
  ]);
  run(FFMPEG, ["-y", "-i", mp3, "-ar", "48000", "-ac", "1", rawWav]);
  run("rm", ["-f", mp3]);
  // Trim TTS trailing/leading silence so scene gaps stay tight.
  run(FFMPEG, [
    "-y", "-i", rawWav,
    "-af",
    "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-42dB:detection=peak,"
    + "silenceremove=stop_periods=-1:stop_duration=0.14:stop_threshold=-42dB:detection=peak,"
    + "apad=pad_dur=0.03",
    "-ar", "48000", "-ac", "1",
    outWav,
  ]);
  run("rm", ["-f", rawWav]);
}

/**
 * @param {{ when?: string, offset?: number, value?: number, atLocal?: number }} fx
 * @param {number} voiceDuration
 */
function resolveSfxLocalTime(fx, voiceDuration) {
  if (fx.when === "preEnd") return Math.max(0, voiceDuration + (fx.offset ?? -0.1));
  if (fx.when === "start") return fx.offset ?? 0.3;
  if (fx.when === "fraction") return voiceDuration * (fx.value ?? 0.5);
  return fx.atLocal ?? 0;
}

function prepareSfx(id) {
  const spec = SFX_CATALOG[id];
  if (!spec) throw new Error(`Unknown SFX id: ${id}`);
  const src = join(SFX_LIB, spec.file);
  if (!existsSync(src)) {
    throw new Error(`SFX library missing ${src}. Install hyperframes-media skill assets.`);
  }
  const outWav = join(AUDIO_DIR, `sfx-${id}.wav`);
  const trim = spec.trim;
  const fadeStart = Math.max(0, trim - 0.1).toFixed(3);
  run(FFMPEG, [
    "-y", "-i", src,
    "-t", String(trim),
    "-af", `highpass=f=35,afade=t=out:st=${fadeStart}:d=0.1,volume=${spec.volume}`,
    "-ar", "48000", "-ac", "1",
    outWav,
  ]);
  return outWav;
}

function synthBgmLoop(outWav, loopDur = 8) {
  const beatS = (60 / BGM_BPM).toFixed(4);
  const noiseSrc = `anoisesrc=d=${loopDur}:c=pink:a=0.08`;
  run(FFMPEG, [
    "-y",
    "-f", "lavfi", "-i", `sine=frequency=82.41:duration=${loopDur}`,
    "-f", "lavfi", "-i", `sine=frequency=98:duration=${loopDur}`,
    "-f", "lavfi", "-i", `sine=frequency=123.47:duration=${loopDur}`,
    "-f", "lavfi", "-i", `sine=frequency=164.81:duration=${loopDur}`,
    "-f", "lavfi", "-i", `sine=frequency=55:duration=${loopDur}`,
    "-f", "lavfi", "-i", noiseSrc,
    "-filter_complex",
    [
      "[0]volume=0.09,lowpass=f=150[bass];",
      "[1]volume=0.04[fif];",
      "[2]volume=0.035,tremolo=f=0.25:d=0.35[p];",
      "[3]volume=0.022[t];",
      `[4]volume='if(lt(mod(t\\,${beatS})\\,0.045)\\,0.42\\,0.03)':eval=frame,lowpass=f=110[k];`,
      "[5]lowpass=f=280,volume=0.018[n];",
      "[bass][fif][p][t][k][n]amix=inputs=6:duration=first,",
      "highpass=f=42,lowpass=f=10000,",
      "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120",
    ].join(""),
    "-ar", "48000", "-ac", "2",
    outWav,
  ]);
}

function synthBgm(outWav, duration) {
  const loopPath = join(AUDIO_DIR, "bgm-loop.wav");
  synthBgmLoop(loopPath, 8);
  const fadeOut = Math.max(0, duration - 1).toFixed(3);
  const dur = duration.toFixed(3);
  run(FFMPEG, [
    "-y",
    "-stream_loop", "-1",
    "-i", loopPath,
    "-t", dur,
    "-af", `afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOut}:d=1.2,volume=0.62`,
    "-ar", "48000", "-ac", "2",
    outWav,
  ]);
}

function buildTimeline(timings) {
  const punch = '"back.out(3)"';
  const snap = 0.1;
  const lines = [];
  const w = (s) => timings.find((t) => t.id === s);

  lines.push(`      window.__timelines = window.__timelines || {};`);
  lines.push(`      const tl = gsap.timeline({ paused: true });`);
  lines.push(`      const punch = ${punch};`);
  lines.push(`      const snap = ${snap};`);
  lines.push(`      const flash = (t) => {`);
  lines.push(`        tl.to("#flash", { opacity: 0.8, duration: 0.03 }, t)`);
  lines.push(`          .to("#flash", { opacity: 0, duration: 0.07 }, t + 0.03)`);
  lines.push(`          .set("#flash", { opacity: 0 }, t + 0.12);`);
  lines.push(`      };`);
  lines.push("");

  const s1 = w(1).start;
  const d1 = w(1).duration;
  lines.push(`      // SCENE 1`);
  lines.push(`      tl.from("#s1-kicker", { opacity: 0, y: 30, duration: snap }, ${s1 + 0.05})`);
  lines.push(`        .from("#s1-h1", { opacity: 0, scale: 1.5, duration: snap, ease: punch }, ${s1 + 0.1})`);
  lines.push(`        .from("#s1-h2", { opacity: 0, scale: 1.4, duration: snap, ease: punch }, ${s1 + 0.18})`);
  lines.push(`        .from("#s1-phone", { opacity: 0, y: 200, rotation: 12, duration: 0.35, ease: punch }, ${s1 + 0.15})`);
  lines.push(`        .from("#s1-char", { opacity: 0, x: -80, duration: 0.25 }, ${s1 + 0.25})`);
  lines.push(`        .from("#s1-ft1", { opacity: 0, x: 200, y: -100, rotation: 25, duration: 0.2, ease: "power3.out" }, ${s1 + 0.4})`);
  lines.push(`        .from("#s1-ft2", { opacity: 0, x: -150, y: -80, rotation: -20, duration: 0.2, ease: "power3.out" }, ${s1 + 0.5})`);
  lines.push(`        .from("#s1-ft3", { opacity: 0, x: 180, y: 60, rotation: 15, duration: 0.2, ease: "power3.out" }, ${s1 + 0.55})`);
  lines.push(`        .from("#s1-ft4", { opacity: 0, x: -120, y: 40, rotation: -30, duration: 0.2, ease: "power3.out" }, ${s1 + 0.6})`);
  lines.push(`        .from("#s1-ft5", { opacity: 0, x: 160, y: 100, rotation: 20, duration: 0.2, ease: "power3.out" }, ${s1 + 0.65})`);
  const suck = s1 + d1 - 0.55;
  lines.push(`        .to("#s1-ft1", { x: 180, y: 350, scale: 0.6, rotation: 0, duration: 0.35, ease: "power2.in" }, ${suck})`);
  lines.push(`        .to("#s1-ft2", { x: 200, y: 400, scale: 0.6, rotation: 0, duration: 0.35, ease: "power2.in" }, ${suck})`);
  lines.push(`        .to("#s1-ft3", { x: 160, y: 380, scale: 0.6, rotation: 0, duration: 0.35, ease: "power2.in" }, ${suck})`);
  lines.push(`        .to("#s1-ft4", { x: 190, y: 420, scale: 0.6, rotation: 0, duration: 0.35, ease: "power2.in" }, ${suck})`);
  lines.push(`        .to("#s1-ft5", { x: 170, y: 360, scale: 0.6, rotation: 0, duration: 0.35, ease: "power2.in" }, ${suck})`);
  lines.push(`        .to("#s1-phone", { rotation: -4, duration: 0.06, yoyo: true, repeat: 7, ease: "power1.inOut" }, ${suck + 0.05})`);
  lines.push(`        .to("#s1-char", { y: 6, duration: 0.08, yoyo: true, repeat: 9, ease: "power1.inOut" }, ${suck + 0.05})`);
  lines.push(`        .to("#s1-strip", { x: -120, duration: 0.8, ease: "power1.inOut" }, ${s1 + 0.9})`);
  lines.push(`        .to("#s1-glow", { scale: 1.3, opacity: 0.8, duration: 0.4 }, ${s1 + d1 - 0.7});`);
  lines.push(`      flash(${s1 + d1 - 0.12});`);
  lines.push("");

  const s2 = w(2).start;
  const d2 = w(2).duration;
  lines.push(`      // SCENE 2`);
  lines.push(`      tl.from("#s2-laptop", { opacity: 0, y: 400, rotation: 8, scale: 0.7, duration: 0.4, ease: punch }, ${s2 + 0.05})`);
  lines.push(`        .from("#s2-kicker", { opacity: 0, duration: snap }, ${s2 + 0.1})`);
  lines.push(`        .from("#s2-h1", { opacity: 0, scale: 1.6, duration: snap, ease: punch }, ${s2 + 0.2})`);
  lines.push(`        .from("#s2-h2", { opacity: 0, y: 40, duration: snap }, ${s2 + 0.35})`);
  lines.push(`        .from("#s2-u1", { opacity: 0, x: -60, duration: 0.08, stagger: 0.06 }, ${s2 + 0.5})`);
  lines.push(`        .from("#s2-vacuum", { opacity: 0, scale: 0, duration: 0.2, ease: punch }, ${s2 + 0.6})`);
  lines.push(`        .to("#s2-vacuum", { y: 300, scale: 2, opacity: 0, duration: 0.5, ease: "power2.in" }, ${s2 + 1.0})`);
  lines.push(`        .to("#s2-list .url-row", { opacity: 0.3, x: 20, duration: 0.15, stagger: 0.04 }, ${s2 + 1.2})`);
  lines.push(`        .to("#s2-laptop", { rotation: 2, duration: 0.05, yoyo: true, repeat: 3 }, ${s2 + d2 - 0.5});`);
  lines.push(`      flash(${s2 + d2 - 0.12});`);
  lines.push("");

  const s3 = w(3).start;
  const d3 = w(3).duration;
  lines.push(`      // SCENE 3`);
  lines.push(`      tl.from("#s3-phone", { opacity: 0, y: -300, rotation: -15, duration: 0.35, ease: punch }, ${s3 + 0.05})`);
  lines.push(`        .from("#s3-h1", { opacity: 0, x: -80, duration: snap }, ${s3 + 0.15})`);
  lines.push(`        .from("#s3-h2", { opacity: 0, x: 80, duration: snap }, ${s3 + 0.25})`);
  lines.push(`        .from("#s3-sub", { opacity: 0, duration: snap }, ${s3 + 0.4})`);
  lines.push(`        .from("#s3-t1", { opacity: 0, y: 80, duration: 0.15, ease: punch }, ${s3 + 0.3})`);
  lines.push(`        .from("#s3-t2", { opacity: 0, y: 80, duration: 0.15, ease: punch }, ${s3 + 0.4})`);
  lines.push(`        .from("#s3-t3", { opacity: 0, y: 80, duration: 0.15, ease: punch }, ${s3 + 0.5})`);
  lines.push(`        .from("#s3-t4", { opacity: 0, y: 80, duration: 0.15, ease: punch }, ${s3 + 0.6})`);
  lines.push(`        .from("#s3-t5", { opacity: 0, y: 80, duration: 0.15, ease: punch }, ${s3 + 0.7})`);
  lines.push(`        .from("#s3-url", { opacity: 0, y: 20, duration: 0.2 }, ${s3 + d3 - 0.6});`);
  lines.push(`      flash(${s3 + d3 - 0.12});`);
  lines.push("");

  const s4 = w(4).start;
  const d4 = w(4).duration;
  lines.push(`      // SCENE 4`);
  lines.push(`      tl.from("#s4-phone", { opacity: 0, scale: 0.5, rotation: 8, duration: 0.35, ease: punch }, ${s4 + 0.05})`);
  lines.push(`        .from("#s4-kicker", { opacity: 0, duration: snap }, ${s4 + 0.1})`);
  lines.push(`        .from("#s4-h1", { opacity: 0, y: 50, duration: snap }, ${s4 + 0.2})`);
  lines.push(`        .from("#s4-h2", { opacity: 0, y: 50, duration: snap }, ${s4 + 0.3})`);
  lines.push(`        .to("#s4-scan", { opacity: 1, y: 700, duration: 1.0, ease: "power1.inOut", repeat: 2, yoyo: true }, ${s4 + 0.4})`);
  lines.push(`        .from("#s4-orb", { opacity: 0, scale: 0, duration: 0.3, ease: punch }, ${s4 + 0.9})`);
  lines.push(`        .to("#s4-orb", { y: -20, duration: 0.4, yoyo: true, repeat: 4, ease: "sine.inOut" }, ${s4 + 1.3})`);
  lines.push(`        .to("#s4-glow", { scale: 1.5, opacity: 1, duration: 0.5 }, ${s4 + 1.1})`);
  lines.push(`        .from("#s4-h3", { opacity: 0, scale: 1.4, duration: 0.2, ease: punch }, ${s4 + d4 - 0.7})`);
  lines.push(`        .to("#s4-phone", { scale: 1.05, duration: 0.3, yoyo: true, repeat: 1 }, ${s4 + d4 - 1.0});`);
  lines.push(`      flash(${s4 + d4 - 0.12});`);
  lines.push("");

  const s5 = w(5).start;
  const d5 = w(5).duration;
  const v5 = w(5).voiceDuration;
  const tap = s5 + v5 * 0.24;
  lines.push(`      // SCENE 5`);
  lines.push(`      tl.from("#s5-phone", { opacity: 0, y: 100, duration: 0.25 }, ${s5 + 0.05})`);
  lines.push(`        .from("#s5-kicker", { opacity: 0, duration: snap }, ${s5 + 0.1})`);
  lines.push(`        .from("#s5-h1", { opacity: 0, scale: 1.5, duration: snap, ease: punch }, ${s5 + 0.15})`);
  lines.push(`        .from("#s5-finger", { opacity: 0, y: -200, scale: 1.5, duration: 0.3, ease: "power2.in" }, ${tap - 0.3})`);
  lines.push(`        .to("#s5-finger", { y: 30, scale: 0.9, duration: 0.12, ease: "power2.in" }, ${tap})`);
  lines.push(`        .to("#s5-ring", { opacity: 1, scale: 2, duration: 0.4, ease: "power2.out" }, ${tap + 0.05})`);
  lines.push(`        .to("#s5-ring", { opacity: 0, scale: 3, duration: 0.3 }, ${tap + 0.4})`);
  lines.push(`        .to("#s5-ta", { x: -200, y: -300, rotation: -45, opacity: 0, duration: 0.25, ease: "power2.out" }, ${tap + 0.02})`);
  lines.push(`        .to("#s5-tb", { x: 100, y: -350, rotation: 30, opacity: 0, duration: 0.25, ease: "power2.out" }, ${tap + 0.02})`);
  lines.push(`        .to("#s5-tc", { x: 250, y: -280, rotation: 60, opacity: 0, duration: 0.25, ease: "power2.out" }, ${tap + 0.02})`);
  lines.push(`        .to("#s5-phone", { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, ${tap})`);
  lines.push(`        .from("#s5-result", { opacity: 0, y: 80, scale: 0.8, duration: 0.3, ease: punch }, ${tap + 0.35})`);
  lines.push(`        .to("#s5-result", { borderColor: "#fff", duration: 0.1, yoyo: true, repeat: 3 }, ${tap + 0.9})`);
  lines.push(`        .to("#s5-finger", { opacity: 0, y: 50, duration: 0.2 }, ${tap + 0.5});`);
  lines.push(`      flash(${s5 + d5 - 0.12});`);
  lines.push("");

  const s6 = w(6).start;
  lines.push(`      // SCENE 6`);
  lines.push(`      tl.from("#s6-char", { opacity: 0, y: 60, duration: 0.25 }, ${s6 + 0.05})`);
  lines.push(`        .from("#s6-boss", { opacity: 0, x: -80, duration: 0.25 }, ${s6 + 0.1})`);
  lines.push(`        .from("#s6-h1", { opacity: 0, y: 30, duration: snap }, ${s6 + 0.15})`);
  lines.push(`        .from("#s6-h2", { opacity: 0, scale: 1.4, duration: 0.15, ease: punch }, ${s6 + 0.3})`);
  lines.push(`        .from("#s6-sub", { opacity: 0, duration: snap }, ${s6 + 0.5})`);
  lines.push(`        .to("#s6-char", { rotation: 2, duration: 0.2, yoyo: true, repeat: 3 }, ${s6 + 0.6})`);
  lines.push(`        .to("#s6-boss", { y: -10, duration: 0.3, yoyo: true, repeat: 2, ease: "sine.inOut" }, ${s6 + 0.7});`);
  lines.push("");

  const s7 = w(7).start;
  lines.push(`      // SCENE 7`);
  lines.push(`      tl.from("#s7-title", { opacity: 0, scale: 0.4, duration: 0.2, ease: punch }, ${s7 + 0.05})`);
  lines.push(`        .from("#s7-tag", { opacity: 0, y: 20, duration: snap }, ${s7 + 0.2})`);
  lines.push(`        .from("#s7-phone", { opacity: 0, y: 150, rotation: 5, duration: 0.3, ease: punch }, ${s7 + 0.1})`);
  lines.push(`        .to("#s7-glow", { scale: 1.8, opacity: 1, duration: 0.4 }, ${s7 + 0.3});`);
  lines.push("");
  lines.push(`      window.__timelines["main"] = tl;`);

  return lines.join("\n");
}

function buildAudioElements(timings, sfxTracks, totalDuration) {
  const els = [];
  for (const t of timings) {
    els.push(
      `<audio id="voice-${String(t.id).padStart(2, "0")}" src="assets/audio/voice-${String(t.id).padStart(2, "0")}.wav" data-start="${round(t.start)}" data-duration="${round(t.voiceDuration)}" data-track-index="10" data-volume="1"></audio>`,
    );
  }
  els.push(
    `<audio id="bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${round(totalDuration)}" data-track-index="11" data-volume="${BGM_VOLUME}"></audio>`,
  );
  let trackIdx = 20;
  for (const sfx of sfxTracks) {
    els.push(
      `<audio id="sfx-${sfx.id}" src="assets/audio/sfx-${sfx.type}.wav" data-start="${round(sfx.start)}" data-duration="${round(sfx.duration)}" data-track-index="${trackIdx++}" data-volume="${sfx.volume}"></audio>`,
    );
  }
  return els.join("\n      ");
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function patchIndex(html, timings, totalDuration, sfxTracks) {
  let out = html;
  out = out.replace(
    /(id="root"[^>]*data-duration=")[^"]*"/,
    `$1${round(totalDuration)}"`,
  );
  out = out.replace(
    /id="flash"[^>]*data-duration="[^"]*"/,
    `id="flash" class="bg-flash clip" data-start="0" data-duration="${round(totalDuration)}" data-track-index="3"`,
  );

  for (const t of timings) {
    const re = new RegExp(`id="scene-${t.id}"[^>]*data-start="[^"]*"[^>]*data-duration="[^"]*"`);
    out = out.replace(
      re,
      `id="scene-${t.id}" class="clip" data-start="${round(t.start)}" data-duration="${round(t.duration)}"`,
    );
  }

  // Fix scene 2 on-screen copy to match voice
  out = out.replace(
    /<div[^>]*id="s2-h2"[^>]*>.*?<\/div>/,
    `<div data-hf-id="hf-42tr" class="headline-sm" id="s2-h2">Brain still fried.</div>`,
  );

  const audioBlock = buildAudioElements(timings, sfxTracks, totalDuration);
  out = out.replace(/\s*<audio[\s\S]*?<\/audio>/g, "");
  out = out.replace(
    /(\s*<\/section>\s*\n)(\s*<\/div>\s*\n\s*<script>)/,
    `$1\n      ${audioBlock}\n$2`,
  );

  const newScript = buildTimeline(timings);
  out = out.replace(
    /<script>\s*window\.__timelines[\s\S]*?<\/script>/,
    `<script>\n${newScript}\n    </script>`,
  );

  return out;
}

function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });

  const sfxTypes = new Set();
  for (const s of SCENES) for (const fx of s.sfx) sfxTypes.add(fx.id);
  for (const type of sfxTypes) prepareSfx(type);

  const timings = [];
  let cursor = 0;
  const sfxTracks = [];
  let sfxCounter = 0;

  for (const scene of SCENES) {
    const voicePath = join(AUDIO_DIR, `voice-${String(scene.id).padStart(2, "0")}.wav`);
    edgeTtsToWav(scene.voice, voicePath);
    const voiceDuration = probeDuration(voicePath);
    const duration = voiceDuration + VOICE_GAP;

    timings.push({
      id: scene.id,
      start: cursor,
      voiceDuration,
      duration,
      voice: scene.voice,
      gapAfter: duration - voiceDuration,
    });

    for (const fx of scene.sfx) {
      const spec = SFX_CATALOG[fx.id];
      const atLocal = resolveSfxLocalTime(fx, voiceDuration);
      const sfxDur = probeDuration(join(AUDIO_DIR, `sfx-${fx.id}.wav`));
      sfxTracks.push({
        id: String(++sfxCounter).padStart(2, "0"),
        type: fx.id,
        start: cursor + atLocal,
        duration: sfxDur,
        volume: spec.volume,
      });
    }

    cursor += duration;
  }

  const totalDuration = cursor;
  const bgmPath = join(AUDIO_DIR, "bgm.wav");
  synthBgm(bgmPath, totalDuration);

  const meta = {
    totalDuration,
    ttsEngine: "edge-tts",
    voice: VOICE,
    ttsRate: TTS_RATE,
    voiceGap: VOICE_GAP,
    sfxSource: "hyperframes-media/pixabay",
    bgmBpm: BGM_BPM,
    bgmVolume: BGM_VOLUME,
    scenes: timings,
    sfx: sfxTracks,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(ROOT, "audio_meta.json"), JSON.stringify(meta, null, 2));

  const html = readFileSync(INDEX, "utf8");
  writeFileSync(INDEX, patchIndex(html, timings, totalDuration, sfxTracks));

  console.log(`Audio sync complete: ${totalDuration.toFixed(2)}s total`);
  for (const t of timings) {
    console.log(
      `  Scene ${t.id}: start=${t.start.toFixed(2)}s dur=${t.duration.toFixed(2)}s `
      + `voice=${t.voiceDuration.toFixed(2)}s gap=${t.gapAfter.toFixed(2)}s`,
    );
  }
}

main();
