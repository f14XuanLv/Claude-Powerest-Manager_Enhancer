# Claude 神级拓展增强脚本 (Claude Powerest Manager & Enhancer)

[![版本](https://img.shields.io/badge/Version-1.1.9-blue.svg)](https://greasyfork.org/zh-CN/scripts/539886-claudepowerestmanager-enhancer)
[![许可证](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/blob/main/LICENSE)
[![平台](https://img.shields.io/badge/Platform-Tampermonkey-yellow.svg)](https://www.tampermonkey.net/)
[![支持的网站](https://img.shields.io/badge/Site-Claude.ai-orange.svg)](https://claude.ai)
[![支持的网站](https://img.shields.io/badge/Site-fuclaude.com-blue.svg)](https://demo.fuclaude.com)
[![作者](https://img.shields.io/badge/Author-f14xuanlv-purple.svg)](https://github.com/f14XuanLv)

[English Version](./README.en.md) | **中文说明**

这是一款功能极其强大的 Tampermonkey 脚本，旨在全方位提升您的 Claude 使用体验。它集成了两大核心模块：一个全面的**对话管理器**和一个实时的**聊天增强器**，为您提供前所未有的控制力和便利性。

| 脚本主界面预览 |
|-------------|
| ![脚本主界面预览](https://images2.imgbox.com/7b/32/lzzWuLhY_o.gif) |

---

## ✨ 核心功能

脚本主要分为两大功能区：**对话管理器** 和 **聊天增强器**。

### 1. 对话管理器 (Manager)

通过点击 Claude 页面右下角的 **`Manager`** 按钮打开。这是一个功能强大的一站式管理中心，让您告别在侧边栏中费力寻找对话的烦恼。

-   **🗂️ 全局对话管理**:
    -   **一键加载**: 轻松获取您的所有历史对话列表。
    -   **强大搜索**: 按标题关键词即时搜索对话。
    -   **智能排序**: 支持按更新时间、标题名称（A-Z, Z-A）等多种方式排序。
    -   **高级筛选**: 可根据“已收藏”、“未收藏”、“纯ASCII标题”等条件快速筛选。

-   **⚡ 批量操作**:
    -   **批量删除**: 勾选多个对话，一次性永久删除。
    -   **批量收藏/取消收藏**: 快速整理您的重要对话。
    -   **批量自动重命名**: 选中对话后，脚本将自动调用 Claude Title API，根据设置中设定的前几轮对话内容生成精准、高质量的标题（支持自定义标题语言）。

-   **📥 强大的导出功能**:
    -   **原始 JSON 导出**: 完整备份官方返回的所有数据，包括每一条消息的详细元数据和附件信息。
    -   **自定义 JSON 导出**: 提供极高自由度的导出选项，您可以精细控制要保留的数据，例如：
        -   是否包含会话元数据（标题、摘要、时间戳等）。
        -   是否包含消息的 UUID、时间戳、停止原因等。
        -   是否保留“思考中”的过程、工具使用记录（网页搜索、代码执行等）。
        -   附件信息的保留级别（完整信息、仅元数据、不保留）。
    -   **附件一并下载**: 进行原始导出时，或在自定义导出中选择保留附件时，脚本会自动将对话中包含的所有附件（PDF, TXT, CSV 等）下载到同一文件夹，并根据其来源和 UUID 智能命名，方便整理。

-   **🌳 单个对话操作**:
    -   **手动重命名**: 直接在管理器中修改任何对话的标题。
    -   **对话树预览**: 以树状结构清晰地展示对话的所有分支，包括每一次重试（Retry）产生的分支，方便您理解对话的完整脉络。支持自动检测并标识"脏数据"（因网络错误等原因未收到 Claude 回复的用户消息节点）。

### 2. 聊天增强器 (Enhancer)

此模块直接在 Claude 的聊天输入框工具栏注入新的功能按钮，实时增强您的聊天体验。

-   **🌿 从任意消息分支 (Branch from any message)**:
    -   点击工具栏新增的 <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-tree.svg" alt="树状图标" width="16" height="16" style="display: inline-block; vertical-align: middle;"> 图标按钮。
    -   在弹出的对话树视图中，选择历史上任意一条 Claude 的回复作为新的分支点。
    -   您发送的下一条消息将从该节点继续，完美实现从任意历史点““复活””对话或探索不同可能性的需求。

-   **🚀 强制 PDF 深度解析 (Force PDF Deep Analysis)**:
    -   点击工具栏新增的 <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-attachment-power.svg" alt="附件增强图标" width="16" height="16" style="display: inline-block; vertical-align: middle;"> 图标按钮，可以开启此模式。
    -   **主要用途**: 对于普通（免费）账户，此功能可以强制 Claude 使用更强大的文档解析路径来处理 PDF 文件，从而获得与 Pro/Team 账户类似的深度解析和内容提取效果。
    -   **工作原理**: 开启后，您上传的 PDF 会被脚本拦截，并通过一个特殊的后台 API 路径进行处理。处理完成的文件会暂存在一个浮动面板中，当您发送消息时，这些文件会自动附加到您的消息中。
    -   **注意**: 此功能对 Pro/Team 账户无效，因为它们默认已使用最佳解析路径。

---

## 🛠️ 安装

1.  **安装脚本管理器**: 您的浏览器需要先安装一个用户脚本管理器。推荐使用 [Tampermonkey](https://www.tampermonkey.net/)。
2.  **安装本脚本**: 点击下面的链接进行安装：
    -   [Greasy Fork 安装页](https://greasyfork.org/zh-CN/scripts/539886-claudepowerestmanager-enhancer)

---

## 📖 使用方法

-   **打开管理器**:
    -   访问 [https://claude.ai](https://claude.ai)
    -   或者访问 [https://demo.fuclaude.com](https://demo.fuclaude.com)
    -   在页面右下角找到并点击橙色的 **`Manager`** 按钮。

-   **使用增强功能**:
    -   进入任意一个聊天界面。
    -   在底部的聊天输入框工具栏（附件上传按钮旁边），您会看到新增的图标按钮，点击即可使用相应功能。

-   **快捷键**:
    -   **Ctrl+M**: 快速隐藏/显示右下角的 Manager 按钮。在需要更纯净的界面时使用，再次按下即可恢复显示。


---

## 🖼️ 预览

| 管理器面板（自动重命名） |
|-----------|
| ![管理器面板](https://images2.imgbox.com/af/62/ij41hS9H_o.gif) |
| 对话树分支选择 |
| ![对话树分支选择](https://images2.imgbox.com/b9/22/ykvYusVi_o.gif) |
| PDF 强制深度解析 |
| ![PDF 强制深度解析](https://images2.imgbox.com/3c/3c/lWvIC4p9_o.gif) |
| 主题切换 |
| ![主题切换](https://images2.imgbox.com/2f/76/QOoxh5UO_o.gif) |

---

## ⚠️ 注意事项

-   本脚本通过与 Claude 的前端和非公开 API 交互来实现功能。如果 Claude.ai
 网站结构或 API 发生重大变化，可能导致脚本部分或全部功能失效。作者会尽力维护，但也请理解潜在的风险。
-   “批量删除”是永久性操作，无法撤销，请谨慎使用。
-   “强制PDF深度解析”功能主要为普通账户设计，以提升体验。

---

## 🤝 致谢与相关项目

-   **本项目**: [f14XuanLv/Claude-Powerest-Manager_Enhancer](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer)
-   **下一个项目预告**: [f14XuanLv/claude-dialog-tree-studio](https://github.com/f14XuanLv/claude-dialog-tree-studio) - 一个专注于 Claude 对话树的智能可视化编辑与管理工具，敬请期待！

如果您觉得这个脚本对您有帮助，欢迎在 GitHub 上给一个 🌟 Star！如果您有任何问题或建议，请通过 [Issues](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/issues) 页面提出。

---

## 📄 许可 (License)

本项目基于 [MIT License](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/blob/main/LICENSE) 授权。