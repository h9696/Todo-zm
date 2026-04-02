# Todo 桌面应用
一个中文界面的待办事项桌面应用，支持分类、多筛选、拖拽排序、截止日期与本地持久化，适合个人日常任务管理。

## 首页

<img src="D:\awork\Todo\img\1.png" alt="1" style="zoom: 56%;" />



## 功能特性

- 任务管理：新增、编辑、删除任务
- 状态管理：任务完成 / 未完成切换
- 分类管理：新增分类、删除分类、任务多分类归属
- 任务筛选：
  - 按状态筛选（所有任务 / 未完成 / 已完成）
  - 按分类多选筛选
- 拖拽排序：支持任务列表拖拽调整顺序并持久化
- 截止日期：任务可设置截止日期，支持中文日期显示
- 本地存储：任务和分类自动保存到本地 JSON 文件
- 桌面体验：自定义中文菜单栏 + 液态玻璃风格 UI

## 快速开始
### 1) 环境要求
- Node.js 18+
- npm 9+
- Windows 10/11
### 2) 安装依赖

本项目关键依赖如下：

- `electron`（开发依赖，用于桌面应用运行）
- `sortablejs`（运行依赖，用于任务拖拽排序）
- `electron-builder`（开发依赖，用于打包构建）

安装命令：

```bash
npm install
```

如需手动单独安装（可选）：

```bash
npm install sortablejs
npm install -D electron electron-builder
```
### 3) 开发运行
```bash
npm start
```
### 4) 打包构建
```bash
npm run build
```
构建产物默认位于：
- 安装包：`dist/todo-app Setup 1.0.0.exe`
- 免安装版：`dist/win-unpacked/todo-app.exe`
## 文件结构
```text
Todo/
├─ index.html          # 页面结构
├─ styles.css          # 样式与动效
├─ renderer.js         # 渲染进程：任务逻辑与交互
├─ main.js             # 主进程：窗口创建、IPC、菜单命令
├─ preload.js          # 预加载脚本：安全桥接 API
├─ package.json        # 项目依赖与脚本
└─ dist/               # 打包输出目录
```
## 技术栈
- Electron（桌面应用框架）
- Vanilla JavaScript（业务逻辑）
- HTML5 + CSS3（界面与动效）
- SortableJS（拖拽排序）
- electron-builder（打包构建）
## 数据存储

应用使用本地 JSON 文件持久化数据，默认写入当前系统用户目录下：

- Windows：`%APPDATA%/todo-app/tasks.json`（实际为 Electron `app.getPath('userData')/tasks.json`）

数据结构：

- `tasks`：任务数组
- `categories`：分类数组

说明：

- 初次运行会自动创建数据文件
- 若检测到旧版项目目录内 `storage/tasks.json`，会自动迁移到新路径
- 数据写入为本地离线存储，不依赖网络服务