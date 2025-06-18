// ==UserScript==
// @name         ClaudePowerestManager&Enhancer
// @name:zh-CN   Claude 超强管理器与增强器
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  [Manager] Adds a button in the bottom-right corner to open a central panel for searching, filtering, and batch-managing all chats. Features a powerful exporter for raw/custom JSON with attachments. [Enhancer] Injects new buttons into the chat prompt toolbar for advanced real-time actions like branching from any message and forcing deep PDF analysis.
// @description:zh-CN [管理器] 右下角打开管理器面板开启一站式搜索、筛选、批量管理所有对话。强大的JSON导出(原始/自定义/含附件)。[增强器]为聊天框注入新功能，如从任意消息分支、强制PDF深度解析等。
// @description:en [Manager] Adds a button in the bottom-right corner to open a central panel for searching, filtering, and batch-managing all chats. Features a powerful exporter for raw/custom JSON with attachments. [Enhancer] Injects new buttons into the chat prompt toolbar for advanced real-time actions like branching from any message and forcing deep PDF analysis.
// @author       f14xuanlv
// @license      MIT
// @homepageURL  https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer
// @supportURL   https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/issues
// @match        https://claude.ai/*
// @include      /^https:\/\/.*\.fuclaude\.[a-z]{3}\/.*$/
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function(window) {
    'use strict';

    const LOG_PREFIX = "[ClaudePowerestManager&Enhancer v1.1.1]:";
    console.log(LOG_PREFIX, "脚本已加载。");


    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // =========================================================================
    // 0. 全局配置
    // =========================================================================
    const Config = {
        INITIAL_PARENT_UUID: "00000000-0000-4000-8000-000000000000",
        TOOLBAR_SELECTOR: 'div.relative.flex-1.flex.items-center.gap-2.shrink.min-w-0',
        EMPTY_AREA_SELECTOR: 'div.flex.flex-row.items-center.gap-2.min-w-0',
        FORCE_UPLOAD_TARGET_EXTENSIONS: [".pdf"],
        ATTACHMENT_PANEL_ID: 'cpm-attachment-preview-panel',
        EXPORT_MODAL_ID: 'cpm-export-modal',
        URL_GITHUB_REPO: 'https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer',
        URL_STUDIO_REPO: 'https://github.com/f14XuanLv/claude-dialog-tree-studio'
    };

    // =========================================================================
    // 1. 设置模块注册表
    // =========================================================================
    /**
     * @typedef {object} ISettingModule - 设置模块接口定义
     * @property {string} id - 模块的唯一ID。
     * @property {string} title - 在设置面板中显示的标题。
     * @property {function(): string} render - 返回该模块设置的HTML字符串。
     * @property {function(HTMLElement): void} load - 从GM存储中加载设置并更新UI。
     * @property {function(HTMLElement): void} save - 从UI读取设置并保存到GM存储。
     * @property {function(HTMLElement): void} [addEventListeners] - (可选) 为模块的UI元素添加特定的事件监听器。
     */
    const SettingsRegistry = {
        /** @type {ISettingModule[]} */
        modules: [],
        /** @param {ISettingModule} module */
        register(module) {
            if (this.modules.find(m => m.id === module.id)) {
                console.warn(LOG_PREFIX, `尝试重复注册设置模块: ${module.id}`);
                return;
            }
            this.modules.push(module);
            console.log(LOG_PREFIX, `设置模块已注册: ${module.id}`);
        }
    };


    // =========================================================================
    // 2. 各功能模块定义
    // =========================================================================

    // --- 2.1 主题设置模块 ---
    const ThemeSettingsModule = {
        id: 'theme',
        title: '外观设置',
        render() {
            return `
                <div class="cpm-setting-group">
                    <div class="cpm-setting-item">
                        <label for="cpm-theme-mode" class="cpm-settings-label">脚本主题:</label>
                        <select id="cpm-theme-mode">
                            <option value="auto">跟随网站</option>
                            <option value="light">锁定白天</option>
                            <option value="dark">锁定黑夜</option>
                        </select>
                    </div>
                </div>
            `;
        },
        load(container) {
            const themeSelect = container.querySelector('#cpm-theme-mode');
            if (themeSelect) themeSelect.value = GM_getValue('themeMode', 'auto');
        },
        save(container) {
            const themeSelect = container.querySelector('#cpm-theme-mode');
            if (themeSelect) {
                GM_setValue('themeMode', themeSelect.value);
                ThemeManager.applyCurrentTheme();
            }
        }
    };

    // --- 2.2 批量操作设置模块 ---
    const BatchOpsSettingsModule = {
        id: 'batchOps',
        title: '批量操作设置',
        render() {
            return `
                <div class="cpm-setting-group">
                    <h4>批量收藏/取消收藏</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-star"><label for="cpm-refresh-after-star">操作后从服务器刷新列表 (否则仅更新当前视图)</label></div>
                </div>
                <div class="cpm-setting-group">
                    <h4>批量删除</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-delete"><label for="cpm-refresh-after-delete">操作后从服务器刷新列表 (否则仅更新当前视图)</label></div>
                </div>
                <div class="cpm-setting-group">
                    <h4>批量自动重命名</h4>
                    <div class="cpm-setting-item"><label for="cpm-rename-lang" class="cpm-settings-label">标题语言:</label><input type="text" id="cpm-rename-lang" placeholder="例如：中文, English, 日本語"></div>
                    <div class="cpm-setting-item"><label for="cpm-rename-rounds" class="cpm-settings-label">使用对话轮数 (最多):</label><input type="number" id="cpm-rename-rounds" min="1" max="10" step="1"></div>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-rename"><label for="cpm-refresh-after-rename">操作后从服务器刷新列表 (否则仅更新当前视图)</label></div>
                </div>
            `;
        },
        load(container) {
            container.querySelector('#cpm-rename-lang').value = GM_getValue('renameLang', '中文');
            container.querySelector('#cpm-rename-rounds').value = GM_getValue('renameRounds', '2');
            container.querySelector('#cpm-refresh-after-rename').checked = GM_getValue('refreshAfterRename', false);
            container.querySelector('#cpm-refresh-after-star').checked = GM_getValue('refreshAfterStar', false);
            container.querySelector('#cpm-refresh-after-delete').checked = GM_getValue('refreshAfterDelete', false);
        },
        save(container) {
            GM_setValue('renameLang', container.querySelector('#cpm-rename-lang').value);
            GM_setValue('renameRounds', container.querySelector('#cpm-rename-rounds').value);
            GM_setValue('refreshAfterRename', container.querySelector('#cpm-refresh-after-rename').checked);
            GM_setValue('refreshAfterStar', container.querySelector('#cpm-refresh-after-star').checked);
            GM_setValue('refreshAfterDelete', container.querySelector('#cpm-refresh-after-delete').checked);
        }
    };

    // --- 2.3 导出设置模块 ---
    const ExportSettingsModule = {
        id: 'export',
        title: '自定义导出默认设置',
        render() {
            return ManagerUI.createExportSettingsHTML(true);
        },
        load(container) {
            ManagerUI.loadExportSettings(container);
        },
        save(container) {
            ManagerUI.saveExportSettings(container);
        },
        addEventListeners(container) {
            ManagerUI.setupSubOptionDisabling(container);
        }
    };

    // --- 2.4 注册所有设置模块 ---
    SettingsRegistry.register(ThemeSettingsModule);
    SettingsRegistry.register(BatchOpsSettingsModule);
    SettingsRegistry.register(ExportSettingsModule);


    // =========================================================================
    // 3. 主题管理器 (共享)
    // =========================================================================
    const ThemeManager = {
        init() {
            this.applyCurrentTheme();
            const observer = new MutationObserver(() => this.applyCurrentTheme());
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
            console.log(LOG_PREFIX, "主题管理器已初始化并开始监听。");
        },
        applyCurrentTheme() {
            const mode = GM_getValue('themeMode', 'auto');
            let theme;
            if (mode === 'light' || mode === 'dark') {
                theme = mode;
            } else {
                theme = document.documentElement.getAttribute('data-mode') || 'light';
            }
            document.body.setAttribute('cpm-theme', theme);
        },
    };

    // =========================================================================
    // 4. API 层 (共享)
    // =========================================================================
    const ClaudeAPI = {
        orgUuid: null,
        orgInfo: null,
        async getOrganizationInfo() {
            if (this.orgInfo) return this.orgInfo;
            try {
                const response = await fetch('/api/organizations');
                if (!response.ok) throw new Error(`组织API请求失败: ${response.status}`);
                const orgs = await response.json();
                if (orgs && orgs.length > 0) {
                    this.orgInfo = orgs[0];
                    this.orgUuid = this.orgInfo.uuid;
                    return this.orgInfo;
                }
                throw new Error("在API响应中未找到组织信息。");
            } catch (error) {
                console.error(LOG_PREFIX, "获取组织信息失败:", error);
                throw error;
            }
        },
        async getOrgUuid() {
            if (this.orgUuid) return this.orgUuid;
            const info = await this.getOrganizationInfo();
            return info.uuid;
        },
        async getConversations() {
            const orgId = await this.getOrgUuid();
            const response = await fetch(`/api/organizations/${orgId}/chat_conversations`);
            if (!response.ok) throw new Error(`获取会话列表失败: ${response.status}`);
            return response.json();
        },
        async getConversationHistory(convUuid) {
            const orgId = await this.getOrgUuid();
            const url = `/api/organizations/${orgId}/chat_conversations/${convUuid}?tree=True&rendering_mode=messages&render_all_tools=true`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`获取历史记录失败: ${response.status}`);
            return response.json();
        },
        async createTempConversation() {
            const orgId = await this.getOrgUuid();
            const tempConvUuid = crypto.randomUUID();
            await fetch(`/api/organizations/${orgId}/chat_conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uuid: tempConvUuid, name: "" })
            });
            return tempConvUuid;
        },
        async deleteConversations(convUuids) {
            const orgId = await this.getOrgUuid();
            const isSingle = convUuids.length === 1;
            const url = isSingle ? `/api/organizations/${orgId}/chat_conversations/${convUuids[0]}` : `/api/organizations/${orgId}/chat_conversations/delete_many`;
            const options = { method: isSingle ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' } };
            if (!isSingle) options.body = JSON.stringify({ conversation_uuids: convUuids });
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`删除API请求失败: ${response.statusText}`);
        },
        async generateTitle(tempConvUuid, messageContent) {
            const orgId = await this.getOrgUuid();
            const url = `/api/organizations/${orgId}/chat_conversations/${tempConvUuid}/title`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_content: messageContent, recent_titles: [] })
            });
            if (!response.ok) throw new Error("标题生成API请求失败。");
            const { title } = await response.json();
            if (!title || title.toLowerCase().includes('untitled')) throw new Error('生成了无效标题。');
            return title;
        },
        async updateConversation(convUuid, payload) {
            const orgId = await this.getOrgUuid();
            const url = `/api/organizations/${orgId}/chat_conversations/${convUuid}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`更新会话失败: ${response.statusText}`);
        },
        async downloadFile(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`文件下载失败: ${response.status} at ${url}`);
            return response.blob();
        }
    };

    // =========================================================================
    // 5. 共享UI与逻辑模块
    // =========================================================================
    const SharedLogic = {
        buildConversationTree(messages) {
            const nodes = {};
            messages.forEach(msg => { nodes[msg.uuid] = msg; });

            const childrenMap = {};
            messages.forEach(msg => {
                const parentUuid = msg.parent_message_uuid || Config.INITIAL_PARENT_UUID;
                if (!childrenMap[parentUuid]) childrenMap[parentUuid] = [];
                childrenMap[parentUuid].push(msg.uuid);
            });

            for (const parentUuid in childrenMap) {
                childrenMap[parentUuid].sort((a, b) => new Date(nodes[a].created_at) - new Date(nodes[b].created_at));
            }

            function assignIdsRecursive(nodeUuid, prefix) {
                if (!nodes[nodeUuid]) return;
                nodes[nodeUuid].tree_id = prefix;
                const children = childrenMap[nodeUuid] || [];
                children.forEach((childUuid, index) => {
                    assignIdsRecursive(childUuid, `${prefix}-${index}`);
                });
            }

            const rootNodes = childrenMap[Config.INITIAL_PARENT_UUID] || [];
            rootNodes.forEach((rootUuid, index) => {
                assignIdsRecursive(rootUuid, `root-${index}`);
            });

            return { nodes, childrenMap, rootNodes };
        },

        async renderTreeView(container, messages, options = {}) {
            const { isForBranching = false, onNodeClick = () => {} } = options;
            container.innerHTML = '';

            if (!messages || messages.length === 0) {
                 container.innerHTML = `<p class="cpm-loading">这是一个空对话${isForBranching ? '，无法选择分支点' : ''}。</p>`;
                 return;
            }

            if (isForBranching) {
                const rootBtn = document.createElement('div');
                rootBtn.id = 'cpm-branch-from-root-btn';
                rootBtn.textContent = '从根节点开始 (创建一个新的主分支)';
                rootBtn.onclick = () => onNodeClick(Config.INITIAL_PARENT_UUID, rootBtn);
                container.appendChild(rootBtn);
            }

            const { nodes, childrenMap, rootNodes } = this.buildConversationTree(messages);
            const orgUuid = await ClaudeAPI.getOrgUuid();
            const baseUrl = window.location.origin;

            const renderNodeRecursive = (nodeUuid, indentLevel) => {
                const node = nodes[nodeUuid];
                if (!node) return;

                const nodeElement = document.createElement('div');
                nodeElement.className = 'cpm-tree-node';
                nodeElement.style.paddingLeft = `${indentLevel * 20}px`;

                const sender = node.sender === 'human' ? 'You' : 'Claude';
                const retryMarker = node.input_mode === 'retry' ? ' [Retry]' : '';
                let textContent = Array.isArray(node.content) ? node.content.filter(b => b.type === 'text' && b.text).map(b => b.text.replace(/\n/g, ' ')).join(' ') : '';
                if (!textContent && node.text) textContent = node.text.replace(/\n/g, ' ');
                const preview = textContent.substring(0, 80) + (textContent.length > 80 ? '...' : '');

                let attachmentsHTML = '';
                const allAttachments = [];
                const files_uuids = new Set();

                if (node.attachments) {
                    allAttachments.push(...node.attachments.map(file => ({ type: 'text', ...file })));
                }
                if (node.files) {
                    const binaryFiles = node.files.map(file => ({ type: 'binary', ...file }));
                    allAttachments.push(...binaryFiles);
                    binaryFiles.forEach(file => {
                        if (file.file_uuid) files_uuids.add(file.file_uuid);
                    });
                }
                if (node.files_v2) {
                    node.files_v2.forEach(file_v2 => {
                        if (!file_v2.file_uuid || !files_uuids.has(file_v2.file_uuid)) {
                            allAttachments.push({ type: 'binary', ...file_v2 });
                        }
                    });
                }

                if (allAttachments.length > 0) {
                    attachmentsHTML += '<div class="cpm-tree-attachments">└─ [附件]:<ul>';
                    allAttachments.forEach(file => {
                        if (file.type === 'text') {
                            const contentPreview = (file.extracted_content || '').substring(0, 25);
                            const escapedPreview = escapeHTML(contentPreview);
                            attachmentsHTML += `<li>- ${file.file_name} <span class="cpm-attachment-source">[Source: convert_document]</span> <span class="cpm-attachment-details">[ID: ${file.id}] [Preview: "${escapedPreview}..."]</span></li>`;

                        } else {
                            // v1.1.1: 增强URL构造逻辑以支持blob类型
                            let fullUrl = '';
                            if (file.document_asset?.url) { // 优先使用显式URL
                                fullUrl = baseUrl + file.document_asset.url;
                            } else if (file.preview_url) { // 其次使用预览URL
                                fullUrl = baseUrl + file.preview_url;
                            } else if (file.file_kind === 'blob' && orgUuid && file.file_uuid) { // **新增**: 处理 blob 类型
                                fullUrl = `${baseUrl}/api/organizations/${orgUuid}/files/${file.file_uuid}/contents`;
                            } else if (orgUuid && file.file_uuid && file.file_name) { // 回退到旧的文档格式
                                const ext = file.file_name.includes('.') ? file.file_name.rsplit('.', 1)[1] : '';
                                if (ext) fullUrl = `${baseUrl}/api/${orgUuid}/files/${file.file_uuid}/document_${ext.replace('.','')}/${file.file_name}`;
                            }

                            const urlLink = fullUrl ? `<a href="${fullUrl}" target="_blank" class="cpm-attachment-url" title="点击在新标签页打开: ${fullUrl}">[View/Download URL]</a>` : '[URL Not Available]';
                            attachmentsHTML += `<li>- ${file.file_name} <span class="cpm-attachment-source">[Source: /upload | Type: ${file.file_kind || 'unknown'}]</span> ${urlLink}</li>`;
                        }
                    });
                    attachmentsHTML += '</ul></div>';
                }

                nodeElement.innerHTML = `
                    <div class="cpm-tree-node-header">
                        <span class="cpm-tree-node-id">[${node.tree_id}]</span>
                        <span class="cpm-tree-node-sender sender-${sender.toLowerCase()}">${sender}${retryMarker}:</span>
                        <span class="cpm-tree-node-preview">${preview || '[仅包含附件或工具使用]'}</span>
                    </div>
                    ${attachmentsHTML}`;

                if (isForBranching && node.sender === 'assistant') {
                    nodeElement.classList.add('cpm-branch-node-clickable');
                    nodeElement.title = `点击从此节点继续对话`;
                    nodeElement.onclick = () => onNodeClick(node.uuid, nodeElement);
                }
                container.appendChild(nodeElement);
                (childrenMap[nodeUuid] || []).forEach(childUuid => renderNodeRecursive(childUuid, indentLevel + 1));
            };
            rootNodes.forEach(rootUuid => renderNodeRecursive(rootUuid, 0));
        }
    };

    // =========================================================================
    // 6. 业务逻辑层 (Service Layer)
    // =========================================================================
    const ManagerService = {
        conversationsCache: [],
        async loadConversations() {
            this.conversationsCache = await ClaudeAPI.getConversations();
            return this.conversationsCache;
        },
        async performManualRename(convUuid, newTitle) {
            await ClaudeAPI.updateConversation(convUuid, { name: newTitle });
            const cachedItem = this.conversationsCache.find(c => c.uuid === convUuid);
            if (cachedItem) cachedItem.name = newTitle;
            return true;
        },
        async exportAttachmentsForConversation(historyData, exportDirHandle, statusCallback) {
            const { nodes } = SharedLogic.buildConversationTree(historyData.chat_messages);
            const allAttachments = [];
            for (const node of Object.values(nodes)) {
                (node.attachments || []).forEach(file => allAttachments.push({ type: 'text', content: file.extracted_content, node_id: node.tree_id, ...file }));
                (node.files || []).forEach(file => allAttachments.push({ type: 'binary', node_id: node.tree_id, ...file }));
                (node.files_v2 || []).forEach(file => allAttachments.push({ type: 'binary', node_id: node.tree_id, ...file }));
            }

            if (allAttachments.length > 0) {
                statusCallback(`发现 ${allAttachments.length} 个附件，开始下载...`, 'info');
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                if (!orgInfo) throw new Error("无法获取组织信息以下载附件。");

                for (let i = 0; i < allAttachments.length; i++) {
                    const file = allAttachments[i];
                    let fileName;
                    const baseName = file.file_name ? (file.file_name.includes('.') ? file.file_name.substring(0, file.file_name.lastIndexOf('.')) : file.file_name) : 'unknown_file';
                    const extension = file.file_name ? (file.file_name.includes('.') ? file.file_name.substring(file.file_name.lastIndexOf('.')) : '') : '';

                    if (file.type === 'text') {
                        fileName = `${baseName}_[${file.id || 'no-id'}]_[${file.node_id || 'no-node'}].txt`;
                    } else if (file.type === 'binary' && file.file_uuid) {
                        fileName = `${baseName}_[${file.file_uuid}]${extension}`;
                    }

                    if (!fileName) continue;

                    try {
                        await exportDirHandle.getFileHandle(fileName, { create: false });
                        statusCallback(`(${i + 1}/${allAttachments.length}) 跳过 (文件已存在): ${fileName}`, 'info');
                        continue;
                    } catch (error) {
                        if (error.name !== 'NotFoundError') {
                            console.error(`检查文件 ${fileName} 时发生意外错误:`, error);
                            statusCallback(`检查文件 ${fileName} 出错`, 'error');
                            continue;
                        }
                    }

                    statusCallback(`(${i + 1}/${allAttachments.length}) 正在下载: ${fileName}`, 'info');
                    try {
                        let fileContent;
                        if (file.type === 'text') {
                             fileContent = new Blob([file.content || ""], { type: 'text/plain;charset=utf-8' });
                        } else {
                            // v1.1.1: 增强URL构造逻辑以支持blob类型
                            let downloadUrl;
                            if (file.document_asset?.url) { // 优先使用显式URL
                                downloadUrl = file.document_asset.url;
                            } else if (file.preview_url) { // 其次使用预览URL
                                downloadUrl = file.preview_url;
                            } else if (file.file_kind === 'blob' && orgInfo.uuid && file.file_uuid) { // **新增**: 处理 blob 类型
                                downloadUrl = `/api/organizations/${orgInfo.uuid}/files/${file.file_uuid}/contents`;
                            } else if (orgInfo.uuid && file.file_uuid && file.file_name) { // 回退到旧的文档格式
                               const ext = file.file_name.includes('.') ? file.file_name.rsplit('.', 1)[1] : '';
                               downloadUrl = `/api/${orgInfo.uuid}/files/${file.file_uuid}/document_${ext.replace('.','')}/${file.file_name}`;
                            }

                            if(!downloadUrl) throw new Error("找不到附件的下载链接。");
                            fileContent = await ClaudeAPI.downloadFile(downloadUrl);
                        }
                        const fileHandle = await exportDirHandle.getFileHandle(fileName, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(fileContent);
                        await writable.close();
                    } catch (err) {
                        console.error(`处理附件 ${fileName} 失败:`, err);
                        statusCallback(`处理附件 ${fileName} 失败`, 'error');
                    }
                }
            }
        },
        async performExportOriginal(convUuid, statusCallback) {
            if (typeof window.showDirectoryPicker !== 'function') throw new Error("您的浏览器不支持 File System Access API。");
            statusCallback("正在请求文件夹权限...", 'info');
            let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') { statusCallback("用户取消了文件夹选择。", 'info', 3000); return; }
                throw err;
            }

            try {
                const historyData = await ClaudeAPI.getConversationHistory(convUuid);
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                if (!orgInfo) throw new Error("缺少导出所需组织信息。");

                statusCallback("正在创建目录...", 'info');
                const orgName = (orgInfo.name || "unknown_org").replace(/'s Organization$/, "");
                const safeTitle = (historyData.name || "Untitled").replace(/[<>:"/\\|?*]/g, '_');
                const pathParts = [`Claude_Exports`, `[${orgName}]`, `[Original]_[${safeTitle}]_[${convUuid}]`];

                let currentDirHandle = rootDirHandle;
                for (const part of pathParts) {
                    currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true });
                }
                const exportDirHandle = currentDirHandle;

                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                const historyFileName = `history-${timestamp}.json`;
                statusCallback(`正在写入 ${historyFileName}...`, 'info');
                const historyFileHandle = await exportDirHandle.getFileHandle(historyFileName, { create: true });
                const writableHistory = await historyFileHandle.createWritable();
                await writableHistory.write(JSON.stringify(historyData, null, 2));
                await writableHistory.close();

                await this.exportAttachmentsForConversation(historyData, exportDirHandle, statusCallback);

                statusCallback("原始导出完成！", 'success', 5000);
            } catch (error) {
                console.error("原始导出失败:", error);
                statusCallback(`原始导出失败: ${error.message}`, 'error', 5000);
            }
        },
        transformConversation(originalData, settings) {
            const newData = {};

            if (settings.metadata.include) {
                if (settings.metadata.title) newData.name = originalData.name;
                if (settings.metadata.summary) newData.summary = originalData.summary;
                if (settings.metadata.main_timestamps) {
                    newData.created_at = originalData.created_at;
                    newData.updated_at = originalData.updated_at;
                }
                if (settings.metadata.conv_settings) newData.settings = originalData.settings;
            }

            newData.chat_messages = originalData.chat_messages.map(originalMsg => {
                const newMsg = { };

                if (settings.message.sender) newMsg.sender = originalMsg.sender;
                if (settings.message.uuids) {
                    newMsg.uuid = originalMsg.uuid;
                    newMsg.parent_message_uuid = originalMsg.parent_message_uuid;
                }
                if (settings.message.timestamps.messageNode) {
                    newMsg.created_at = originalMsg.created_at;
                    newMsg.updated_at = originalMsg.updated_at;
                }
                if (settings.message.other_meta) {
                    newMsg.index = originalMsg.index;
                    newMsg.stop_reason = originalMsg.stop_reason;
                    newMsg.truncated = originalMsg.truncated;
                }
                if (originalMsg.text) newMsg.text = originalMsg.text;

                if (originalMsg.content && Array.isArray(originalMsg.content)) {
                    newMsg.content = originalMsg.content.map(block => {
                        const newBlock = {...block};
                        if (!settings.message.timestamps.contentBlock) {
                            delete newBlock.start_timestamp;
                            delete newBlock.stop_timestamp;
                        }
                        return newBlock;
                    }).filter(block => {
                        switch (block.type) {
                            case 'text': return settings.content.text;
                            case 'thinking': return settings.advanced.thinking;
                            case 'tool_use':
                            case 'tool_result':
                                if (!settings.advanced.tools.include) return false;
                                if (settings.advanced.tools.onlySuccessful && block.is_error) return false;
                                switch (block.name) {
                                    case 'web_search': return settings.advanced.tools.web_search;
                                    case 'repl': return settings.advanced.tools.repl;
                                    case 'artifacts': return settings.advanced.tools.artifacts;
                                    default: return settings.advanced.tools.other;
                                }
                            default: return true;
                        }
                    });
                }

                const processAttachments = (attachments) => {
                    if (!attachments) return undefined;
                    if (settings.attachments.mode === 'none') return undefined;
                    if (settings.attachments.mode === 'full') {
                       if (settings.message.timestamps.attachment) return attachments;
                       return attachments.map(att => { const newAtt = {...att}; delete newAtt.created_at; return newAtt; });
                    }
                    if (settings.attachments.mode === 'metadata_only') {
                        return attachments.map(att => ({
                            id: att.id, file_uuid: att.file_uuid, file_name: att.file_name,
                            file_size: att.file_size, file_type: att.file_type, file_kind: att.file_kind
                        }));
                    }
                };

                const attachmentsResult = processAttachments(originalMsg.attachments);
                const filesResult = processAttachments(originalMsg.files);
                const filesV2Result = processAttachments(originalMsg.files_v2);

                if (attachmentsResult) newMsg.attachments = attachmentsResult;
                if (filesResult) newMsg.files = filesResult;
                if (filesV2Result) newMsg.files_v2 = filesV2Result;

                return newMsg;
            });

            return newData;
        },
        async performExportCustom(convUuid, settings, statusCallback) {
            if (typeof window.showDirectoryPicker !== 'function') throw new Error("您的浏览器不支持 File System Access API。");
            statusCallback("正在请求文件夹权限...", 'info');
             let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') { statusCallback("用户取消了文件夹选择。", 'info', 3000); return; }
                throw err;
            }

            try {
                const historyData = await ClaudeAPI.getConversationHistory(convUuid);
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                 if (!orgInfo) throw new Error("缺少导出所需组织信息。");

                statusCallback("正在创建目录...", 'info');
                const orgName = (orgInfo.name || "unknown_org").replace(/'s Organization$/, "");
                const safeTitle = (historyData.name || "Untitled").replace(/[<>:"/\\|?*]/g, '_');
                const pathParts = [`Claude_Exports`, `[${orgName}]`, `[Custom]_[${safeTitle}]_[${convUuid}]`];

                let currentDirHandle = rootDirHandle;
                for (const part of pathParts) {
                    currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true });
                }
                const exportDirHandle = currentDirHandle;

                statusCallback("正在根据设置转换数据...", 'info');
                const transformedData = this.transformConversation(historyData, settings);
                const jsonString = JSON.stringify(transformedData, null, 2);

                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                const historyFileName = `history-${timestamp}.json`;
                statusCallback(`正在写入 ${historyFileName}...`, 'info');
                const historyFileHandle = await exportDirHandle.getFileHandle(historyFileName, { create: true });
                const writableHistory = await historyFileHandle.createWritable();
                await writableHistory.write(jsonString);
                await writableHistory.close();

                if (settings.attachments.mode !== 'none') {
                    await this.exportAttachmentsForConversation(historyData, exportDirHandle, statusCallback);
                }

                statusCallback("自定义导出完成！", 'success', 5000);
            } catch (error) {
                console.error("自定义导出失败:", error);
                statusCallback(`自定义导出失败: ${error.message}`, 'error', 5000);
            }
        },
        async performAutoRename(convUuid) {
            const langPrompt = GM_getValue('renameLang', '中文');
            const maxRounds = parseInt(GM_getValue('renameRounds', 2), 10);
            const historyData = await ClaudeAPI.getConversationHistory(convUuid);
            const roundsToUse = Math.min(Math.floor(historyData.chat_messages.length / 2), maxRounds);
            if (roundsToUse < 1) throw new Error("对话轮次不足(可能为空对话)，跳过重命名。");
            const messagesToProcess = historyData.chat_messages.slice(0, roundsToUse * 2);
            let messageParts = [];
            messagesToProcess.forEach((msg, index) => {
                const senderLabel = `Message ${index + 1} (${msg.sender === 'human' ? 'User' : 'Assistant'})`;
                let textContent = Array.isArray(msg.content) ? msg.content.filter(b => b.type === 'text' && b.text).map(b => b.text).join('\n') : '';
                if (!textContent && msg.text) textContent = msg.text;
                if (textContent.trim()) messageParts.push(`${senderLabel}:\n\n${textContent.trim()}`);
            });
            if (messageParts.length === 0) throw new Error("在指定轮次内未找到有效文本内容。");
            let finalMessageContent = messageParts.join('\n\n');
            if (langPrompt && langPrompt.trim() !== "") {
                const startInstruction = `TASK: Generate a title for the following conversation.\nRULE: The title language must be strictly ${langPrompt}.\n\n--- Conversation Start ---`;
                const endInstruction = `\n--- Conversation End ---\nREMINDER: Generate the title in ${langPrompt} now.`;
                finalMessageContent = `${startInstruction}\n\n${finalMessageContent}\n${endInstruction}`;
            }
            const tempConvUuid = await ClaudeAPI.createTempConversation();
            try {
                const newTitle = await ClaudeAPI.generateTitle(tempConvUuid, finalMessageContent);
                await ClaudeAPI.updateConversation(convUuid, { name: newTitle });
                const cachedItem = this.conversationsCache.find(c => c.uuid === convUuid);
                if (cachedItem) cachedItem.name = newTitle;
                return newTitle;
            } finally {
                await ClaudeAPI.deleteConversations([tempConvUuid]);
            }
        },
        async performBatchStarAction(uuids, isStarring) {
            let successCount = 0;
            for (const uuid of uuids) {
                try {
                    await ClaudeAPI.updateConversation(uuid, { is_starred: isStarring });
                    const cachedItem = this.conversationsCache.find(c => c.uuid === uuid);
                    if (cachedItem) cachedItem.is_starred = isStarring;
                    successCount++;
                } catch (error) { console.error(`(取消)收藏 ${uuid} 失败:`, error); }
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            return successCount;
        },
        async performBatchDelete(uuids) {
            await ClaudeAPI.deleteConversations(uuids);
            this.conversationsCache = this.conversationsCache.filter(c => !uuids.includes(c.uuid));
            return uuids.length;
        }
    };


    // =========================================================================
    // 7. 主管理器UI层 (ManagerUI)
    // =========================================================================
    const ManagerUI = {
        currentSort: 'updated_at_desc',
        currentFilter: 'all',
        currentSearch: '',
        statusTimeout: null,
        isInitialized: false,

        init() {
            if (this.isInitialized) return;
            this.createUI();
            this.bindEvents();
            ClaudeAPI.getOrgUuid().catch(err => console.error(LOG_PREFIX, "预获取OrgId失败", err));
            this.isInitialized = true;
            console.log(LOG_PREFIX, "主管理器UI已初始化。");
        },

        createUI() {
            const svgDefs = document.createElement('div');
            svgDefs.style.display = 'none';
            svgDefs.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <symbol id="cpm-icon-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></symbol>
                        <symbol id="cpm-icon-refresh" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></symbol>
                        <symbol id="cpm-icon-edit" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></symbol>
                        <symbol id="cpm-icon-tree" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></symbol>
                        <symbol id="cpm-icon-export-original" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></symbol>
                        <symbol id="cpm-icon-export-custom" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /><g transform="translate(16, 3) scale(0.5)" fill="currentColor" stroke="none"><path fill-rule="evenodd" d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768c-.433.36-.928.649-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.993 4.993 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206l-1.047-1.814a.5.5 0 0 1 .14-.656l1.517-1.09a5.033 5.033 0 0 1 0-1.694l-1.516-1.09a.5.5 0 0 1-.141-.656L2.46 3.593a.5.5 0 0 1 .639-.206l1.703.769c.433-.36.928.65 1.466-.848l.186-1.858Zm-.177 7.567-.022-.037a2 2 0 0 1 3.466-1.997l.022.037a2 2 0 0 1-3.466 1.997Z" clip-rule="evenodd" /></g></symbol>
                        <symbol id="cpm-icon-save" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></symbol>
                        <symbol id="cpm-icon-cancel" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></symbol>
                        <symbol id="cpm-icon-github" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></symbol>
                        <symbol id="cpm-icon-studio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="3" x2="6" y2="15" stroke-linecap="round"></line><circle cx="16" cy="8" r="2"></circle><circle cx="6" cy="18" r="2"></circle><path d="M16 11a8 8 0 0 1 -8 7" stroke-linecap="round"></path><g transform="translate(14.5, 14.5) scale(0.5)" fill="currentColor" stroke="none"><path fill-rule="evenodd" d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768c-.433.36-.928.649-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.993 4.993 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206l-1.047-1.814a.5.5 0 0 1 .14-.656l1.517-1.09a5.033 5.033 0 0 1 0-1.694l-1.516-1.09a.5.5 0 0 1-.141-.656L2.46 3.593a.5.5 0 0 1 .639-.206l1.703.769c.433-.36.928.65 1.466-.848l.186-1.858Zm-.177 7.567-.022-.037a2 2 0 0 1 3.466-1.997l.022.037a2 2 0 0 1-3.466 1.997Z" clip-rule="evenodd" /></g></symbol>
                    </defs>
                </svg>
            `;
            document.body.appendChild(svgDefs);

            const managerButton = document.createElement('button');
            managerButton.id = 'cpm-manager-button';
            managerButton.innerHTML = 'Manager';
            document.body.appendChild(managerButton);

            const mainPanel = document.createElement('div');
            mainPanel.id = 'cpm-main-panel';
            mainPanel.className = 'cpm-panel';
            mainPanel.innerHTML = `
                <div class="cpm-header">
                    <h2>Manager</h2>
                    <div class="cpm-header-actions">
                        <a href="${Config.URL_GITHUB_REPO}" target="_blank" class="cpm-icon-btn" title="查看 GitHub 仓库"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-github"></use></svg></a>
                        <a href="${Config.URL_STUDIO_REPO}" target="_blank" class="cpm-icon-btn" title="了解下一个项目: claude-dialog-tree-studio"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-studio"></use></svg></a>
                        <button id="cpm-open-settings-button" title="设置" class="cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-settings"></use></svg></button>
                        <button class="cpm-close-button cpm-icon-btn">×</button>
                    </div>
                </div>
                <div class="cpm-toolbar">
                    <div class="cpm-toolbar-group"><button class="cpm-btn" id="cpm-select-all">全选</button><button class="cpm-btn" id="cpm-select-none">全不选</button><button class="cpm-btn" id="cpm-select-invert">反选</button></div>
                    <div class="cpm-toolbar-group"><input type="search" id="cpm-search-box" placeholder="搜索标题..."/></div>
                    <div class="cpm-toolbar-group"><label>排序:</label><select id="cpm-sort-select"><option value="updated_at_desc">时间降序</option><option value="updated_at_asc">时间升序</option><option value="name_asc">名称 A-Z</option><option value="name_desc">名称 Z-A</option></select></div>
                    <div class="cpm-toolbar-group"><label>筛选:</label><select id="cpm-filter-select"><option value="all">显示全部</option><option value="starred">仅显示收藏</option><option value="unstarred">隐藏收藏</option><option value="ascii_only">仅显示纯ASCII标题</option><option value="non_ascii">不显示纯ASCII标题</option></select></div>
                    <button class="cpm-icon-btn" id="cpm-refresh" title="刷新列表"><svg class="cpm-svg-icon"><use href="#cpm-icon-refresh"></use></svg></button>
                </div>
                <div class="cpm-actions"><button class="cpm-action-btn" id="cpm-batch-star">批量收藏</button><button class="cpm-action-btn" id="cpm-batch-unstar">批量取消收藏</button><button class="cpm-action-btn" id="cpm-batch-rename">批量自动重命名</button><button class="cpm-action-btn cpm-danger-btn" id="cpm-batch-delete">批量删除</button></div>
                <div class="cpm-list-container"><p class="cpm-loading">点击刷新按钮 ( <svg class="cpm-svg-icon"><use href="#cpm-icon-refresh"></use></svg> ) 加载会话列表。</p></div>
                <div class="cpm-status-bar">准备就绪。</div>`;
            document.body.appendChild(mainPanel);

            const settingsPanel = document.createElement('div');
            settingsPanel.id = 'cpm-settings-panel';
            settingsPanel.className = 'cpm-panel';

            const settingsHeader = `<div class="cpm-header"><h2>管理器设置</h2><button class="cpm-close-button cpm-icon-btn">×</button></div>`;
            const settingsContent = document.createElement('div');
            settingsContent.className = 'cpm-settings-content';

            for (const module of SettingsRegistry.modules) {
                const section = document.createElement('div');
                section.className = 'cpm-setting-section';
                section.innerHTML = `<h3 class="cpm-setting-section-title">${module.title}</h3>` + module.render();
                settingsContent.appendChild(section);
            }

            const settingsButtons = `<div class="cpm-settings-buttons"><button id="cpm-back-to-main" class="cpm-btn">返回主面板</button><button id="cpm-save-settings-button" class="cpm-btn cpm-primary-btn">保存设置</button></div>`;

            settingsPanel.innerHTML = settingsHeader;
            settingsPanel.appendChild(settingsContent);
            settingsPanel.insertAdjacentHTML('beforeend', settingsButtons);
            document.body.appendChild(settingsPanel);


            const treePanel = document.createElement('div');
            treePanel.id = 'cpm-tree-panel';
            treePanel.className = 'cpm-panel cpm-tree-panel-override';
            treePanel.innerHTML = `
                <div class="cpm-header"><h2 id="cpm-tree-title">对话树预览</h2><button id="cpm-tree-close-button" class="cpm-icon-btn">×</button></div>
                <div id="cpm-tree-container" class="cpm-tree-container"><p class="cpm-loading">正在加载对话树...</p></div>`;
            document.body.appendChild(treePanel);
        },
        bindEvents() {
            document.getElementById('cpm-manager-button').onclick = () => this.togglePanel('cpm-main-panel');
            document.querySelectorAll('.cpm-close-button').forEach(btn => btn.onclick = () => this.hideAllPanels());
            document.getElementById('cpm-open-settings-button').onclick = () => this.togglePanel('cpm-settings-panel');
            document.getElementById('cpm-back-to-main').onclick = () => this.togglePanel('cpm-main-panel');
            document.getElementById('cpm-refresh').onclick = () => this.loadConversations();
            document.getElementById('cpm-select-all').onclick = () => this.selectAll(true);
            document.getElementById('cpm-select-none').onclick = () => this.selectAll(false);
            document.getElementById('cpm-select-invert').onclick = () => this.selectInvert();
            document.getElementById('cpm-search-box').oninput = (e) => { this.currentSearch = e.target.value; this.renderConversationList(); };
            document.getElementById('cpm-sort-select').onchange = (e) => { this.currentSort = e.target.value; this.renderConversationList(); };
            document.getElementById('cpm-filter-select').onchange = (e) => { this.currentFilter = e.target.value; this.renderConversationList(); };
            document.getElementById('cpm-batch-rename').onclick = () => this.handleBatchRename();
            document.getElementById('cpm-batch-delete').onclick = () => this.handleBatchDelete();
            document.getElementById('cpm-batch-star').onclick = () => this.handleBatchStar(true);
            document.getElementById('cpm-batch-unstar').onclick = () => this.handleBatchStar(false);
            document.getElementById('cpm-save-settings-button').onclick = () => this.saveSettings();
            document.getElementById('cpm-tree-close-button').onclick = () => this.hidePanel('cpm-tree-panel');
            document.querySelector('#cpm-main-panel .cpm-list-container').addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                const uuid = li.dataset.uuid;
                if (e.target.closest('.cpm-action-rename')) this.enterEditMode(li);
                else if (e.target.closest('.cpm-action-tree')) this.handleTreeView(uuid);
                else if (e.target.closest('.cpm-action-export-original')) this.handleExport(uuid, 'original');
                else if (e.target.closest('.cpm-action-export-custom')) this.handleExport(uuid, 'custom');
                else if (e.target.closest('.cpm-action-save')) this.handleSaveRename(li);
                else if (e.target.closest('.cpm-action-cancel')) this.exitEditMode(li);
            });
        },
        togglePanel(panelId) {
            const panel = document.getElementById(panelId);
            const isVisible = panel.style.display === 'flex';
            this.hideAllPanels();
            if (!isVisible) {
                panel.style.display = 'flex';
                if (panelId === 'cpm-main-panel' && ManagerService.conversationsCache.length === 0) this.loadConversations();
                if (panelId === 'cpm-settings-panel') this.loadSettings();
            }
        },
        hidePanel(panelId) { document.getElementById(panelId).style.display = 'none'; },
        hideAllPanels() {
             document.querySelectorAll('.cpm-panel').forEach(p => p.style.display = 'none');
             document.querySelector('.cpm-modal-overlay')?.remove();
        },
        loadSettings() {
            const panel = document.getElementById('cpm-settings-panel');
            if (!panel) return;
            for (const module of SettingsRegistry.modules) {
                module.load(panel);
                module.addEventListeners?.(panel);
            }
        },
        saveSettings() {
            const panel = document.getElementById('cpm-settings-panel');
            if (!panel) return;
            for (const module of SettingsRegistry.modules) {
                module.save(panel);
            }
            this.updateStatus('设置已保存！', 'success', 3000);
            this.togglePanel('cpm-main-panel');
        },
        async loadConversations() {
            const listContainer = document.querySelector('#cpm-main-panel .cpm-list-container');
            listContainer.innerHTML = '<p class="cpm-loading">正在加载会话列表...</p>';
            this.updateStatus("正在获取会话列表...", 'info');
            try {
                const convos = await ManagerService.loadConversations();
                this.renderConversationList();
                this.updateStatus(`已加载 ${convos.length} 个会话。`, 'info');
            } catch (error) {
                listContainer.innerHTML = `<p class="cpm-error">加载会话失败: ${error.message}</p>`;
                this.updateStatus("加载失败。", 'error');
            }
        },
        escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); },
        renderConversationList() {
            const listContainer = document.querySelector('#cpm-main-panel .cpm-list-container');
            let conversationsToRender = [...ManagerService.conversationsCache];
            if (this.currentSearch) {
                const searchPattern = new RegExp(this.escapeRegExp(this.currentSearch), 'i');
                conversationsToRender = conversationsToRender.filter(c => searchPattern.test(c.name || ''));
            }
            if (this.currentFilter === 'starred') conversationsToRender = conversationsToRender.filter(c => c.is_starred);
            else if (this.currentFilter === 'unstarred') conversationsToRender = conversationsToRender.filter(c => !c.is_starred);
            else if (this.currentFilter === 'ascii_only') conversationsToRender = conversationsToRender.filter(c => /^[\x00-\x7F]*$/.test(c.name || ''));
            else if (this.currentFilter === 'non_ascii') conversationsToRender = conversationsToRender.filter(c => /[^\x00-\x7F]/.test(c.name || ''));
            conversationsToRender.sort((a, b) => {
                switch (this.currentSort) {
                    case 'updated_at_asc': return new Date(a.updated_at) - new Date(b.updated_at);
                    case 'name_asc': return (a.name || '').localeCompare(b.name || '');
                    case 'name_desc': return (b.name || '').localeCompare(a.name || '');
                    default: return new Date(b.updated_at) - new Date(a.updated_at);
                }
            });
            if (conversationsToRender.length === 0) { listContainer.innerHTML = '<p>没有符合条件的会话。</p>'; return; }
            const ul = document.createElement('ul');
            ul.className = 'cpm-convo-list';
            conversationsToRender.forEach(convo => {
                const li = document.createElement('li');
                li.dataset.uuid = convo.uuid;
                const titleText = convo.name || '无标题对话';
                let highlightedTitle = titleText;
                if (this.currentSearch) highlightedTitle = titleText.replace(new RegExp(this.escapeRegExp(this.currentSearch), 'gi'), (match) => `<span class="cpm-highlight">${match}</span>`);
                const star = convo.is_starred ? '<span class="cpm-star">★</span>' : '';
                li.innerHTML = `
                    <input type="checkbox" class="cpm-checkbox" data-uuid="${convo.uuid}">
                    <div class="cpm-convo-details"><span class="cpm-convo-title">${star}${highlightedTitle}</span><span class="cpm-convo-date">${new Date(convo.updated_at).toLocaleString()}</span></div>
                    <div class="cpm-convo-actions">
                        <button class="cpm-icon-btn cpm-action-rename" title="手动重命名"><svg class="cpm-svg-icon"><use href="#cpm-icon-edit"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-tree" title="预览对话树"><svg class="cpm-svg-icon"><use href="#cpm-icon-tree"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-export-original" title="原始JSON导出"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-export-original"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-export-custom" title="自定义JSON导出"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-export-custom"></use></svg></button>
                    </div>`;
                ul.appendChild(li);
            });
            listContainer.innerHTML = '';
            listContainer.appendChild(ul);
        },
        enterEditMode(li) {
            const currentlyEditing = document.querySelector('li.is-editing');
            if (currentlyEditing && currentlyEditing !== li) this.exitEditMode(currentlyEditing);
            li.classList.add('is-editing');
            const detailsDiv = li.querySelector('.cpm-convo-details');
            const actionsDiv = li.querySelector('.cpm-convo-actions');
            const titleSpan = li.querySelector('.cpm-convo-title');
            const originalTitle = titleSpan.textContent.replace(/★/g, '').trim();
            li.dataset.originalDetails = detailsDiv.innerHTML;
            li.dataset.originalActions = actionsDiv.innerHTML;
            detailsDiv.innerHTML = `<input type="text" class="cpm-edit-input" value="${originalTitle}">`;
            actionsDiv.innerHTML = `<button class="cpm-icon-btn cpm-action-save" title="保存"><svg class="cpm-svg-icon"><use href="#cpm-icon-save"></use></svg></button><button class="cpm-icon-btn cpm-action-cancel" title="取消"><svg class="cpm-svg-icon"><use href="#cpm-icon-cancel"></use></svg></button>`;
            const input = detailsDiv.querySelector('.cpm-edit-input');
            input.focus();
            input.select();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.handleSaveRename(li); }
                else if (e.key === 'Escape') { this.exitEditMode(li); }
            };
        },
        exitEditMode(li) {
            if (!li.classList.contains('is-editing')) return;
            li.classList.remove('is-editing');
            li.querySelector('.cpm-convo-details').innerHTML = li.dataset.originalDetails;
            li.querySelector('.cpm-convo-actions').innerHTML = li.dataset.originalActions;
            delete li.dataset.originalDetails;
            delete li.dataset.originalActions;
        },
        async handleSaveRename(li) {
            const uuid = li.dataset.uuid;
            const input = li.querySelector('.cpm-edit-input');
            const newTitle = input.value.trim();
            const originalTitle = li.dataset.originalDetails.match(/<span class="cpm-convo-title">(.*?)<\/span>/)[1].replace(/<[^>]*>/g, '').replace(/★/g, '').trim();
            if (!newTitle || newTitle === originalTitle) { this.exitEditMode(li); return; }
            input.disabled = true;
            this.updateStatus(`正在保存新标题...`, 'info');
            try {
                await ManagerService.performManualRename(uuid, newTitle);
                this.updateStatus("保存成功！", 'success');
                const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
                const star = convo.is_starred ? '<span class="cpm-star">★</span>' : '';
                li.dataset.originalDetails = li.dataset.originalDetails.replace(/>(★)?.*?<\/span>/, `>${star}${newTitle}</span>`);
                this.exitEditMode(li);
            } catch (error) {
                this.updateStatus(`保存失败: ${error.message}`, 'error');
                input.disabled = false;
                input.focus();
            }
        },
        async handleTreeView(uuid) {
            const treePanel = document.getElementById('cpm-tree-panel');
            const treeContainer = document.getElementById('cpm-tree-container');
            const treeTitle = document.getElementById('cpm-tree-title');
            const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
            treeTitle.textContent = `对话树: ${convo ? (convo.name || '无标题') : '加载中...'}`;
            treeContainer.innerHTML = '<p class="cpm-loading">正在加载对话历史...</p>';
            treePanel.style.display = 'flex';
            try {
                const historyData = await ClaudeAPI.getConversationHistory(uuid);
                await SharedLogic.renderTreeView(treeContainer, historyData.chat_messages);
            } catch (error) {
                console.error(error);
                treeContainer.innerHTML = `<p class="cpm-error">无法加载对话树: ${error.message}</p>`;
            }
        },
        async handleExport(uuid, type) {
            if (type === 'original') {
                await ManagerService.performExportOriginal(uuid, this.updateStatus.bind(this));
            } else if (type === 'custom') {
                this.showExportModal(uuid);
            }
        },
        selectAll(checked) { document.querySelectorAll('.cpm-list-container .cpm-checkbox').forEach(cb => cb.checked = checked); },
        selectInvert() { document.querySelectorAll('.cpm-list-container .cpm-checkbox').forEach(cb => cb.checked = !cb.checked); },
        getSelectedUuids() { return Array.from(document.querySelectorAll('.cpm-checkbox:checked')).map(cb => cb.dataset.uuid); },
        updateStatus(message, type = 'info', timeout = 0) {
            if (this.statusTimeout) clearTimeout(this.statusTimeout);
            const s = document.querySelector('#cpm-main-panel .cpm-status-bar');
            s.textContent = message;
            s.classList.remove('is-error', 'is-success');
            if (type === 'error') s.classList.add('is-error');
            else if (type === 'success') s.classList.add('is-success');
            if (timeout > 0) {
                this.statusTimeout = setTimeout(() => {
                    s.textContent = '准备就绪。';
                    s.classList.remove('is-error', 'is-success');
                }, timeout);
            }
        },
        async handleBatchOperation(opName, serviceFunc, ...args) {
            const uuids = this.getSelectedUuids();
            if (uuids.length === 0) { alert(`请选择要执行“${opName}”的会话。`); return; }
            if (opName.includes('删除') && !confirm(`确定永久删除 ${uuids.length} 个会话吗？`)) return;
            document.querySelectorAll('.cpm-action-btn').forEach(btn => btn.disabled = true);
            this.updateStatus(`正在批量${opName} ${uuids.length} 个会话...`, 'info');
            let successCount = 0;
            try {
                if (opName.includes('重命名')) {
                     for (let i = 0; i < uuids.length; i++) {
                        this.updateStatus(`正在${opName} ${i + 1}/${uuids.length}...`, 'info');
                        try {
                            const newTitle = await serviceFunc(uuids[i]);
                            const titleElement = document.querySelector(`li[data-uuid="${uuids[i]}"] .cpm-convo-title`);
                            if (titleElement) {
                                const star = titleElement.querySelector('.cpm-star');
                                titleElement.innerHTML = `${star ? star.outerHTML : ''}${newTitle}`;
                                titleElement.style.color = 'hsl(var(--cpm-success-000))';
                            }
                            successCount++;
                        } catch (error) {
                             const titleElement = document.querySelector(`li[data-uuid="${uuids[i]}"] .cpm-convo-title`);
                             if(titleElement) { titleElement.style.color = 'hsl(var(--cpm-danger-000))'; }
                             this.updateStatus(`第${i+1}个失败: ${error.message}`, 'error');
                             await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                        if (i < uuids.length - 1) await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } else {
                    successCount = await serviceFunc(uuids, ...args);
                }
                this.updateStatus(`操作完成。成功${opName} ${successCount}/${uuids.length} 个会话。`, 'success', 4000);
            } catch(e) { this.updateStatus(`批量${opName}失败: ${e.message}`, 'error', 5000); }
            const refreshSettingKey = opName.includes('删除') ? 'refreshAfterDelete' : opName.includes('收藏') ? 'refreshAfterStar' : 'refreshAfterRename';
            if (GM_getValue(refreshSettingKey, false)) {
                this.updateStatus(document.querySelector('#cpm-main-panel .cpm-status-bar').textContent + ' 正在从服务器刷新列表...', 'info');
                await this.loadConversations();
            } else { this.renderConversationList(); }
            document.querySelectorAll('.cpm-action-btn').forEach(btn => btn.disabled = false);
        },
        handleBatchRename() { this.handleBatchOperation('重命名', ManagerService.performAutoRename.bind(ManagerService)); },
        handleBatchDelete() { this.handleBatchOperation('删除', ManagerService.performBatchDelete.bind(ManagerService)); },
        handleBatchStar(isStarring) { this.handleBatchOperation(isStarring ? '收藏' : '取消收藏', ManagerService.performBatchStarAction.bind(ManagerService), isStarring); },

        createExportSettingsHTML(forSettingsPanel = false) {
            const maybeRemoveTitle = forSettingsPanel ? '' : '<h3 class="cpm-setting-section-title">自定义导出默认设置</h3>';
            return `
                ${maybeRemoveTitle}
                <div class="cpm-setting-group" data-section="export-metadata">
                    <h4>基础信息</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-include"><label for="cpm-export-meta-include">保留会话元数据</label></div>
                    <div class="cpm-setting-sub-group" data-parent="meta-include">
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-title"><label for="cpm-export-meta-title">标题 (name)</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-summary"><label for="cpm-export-meta-summary">摘要 (summary)</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-main-timestamps"><label for="cpm-export-meta-main-timestamps">会话创建/更新时间</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-conv-settings"><label for="cpm-export-meta-conv-settings">会话设置 (settings)</label></div>
                    </div>
                </div>
                 <div class="cpm-setting-group" data-section="export-message">
                    <h4>消息结构</h4>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-sender"><label for="cpm-export-msg-sender">发送者 (sender)</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-uuids"><label for="cpm-export-msg-uuids">消息/父级UUID (建议保留)</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-other-meta"><label for="cpm-export-msg-other-meta">其他元数据 (index, stop_reason等)</label></div>
                </div>
                <div class="cpm-setting-group" data-section="export-timestamps">
                    <h4>时间戳信息</h4>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-message"><label for="cpm-export-ts-message">消息节点时间戳 (created_at/updated_at)</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-content"><label for="cpm-export-ts-content">内容块流式时间戳 (start/stop)</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-attachment"><label for="cpm-export-ts-attachment">附件创建时间戳</label></div>
                </div>
                 <div class="cpm-setting-group" data-section="export-content">
                    <h4>核心内容</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-content-text"><label for="cpm-export-content-text">文本内容 (text块)</label></div>
                    <div class="cpm-setting-item">
                        <label class="cpm-settings-label">附件信息:</label>
                        <select id="cpm-export-attachments-mode">
                            <option value="full">完整信息 (含提取文本)</option>
                            <option value="metadata_only">仅元数据 (文件名,大小等)</option>
                            <option value="none">不保留附件</option>
                        </select>
                    </div>
                </div>
                 <div class="cpm-setting-group" data-section="export-advanced">
                    <h4>高级内容</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-thinking"><label for="cpm-export-adv-thinking">'思考'过程 (thinking块)</label></div>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tools-include"><label for="cpm-export-adv-tools-include">保留工具使用记录</label></div>
                    <div class="cpm-setting-sub-group" data-parent="adv-tools-include">
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-websearch"><label for="cpm-export-adv-tool-websearch">网页搜索 (web_search)</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-repl"><label for="cpm-export-adv-tool-repl">代码分析 (repl)</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-artifacts"><label for="cpm-export-adv-tool-artifacts">工件创建 (artifacts)</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-other"><label for="cpm-export-adv-tool-other">其他未知工具</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-only-successful"><label for="cpm-export-adv-tool-only-successful">仅保留成功的工具调用</label></div>
                    </div>
                </div>
            `;
        },
        getExportSettings(container) {
            return {
                metadata: {
                    include: container.querySelector('#cpm-export-meta-include').checked,
                    title: container.querySelector('#cpm-export-meta-title').checked,
                    summary: container.querySelector('#cpm-export-meta-summary').checked,
                    main_timestamps: container.querySelector('#cpm-export-meta-main-timestamps').checked,
                    conv_settings: container.querySelector('#cpm-export-meta-conv-settings').checked,
                },
                message: {
                    sender: container.querySelector('#cpm-export-msg-sender').checked,
                    uuids: container.querySelector('#cpm-export-msg-uuids').checked,
                    other_meta: container.querySelector('#cpm-export-msg-other-meta').checked,
                    timestamps: {
                        messageNode: container.querySelector('#cpm-export-ts-message').checked,
                        contentBlock: container.querySelector('#cpm-export-ts-content').checked,
                        attachment: container.querySelector('#cpm-export-ts-attachment').checked,
                    }
                },
                content: {
                    text: container.querySelector('#cpm-export-content-text').checked,
                },
                attachments: {
                    mode: container.querySelector('#cpm-export-attachments-mode').value,
                },
                advanced: {
                    thinking: container.querySelector('#cpm-export-adv-thinking').checked,
                    tools: {
                        include: container.querySelector('#cpm-export-adv-tools-include').checked,
                        web_search: container.querySelector('#cpm-export-adv-tool-websearch').checked,
                        repl: container.querySelector('#cpm-export-adv-tool-repl').checked,
                        artifacts: container.querySelector('#cpm-export-adv-tool-artifacts').checked,
                        other: container.querySelector('#cpm-export-adv-tool-other').checked,
                        onlySuccessful: container.querySelector('#cpm-export-adv-tool-only-successful').checked,
                    }
                }
            };
        },
        loadExportSettings(container) {
            const prefix = 'exportDefault_';
            const settings = {
                metadata: {
                    include: GM_getValue(`${prefix}meta_include`, true), title: GM_getValue(`${prefix}meta_title`, true),
                    summary: GM_getValue(`${prefix}meta_summary`, false), main_timestamps: GM_getValue(`${prefix}meta_main_timestamps`, false),
                    conv_settings: GM_getValue(`${prefix}meta_conv_settings`, false),
                },
                message: {
                    sender: GM_getValue(`${prefix}msg_sender`, true), uuids: GM_getValue(`${prefix}msg_uuids`, true),
                    other_meta: GM_getValue(`${prefix}msg_other_meta`, false),
                    timestamps: {
                         messageNode: GM_getValue(`${prefix}ts_message`, false),
                         contentBlock: GM_getValue(`${prefix}ts_content`, false),
                         attachment: GM_getValue(`${prefix}ts_attachment`, false),
                    }
                },
                content: { text: GM_getValue(`${prefix}content_text`, true) },
                attachments: { mode: GM_getValue(`${prefix}attachments_mode`, 'full') },
                advanced: {
                    thinking: GM_getValue(`${prefix}adv_thinking`, true),
                    tools: {
                        include: GM_getValue(`${prefix}adv_tools_include`, true), web_search: GM_getValue(`${prefix}adv_tool_websearch`, true),
                        repl: GM_getValue(`${prefix}adv_tool_repl`, true), artifacts: GM_getValue(`${prefix}adv_tool_artifacts`, true),
                        other: GM_getValue(`${prefix}adv_tool_other`, true), onlySuccessful: GM_getValue(`${prefix}adv_tool_only_successful`, false),
                    }
                }
            };

            container.querySelector('#cpm-export-meta-include').checked = settings.metadata.include;
            container.querySelector('#cpm-export-meta-title').checked = settings.metadata.title;
            container.querySelector('#cpm-export-meta-summary').checked = settings.metadata.summary;
            container.querySelector('#cpm-export-meta-main-timestamps').checked = settings.metadata.main_timestamps;
            container.querySelector('#cpm-export-meta-conv-settings').checked = settings.metadata.conv_settings;
            container.querySelector('#cpm-export-msg-sender').checked = settings.message.sender;
            container.querySelector('#cpm-export-msg-uuids').checked = settings.message.uuids;
            container.querySelector('#cpm-export-msg-other-meta').checked = settings.message.other_meta;
            container.querySelector('#cpm-export-ts-message').checked = settings.message.timestamps.messageNode;
            container.querySelector('#cpm-export-ts-content').checked = settings.message.timestamps.contentBlock;
            container.querySelector('#cpm-export-ts-attachment').checked = settings.message.timestamps.attachment;
            container.querySelector('#cpm-export-content-text').checked = settings.content.text;
            container.querySelector('#cpm-export-attachments-mode').value = settings.attachments.mode;
            container.querySelector('#cpm-export-adv-thinking').checked = settings.advanced.thinking;
            container.querySelector('#cpm-export-adv-tools-include').checked = settings.advanced.tools.include;
            container.querySelector('#cpm-export-adv-tool-websearch').checked = settings.advanced.tools.web_search;
            container.querySelector('#cpm-export-adv-tool-repl').checked = settings.advanced.tools.repl;
            container.querySelector('#cpm-export-adv-tool-artifacts').checked = settings.advanced.tools.artifacts;
            container.querySelector('#cpm-export-adv-tool-other').checked = settings.advanced.tools.other;
            container.querySelector('#cpm-export-adv-tool-only-successful').checked = settings.advanced.tools.onlySuccessful;
        },
        saveExportSettings(container) {
             const settings = this.getExportSettings(container);
             const prefix = 'exportDefault_';
             GM_setValue(`${prefix}meta_include`, settings.metadata.include);
             GM_setValue(`${prefix}meta_title`, settings.metadata.title);
             GM_setValue(`${prefix}meta_summary`, settings.metadata.summary);
             GM_setValue(`${prefix}meta_main_timestamps`, settings.metadata.main_timestamps);
             GM_setValue(`${prefix}meta_conv_settings`, settings.metadata.conv_settings);
             GM_setValue(`${prefix}msg_sender`, settings.message.sender);
             GM_setValue(`${prefix}msg_uuids`, settings.message.uuids);
             GM_setValue(`${prefix}msg_other_meta`, settings.message.other_meta);
             GM_setValue(`${prefix}ts_message`, settings.message.timestamps.messageNode);
             GM_setValue(`${prefix}ts_content`, settings.message.timestamps.contentBlock);
             GM_setValue(`${prefix}ts_attachment`, settings.message.timestamps.attachment);
             GM_setValue(`${prefix}content_text`, settings.content.text);
             GM_setValue(`${prefix}attachments_mode`, settings.attachments.mode);
             GM_setValue(`${prefix}adv_thinking`, settings.advanced.thinking);
             GM_setValue(`${prefix}adv_tools_include`, settings.advanced.tools.include);
             GM_setValue(`${prefix}adv_tool_websearch`, settings.advanced.tools.web_search);
             GM_setValue(`${prefix}adv_tool_repl`, settings.advanced.tools.repl);
             GM_setValue(`${prefix}adv_tool_artifacts`, settings.advanced.tools.artifacts);
             GM_setValue(`${prefix}adv_tool_other`, settings.advanced.tools.other);
             GM_setValue(`${prefix}adv_tool_only_successful`, settings.advanced.tools.onlySuccessful);
        },
        setupSubOptionDisabling(container) {
            const setupListener = (parentId, subGroupSelector) => {
                const parentCheckbox = container.querySelector(parentId);
                const subItems = container.querySelectorAll(subGroupSelector);
                if (!parentCheckbox || subItems.length === 0) return;

                const updateState = () => {
                    const isDisabled = !parentCheckbox.checked;
                    subItems.forEach(item => {
                        item.querySelectorAll('input, select').forEach(el => el.disabled = isDisabled);
                        item.classList.toggle('disabled', isDisabled);
                    });
                };
                parentCheckbox.addEventListener('change', updateState);
                updateState();
            };

            setupListener('#cpm-export-meta-include', '.cpm-setting-sub-group[data-parent="meta-include"] .cpm-setting-item');
            setupListener('#cpm-export-adv-tools-include', '.cpm-setting-sub-group[data-parent="adv-tools-include"] .cpm-setting-item');
        },
        showExportModal(uuid) {
            document.querySelector('.cpm-modal-overlay')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'cpm-modal-overlay';

            const modalContent = document.createElement('div');
            modalContent.className = 'cpm-panel cpm-export-modal-content';
            modalContent.style.display = 'flex';
            modalContent.innerHTML = `
                <div class="cpm-header"><h2>自定义导出选项</h2><button class="cpm-close-button cpm-icon-btn">×</button></div>
                <div class="cpm-settings-content">
                    ${this.createExportSettingsHTML(false)}
                </div>
                <div class="cpm-settings-buttons">
                    <button id="cpm-export-now-btn" class="cpm-btn cpm-primary-btn">立即导出</button>
                </div>
            `;
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);

            this.loadExportSettings(modalContent);
            this.setupSubOptionDisabling(modalContent);

            overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
            modalContent.querySelector('.cpm-close-button').onclick = () => overlay.remove();
            modalContent.querySelector('#cpm-export-now-btn').onclick = async () => {
                const currentSettings = this.getExportSettings(modalContent);
                modalContent.querySelector('#cpm-export-now-btn').disabled = true;
                modalContent.querySelector('#cpm-export-now-btn').textContent = '正在导出...';
                await ManagerService.performExportCustom(uuid, currentSettings, this.updateStatus.bind(this));
                overlay.remove();
            };
        }
    };


    // =========================================================================
    // 8. 聊天增强模块 (Enhancer Modules)
    // =========================================================================
    const BranchEnhancer = {
        state: { conversationUUID: null, selectedParentMessageUUID: null },
        init() {
            this.cleanup();
            this.createBranchButton();
        },
        updateState(currentUrl) {
            const pathParts = new URL(currentUrl).pathname.split('/');
            this.state.conversationUUID = (pathParts[1] === 'chat' && pathParts[2]) ? pathParts[2] : null;
            if (!this.state.conversationUUID) this.state.selectedParentMessageUUID = null;
            this.updateStatusIndicator();
        },
        createBranchButton() {
            if (document.getElementById('cpm-branch-btn')) return;
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            if (!toolbar) return;
            const emptyArea = toolbar.querySelector(Config.EMPTY_AREA_SELECTOR);
            if (!emptyArea) return;

            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = "relative shrink-0";
            const button = document.createElement('button');
            button.id = 'cpm-branch-btn';
            button.type = 'button';
            button.title = '从对话历史的任意节点继续';
            button.className = "inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-0.5 transition-all h-8 min-w-8 rounded-lg flex items-center px-[7.5px] group !pointer-events-auto !outline-offset-1 text-text-300 border-border-300 active:scale-[0.98] hover:text-text-200/90 hover:bg-bg-100";
            button.innerHTML = `<div class="flex flex-row items-center justify-center gap-1"><svg class="cpm-svg-icon" style="width:16px; height:16px; stroke-width:1.8;"><use href="#cpm-icon-tree"></use></svg></div>`;
            button.onclick = () => this.showModal();
            wrapperDiv.appendChild(button);
            toolbar.insertBefore(wrapperDiv, emptyArea);
        },
        async showModal() {
            const overlay = document.createElement('div');
            overlay.className = 'cpm-modal-overlay';
            overlay.onclick = () => overlay.remove();

            const modalContent = document.createElement('div');
            modalContent.className = 'cpm-panel cpm-tree-panel-override';
            modalContent.style.display = 'flex';
            modalContent.onclick = (e) => e.stopPropagation();
            modalContent.innerHTML = `
                <div class="cpm-header"><h2>选择一个分支起点</h2><button id="cpm-branch-modal-close-btn" class="cpm-icon-btn">×</button></div>
                <div id="cpm-branch-tree-container" class="cpm-tree-container"></div>`;

            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            overlay.querySelector('#cpm-branch-modal-close-btn').onclick = () => overlay.remove();

            const treeContainer = modalContent.querySelector('#cpm-branch-tree-container');
            if (this.state.conversationUUID) {
                treeContainer.innerHTML = '<p class="cpm-loading">正在加载对话历史...</p>';
                try {
                    const historyData = await ClaudeAPI.getConversationHistory(this.state.conversationUUID);
                    await SharedLogic.renderTreeView(treeContainer, historyData.chat_messages, {
                        isForBranching: true,
                        onNodeClick: (uuid, element) => this.selectBranchPoint(uuid, element)
                    });
                } catch (error) {
                    treeContainer.innerHTML = `<p class="cpm-error">加载失败: ${error.message}</p>`;
                }
            } else {
                treeContainer.innerHTML = '<p class="cpm-loading">不在具体聊天内，无法从任何节点延续。</p>';
            }
        },
        selectBranchPoint(uuid, element) {
            this.state.selectedParentMessageUUID = uuid;
            document.querySelectorAll('.cpm-branch-node-selected').forEach(n => n.classList.remove('cpm-branch-node-selected'));
            element.classList.add('cpm-branch-node-selected');
            this.updateStatusIndicator();
            setTimeout(() => document.querySelector('.cpm-modal-overlay')?.remove(), 300);
        },
        updateStatusIndicator() {
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            if (!toolbar) return;
            document.getElementById('cpm-branch-status-indicator')?.remove();
            if (this.state.selectedParentMessageUUID) {
                const indicator = document.createElement('span');
                indicator.id = 'cpm-branch-status-indicator';
                indicator.textContent = '分支点已选定';
                indicator.title = `下条消息将从指定节点开始。\nUUID: ${this.state.selectedParentMessageUUID}`;
                toolbar.appendChild(indicator);
            }
        },
        cleanup() {
            document.querySelector('#cpm-branch-btn')?.closest('div.relative.shrink-0').remove();
            document.getElementById('cpm-branch-status-indicator')?.remove();
        }
    };

    const AttachmentEnhancer = {
        state: {
            forceUploadMode: 'default',
            stagedAttachments: [],
        },
        panelObserver: null,

        init() {
            this.cleanup();
            this.createAttachmentPowerButton();
            if (this.state.stagedAttachments.length > 0) {
                this.showPreviewPanel();
            }
        },

        createAttachmentPowerButton() {
            if (document.getElementById('cpm-attachment-power-btn')) return;
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            const emptyArea = toolbar?.querySelector(Config.EMPTY_AREA_SELECTOR);
            if (!toolbar || !emptyArea) return;

            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = "relative shrink-0";
            wrapperDiv.innerHTML = `
                <button class="inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-0.5 transition-all h-8 min-w-8 rounded-lg flex items-center px-[7.5px] group !pointer-events-auto !outline-offset-1 text-text-300 border-border-300 active:scale-[0.98] hover:text-text-200/90 hover:bg-bg-100" type="button" id="cpm-attachment-power-btn" aria-label="打开PDF上传设置">
                    <div class="flex flex-row items-center justify-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></div>
                </button>
                <div class="w-[24rem] absolute max-w-[calc(100vw-16px)] top-10 block hidden" id="cpm-attachment-power-menu">
                    <div class="relative w-full will-change-transform h-auto overflow-y-auto overscroll-auto flex z-dropdown bg-bg-000 rounded-lg overflow-hidden border-border-300 border-0.5 shadow-diffused shadow-[hsl(var(--always-black)/6%)] flex-col-reverse" style="max-height: 340px;">
                        <div class="flex flex-col min-h-0 w-full !ease-out justify-end" style="height: auto;">
                            <div class="w-full">
                                <div class="p-1.5 flex flex-col">
                                    <button class="group flex w-full items-center text-left gap-2.5 py-auto px-1.5 text-[0.875rem] text-text-200 rounded-md transition-colors select-none active:!scale-100 hover:bg-bg-200/50 hover:text-text-000 h-[2rem]">
                                        <div id="cpm-dynamic-icon-container" class="group/icon min-w-4 min-h-4 flex items-center justify-center text-text-300 shrink-0 group-hover:text-text-100">
                                            <div id="cpm-icon-mode-off"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></div>
                                            <div id="cpm-icon-mode-on" class="hidden"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></div>
                                        </div>
                                        <div class="flex flex-col flex-1 min-w-0"><p class="text-[0.9375rem] text-text-300 group-hover:text-text-100">Force PDF Deep Analysis</p></div>
                                        <div class="flex items-center justify-center text-text-400" title="此功能为普通账户设计，可强制使用高级解析路径。Pro/Team账户原生支持，此开关对其无效。"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg></div>
                                        <div class="group/switch relative select-none cursor-pointer ml-2">
                                            <input class="peer sr-only" type="checkbox" id="cpm-attachment-mode-toggle-switch">
                                            <div class="border-border-300 rounded-full peer:can-focus peer-disabled:opacity-50 bg-bg-500 transition-colors peer-checked:bg-accent-secondary-100" style="width: 28px; height: 16px;"></div>
                                            <div class="absolute start-[2px] top-[2px] rounded-full transition-all peer-checked:translate-x-full rtl:peer-checked:-translate-x-full group-hover/switch:opacity-80 bg-white transition" style="height: 12px; width: 12px;"></div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            toolbar.insertBefore(wrapperDiv, emptyArea);
            this.setupEventListeners();
        },

        updateSubPanelIcon(isForceMode) {
            document.getElementById('cpm-icon-mode-off')?.classList.toggle('hidden', isForceMode);
            document.getElementById('cpm-icon-mode-on')?.classList.toggle('hidden', !isForceMode);
        },

        setupEventListeners() {
            const triggerBtn = document.getElementById('cpm-attachment-power-btn');
            const menu = document.getElementById('cpm-attachment-power-menu');
            const toggleSwitch = document.getElementById('cpm-attachment-mode-toggle-switch');
            if (!triggerBtn || !menu || !toggleSwitch) return;

            const isInitialForceMode = (this.state.forceUploadMode === 'force');
            toggleSwitch.checked = isInitialForceMode;
            this.updateSubPanelIcon(isInitialForceMode);

            triggerBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); });

            const buttonInsideMenu = menu.querySelector('button.group');
            buttonInsideMenu.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                toggleSwitch.checked = !toggleSwitch.checked;
                toggleSwitch.dispatchEvent(new Event('change'));
            });

            toggleSwitch.addEventListener('change', () => {
                const isForceMode = toggleSwitch.checked;
                this.state.forceUploadMode = isForceMode ? 'force' : 'default';
                this.updateSubPanelIcon(isForceMode);
                console.log(LOG_PREFIX, `强制PDF深度解析模式已: ${isForceMode ? '开启' : '关闭'}`);
            });
            document.addEventListener('click', (e) => {
                if (!menu.classList.contains('hidden') && !triggerBtn.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
        },

        getOrCreatePreviewPanel() {
            let panel = document.getElementById(Config.ATTACHMENT_PANEL_ID);
            if (!panel) {
                panel = document.createElement('div');
                panel.id = Config.ATTACHMENT_PANEL_ID;
                panel.innerHTML = `
                    <div class="cpm-attachment-panel-header">
                        <span>PDF深度解析暂存区</span>
                        <button class="cpm-icon-btn cpm-attachment-panel-close-btn" title="关闭并清空所有暂存文件">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></svg>
                        </button>
                    </div>
                    <div class="cpm-attachment-panel-content"></div>`;
                document.body.appendChild(panel);

                panel.querySelector('.cpm-attachment-panel-close-btn').onclick = () => this.clearAndHidePanel();
                panel.addEventListener('click', (e) => {
                    const deleteBtn = e.target.closest('.cpm-preview-delete-btn');
                    if (!deleteBtn) return;
                    e.preventDefault(); e.stopPropagation();
                    const uuidToDelete = deleteBtn.dataset.uuid;
                    this.removeStagedFile(uuidToDelete);
                });

                this.panelObserver = new MutationObserver((mutations) => {
                    if (!document.getElementById(Config.ATTACHMENT_PANEL_ID)) {
                        this.clearStagedFiles();
                        this.panelObserver.disconnect();
                        this.panelObserver = null;
                        console.log(LOG_PREFIX, "暂存面板已从DOM移除，自动清空暂存文件。");
                    }
                });
                this.panelObserver.observe(document.body, { childList: true });
            }
            return panel;
        },

        showPreviewPanel() {
            const panel = this.getOrCreatePreviewPanel();
            void panel.offsetWidth;
            panel.classList.add('visible');
        },

        hidePreviewPanel() {
            const panel = document.getElementById(Config.ATTACHMENT_PANEL_ID);
            if (panel) {
                panel.classList.remove('visible');
                const transitionEndHandler = () => {
                    if (!panel.classList.contains('visible')) {
                        panel.remove();
                    }
                    panel.removeEventListener('transitionend', transitionEndHandler);
                };
                panel.addEventListener('transitionend', transitionEndHandler);
            }
        },

        addFileToPanel(fileInfo) {
            this.showPreviewPanel();
            const content = this.getOrCreatePreviewPanel().querySelector('.cpm-attachment-panel-content');
            if (!content) return;
            const previewUrl = `/api/${fileInfo.org_uuid}/files/${fileInfo.uuid}/document_pdf/${encodeURIComponent(fileInfo.fileName)}`;
            const wrapper = document.createElement('div');
            wrapper.className = 'cpm-preview-thumbnail-wrapper';
            wrapper.id = `thumbnail-wrapper-${fileInfo.uuid}`;
            wrapper.innerHTML = `
                <button class="cpm-preview-delete-btn" data-uuid="${fileInfo.uuid}" title="移除文件">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></svg>
                </button>
                <a href="${previewUrl}" target="_blank" rel="noopener noreferrer" class="cpm-preview-thumbnail-link" title="点击预览: ${fileInfo.fileName}">
                    <img src="${fileInfo.thumbnailUrl}" alt="${fileInfo.fileName}">
                    <div class="cpm-preview-thumbnail-overlay">
                        <p class="cpm-preview-thumbnail-name">${fileInfo.fileName}</p>
                    </div>
                </a>`;
            content.appendChild(wrapper);
        },

        clearStagedFiles() {
            if (this.state.stagedAttachments.length > 0) {
                 console.log(LOG_PREFIX, `正在清空 ${this.state.stagedAttachments.length} 个暂存文件。`);
                 this.state.stagedAttachments = [];
            }
        },

        clearAndHidePanel() {
            this.clearStagedFiles();
            this.hidePreviewPanel();
        },

        removeStagedFile(uuid) {
            const index = this.state.stagedAttachments.findIndex(f => f.uuid === uuid);
            if (index > -1) {
                const fileName = this.state.stagedAttachments[index].fileName;
                this.state.stagedAttachments.splice(index, 1);
                console.log(LOG_PREFIX, `文件已从暂存区移除: ${fileName}`);
                document.getElementById(`thumbnail-wrapper-${uuid}`)?.remove();
                if (this.state.stagedAttachments.length === 0) {
                    this.hidePreviewPanel();
                }
            }
        },

        schedulePanelClosure(delay = 3000) {
             setTimeout(() => {
                const panel = document.getElementById(Config.ATTACHMENT_PANEL_ID);
                if (panel) this.hidePreviewPanel();
            }, delay);
        },

        shouldForceUpload(fileName) {
            if (!fileName || typeof fileName !== 'string') return false;
            const ext = ('.' + fileName.split('.').pop()).toLowerCase();
            return Config.FORCE_UPLOAD_TARGET_EXTENSIONS.includes(ext) && this.state.forceUploadMode === 'force';
        },

        cleanup() {
            document.querySelector('#cpm-attachment-power-btn')?.closest('div.relative.shrink-0').remove();
            this.hidePreviewPanel();
            if (this.panelObserver) {
                this.panelObserver.disconnect();
                this.panelObserver = null;
            }
        }
    };


    // =========================================================================
    // 9. 核心拦截与启动模块
    // =========================================================================
    const App = {
        lastUrl: '',
        observer: null,
        init() {
            ThemeManager.init();
            this.installFetchInterceptor();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startObserver());
            } else {
                this.startObserver();
            }
        },
        installFetchInterceptor() {
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                let url = args[0] instanceof Request ? args[0].url : String(args[0]);
                let options = args[1] || {};

                if (url.includes('/convert_document') && options.body instanceof FormData) {
                    const file = Array.from(options.body.values()).find(v => v instanceof File);
                    if (file && AttachmentEnhancer.shouldForceUpload(file.name)) {
                        console.groupCollapsed(`%c${LOG_PREFIX} [劫持] 强制PDF深度解析...`, 'color: #ef4444; font-weight: bold;');
                        const orgUuidMatch = url.match(/\/api\/organizations\/(.*?)\/convert_document/);
                        if (orgUuidMatch) {
                            const org_uuid = orgUuidMatch[1];
                            const uploadUrl = `/api/${org_uuid}/upload`;
                             originalFetch(uploadUrl, options)
                                .then(res => res.ok ? res.json() : Promise.reject(`后台上传失败: ${res.statusText}`))
                                .then(uploadResult => {
                                    if (uploadResult.file_uuid && uploadResult.thumbnail_asset?.url) {
                                        const fileInfo = {
                                            uuid: uploadResult.file_uuid,
                                            fileName: uploadResult.file_name,
                                            org_uuid: org_uuid,
                                            thumbnailUrl: uploadResult.thumbnail_asset.url
                                        };
                                        AttachmentEnhancer.state.stagedAttachments.push(fileInfo);
                                        AttachmentEnhancer.addFileToPanel(fileInfo);
                                        console.log('后台 /upload 强制上传成功并已暂存:', fileInfo.fileName);
                                    }
                                }).catch(error => console.error(`${LOG_PREFIX} 后台 /upload 任务失败:`, error))
                                .finally(() => console.groupEnd());
                        } else {
                            console.error(`${LOG_PREFIX} 无法从URL中提取组织UUID。`);
                            console.groupEnd();
                        }
                        return Promise.resolve(new Response(JSON.stringify({}), { status: 200, statusText: "OK (Handled by Enhancer)" }));
                    }
                }

                if (url.includes('/completion') && (AttachmentEnhancer.state.stagedAttachments.length > 0 || BranchEnhancer.state.selectedParentMessageUUID)) {
                    console.groupCollapsed(`%c${LOG_PREFIX} 请求注入: 正在处理/completion...`, 'color: #8b5cf6; font-weight: bold;');
                    if (options.body && typeof options.body === 'string') {
                        try {
                            const payload = JSON.parse(options.body);

                            if (AttachmentEnhancer.state.stagedAttachments.length > 0) {
                                console.log(`执行附件注入... (${AttachmentEnhancer.state.stagedAttachments.length}个文件)`);
                                const hijackedFileNames = AttachmentEnhancer.state.stagedAttachments.map(att => att.fileName);
                                if (payload.attachments) { payload.attachments = payload.attachments.filter(att => !hijackedFileNames.includes(att.file_name)); }
                                const fileUuidsToInject = AttachmentEnhancer.state.stagedAttachments.map(att => att.uuid);
                                if (!payload.files) payload.files = [];
                                fileUuidsToInject.forEach(uuid => { if (!payload.files.includes(uuid)) payload.files.push(uuid); });

                                AttachmentEnhancer.clearStagedFiles();
                                AttachmentEnhancer.schedulePanelClosure();
                                console.log("附件注入完成，暂存区已清空。");
                            }

                            if (BranchEnhancer.state.selectedParentMessageUUID) {
                                console.log("执行分支注入...");
                                payload.parent_message_uuid = BranchEnhancer.state.selectedParentMessageUUID;
                                BranchEnhancer.state.selectedParentMessageUUID = null;
                                setTimeout(() => BranchEnhancer.updateStatusIndicator(), 0);
                                console.log("分支注入完成。");
                            }

                            options.body = JSON.stringify(payload);
                        } catch (e) { console.error(LOG_PREFIX, "修改/completion请求体失败:", e);
                        } finally { console.groupEnd(); }
                    }
                }

                return originalFetch.apply(this, args);
            };
        },
        startObserver() {
            this.observer = new MutationObserver(() => this.onPageChange());
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.onPageChange();
        },
        onPageChange() {
            const currentUrl = location.href;
            if (currentUrl === this.lastUrl && document.getElementById('cpm-manager-button')) {
                if(document.querySelector(Config.TOOLBAR_SELECTOR) && !document.getElementById('cpm-branch-btn')) {
                    this.setupEnhancers(currentUrl);
                }
                return;
            }
            this.lastUrl = currentUrl;
            console.log(LOG_PREFIX, "URL变更或初次加载，执行页面设置。");

            ManagerUI.init();
            this.setupEnhancers(currentUrl);

            if (AttachmentEnhancer.state.stagedAttachments.length > 0) {
                 AttachmentEnhancer.showPreviewPanel();
            } else {
                 AttachmentEnhancer.hidePreviewPanel();
            }
        },
        setupEnhancers(currentUrl) {
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            if (toolbar) {
                BranchEnhancer.init();
                AttachmentEnhancer.init();
                BranchEnhancer.updateState(currentUrl);
            } else {
                BranchEnhancer.cleanup();
                AttachmentEnhancer.cleanup();
            }
        }
    };


    // =========================================================================
    // 10. CSS 样式 (全部整合)
    // =========================================================================
    GM_addStyle(`
        /* --- THEME VARIABLES --- */
        body[cpm-theme='light'] {
            --cpm-bg-000: 0 0% 100%; --cpm-bg-100: 48 33.3% 97.1%; --cpm-bg-200: 53 28.6% 94.5%; --cpm-bg-300: 48 25% 92.2%; --cpm-bg-400: 50 20.7% 88.6%; --cpm-bg-500: 50 20.7% 88.6%;
            --cpm-text-000: 60 2.6% 7.6%; --cpm-text-100: 60 2.6% 7.6%; --cpm-text-200: 60 2.5% 23.3%; --cpm-text-300: 60 2.5% 23.3%; --cpm-text-400: 51 3.1% 43.7%; --cpm-text-500: 51 3.1% 43.7%;
            --cpm-border-100: 30 3.3% 11.8%; --cpm-border-200: 30 3.3% 11.8%; --cpm-border-300: 45 8.3% 84.1%; --cpm-border-400: 30 3.3% 11.8%;
            --cpm-accent-brand: 15 63.1% 59.6%; --cpm-accent-secondary-100: 210 70.9% 51.6%; --cpm-accent-pro-100: 251 40% 45.1%;
            --cpm-danger-000: 0 72.2% 50.6%; --cpm-danger-100: 0 58.6% 34.1%; --cpm-success-000: 145 58% 34%; --cpm-oncolor-100: 0 0% 100%;
            --cpm-highlight-orange: 31 56% 61%; --cpm-brand-orange-base: 19 58% 55%; --cpm-always-black: 0 0% 0%;
            --cpm-sender-you-color: #15803d; --cpm-sender-claude-color: #1d4ed8;
            --cpm-branch-hover-bg: rgba(93, 93, 255, 0.2); --cpm-branch-selected-bg: #43a047; --cpm-branch-selected-text: white;
        }
        body[cpm-theme='dark'] {
            --cpm-bg-000: 60 2.1% 18.4%; --cpm-bg-100: 60 2.7% 14.5%; --cpm-bg-200: 30 3.3% 11.8%; --cpm-bg-300: 60 2.6% 7.6%; --cpm-bg-400: 60 3.4% 5.7%; --cpm-bg-500: 60 3.4% 5.7%;
            --cpm-text-000: 48 33.3% 97.1%; --cpm-text-100: 48 33.3% 97.1%; --cpm-text-200: 50 9% 73.7%; --cpm-text-300: 50 9% 73.7%; --cpm-text-400: 48 4.8% 59.2%; --cpm-text-500: 48 4.8% 59.2%;
            --cpm-border-100: 51 16.5% 84.5%; --cpm-border-200: 51 16.5% 84.5%; --cpm-border-300: 51 16.5% 84.5%; --cpm-border-400: 51 16.5% 84.5%;
            --cpm-accent-brand: 15 63.1% 59.6%; --cpm-accent-secondary-100: 210 70.9% 51.6%; --cpm-accent-pro-100: 251 40.2% 54.1%;
            --cpm-danger-000: 0 73.1% 66.5%; --cpm-danger-100: 0 58.6% 34.1%; --cpm-success-000: 145 63% 52%; --cpm-oncolor-100: 0 0% 100%;
            --cpm-highlight-orange: 31 56% 61%; --cpm-brand-orange-base: 19 58% 55%; --cpm-always-black: 0 0% 0%;
            --cpm-sender-you-color: #81c784; --cpm-sender-claude-color: #82aaff;
            --cpm-branch-hover-bg: rgba(93, 93, 255, 0.4); --cpm-branch-selected-bg: #2a9d8f; --cpm-branch-selected-text: white;
        }

        /* --- SHARED & BASE --- */
        .cpm-svg-icon { width: 1.1em; height: 1.1em; display: inline-block; vertical-align: middle; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        #cpm-manager-button { position: fixed; bottom: 18px; right: 18px; z-index: 9998; background-color: hsl(var(--cpm-brand-orange-base)); color: hsl(var(--cpm-oncolor-100)); border: none; border-radius: 8px; padding: 4px 8px; font-size: 16px; font-weight: 600; font-family: sans-serif; cursor: pointer; letter-spacing: 0.2px; box-shadow: 0 4px 12px hsla(var(--cpm-text-000), 0.15); transition: all 0.2s ease-in-out; }
        #cpm-manager-button:hover { box-shadow: 0 8px 20px hsla(var(--cpm-text-000), 0.2); transform: scale(1.05) rotate(-1deg); }
        #cpm-manager-button:active { box-shadow: 0 2px 5px hsla(var(--cpm-text-000), 0.15); transform: scale(0.98); transition-duration: 0.1s; }

        /* --- PANELS & MODALS --- */
        .cpm-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80vw; max-width: 800px; height: 80vh; background-color: hsl(var(--cpm-bg-100)); color: hsl(var(--cpm-text-200)); border: 1px solid hsl(var(--cpm-border-300)); border-radius: 12px; z-index: 9999; box-shadow: 0 10px 25px hsla(var(--cpm-text-000), 0.2); flex-direction: column; font-family: sans-serif; transition: background-color 0.3s, color 0.3s; }
        .cpm-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: hsla(var(--cpm-text-000), 0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; }
        .cpm-export-modal-content { max-width: 600px; height: auto; max-height: 90vh; }
        .cpm-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid hsl(var(--cpm-border-200)); flex-shrink: 0; }
        .cpm-header h2 { margin: 0; font-size: 18px; color: hsl(var(--cpm-text-100)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cpm-header-actions { display: flex; align-items: center; gap: 8px; }
        .cpm-icon-btn { background: none; border: none; color: hsl(var(--cpm-text-400)); font-size: 1.1em; cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.2s, background-color 0.2s; line-height: 1; display:flex; align-items:center; justify-content:center; }
        .cpm-icon-btn:hover { color: hsl(var(--cpm-text-100)); background-color: hsl(var(--cpm-bg-200)); }

        /* --- MANAGER UI --- */
        .cpm-toolbar { display: flex; flex-wrap: wrap; gap: 15px; padding: 12px 20px; background-color: hsl(var(--cpm-bg-200)); border-bottom: 1px solid hsl(var(--cpm-border-200)); align-items: center; flex-shrink: 0; }
        .cpm-toolbar-group { display: flex; align-items: center; gap: 8px; }
        .cpm-toolbar input, .cpm-toolbar select { background-color: hsl(var(--cpm-bg-000)); color: hsl(var(--cpm-text-100)); border: 1px solid hsl(var(--cpm-border-300)); border-radius: 4px; padding: 4px 8px; }
        .cpm-btn, .cpm-action-btn { background-color: hsl(var(--cpm-bg-400)); color: hsl(var(--cpm-text-100)); border: 1px solid hsl(var(--cpm-border-300)); border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: background-color 0.2s, border-color 0.2s; }
        .cpm-btn:hover, .cpm-action-btn:hover { background-color: hsl(var(--cpm-bg-500)); }
        .cpm-actions { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px 20px; align-items: center; flex-shrink: 0; }
        .cpm-action-btn { padding: 8px 14px; }
        .cpm-action-btn:disabled { background-color: hsl(var(--cpm-bg-300)); cursor: not-allowed; opacity: 0.6; }
        .cpm-danger-btn { background-color: hsla(var(--cpm-danger-100), 0.8); border-color: hsl(var(--cpm-danger-100)); }
        .cpm-danger-btn:hover { background-color: hsl(var(--cpm-danger-100)); }
        #cpm-refresh { margin-left: auto; }
        .cpm-list-container { flex-grow: 1; overflow-y: auto; padding: 0 5px 0 20px; border-top: 1px solid hsl(var(--cpm-border-200)); }
        .cpm-loading, .cpm-error, .cpm-list-container p { color: hsl(var(--cpm-text-300)); text-align: center; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .cpm-convo-list { list-style: none; padding: 0; margin: 0; }
        .cpm-convo-list li { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid hsl(var(--cpm-border-200)); transition: background-color 0.2s; }
        .cpm-convo-list li:not(.is-editing):hover { background-color: hsl(var(--cpm-bg-200)); }
        .cpm-checkbox { margin-right: 15px; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
        .cpm-convo-details { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; min-width: 0; }
        .cpm-convo-title { font-size: 15px; color: hsl(var(--cpm-text-100)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s ease; }
        .cpm-star { color: #facc15; margin-right: 5px; }
        .cpm-convo-date { font-size: 12px; color: hsl(var(--cpm-text-400)); }
        .cpm-convo-actions { display: flex; gap: 5px; padding: 0 10px; }
        .cpm-action-save { color: hsl(var(--cpm-success-000)) !important; }
        .cpm-action-cancel { color: hsl(var(--cpm-danger-000)) !important; }
        .cpm-status-bar { padding: 8px 20px; border-top: 1px solid hsl(var(--cpm-border-200)); font-size: 12px; color: hsl(var(--cpm-text-400)); text-align: right; flex-shrink: 0; transition: color 0.3s; }
        .cpm-status-bar.is-error { color: hsl(var(--cpm-danger-000)); }
        .cpm-status-bar.is-success { color: hsl(var(--cpm-success-000)); }
        .cpm-highlight { color: hsl(var(--cpm-accent-brand)); font-weight: bold; background-color: hsla(var(--cpm-accent-brand), 0.1); }
        .cpm-edit-input { width: 100%; background-color: hsl(var(--cpm-bg-200)); border: 1px solid hsl(var(--cpm-border-300)); border-radius: 4px; color: hsl(var(--cpm-text-100)); padding: 4px 8px; font-size: 15px; line-height: 1.5; box-sizing: border-box; }
        .cpm-edit-input:focus { outline: none; border-color: hsl(var(--cpm-accent-brand)); }
        li.is-editing .cpm-convo-details { padding-top: 2px; padding-bottom: 2px; }

        /* --- SETTINGS PANEL --- */
        .cpm-settings-content { padding: 20px; overflow-y: auto; background-color: hsl(var(--cpm-bg-000)); flex-grow: 1; }
        .cpm-setting-section { margin-bottom: 25px; border-bottom: 1px solid hsl(var(--cpm-border-200)); padding-bottom: 15px; }
        .cpm-setting-section:last-of-type { border-bottom: none; }
        .cpm-setting-section-title { margin-top: 0; padding-bottom: 15px; color: hsl(var(--cpm-text-100)); font-size: 16px; font-weight: 600; }
        .cpm-setting-group { margin-bottom: 15px; }
        .cpm-setting-group h4 { color: hsl(var(--cpm-text-300)); font-size: 14px; margin-bottom: 10px; }
        .cpm-setting-sub-group { padding-left: 20px; border-left: 2px solid hsl(var(--cpm-bg-200)); margin-top: 10px; }
        .cpm-setting-item { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
        .cpm-setting-item label { color: hsl(var(--cpm-text-200)); cursor: pointer; }
        .cpm-settings-label { width: 150px; text-align: right; flex-shrink: 0; }
        .cpm-setting-item input[type="text"], .cpm-setting-item input[type="number"], .cpm-setting-item select { background-color: hsl(var(--cpm-bg-100)); border: 1px solid hsl(var(--cpm-border-300)); color: hsl(var(--cpm-text-100)); border-radius: 4px; padding: 8px; flex-grow: 1; }
        .cpm-setting-item input[type="checkbox"] { width: 16px; height: 16px; }
        .cpm-setting-item.disabled { opacity: 0.5; }
        .cpm-setting-item.disabled label { cursor: not-allowed; }
        .cpm-settings-buttons { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
        .cpm-settings-buttons .cpm-btn { padding: 10px 20px; color: hsl(var(--cpm-oncolor-100)); border: none; border-radius: 6px; cursor: pointer; }
        #cpm-back-to-main { background-color: hsl(var(--cpm-bg-400)); }
        #cpm-save-settings-button, #cpm-export-now-btn { background-color: hsl(var(--cpm-accent-secondary-100)); }
        #cpm-export-now-btn:disabled { background-color: hsl(var(--cpm-bg-300)); cursor: not-allowed; }

        /* --- TREE VIEW --- */
        .cpm-tree-panel-override { width: 90vw; max-width: 1200px; height: 90vh; }
        .cpm-tree-container { flex-grow: 1; overflow-y: auto; padding: 20px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 14px; background-color: hsl(var(--cpm-bg-200)); }
        .cpm-tree-node { margin-bottom: 10px; border-radius: 6px; }
        .cpm-tree-node-header { margin: 0 0 5px 0; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 4px; }
        .cpm-tree-node-id { color: hsl(var(--cpm-text-400)); font-size: 12px; flex-shrink: 0; }
        .cpm-tree-node-sender { font-weight: bold; flex-shrink: 0; }
        .sender-you { color: var(--cpm-sender-you-color); }
        .sender-claude { color: var(--cpm-sender-claude-color); }
        .cpm-tree-node-preview { color: hsl(var(--cpm-text-200)); word-break: break-all; }
        .cpm-tree-attachments { color: hsl(var(--cpm-text-300)); font-size: 12px; padding-left: 20px; }
        .cpm-tree-attachments ul { list-style: none; padding-left: 10px; margin: 5px 0 0 0; }
        .cpm-tree-attachments li { margin-bottom: 4px; }
        .cpm-attachment-source { color: hsl(var(--cpm-accent-pro-100)); margin: 0 5px; font-style: italic; }
        .cpm-attachment-details { color: hsl(var(--cpm-text-400)); }
        .cpm-attachment-url { color: hsl(var(--cpm-accent-secondary-100)); text-decoration: none; }
        .cpm-attachment-url:hover { text-decoration: underline; }

        /* --- ENHANCER-SPECIFIC STYLES --- */
        #cpm-branch-status-indicator { background-color: var(--cpm-branch-selected-bg); color: var(--cpm-branch-selected-text); padding: 2px 8px; font-size: 12px; border-radius: 12px; margin-left: 8px; font-weight: 500; animation: cpm-fadeIn 0.3s ease; }
        @keyframes cpm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        #cpm-branch-from-root-btn { border: 1px dashed hsl(var(--cpm-border-300)); padding: 10px; margin-bottom: 20px; text-align: center; font-weight: bold; color: hsl(var(--cpm-text-200)); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .cpm-branch-node-clickable { cursor: pointer; transition: background-color 0.2s; }
        .cpm-branch-node-clickable:hover, #cpm-branch-from-root-btn:hover { background-color: var(--cpm-branch-hover-bg); }
        .cpm-branch-node-selected, #cpm-branch-from-root-btn.cpm-branch-node-selected { background-color: var(--cpm-branch-selected-bg) !important; color: var(--cpm-branch-selected-text) !important; }
        .cpm-branch-node-selected .cpm-tree-node-sender, .cpm-branch-node-selected .cpm-tree-node-preview, .cpm-branch-node-selected .cpm-tree-node-id { color: var(--cpm-branch-selected-text) !important; }
        #cpm-attachment-power-menu .bg-bg-000 { background-color: hsl(var(--cpm-bg-000)); }
        #cpm-attachment-power-menu .text-text-200 { color: hsl(var(--cpm-text-200)); }
        #cpm-attachment-power-menu .text-text-300 { color: hsl(var(--cpm-text-300)); }
        #cpm-attachment-power-menu .hover\\:bg-bg-200\\/50:hover { background-color: hsl(var(--cpm-bg-200) / 0.5); }
        #cpm-attachment-power-menu .hover\\:text-text-000:hover { color: hsl(var(--cpm-text-000)); }
        #cpm-attachment-power-menu .group-hover\\:text-text-100:hover { color: hsl(var(--cpm-text-100)); }
        #cpm-attachment-power-menu .bg-bg-500 { background-color: hsl(var(--cpm-bg-500)); }
        #cpm-attachment-mode-toggle-switch:checked + div { background-color: hsl(var(--cpm-accent-secondary-100)) !important; }

        /* --- ATTACHMENT PREVIEW PANEL --- */
        #cpm-attachment-preview-panel {
            position: fixed; right: 20px; bottom: 80px; width: 320px; max-height: 480px;
            background-color: hsl(var(--cpm-bg-100));
            border: 0.5px solid hsl(var(--cpm-border-300));
            border-radius: 12px; box-shadow: 0 10px 25px -5px hsla(var(--cpm-always-black), 0.1), 0 8px 10px -6px hsla(var(--cpm-always-black), 0.1);
            z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
            opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease-out, transform 0.4s ease-out;
            pointer-events: none;
        }
        #cpm-attachment-preview-panel.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .cpm-attachment-panel-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 8px 8px 12px; font-weight: 600; font-size: 14px; color: hsl(var(--cpm-text-300));
            border-bottom: 0.5px solid hsl(var(--cpm-border-200)); flex-shrink: 0;
        }
        .cpm-attachment-panel-content { padding: 12px; display: flex; flex-wrap: wrap; gap: 12px; overflow-y: auto; justify-content: center; }
        .cpm-preview-thumbnail-wrapper {
            position: relative;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            border-radius: 8px;
            box-shadow: 0 1px 3px 0 hsla(var(--cpm-always-black), 0.08);
        }
        .cpm-preview-thumbnail-wrapper:hover {
            transform: scale(1.04);
            z-index: 10;
            box-shadow: 0 8px 16px hsla(var(--cpm-always-black), 0.15);
        }
        .cpm-preview-thumbnail-link {
            display: block;
            width: 112px;
            height: 160px;
            border-radius: 8px;
            overflow: hidden;
            border: 0.5px solid hsla(var(--cpm-border-300), 0.5);
            text-decoration: none;
            position: relative;
            background-color: hsl(var(--cpm-bg-300));
        }
        .cpm-preview-thumbnail-link img { width: 100%; height: 100%; object-fit: cover; }
        .cpm-preview-thumbnail-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, hsla(var(--cpm-always-black), 0.8), transparent); padding: 12px 6px 6px; text-align: center; }
        .cpm-preview-thumbnail-name { color: white; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cpm-preview-delete-btn {
            position: absolute;
            top: -8px;
            left: -8px;
            width: 20px;
            height: 20px;
            background-color: hsla(var(--cpm-bg-000), 0.9);
            color: hsl(var(--cpm-text-400));
            border: 0.5px solid hsla(var(--cpm-border-200), 0.25);
            border-radius: 50%;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transform: scale(0.8);
            transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
            z-index: 20;
        }
        .cpm-preview-thumbnail-wrapper:hover .cpm-preview-delete-btn {
            opacity: 1;
            transform: scale(1);
        }
        .cpm-preview-delete-btn:hover {
            background-color: hsla(var(--cpm-bg-200), 0.95);
            color: hsl(var(--cpm-text-100));
        }
        .cpm-preview-delete-btn svg {
            width: 12px;
            height: 12px;
        }
    `);


    // =========================================================================
    // 11. 辅助工具 & 启动脚本
    // =========================================================================
    String.prototype.rsplit = function(sep, maxsplit) {
        const split = this.split(sep);
        return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
    };

    App.init();

})(unsafeWindow);