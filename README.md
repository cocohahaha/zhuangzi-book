# 庄子 · 互动书

一本放在木书桌上的《庄子》精装书：翻开封面，逐页翻阅三十三篇全文。

在线阅读：<https://cocohahaha.github.io/zhuangzi-book/>

## 怎么读

- 点按书页右半边翻到下一页，左半边回到上一页；手机上左右滑动也可以。
- 键盘：← / → 翻页，Home / End 回到封面或封底。
- 底部的「目录」按钮跳到目录页，点篇名直达该篇。
- 会自动记住上次读到的位置；也可以用 `#p=页码` 直接打开某一页，例如 `#p=20`。
- 宽屏显示左右对开的两页，竖屏手机显示单页。改变窗口大小后会重新排版，并停在原来读到的地方。

## 内容

- 正文：维基文库《莊子》各篇（公有领域），用 OpenCC 转为简体。
- 全书三十三篇：内篇七、外篇十五、杂篇十一，约八万字。
- 卷首有出版说明、导读与目录。
- 数据在 `content/zhuangzi.json`，抓取脚本是 `scripts/fetch.py`，来源说明见 `content/SOURCE.md`。

## 技术

纯静态页面，不需要构建，也没有任何依赖：

```
index.html      页面结构
css/book.css    书桌、纸张、封面与翻页样式
js/book.js      排版、分页、翻页与导航
content/        正文数据
.nojekyll       让 GitHub Pages 原样发布
```

本地预览需要通过 HTTP 打开（直接双击 `index.html` 无法读取 JSON）：

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000/
```

字体为 Google Fonts 的 Noto Serif SC，加载不到时会退回系统宋体。
