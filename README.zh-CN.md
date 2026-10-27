<p align="center">
  <img src="logo.svg" alt="Huaqiang Video — 西瓜切片拼成播放键" width="620">
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

# 华强买瓜 · Huaqiang Video

**用 React 和 Remotion 重做“华强买瓜”名场面：70 秒短片，台词、运镜、灯光和音效全部写在同一根时间轴上，逐帧可改。**

> **状态：** 0.1.0 创意里程碑已完成。这是一个带成片的原型，不是持续开发的产品，也不是通用视频编辑器或最终成片。

▶ **[查看已入库的 70 秒成片](render/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9C.mp4)** · 1280×720，30 fps

## 快速开始

需要 Node.js 20+ 和 npm。

```bash
git clone https://github.com/ZisIsNotZis/huaqiang_video.git
cd huaqiang_video
npm ci
npm run studio
```

Remotion Studio 会打开 `HuaqiangMelon` 合成，可以拖动时间轴、改代码并实时预览。重新生成已入库的成片：

```bash
npm run render
```

输出文件为 `render/华强买瓜.mp4`。

## 现在能做什么

- **一支完整的 70 秒短片。** `HuaqiangMelon` 共 2,100 帧，1280×720、30 fps。
- **中英双语对白。** 21 段中文台词，每段都配英文字幕和独立的配音片段。
- **画面全部由代码画出。** 街景、道具和人物由 SVG 与 three.js 构成，包含三维人脸和证据特写。
- **有设计的声轨。** 21 段配音、14 个音效触发点，以及一条随剧情压力变化的黑色电影风格配乐。
- **成片可复现。** 执行 `npm run render` 即可从源码重新生成已入库的 H.264 MP4。
- **素材和代码放在一起。** 逐镜头分镜、完整台词和结构分析都在 [`docs/`](docs/) 里，既能看片，也能读片。

## 架构

Remotion 只加载一个入口、注册一个合成，整部短片都从同一根时间轴渲染。

| 路径 | 作用 |
| --- | --- |
| [`src/index.ts`](src/index.ts) | Remotion 入口，注册根组件。 |
| [`src/Root.tsx`](src/Root.tsx) | 声明 `HuaqiangMelon`：2100 帧、30 fps、1280×720。 |
| [`src/HuaqiangMelon.tsx`](src/HuaqiangMelon.tsx) | 整部短片：场次节奏、SVG 街景、three.js 人物、运镜、字幕与音频。 |
| [`public/audio/huaqiang/`](public/audio/huaqiang/) | 配音、配乐和音效，通过 Remotion 的 `staticFile()` 读取。 |
| [`docs/designs/`](docs/designs/README.md) | 分镜、场面调度和结构分析的正式版本。 |
| [`docs/华强买瓜lines.md`](docs/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9Clines.md) | 完整台词本。 |
| [`render/华强买瓜.mp4`](render/%E5%8D%8E%E5%BC%BA%E4%B9%B0%E7%93%9C.mp4) | 已入库的成片。 |

剧情节点、动作和节奏都写在代码里：改时间轴、在 Studio 里预览、每次都用同一条命令渲染。

## 如何开发

```bash
npm run studio    # 在 Remotion Studio 中预览合成
npm run render    # 生成 render/华强买瓜.mp4（H.264、yuv420p）
npx tsc --noEmit  # 严格 TypeScript 类型检查
```

- 合成引用的媒体放在 `public/` 下，通过 `staticFile()` 解析。
- 除非明确要改制作规格，否则保留合成 id 和 1280×720 / 30 fps 格式。
- 改台词或镜头时，同步更新 [`docs/designs/`](docs/designs/README.md) 中对应的分镜文件和台词本。

## 如何参与

小范围、聚焦的改动最容易审阅。请先读 [`CONTRIBUTING.md`](CONTRIBUTING.md)，并遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)；安全和隐私问题请按 [`SECURITY.md`](SECURITY.md) 的方式私下报告。

改代码或节奏时，请在 PR 里附上渲染命令和改动前后的说明；改媒体或台词时，请在同一次 PR 中更新对应的分镜或台词文档。

## 路线图

### 已实现

- 完整的 `HuaqiangMelon` 合成及已入库成片。
- 带时间轴的中英文字幕和对应配音。
- 程序化街景、二维道具，以及 three.js 人物和特写镜头。
- 配乐、对白与音效的分层混音。
- 分镜、台词、场面调度和结构文档。
- 依赖锁定、一条命令出片的渲染流程。

### 计划

该里程碑已经关闭，目前没有在做的功能路线图。如果项目重新启动，待办是：

- 在再次分发前复核已入库音频和视频的权利。
- 建立正式发布清单：渲染器版本、输出校验和、素材权利。
- 把素材做成可替换项，并记录渲染预设，让下一场戏能复用这套流程。

### 未来设想

如果这个原型继续生长，它更像一套“分镜到成片”的模板：把每场戏的台词、运镜、音效和节奏写成数据，换一套素材就能生成另一支短片。这些目前都还没有实现。

## 版权与许可

故事以及随仓库提供的音频、视频属于项目素材；重新分发或公开发布成片前，请先确认版权和肖像授权。本仓库不包含论文、上传记录或其他发表记录。

采用 AGPL-3.0-only 许可，详见 [`LICENSE`](LICENSE)。
