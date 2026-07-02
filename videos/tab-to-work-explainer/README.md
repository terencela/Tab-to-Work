# Tab-to-Work Explainer Video

~21s portrait motion cut with voice + SFX, built with [HyperFrames](https://github.com/heygen-com/hyperframes).

## Preview

```bash
cd videos/tab-to-work-explainer
npm run dev
```

## Audio sync

Regenerates neural voice (Microsoft edge-tts), Mixkit corporate BGM bed, SFX, retimes scenes + GSAP. First run bootstraps a local Python venv automatically.

```bash
npm run audio
npm run render
```

## Validate

```bash
npm run check
```

## Render MP4

Requires Node 22+. FFmpeg is bundled via `@ffmpeg-installer/ffmpeg`.

```bash
npm install
npm run audio   # optional if assets/audio already present
npm run render
```

Output: `renders/video.mp4` (with audio)

## Story (7 scenes)

1. Phone drowning in tabs
2. OneTab saves URLs, brain still fried
3. Cemetery of dead links
4. Agent reads every tab, does the work
5. One click, tabs gone, shortlist ready
6. Boss thinks you're organized
7. CTA: Tab to Work

## Files

- `index.html` — HyperFrames composition + synced GSAP
- `scripts/build-audio-sync.mjs` — voice/SFX generation + timeline sync
- `audio_meta.json` — measured scene durations
- `assets/audio/` — voice, SFX, BGM wav files
- `STORYBOARD.md` — frame plan
- `SCRIPT.md` — narration script
