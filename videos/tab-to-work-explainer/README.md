# Tab-to-Work Explainer Video

55-second faceless explainer built with [HyperFrames](https://github.com/heygen-com/hyperframes).

## Preview

```bash
cd videos/tab-to-work-explainer
npm run dev
```

## Validate

```bash
npm run check
```

## Render MP4

Requires Node 22+. FFmpeg is bundled via `@ffmpeg-installer/ffmpeg`.

```bash
npm install
npm run render
```

Output: `renders/video.mp4`

## Story

1. Tab overload hook (47 tabs)
2. OneTab/Tab Space limitation (URLs without content)
3. Thesis: intent over URLs
4. Pipeline: Save → Understand → Execute
5. Goal-based organization
6. CTA: Tab to Work

## Files

- `index.html` — HyperFrames composition
- `STORYBOARD.md` — frame plan
- `SCRIPT.md` — narration script
- `frame.md` — Cobalt Grid design system
