# Claude Powerest Manager & Enhancer

[![Version](https://img.shields.io/badge/Version-1.2.4-blue.svg)](https://greasyfork.org/en/scripts/539886-claudepowerestmanager-enhancer)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Tampermonkey-yellow.svg)](https://www.tampermonkey.net/)
[![Supported Site](https://img.shields.io/badge/Site-Claude.ai-orange.svg)](https://claude.ai)
[![Author](https://img.shields.io/badge/Author-f14xuanlv-purple.svg)](https://github.com/f14XuanLv)


[**阅读中文文档**](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/blob/main/README_zh.md)

This is an extremely powerful Tampermonkey script designed to enhance your Claude experience in every way. It integrates two core modules: a comprehensive **Conversation Manager** and a real-time **Chat Enhancer**, giving you unprecedented control and convenience.

| Main Interface Preview |
|-----------|
| ![Main Interface Preview](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/main-preview.gif) |

---

| Manager Panel (Auto-Rename) |
|-----------|
| ![Manager Panel](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/auto-rename.gif) |
| Continue from Any Branch Node Demo |
| ![Continue from Any Branch Node](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/continue-from-any-branch-node.gif) |
| Cross-Branch Navigation to Any Node Demo |
| ![Cross-Branch Navigation to Any Node](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/branch-navigator.gif) |
| Force PDF Deep Analysis |
| ![Force PDF Deep Analysis](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/force-pdf-analysis.gif) |
| Linear Navigation Panel |
| ![Linear Navigation Panel](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/linear-navigator.gif) |
| Theme Switch |
| ![Theme Switch](https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/docs/images/theme-switch.gif) |

---

## 📺 Demo Videos

### BiliBili Demo Video
[![Claude Powerest Manager & Enhancer Demo](https://i0.hdslb.com/bfs/archive/100ade411248453a4ed394a3faaf214d89c9e8e9.jpg)](https://www.bilibili.com/video/BV12RaczjEth)

### YouTube Demo Video
[![Claude Powerest Manager & Enhancer Demo](https://img.youtube.com/vi/lW2sbsHDyJM/maxresdefault.jpg)](https://youtu.be/lW2sbsHDyJM)

---

## ✨ Core Features

The script is divided into two main functional areas: **Conversation Manager** and **Chat Enhancer**.

### 1. Conversation Manager

Opened by clicking the **`Manager`** button in the bottom-right corner of the Claude page. This is a powerful, one-stop management center that saves you from the hassle of searching for conversations in the sidebar.

-   **🗂️ Global Conversation Management**:
    -   **One-Click Load**: Easily fetch a list of all your historical conversations.
    -   **Powerful Search**: Instantly search conversations by title keywords.
    -   **Smart Sorting**: Supports various sorting methods, including by update time and title name (A-Z, Z-A).
    -   **Advanced Filtering**: Quickly filter by criteria such as "Favorited," "Not Favorited," and "ASCII-only Titles."

-   **⚡ Bulk Operations**:
    -   **Bulk Delete**: Select multiple conversations and permanently delete them at once.
    -   **Bulk Favorite/Unfavorite**: Quickly organize your important conversations.
    -   **Bulk Auto-Rename**: After selecting conversations, the script will automatically call the Claude Title API to generate accurate, high-quality titles based on the initial turns of the conversation (supports custom title language).
    -   **Bulk Raw JSON Export**: One-click export of complete raw data for multiple conversations, including all metadata and attachment information, suitable for complete backups.
    -   **Bulk Custom JSON Export**: Use preset custom export configurations to bulk-export streamlined and formatted conversation data, suitable for data analysis and processing.

-   **📥 Powerful Export Features**:
    -   **Raw JSON Export**: Complete backup of all data returned by the official API, including detailed metadata and attachment information for each message.
    -   **Custom JSON Export**: Provides highly flexible export options, allowing you to finely control the data to be retained, for example:
        -   Whether to include session metadata (title, summary, timestamps, etc.).
        -   Whether to include message UUIDs, timestamps, stop reasons, etc.
        -   Whether to retain "thinking" processes, tool usage records (web search, code execution, etc.).
        -   The level of attachment information to retain (full info, metadata only, none).
    -   **Download Attachments Alongside**: When performing a raw export or choosing to retain attachments in a custom export, the script will automatically download all attachments (PDF, TXT, CSV, etc.) from the conversation into the same folder, intelligently named according to their source and UUID for easy organization.

-   **🌳 Single Conversation Operations**:
    -   **Manual Rename**: Directly edit the title of any conversation within the manager.
    -   **Conversation Tree Preview**: Clearly displays all branches of a conversation in a tree structure, including branches created by each "Retry," helping you understand the full context of the conversation. Supports automatic detection and flagging of "dirty data" (user message nodes that did not receive a reply from Claude due to network errors, etc.).

### 2. Chat Enhancer

This module injects new function buttons directly into the chat input toolbar in Claude, enhancing your chat experience in real-time.

-   **🌿 Smart Branch Continuer & Navigator**:
    -   Click the new <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-tree.svg" alt="Tree Icon" width="16" height="16" style="display: inline-block; vertical-align: middle;"> icon button in the toolbar to open the powerful conversation tree management panel.
    -   **Dual-Mode Operation**:
        - **Continue Mode**: Select any historical Claude reply as a new branch point. Your next message will continue from that node, perfectly "reviving" the conversation from any historical point.
        - **Navigate Mode**: Quickly jump to any historical node in a complex, multi-branched conversation.
    -   **Core Features**:
        - Visualizes the conversation tree structure, clearly showing all branches and node relationships.
        - Supports recursive search of the entire conversation tree to quickly locate target content.
        - An intelligent indexing system and branch-switching algorithm ensure precise navigation in complex branches.

-   **🚀 Force PDF Deep Analysis**:
    -   Click the new <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-attachment-power.svg" alt="Attachment Power Icon" width="16" height="16" style="display: inline-block; vertical-align: middle;"> icon button in the toolbar to enable this mode.
    -   **Main Purpose**: For regular (free) accounts, this feature forces Claude to use a more powerful document processing path for PDF files, achieving deep analysis and content extraction effects similar to Pro/Team accounts.
    -   **How It Works**: When enabled, your uploaded PDFs are intercepted by the script and processed through a special backend API path. The processed files are temporarily stored in a floating panel and are automatically attached to your message when you send it.
    -   **Note**: This feature has no effect on Pro/Team accounts, as they already use the optimal processing path by default.

-   **🧭 Linear Navigation Panel**:
    -   Click the new <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-linear-navigator.svg" alt="Linear Navigator Icon" width="16" height="16" style="display: inline-block; vertical-align: middle;"> icon button in the toolbar to open the floating linear navigation panel.
    -   **Core Functions**:
        - **Conversation Overview**: Displays all conversation turns in the current branch as a linear list, showing previews of user inputs and Claude's replies.
        - **Quick Jump**: Click any item in the list to quickly scroll to the corresponding conversation content, with a highlight animation effect.
        - **Navigation Controls**: Provides quick navigation buttons like Previous/Next, and To Top/To Bottom.
        - **State Persistence**: The panel's open/closed state is automatically saved and restored on your next visit.
        - **Draggable**: The panel can be dragged to any position on the screen to suit different user habits.
    -   **Use Case**: Especially useful for quickly locating and reviewing historical content in long conversations, improving navigation efficiency.

---

## 🛠️ Installation

1.  **Install a Script Manager**: Your browser needs a user script manager first. [Tampermonkey](https://www.tampermonkey.net/) is recommended.
2.  **Install This Script**: Click the link below to install:
    -   [Greasy Fork Installation Page](https://greasyfork.org/en/scripts/539886-claudepowerestmanager-enhancer)

---

## 📖 Usage

-   **Open the Manager**:
    -   Visit [https://claude.ai](https://claude.ai)
    -   Find and click the orange **`Manager`** button in the bottom-right corner of the page.

-   **Use Enhancer Features**:
    -   Enter any chat interface.
    -   In the chat input toolbar at the bottom (next to the attachment upload button), you will see the new icon buttons. Click them to use the corresponding features.

-   **Language Switching**:
    -   Install the script, then on the Claude page click the Manager button in the bottom-right corner.
    -   In the Manager panel, click the <img src="https://raw.githubusercontent.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/refs/heads/main/assets/icon-settings.svg" alt="Tree Icon" width="16" height="16" style="display: inline-block; vertical-align: middle;"> button in the top-right corner to open the settings panel.
    -   In the "语言设置" section, switch the "界面语言", then click "保存设置" at the bottom of the panel.
    -   Wait for the page to automatically refresh to complete the language switch.

-   **Shortcut**:
    -   **Ctrl+M**: Quickly hide/show the Manager button in the bottom-right corner. Use this when you need a cleaner interface; press it again to restore.

---

## ⚠️ Important Notes

-   This script works by interacting with Claude's front-end and private APIs. If the structure of the Claude.ai website or its APIs changes significantly, it may cause some or all of the script's features to break. The author will do their best to maintain it, but please understand the potential risks.
-   "Bulk Delete" is a permanent action and cannot be undone. Please use it with caution.
-   The "Force PDF Deep Analysis" feature is primarily designed for regular accounts to enhance their experience.

---

## 🤝 Acknowledgments & Related Projects

-   **This Project**: [f14XuanLv/Claude-Powerest-Manager_Enhancer](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer)
-   **Next Project Preview**: [f14XuanLv/claude-dialog-tree-studio](https://github.com/f14XuanLv/claude-dialog-tree-studio) - An intelligent visual editing and management tool focused on Claude conversation trees. Stay tuned!

If you find this script helpful, please give it a 🌟 Star on GitHub! If you have any questions or suggestions, please submit them via the [Issues](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/issues) page.

---

## 📄 License

This project is licensed under the [MIT License](https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/blob/main/LICENSE).