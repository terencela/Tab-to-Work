import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, "..");
const binDirs = [
  dirname(ffmpegInstaller.path),
  dirname(ffprobeInstaller.path),
].join(":");

const env = {
  ...process.env,
  PATH: `${binDirs}:${process.env.PATH ?? ""}`,
};

const result = spawnSync(
  "npx",
  ["--yes", "hyperframes@0.7.15", "render", "-o", "renders/video.mp4"],
  {
    cwd: projectDir,
    env,
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status ?? 1);
