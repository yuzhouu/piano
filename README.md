# 小小钢琴家

一个给孩子使用的在线钢琴房：可以用鼠标、触摸、多指触控或电脑键盘弹奏，切换 WebAudioFont 真实采样音色，并通过儿童模式减少误触和误退出。

## 开始使用

需要 Node.js 20+ 与 pnpm 11+。

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。第一次点击“开始弹奏”会在用户手势中解锁浏览器音频，并加载当前采样。

常用命令：

```bash
pnpm typecheck   # TypeScript 检查
pnpm test        # Vitest 单元测试
pnpm test:e2e    # Playwright 浏览器测试
pnpm build       # Vite 生产构建 + TypeScript 检查
pnpm preview     # 预览 dist
pnpm format      # Prettier 格式化
```

## 部署到 GitHub Pages

仓库已配置 `.github/workflows/deploy-pages.yml`。将 `main` 分支推送到 GitHub 后，Actions 会自动构建并发布到 GitHub Pages；也可以在 Actions 页面手动运行 `Deploy to GitHub Pages`。

首次使用时，在仓库的 **Settings → Pages → Build and deployment** 中将 **Source** 设置为 **GitHub Actions**。部署完成后，项目站点地址为 `https://yuzhouu.github.io/piano/`。

工作流会根据 `GITHUB_REPOSITORY` 自动设置 Vite 的项目路径，同时生成 SPA 的 `404.html` 回退页，保证 GitHub Pages 上的资源加载和客户端路由正常工作。

### 采样音色

项目把音色文件放在 `public/soundfonts`，首次初始化或需要更新时运行：

```bash
pnpm soundfonts
```

脚本固定下载 `surikov/webaudiofontdata` 的 revision，避免同一个版本在不同时间产生不同资源。内置音色为钢琴、音乐盒、木琴和吉他；采样加载失败时会自动使用轻量级合成音色兜底。

## 儿童模式与设备锁定

点击右上角“儿童模式”后：

- 页面内普通键盘按键都会被拦截；未映射的普通键会映射到五声音阶，因此乱按也能发出音乐。
- 页面滚动、右键、文本选择、拖拽和触摸手势会被拦截。
- 音色、音量、八度等设置隐藏；右上角按钮需要持续按住 3 秒才能解锁。
- 页面会尽力进入全屏，并在失焦、切后台或全屏状态变化时停止声音。

网页无法阻止系统级快捷键、电源键、浏览器退出手势、`Cmd+Q`、`Alt+F4` 或系统通知中心等操作。交给孩子使用时，建议同时启用设备的系统锁定：

- iPad / iPhone：**设置 → 辅助功能 → 引导式访问**，打开钢琴后连按三次顶部按钮（或主屏幕按钮）。
- Android：使用**应用固定**（Screen pinning）。
- Windows：使用 kiosk 专用账户或 Microsoft Edge kiosk 模式。

## PWA 与离线

项目使用 `vite-plugin-pwa` 生成 manifest 和 service worker。首次联网打开并等待底部出现“离线已就绪”后，可以添加到主屏幕；应用壳、字体、脚本、四种采样与样式会被缓存，之后可离线弹奏。浏览器仍需要在首次用户手势时解锁 `AudioContext`。

## 技术栈

- React 19 + TypeScript + Vite
- TanStack Router（file-based route）与 TanStack Store
- Tailwind CSS v4、shadcn/ui（Radix primitives）、lucide-react
- `webaudiofont` 播放器 + `surikov/webaudiofontdata` 采样
- Vitest + Playwright

项目最初使用 TanStack CLI 创建：

```bash
pnpm dlx @tanstack/cli@0.71.0 create piano \
  --target-dir /Users/yuzhou/project/piano \
  --framework React \
  --router-only \
  --package-manager pnpm \
  --no-install --no-git --no-intent --no-toolchain --no-examples -y
```

shadcn/ui 初始化与组件添加：

```bash
pnpm dlx shadcn@latest init --base radix --preset nova --yes --no-monorepo
pnpm dlx shadcn@latest add button dialog toggle-group slider switch alert separator --yes
```

## 参考项目与许可

交互与键盘映射参考：

- [`kevinsqi/react-piano`](https://github.com/kevinsqi/react-piano)
- [`amoshydra/piano`](https://github.com/amoshydra/piano)

音频播放与采样来源：

- [`surikov/webaudiofont`](https://github.com/surikov/webaudiofont)，GPL-3.0-or-later
- [`surikov/webaudiofontdata`](https://github.com/surikov/webaudiofontdata)，包含 GeneralUserGS.sf2 与 FluidR3 等采样及其各自许可/归属要求

本项目没有复制上述项目的页面代码；只借鉴其公开的钢琴交互与 WebAudioFont 使用方式。发布时请保留相应许可证和采样归属信息，并按采样库许可要求分发。
