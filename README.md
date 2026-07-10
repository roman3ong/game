# 星际宠物 · Star Pets

一款可在手机上玩的星际主题宠物养成游戏。在浏览器中打开即可游玩，支持添加到主屏幕像 App 一样使用。

## 下载游玩

**单文件版（推荐）：** 下载后双击用浏览器打开即可，无需其他文件。

- 下载：[star-pets.html](https://github.com/roman3ong/game/raw/main/star-pets.html)
- 或下载整个项目 ZIP：https://github.com/roman3ong/game/archive/refs/heads/main.zip

## 在线游玩

**推荐（永久链接，需先开启 GitHub Pages）：** https://roman3ong.github.io/game/

> 首次使用请在 GitHub 仓库 [Settings → Pages](https://github.com/roman3ong/game/settings/pages) 中：
> 1. **Source** 选 **Deploy from a branch**
> 2. **Branch** 选 **gh-pages** / **/ (root)**
> 3. 点 **Save**，等 1～2 分钟即可访问

**临时链接（立即可玩）：** 在电脑上运行 `python3 -m http.server 8080`，手机访问 `http://<电脑IP>:8080`

> ⚠️ 不要用 jsDelivr / raw.githubusercontent.com 链接，浏览器会把 HTML 当成代码显示。

## 玩法

1. **孵化** — 点击宇宙蛋 5 次，孵化你的星际伙伴
2. **选宠** — 四种宠物可选：星尘兽、月魄精灵、彗尾小龙、星云猫
3. **养成** — 通过喂食、玩耍、休息、训练照顾宠物
4. **探索** — 参与星尘收集小游戏，赚取星尘和经验
5. **进化** — 达到 Lv.5 / Lv.10 解锁新形态
6. **商店** — 用星尘购买补给道具

## 宠物属性

| 属性 | 说明 |
|------|------|
| 饱食度 | 定期下降，过低会影响健康 |
| 心情 | 通过玩耍和互动提升 |
| 能量 | 训练和探索会消耗能量 |
| 健康 | 各项属性过低时会下降 |

## 本地运行

```bash
# 方式一：Python
python3 -m http.server 8080

# 方式二：Node.js
npx serve .
```

然后在手机浏览器访问 `http://<你的IP>:8080`

## 手机体验

- 响应式布局，适配各种屏幕尺寸
- 触控优化，支持安全区域（刘海屏）
- 可添加到主屏幕（iOS / Android PWA 风格）
- 自动存档（localStorage）

## 技术栈

- 纯 HTML / CSS / JavaScript，无需构建工具
- 零依赖，开箱即玩
