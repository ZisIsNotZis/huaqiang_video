<p align="center">
  <img src="logo.svg" alt="Huaqiang Video — a melon slice framed like a play button" width="620">
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

# Huaqiang Video

**A 70-second, code-timed remake of the classic “Huaqiang buys a melon” scene — dialogue, camera, lighting and sound all live in one React/Remotion timeline.**

> **Status:** closed 0.1.0 creative milestone. This is a finished prototype with a checked-in render, not an actively developed product, a general video editor, or a final film.

▶ **[Watch the checked-in 70-second render](render/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9C.mp4)** · 1280×720, 30 fps

## Quick start

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/ZisIsNotZis/huaqiang_video.git
cd huaqiang_video
npm ci
npm run studio
```

Remotion Studio opens the `HuaqiangMelon` composition for scrubbing and live edits. To regenerate the checked-in cut:

```bash
npm run render
```

The output is written to `render/华强买瓜.mp4`.

## What it can do now

- **One complete 70-second composition.** `HuaqiangMelon` is 2,100 frames at 1280×720 and 30 fps.
- **Bilingual dialogue in sync.** 21 Chinese lines, each with an English subtitle and its own voice clip on the timeline.
- **Drawn, not assembled.** The street, props and characters are built from SVG and three.js, including a 3D face close-up and a hands-on evidence insert.
- **A directed soundtrack.** 21 voice cues, 14 sound effects and a noir BGM bed whose level moves with the pressure of the scene.
- **A reproducible output.** `npm run render` rebuilds the checked-in H.264 MP4 from source.
- **The source material beside the code.** Shot-by-shot storyboard, full dialogue and structural notes live in [`docs/`](docs/), so the film can be read as well as watched.

## Architecture

Remotion loads one entry point, registers one composition, and renders the whole film from a single timeline.

| Path | Role |
| --- | --- |
| [`src/index.ts`](src/index.ts) | Remotion entry point; registers the root component. |
| [`src/Root.tsx`](src/Root.tsx) | Declares `HuaqiangMelon`: 2100 frames, 30 fps, 1280×720. |
| [`src/HuaqiangMelon.tsx`](src/HuaqiangMelon.tsx) | The film: scene timing, SVG market set, three.js characters, camera moves, captions and audio. |
| [`public/audio/huaqiang/`](public/audio/huaqiang/) | Voice clips, BGM and sound effects, loaded through Remotion's `staticFile()`. |
| [`docs/designs/`](docs/designs/README.md) | Canonical storyboard, staging map and structure notes. |
| [`docs/华强买瓜lines.md`](docs/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9Clines.md) | Full dialogue script. |
| [`render/华强买瓜.mp4`](render/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9C.mp4) | The checked-in render. |

The composition keeps story beats, motion and timing in code: edit the timeline, preview in Studio, and render the same way every time.

## How to develop

```bash
npm run studio    # preview the composition in Remotion Studio
npm run render    # write render/华强买瓜.mp4 (H.264, yuv420p)
npx tsc --noEmit  # strict TypeScript check
```

- Media referenced by the composition lives under `public/` and is resolved with `staticFile()`.
- Keep the composition id and the 1280×720 / 30 fps format stable unless the production format is deliberately changing.
- When dialogue or shots change, update the matching file in [`docs/designs/`](docs/designs/README.md) and the script.

## How to contribute

Focused changes are easiest to review. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first, and follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Security and privacy reports go through [`SECURITY.md`](SECURITY.md).

For a code or timing change, include the render command and a before/after description. For a media or script change, update the relevant storyboard or dialogue document in the same pull request.

## Roadmap

### Implemented

- The full `HuaqiangMelon` composition and its checked-in render.
- Timed Chinese/English captions with matching voice clips.
- Procedural street set, 2D props, and three.js character and close-up shots.
- Layered BGM, dialogue and sound-effect mixing.
- Storyboard, dialogue, staging and structure documentation.
- A single-command render path with pinned dependencies.

### Planned

The milestone is closed, so there is no active feature roadmap. If the project reopens, the deferred work is:

- A rights review of the checked-in audio and video before any redistribution.
- A formal release checklist covering renderer version, output checksum and asset rights.
- Replaceable assets and a documented render preset so another scene can reuse the pipeline.

### Future vision

If this prototype grows, it becomes a reusable storyboard-to-film template: each scene's lines, camera moves, sound cues and timing expressed as data, so a new set of assets can become another short. None of that is built yet.

## Rights and license

The story and the supplied audio/video are project material. Confirm rights and likeness permissions before redistributing or publishing the render. There is no paper, upload or publication record in this repository.

Licensed under AGPL-3.0-only; see [`LICENSE`](LICENSE).
