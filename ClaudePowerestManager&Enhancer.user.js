// ==UserScript==
// @name         ClaudePowerestManager&Enhancer
// @name:zh-CN   Claude神级拓展增强脚本
// @namespace    http://tampermonkey.net/
// @version      1.2.2
// @description  一站式搜索、筛选、批量管理所有对话。强大的JSON导出(原始/自定义/含附件)。为聊天框注入新功能，如从任意消息分支、跨分支全局导航、强制PDF深度解析、浮动线性导航面板等。
// @description:zh-CN [管理器] 右下角打开管理器面板开启一站式搜索、筛选、批量管理所有对话。强大的JSON导出(原始/自定义/含附件)。[增强器]为聊天框注入新功能，如从任意消息分支、跨分支全局导航、强制PDF深度解析、浮动线性导航面板等。
// @description:en [Manager] Opens a management panel in the bottom-right corner for one-stop searching, filtering, and batch management of all conversations. Powerful JSON export (raw/custom/with attachments). [Enhancer] Injects new features into the chat interface, such as branching from any message, cross-branch navigation, forced deep PDF parsing, floating linear navigation panel, and more.
// @author       f14xuanlv
// @license      MIT
// @homepageURL  https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer
// @supportURL   https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer/issues
// @match        https://claude.ai/*
// @include      /^https:\/\/.*\.fuclaude\.[a-z]{3}\/.*$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=claude.ai
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function(window) {
    'use strict';

    const LOG_PREFIX = "[ClaudePowerestManager&Enhancer v1.2.2]:"
    console.log(LOG_PREFIX, "脚本已加载。");


    // 全局HTML转义函数 - 统一的转义实现
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

    // 全局字符串分割工具函数 - 避免原型污染
    function rsplit(str, sep, maxsplit) {
        const split = str.split(sep);
        return maxsplit ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit)) : split;
    }

    // =========================================================================
    // 0. 国际化配置和翻译函数
    // =========================================================================
    const I18N_CONFIG = {
        currentLang: GM_getValue('language', 'zh'),
        translations: {
            zh: {
                // Manager 相关
                'manager.title': 'Manager',
                'manager.refresh': '刷新列表',
                'manager.selectAll': '全选',
                'manager.selectNone': '全不选',
                'manager.selectInvert': '反选',
                'manager.batchStar': '批量收藏',
                'manager.batchUnstar': '批量取消收藏',
                'manager.batchRename': '批量自动重命名',
                'manager.batchDelete': '批量删除',
                'manager.loading': '正在加载会话列表...',
                'manager.noResults': '没有符合条件的会话。',
                'manager.ready': '准备就绪。',
                'manager.refreshButtonTip': '点击刷新按钮 ( <svg class="cpm-svg-icon"><use href="#cpm-icon-refresh"></use></svg> ) 加载会话列表。',

                // Settings 相关
                'settings.title': '管理器设置',
                'settings.theme': '外观设置',
                'settings.themeMode': '脚本主题:',
                'settings.themeAuto': '跟随网站',
                'settings.themeLight': '锁定白天',
                'settings.themeDark': '锁定黑夜',
                'settings.batchOps': '批量操作设置',
                'settings.exportDefaults': '自定义导出默认设置',
                'settings.save': '保存设置',
                'settings.saved': '设置已保存！',
                'settings.backToMain': '返回主面板',
                'settings.language': '语言设置',
                'settings.interfaceLanguage': '界面语言:',

                // Navigator 相关
                'navigator.title': '对话节点延续&导航器',
                'navigator.branchMode': '延续模式',
                'navigator.navigateMode': '导航模式',
                'navigator.branchSelected': '分支点已选定',
                'navigator.loading': '正在加载对话历史...',
                'navigator.branchFromRoot': '从根节点开始 (创建一个新的主分支)',

                // Linear Navigator 相关
                'linear.title': '线性导航',
                'linear.refresh': '刷新对话列表',
                'linear.close': '关闭线性导航',
                'linear.top': '回到顶部',
                'linear.bottom': '回到底部',
                'linear.prev': '上一条',
                'linear.next': '下一条',
                'linear.empty': '暂无线性对话',

                // Attachment 相关
                'attachment.title': 'PDF深度解析暂存区',
                'attachment.forceMode': 'Force PDF Deep Analysis',
                'attachment.close': '关闭并清空所有暂存文件',

                // Export 相关
                'export.original': '原始JSON导出',
                'export.custom': '自定义JSON导出',
                'export.batchOriginal': '批量原始JSON导出',
                'export.batchCustom': '批量自定义JSON导出',
                'export.selectFolder': '正在请求文件夹权限...',
                'export.complete': '导出完成！',

                // Tree view 相关
                'tree.preview': '对话树预览',
                'tree.loading': '正在加载对话树...',
                'tree.empty': '这是一个空对话',
                'tree.emptyForBranching': '，无法选择节点',

                // Common 相关
                'common.confirm': '确定',
                'common.cancel': '取消',
                'common.close': '关闭',
                'common.save': '保存',
                'common.loading': '加载中...',
                'common.error': '错误',
                'common.success': '成功',
                'common.failed': '失败',

                // Sorting & Filtering
                'sort.updatedDesc': '时间降序',
                'sort.updatedAsc': '时间升序',
                'sort.nameAsc': '名称 A-Z',
                'sort.nameDesc': '名称 Z-A',
                'filter.all': '显示全部',
                'filter.starred': '仅显示收藏',
                'filter.unstarred': '隐藏收藏',
                'filter.asciiOnly': '仅显示纯ASCII标题',
                'filter.nonAscii': '不显示纯ASCII标题',

                // Button tooltips
                'tooltip.managerButton': 'Tips: Ctrl + M 可以隐藏此按钮',
                'tooltip.navigatorButton': '从对话历史的任意节点延续&导航至任意节点',
                'tooltip.linearNavButton': '线性导航',
                'tooltip.pdfButton': '打开PDF上传设置',
                'tooltip.pdfHelp': '此功能为普通账户设计，可强制使用高级解析路径。Pro/Team账户原生支持，此开关对其无效。',
                'tooltip.settingsButton': '设置',
                'tooltip.githubLink': '查看 GitHub 仓库',
                'tooltip.studioLink': '了解下一个项目: claude-dialog-tree-studio',
                'pdf.forceModeText': 'Force PDF Deep Analysis',

                // Toolbar labels
                'toolbar.sort': '排序:',
                'toolbar.filter': '筛选:',
                'toolbar.searchPlaceholder': '搜索标题...',

                // Batch operations detailed settings
                'batchOps.starUnstar': '批量收藏/取消收藏',
                'batchOps.refreshAfterStar': '操作后从服务器刷新列表 (否则仅更新当前视图)',
                'batchOps.batchDelete': '批量删除',
                'batchOps.refreshAfterDelete': '操作后从服务器刷新列表 (否则仅更新当前视图)',
                'batchOps.autoRename': '批量自动重命名',
                'batchOps.titleLanguage': '标题语言:',
                'batchOps.titleLanguagePlaceholder': '例如：中文, English, 日本語',
                'batchOps.maxRounds': '使用对话轮数 (最多):',
                'batchOps.refreshAfterRename': '操作后从服务器刷新列表 (否则仅更新当前视图)',

                // Export settings
                'exportSettings.customOptions': '自定义导出选项',
                'exportSettings.batchCustomOptions': '批量自定义导出选项',
                'exportSettings.exportNow': '立即导出',
                'exportSettings.batchExportNow': '开始批量导出',
                'exportSettings.basicInfo': '基础信息',
                'exportSettings.messageStructure': '消息结构',
                'exportSettings.timestampInfo': '时间戳信息',
                'exportSettings.coreContent': '核心内容',
                'exportSettings.advancedContent': '高级内容',
                'exportSettings.keepMetadata': '保留会话元数据',
                'exportSettings.title': '标题 (name)',
                'exportSettings.summary': '摘要 (summary)',
                'exportSettings.sessionTimestamp': '会话创建/更新时间',
                'exportSettings.sessionSettings': '会话设置 (settings)',
                'exportSettings.sender': '发送者 (sender)',
                'exportSettings.messageUuids': '消息/父级UUID (建议保留)',
                'exportSettings.otherMeta': '其他元数据 (index, stop_reason等)',
                'exportSettings.messageTimestamp': '消息节点时间戳 (created_at/updated_at)',
                'exportSettings.contentTimestamp': '内容块流式时间戳 (start/stop)',
                'exportSettings.attachmentTimestamp': '附件创建时间戳',
                'exportSettings.textContent': '文本内容 (text块)',
                'exportSettings.attachmentInfo': '附件信息:',
                'exportSettings.attachmentFull': '完整信息 (含提取文本)',
                'exportSettings.attachmentMetaOnly': '仅元数据 (文件名,大小等)',
                'exportSettings.attachmentNone': '不保留附件',
                'exportSettings.thinkingProcess': "'思考'过程 (thinking块)",
                'exportSettings.toolRecords': '保留工具使用记录',
                'exportSettings.webSearch': '网页搜索 (web_search)',
                'exportSettings.codeAnalysis': '代码分析 (repl)',
                'exportSettings.artifactCreation': '工件创建 (artifacts)',
                'exportSettings.otherTools': '其他未知工具',
                'exportSettings.successfulOnly': '仅保留成功的工具调用',

                // Export status messages
                'exportStatus.customComplete': '自定义导出完成！',
                'exportStatus.customFailed': '自定义导出失败',
                'exportStatus.batchPreparing': '准备批量自定义导出',
                'exportStatus.batchComplete': '批量自定义导出完成',
                'exportStatus.sessions': '个会话',

                // Action button tooltips
                'action.manualRename': '手动重命名',
                'action.previewTree': '预览对话树',
                'action.originalExport': '原始JSON导出',
                'action.customExport': '自定义JSON导出',

                // Status messages
                'status.savingTitle': '正在保存新标题...',
                'status.saveSuccess': '保存成功！',
                'status.saveFailed': '保存失败',
                'status.loadedSessions': '已加载',
                'status.loadSessionsFailed': '加载会话失败',
                'status.loadFailed': '加载失败',

                // Error messages
                'error.cannotLoadTree': '无法加载对话树',

                // Tree view related
                'treeView.prefix': '对话树: ',
                'treeView.untitled': '无标题',
                'treeView.loading': '加载中...',
                'treeView.loadFailed': '无法加载对话树',

                // Additional status and error messages
                'error.invalidTitle': '生成了无效标题。',
                'error.loadSessionsFailed': '加载会话失败',
                'error.selectSessions': '请选择要执行"{0}"的会话。',
                'error.selectExportSessions': '请选择要导出的会话。',
                'error.browserNotSupported': '您的浏览器不支持 File System Access API。',
                'status.refreshingFromServer': ' 正在从服务器刷新列表...',
                'status.preparingExport': '准备导出...',
                'status.exporting': '正在导出...',
                'status.ready': '准备就绪。',
                'navigator.loadingHistory': '正在加载对话历史...',
                'navigator.notInChat': '不在具体聊天内，无法操作节点。',
                'attachment.title': 'PDF深度解析暂存区',
                'attachment.removeFile': '移除文件',
                'attachment.clickPreview': '点击预览',
                'attachment.openInNewTab': '点击在新标签页打开',
                'navigator.clickToNavigate': '点击导航到此节点',
                'navigator.clickToContinue': '点击从此节点继续对话',
                'navigator.nextMessageFrom': '下条消息将从指定节点开始。',
                'batchOps.confirmDelete': '确定永久删除 {0} 个会话吗？',
                'status.batchProcessing': '正在批量{0} {1} 个会话...',
                'status.batchItemProcessing': '正在{0} {1}/{2}...',
                'status.batchItemFailed': '第{0}个失败',
                'status.batchOperationComplete': '操作完成。成功{0} {1}/{2} 个会话。',
                'status.batchOperationFailed': '批量{0}失败',
                'status.batchExportPreparing': '准备批量导出 {0} 个会话...',
                'status.batchExportFailed': '批量导出失败',
                'status.exportFailed': '导出失败',
                'status.checkingFile': '检查文件 {0} 出错',
                'status.writingFile': '正在写入 {0}...',
                'status.convertingData': '正在根据设置转换数据...',

                // Export related messages
                'export.foundAttachments': '发现 {0} 个附件，开始下载...',
                'export.cannotGetOrgInfo': '无法获取组织信息以下载附件。',
                'export.skipExistingFile': '({0}/{1}) 跳过 (文件已存在): {2}',
                'export.downloading': '({0}/{1}) 正在下载: {2}',
                'export.noDownloadUrl': '找不到附件的下载链接。',
                'export.processAttachmentFailed': '处理附件 {0} 失败',
                'export.requestingFolder': '正在请求文件夹权限...',
                'export.userCancelled': '用户取消了文件夹选择。',
                'export.orgInfoRequired': '缺少导出所需组织信息。',
                'export.creatingDirectory': '正在创建目录...',
                'export.originalComplete': '原始导出完成！',
                'export.originalFailed': '原始导出失败',
                'export.customFailed': '自定义导出失败',
                'export.batchComplete': '批量导出完成: {0}/{1} 个会话成功导出。',
                'export.exportFailed': '导出失败 ({0}/{1}): {2}',
                'export.exportingProgress': '({0}/{1}) 正在导出: {2}',
                'export.sessionFailed': '导出会话 {0} 失败',

                // API error messages
                'api.orgRequestFailed': '组织API请求失败: {0}',
                'api.orgInfoNotFound': '在API响应中未找到组织信息。',
                'api.getSessionsFailed': '获取会话列表失败: {0}',
                'api.getHistoryFailed': '获取历史记录失败: {0}',
                'api.deleteRequestFailed': '删除API请求失败: {0}',
                'api.titleGenerationFailed': '标题生成API请求失败。',
                'api.updateSessionFailed': '更新会话失败: {0}',
                'api.fileDownloadFailed': '文件下载失败: {0} at {1}',

                // Tree view and content messages
                'tree.attachmentOrToolOnly': '[仅包含附件或工具使用]',
                'tree.attachments': '附件',
                'tree.dirtyData': '脏数据',
                'error.checkingFile': '检查文件 {0} 时发生意外错误',
                'error.noValidTextContent': '在指定轮次内未找到有效文本内容。',
                'error.insufficientRounds': '对话轮次不足(可能为空对话)，跳过重命名。',
                'error.cannotGetConvoData': '无法获取对话数据',

                // Operation names
                'operation.rename': '重命名',
                'operation.delete': '删除',
                'operation.star': '收藏',
                'operation.unstar': '取消收藏'
            },

            en: {
                // Manager related
                'manager.title': 'Manager',
                'manager.refresh': 'Refresh List',
                'manager.selectAll': 'Select All',
                'manager.selectNone': 'Select None',
                'manager.selectInvert': 'Invert Selection',
                'manager.batchStar': 'Batch Star',
                'manager.batchUnstar': 'Batch Unstar',
                'manager.batchRename': 'Batch Auto Rename',
                'manager.batchDelete': 'Batch Delete',
                'manager.loading': 'Loading conversations...',
                'manager.noResults': 'No conversations match the criteria.',
                'manager.ready': 'Ready.',
                'manager.refreshButtonTip': 'Click refresh button ( <svg class="cpm-svg-icon"><use href="#cpm-icon-refresh"></use></svg> ) to load conversation list.',

                // Settings related
                'settings.title': 'Manager Settings',
                'settings.theme': 'Appearance Settings',
                'settings.themeMode': 'Script Theme:',
                'settings.themeAuto': 'Follow Website',
                'settings.themeLight': 'Lock Light',
                'settings.themeDark': 'Lock Dark',
                'settings.batchOps': 'Batch Operations Settings',
                'settings.exportDefaults': 'Custom Export Default Settings',
                'settings.save': 'Save Settings',
                'settings.saved': 'Settings saved!',
                'settings.backToMain': 'Back to Main Panel',
                'settings.language': 'Language Settings',
                'settings.interfaceLanguage': 'Interface Language:',

                // Navigator related
                'navigator.title': 'Dialog Node Continuation & Navigator',
                'navigator.branchMode': 'Branch Mode',
                'navigator.navigateMode': 'Navigate Mode',
                'navigator.branchSelected': 'Branch point selected',
                'navigator.loading': 'Loading conversation history...',
                'navigator.branchFromRoot': 'Start from root node (create a new main branch)',

                // Linear Navigator related
                'linear.title': 'Linear Navigation',
                'linear.refresh': 'Refresh Dialog List',
                'linear.close': 'Close Linear Navigation',
                'linear.top': 'Go to Top',
                'linear.bottom': 'Go to Bottom',
                'linear.prev': 'Previous',
                'linear.next': 'Next',
                'linear.empty': 'No linear dialogs',

                // Attachment related
                'attachment.title': 'PDF Deep Analysis Staging Area',
                'attachment.forceMode': 'Force PDF Deep Analysis',
                'attachment.close': 'Close and clear all staged files',

                // Export related
                'export.original': 'Original JSON Export',
                'export.custom': 'Custom JSON Export',
                'export.batchOriginal': 'Batch Original JSON Export',
                'export.batchCustom': 'Batch Custom JSON Export',
                'export.selectFolder': 'Requesting folder permission...',
                'export.complete': 'Export completed!',

                // Tree view related
                'tree.preview': 'Dialog Tree Preview',
                'tree.loading': 'Loading dialog tree...',
                'tree.empty': 'This is an empty conversation',
                'tree.emptyForBranching': ', cannot select nodes',

                // Common related
                'common.confirm': 'Confirm',
                'common.cancel': 'Cancel',
                'common.close': 'Close',
                'common.save': 'Save',
                'common.loading': 'Loading...',
                'common.error': 'Error',
                'common.success': 'Success',
                'common.failed': 'Failed',

                // Sorting & Filtering
                'sort.updatedDesc': 'Time Desc',
                'sort.updatedAsc': 'Time Asc',
                'sort.nameAsc': 'Name A-Z',
                'sort.nameDesc': 'Name Z-A',
                'filter.all': 'Show All',
                'filter.starred': 'Show Starred Only',
                'filter.unstarred': 'Hide Starred',
                'filter.asciiOnly': 'ASCII Titles Only',
                'filter.nonAscii': 'Non-ASCII Titles Only',

                // Button tooltips
                'tooltip.managerButton': 'Tips: Ctrl + M to hide this button',
                'tooltip.navigatorButton': 'Branch from any message node & navigate to any node',
                'tooltip.linearNavButton': 'Linear Navigation',
                'tooltip.pdfButton': 'Open PDF upload settings',
                'tooltip.pdfHelp': 'This feature is designed for regular accounts to force advanced parsing. Pro/Team accounts natively support this, so this toggle has no effect.',
                'tooltip.settingsButton': 'Settings',
                'tooltip.githubLink': 'View GitHub Repository',
                'tooltip.studioLink': 'Learn about next project: claude-dialog-tree-studio',
                'pdf.forceModeText': 'Force PDF Deep Analysis',

                // Toolbar labels
                'toolbar.sort': 'Sort:',
                'toolbar.filter': 'Filter:',
                'toolbar.searchPlaceholder': 'Search titles...',

                // Batch operations detailed settings
                'batchOps.starUnstar': 'Batch Star/Unstar',
                'batchOps.refreshAfterStar': 'Refresh list from server after operation (otherwise only update current view)',
                'batchOps.batchDelete': 'Batch Delete',
                'batchOps.refreshAfterDelete': 'Refresh list from server after operation (otherwise only update current view)',
                'batchOps.autoRename': 'Batch Auto Rename',
                'batchOps.titleLanguage': 'Title Language:',
                'batchOps.titleLanguagePlaceholder': 'e.g.: 中文, English, 日本語',
                'batchOps.maxRounds': 'Max Conversation Rounds:',
                'batchOps.refreshAfterRename': 'Refresh list from server after operation (otherwise only update current view)',

                // Export settings
                'exportSettings.customOptions': 'Custom Export Options',
                'exportSettings.batchCustomOptions': 'Batch Custom Export Options',
                'exportSettings.exportNow': 'Export Now',
                'exportSettings.batchExportNow': 'Start Batch Export',
                'exportSettings.basicInfo': 'Basic Information',
                'exportSettings.messageStructure': 'Message Structure',
                'exportSettings.timestampInfo': 'Timestamp Information',
                'exportSettings.coreContent': 'Core Content',
                'exportSettings.advancedContent': 'Advanced Content',
                'exportSettings.keepMetadata': 'Keep conversation metadata',
                'exportSettings.title': 'Title (name)',
                'exportSettings.summary': 'Summary (summary)',
                'exportSettings.sessionTimestamp': 'Session creation/update time',
                'exportSettings.sessionSettings': 'Session settings (settings)',
                'exportSettings.sender': 'Sender (sender)',
                'exportSettings.messageUuids': 'Message/Parent UUIDs (recommended to keep)',
                'exportSettings.otherMeta': 'Other metadata (index, stop_reason, etc.)',
                'exportSettings.messageTimestamp': 'Message node timestamps (created_at/updated_at)',
                'exportSettings.contentTimestamp': 'Content block streaming timestamps (start/stop)',
                'exportSettings.attachmentTimestamp': 'Attachment creation timestamps',
                'exportSettings.textContent': 'Text content (text blocks)',
                'exportSettings.attachmentInfo': 'Attachment Information:',
                'exportSettings.attachmentFull': 'Full information (including extracted text)',
                'exportSettings.attachmentMetaOnly': 'Metadata only (filename, size, etc.)',
                'exportSettings.attachmentNone': 'No attachments',
                'exportSettings.thinkingProcess': "'Thinking' process (thinking blocks)",
                'exportSettings.toolRecords': 'Keep tool usage records',
                'exportSettings.webSearch': 'Web search (web_search)',
                'exportSettings.codeAnalysis': 'Code analysis (repl)',
                'exportSettings.artifactCreation': 'Artifact creation (artifacts)',
                'exportSettings.otherTools': 'Other unknown tools',
                'exportSettings.successfulOnly': 'Keep only successful tool calls',

                // Export status messages
                'exportStatus.customComplete': 'Custom export completed!',
                'exportStatus.customFailed': 'Custom export failed',
                'exportStatus.batchPreparing': 'Preparing batch custom export',
                'exportStatus.batchComplete': 'Batch custom export completed',
                'exportStatus.sessions': 'sessions',

                // Action button tooltips
                'action.manualRename': 'Manual Rename',
                'action.previewTree': 'Preview Dialog Tree',
                'action.originalExport': 'Original JSON Export',
                'action.customExport': 'Custom JSON Export',

                // Status messages
                'status.savingTitle': 'Saving new title...',
                'status.saveSuccess': 'Saved successfully!',
                'status.saveFailed': 'Save failed',
                'status.loadedSessions': 'Loaded',
                'status.loadSessionsFailed': 'Failed to load conversations',
                'status.loadFailed': 'Load failed',

                // Error messages
                'error.cannotLoadTree': 'Cannot load conversation tree',

                // Tree view related
                'treeView.prefix': 'Dialog Tree: ',
                'treeView.untitled': 'Untitled',
                'treeView.loading': 'Loading...',
                'treeView.loadFailed': 'Failed to load dialog tree',

                // Additional status and error messages
                'error.invalidTitle': 'Generated invalid title.',
                'error.loadSessionsFailed': 'Failed to load sessions',
                'error.selectSessions': 'Please select sessions to execute "{0}".',
                'error.selectExportSessions': 'Please select sessions to export.',
                'error.browserNotSupported': 'Your browser does not support File System Access API.',
                'status.refreshingFromServer': ' Refreshing from server...',
                'status.preparingExport': 'Preparing export...',
                'status.exporting': 'Exporting...',
                'status.ready': 'Ready.',
                'navigator.loadingHistory': 'Loading conversation history...',
                'navigator.notInChat': 'Not in a specific chat, cannot operate on nodes.',
                'attachment.title': 'PDF Deep Analysis Staging Area',
                'attachment.removeFile': 'Remove file',
                'attachment.clickPreview': 'Click to preview',
                'attachment.openInNewTab': 'Click to open in new tab',
                'navigator.clickToNavigate': 'Click to navigate to this node',
                'navigator.clickToContinue': 'Click to continue from this node',
                'navigator.nextMessageFrom': 'Next message will start from the specified node.',
                'batchOps.confirmDelete': 'Are you sure to permanently delete {0} conversations?',
                'status.batchProcessing': 'Batch {0} {1} conversations...',
                'status.batchItemProcessing': '{0} {1}/{2}...',
                'status.batchItemFailed': 'Item {0} failed',
                'status.batchOperationComplete': 'Operation completed. Successfully {0} {1}/{2} conversations.',
                'status.batchOperationFailed': 'Batch {0} failed',
                'status.batchExportPreparing': 'Preparing batch export for {0} conversations...',
                'status.batchExportFailed': 'Batch export failed',
                'status.exportFailed': 'Export failed',
                'status.checkingFile': 'Error checking file {0}',
                'status.writingFile': 'Writing {0}...',
                'status.convertingData': 'Converting data according to settings...',

                // Export related messages
                'export.foundAttachments': 'Found {0} attachments, starting download...',
                'export.cannotGetOrgInfo': 'Cannot get organization info for downloading attachments.',
                'export.skipExistingFile': '({0}/{1}) Skip (file exists): {2}',
                'export.downloading': '({0}/{1}) Downloading: {2}',
                'export.noDownloadUrl': 'Cannot find download link for attachment.',
                'export.processAttachmentFailed': 'Failed to process attachment {0}',
                'export.requestingFolder': 'Requesting folder permissions...',
                'export.userCancelled': 'User cancelled folder selection.',
                'export.orgInfoRequired': 'Organization info required for export.',
                'export.creatingDirectory': 'Creating directory...',
                'export.originalComplete': 'Original export completed!',
                'export.originalFailed': 'Original export failed',
                'export.customFailed': 'Custom export failed',
                'export.batchComplete': 'Batch export completed: {0}/{1} conversations exported successfully.',
                'export.exportFailed': 'Export failed ({0}/{1}): {2}',
                'export.exportingProgress': '({0}/{1}) Exporting: {2}',
                'export.sessionFailed': 'Failed to export session {0}',

                // API error messages
                'api.orgRequestFailed': 'Organization API request failed: {0}',
                'api.orgInfoNotFound': 'Organization info not found in API response.',
                'api.getSessionsFailed': 'Failed to get sessions: {0}',
                'api.getHistoryFailed': 'Failed to get history: {0}',
                'api.deleteRequestFailed': 'Delete API request failed: {0}',
                'api.titleGenerationFailed': 'Title generation API request failed.',
                'api.updateSessionFailed': 'Failed to update session: {0}',
                'api.fileDownloadFailed': 'File download failed: {0} at {1}',

                // Tree view and content messages
                'tree.attachmentOrToolOnly': '[Contains only attachments or tool usage]',
                'tree.attachments': 'Attachments',
                'tree.dirtyData': 'Dirty Data',
                'error.checkingFile': 'Unexpected error checking file {0}',
                'error.noValidTextContent': 'No valid text content found within specified rounds.',
                'error.insufficientRounds': 'Insufficient conversation rounds (possibly empty conversation), skipping rename.',
                'error.cannotGetConvoData': 'Cannot get conversation data',

                // Operation names
                'operation.rename': 'rename',
                'operation.delete': 'delete',
                'operation.star': 'star',
                'operation.unstar': 'unstar'
            }
        }
    };

    // 翻译函数
    function t(key, fallback = key, ...params) {
        const lang = I18N_CONFIG.currentLang;
        const translations = I18N_CONFIG.translations[lang];
        let text = translations && translations[key] ? translations[key] : (fallback || key);

        // 支持参数替换 {0}, {1}, {2}...
        if (params.length > 0) {
            for (let i = 0; i < params.length; i++) {
                text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), params[i]);
            }
        }

        return text;
    }



    // =========================================================================
    // 1. 全局配置
    // =========================================================================
    const Config = {
        INITIAL_PARENT_UUID: "00000000-0000-4000-8000-000000000000",
        TOOLBAR_SELECTOR: 'div.relative.flex-1.flex.items-center.gap-2.shrink.min-w-0',
        EMPTY_AREA_SELECTOR: 'div.flex.flex-row.items-center.gap-2.min-w-0',
        FORCE_UPLOAD_TARGET_EXTENSIONS: [".pdf"],
        ContentExtractorHandler: [".docx", ".rtf", ".epub", ".odt", ".odp"],
        ATTACHMENT_PANEL_ID: 'cpm-attachment-preview-panel',
        EXPORT_MODAL_ID: 'cpm-export-modal',
        URL_GITHUB_REPO: 'https://github.com/f14XuanLv/Claude-Powerest-Manager_Enhancer',
        URL_STUDIO_REPO: 'https://github.com/f14XuanLv/claude-dialog-tree-studio',
        maxPreviewLength: 16,
        refreshInterval: 150,
        topMargin: 200,
        STORAGE_KEY: 'cpm-ln-panel-state'
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
        title: t('settings.theme'),
        render() {
            return `
                <div class="cpm-setting-group">
                    <div class="cpm-setting-item">
                        <label for="cpm-theme-mode" class="cpm-settings-label">${t('settings.themeMode')}</label>
                        <select id="cpm-theme-mode">
                            <option value="auto">${t('settings.themeAuto')}</option>
                            <option value="light">${t('settings.themeLight')}</option>
                            <option value="dark">${t('settings.themeDark')}</option>
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
        title: t('settings.batchOps'),
        render() {
            return `
                <div class="cpm-setting-group">
                    <h4>${t('batchOps.starUnstar')}</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-star"><label for="cpm-refresh-after-star">${t('batchOps.refreshAfterStar')}</label></div>
                </div>
                <div class="cpm-setting-group">
                    <h4>${t('batchOps.batchDelete')}</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-delete"><label for="cpm-refresh-after-delete">${t('batchOps.refreshAfterDelete')}</label></div>
                </div>
                <div class="cpm-setting-group">
                    <h4>${t('batchOps.autoRename')}</h4>
                    <div class="cpm-setting-item"><label for="cpm-rename-lang" class="cpm-settings-label">${t('batchOps.titleLanguage')}</label><input type="text" id="cpm-rename-lang" placeholder="${t('batchOps.titleLanguagePlaceholder')}"></div>
                    <div class="cpm-setting-item"><label for="cpm-rename-rounds" class="cpm-settings-label">${t('batchOps.maxRounds')}</label><input type="number" id="cpm-rename-rounds" min="1" max="10" step="1"></div>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-refresh-after-rename"><label for="cpm-refresh-after-rename">${t('batchOps.refreshAfterRename')}</label></div>
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
        title: t('settings.exportDefaults'),
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

    // --- 2.4 语言设置模块 ---
    const LanguageSettingsModule = {
        id: 'language',
        title: t('settings.language'),
        render() {
            return `
                <div class="cpm-setting-group">
                    <div class="cpm-setting-item">
                        <label for="cpm-language-select" class="cpm-settings-label">${t('settings.interfaceLanguage')}</label>
                        <select id="cpm-language-select">
                            <option value="zh">简体中文</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            `;
        },
        load(container) {
            const langSelect = container.querySelector('#cpm-language-select');
            if (langSelect) {
                langSelect.value = I18N_CONFIG.currentLang;
            }
        },
        save(container) {
            const langSelect = container.querySelector('#cpm-language-select');
            if (langSelect) {
                const newLang = langSelect.value;
                if (newLang !== I18N_CONFIG.currentLang) {
                    I18N_CONFIG.currentLang = newLang;
                    GM_setValue('language', newLang);
                    // 重新加载界面
                    setTimeout(() => {
                        location.reload();
                    }, 500);
                }
            }
        }
    };

    // --- 2.5 注册所有设置模块 ---
    SettingsRegistry.register(LanguageSettingsModule);
    SettingsRegistry.register(ThemeSettingsModule);
    SettingsRegistry.register(BatchOpsSettingsModule);
    SettingsRegistry.register(ExportSettingsModule);


    // =========================================================================
    // 3. 主题管理器 (共享)
    // =========================================================================
    const ThemeManager = {
        init() {
            this.applyCurrentTheme();
            this.observer = new MutationObserver(() => this.applyCurrentTheme());
            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
            console.log(LOG_PREFIX, "主题管理器已初始化并开始监听。");
        },
        cleanup() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
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
    // 4. 存储管理器和文本处理工具
    // =========================================================================
    const StorageManager = {
        getPanelState() {
            try {
                const state = localStorage.getItem(Config.STORAGE_KEY);
                return state === 'true';
            } catch (e) {
                return false;
            }
        },
        setPanelState(isOpen) {
            try {
                localStorage.setItem(Config.STORAGE_KEY, String(isOpen));
            } catch (e) {
                // 忽略存储错误
            }
        }
    };

    const TextUtils = {
        getPreview(element, maxLength = Config.maxPreviewLength) {
            if (!element) return '';

            const text = (element.innerText || element.textContent || '')
                .replace(/\s+/g, ' ').trim();
            if (!text) return '';

            let width = 0, result = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charWidth = /[\u4e00-\u9fa5]/.test(char) ? 2 : 1;
                if (width + charWidth > maxLength) {
                    result += '…';
                    break;
                }
                result += char;
                width += charWidth;
            }
            return result || text.slice(0, maxLength);
        }
    };

    // =========================================================================
    // 5. API 层 (共享)
    // =========================================================================
    const ClaudeAPI = {
        orgUuid: null,
        orgInfo: null,
        conversationTree: null,
        currentLinearBranch: null,
        currentConversationUuid: null,
        isInitialized: false,
        async getOrganizationInfo() {
            if (this.orgInfo) return this.orgInfo;
            try {
                const response = await fetch('/api/organizations');
                if (!response.ok) throw new Error(t('api.orgRequestFailed', 'api.orgRequestFailed', response.status));
                const orgs = await response.json();
                if (orgs && orgs.length > 0) {
                    this.orgInfo = orgs[0];
                    this.orgUuid = this.orgInfo.uuid;
                    return this.orgInfo;
                }
                throw new Error(t('api.orgInfoNotFound'));
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
            if (!response.ok) throw new Error(t('api.getSessionsFailed', 'api.getSessionsFailed', response.status));
            return response.json();
        },
        async getConversationHistory(convUuid) {
            const orgId = await this.getOrgUuid();
            const url = `/api/organizations/${orgId}/chat_conversations/${convUuid}?tree=True&rendering_mode=messages&render_all_tools=true`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(t('api.getHistoryFailed', 'api.getHistoryFailed', response.status));
            const data = await response.json();

            // 标记脏数据：标记没有 Claude 回复的孤儿用户节点
            data.chat_messages = this.markDirtyMessages(data.chat_messages);

            this.conversationTree = this.buildConversationTree(data.chat_messages);
            this.updateCurrentLinearBranch();
            return data;
        },

        markDirtyMessages(messages) {
            // 按 index 排序消息以确保正确的时间顺序
            const sortedMessages = [...messages].sort((a, b) => a.index - b.index);
            let dirtyCount = 0;

            console.log(`${LOG_PREFIX} 开始标记脏数据，原始消息数量: ${messages.length}`);

            for (let i = 0; i < sortedMessages.length; i++) {
                const currentMessage = sortedMessages[i];

                // 如果是用户消息，检查下一个消息是否是 Claude 的回复
                if (currentMessage.sender === 'human') {
                    const nextMessage = sortedMessages[i + 1];

                    // 如果没有下一个消息，或者下一个消息也是用户消息，说明是孤儿用户节点
                    if (!nextMessage || nextMessage.sender === 'human') {
                        console.log(`${LOG_PREFIX} 发现孤儿用户节点: ${currentMessage.uuid.slice(-8)}, index: ${currentMessage.index}, 内容: "${currentMessage.content?.[0]?.text?.slice(0, 50) || '空内容'}..."`);
                        // 标记为脏数据而不是删除
                        currentMessage._isDirtyData = true;
                        dirtyCount++;
                    }
                }
            }

            if (dirtyCount > 0) {
                console.log(`${LOG_PREFIX} 标记完成，标记了 ${dirtyCount} 个孤儿用户节点为脏数据，总消息数量: ${messages.length}`);
            }

            return messages; // 返回包含脏数据标记的完整消息列表
        },


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
                const node = nodes[nodeUuid];
                node.tree_id = prefix;

                const children = childrenMap[nodeUuid] || [];
                let normalIndex = 0;
                let dirtyCount = 1;

                children.forEach((childUuid) => {
                    const childNode = nodes[childUuid];
                    if (!childNode) return;

                    // 检测脏数据：标记了 _isDirtyData 的节点
                    const isDirtyData = childNode._isDirtyData;

                    if (isDirtyData) {
                        assignIdsRecursive(childUuid, `${prefix}-F${dirtyCount}`);
                        dirtyCount++;
                    } else {
                        assignIdsRecursive(childUuid, `${prefix}-${normalIndex}`);
                        normalIndex++;
                    }
                });
            }

            const rootNodes = childrenMap[Config.INITIAL_PARENT_UUID] || [];
            rootNodes.forEach((rootUuid, index) => {
                assignIdsRecursive(rootUuid, `root-${index}`);
            });

            return { nodes, childrenMap, rootNodes };
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
            if (!response.ok) throw new Error(t('api.deleteRequestFailed', 'api.deleteRequestFailed', response.statusText));
        },
        async generateTitle(tempConvUuid, messageContent) {
            const orgId = await this.getOrgUuid();
            const url = `/api/organizations/${orgId}/chat_conversations/${tempConvUuid}/title`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_content: messageContent, recent_titles: [] })
            });
            if (!response.ok) throw new Error(t('api.titleGenerationFailed'));
            const { title } = await response.json();
            if (!title || title.toLowerCase().includes('untitled')) throw new Error(t('error.invalidTitle'));
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
            if (!response.ok) throw new Error(t('api.updateSessionFailed', 'api.updateSessionFailed', response.statusText));
        },
        async downloadFile(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(t('api.fileDownloadFailed', 'api.fileDownloadFailed', response.status, url));
            return response.blob();
        },

        async updateCurrentLinearBranch() {
            // 分析当前前端显示的线性分支
            if (!this.conversationTree) {
                // 尝试自动初始化对话树
                await this.tryInitializeConversationTree();
                if (!this.conversationTree) {
                    this.currentLinearBranch = [];
                    return;
                }
            }

            const turns = this.findCurrentTurns();

            // 构建线性分支：前端DOM显示的必定是完整的父子串行关系
            const branch = this.buildLinearBranchFromDOM(turns);
            this.currentLinearBranch = branch;

            return turns; // 返回turns避免重复调用
        },

        async tryInitializeConversationTree() {
            // 智能初始化对话树 - 避免重复请求
            try {
                const currentUrl = window.location.href;
                const pathParts = new URL(currentUrl).pathname.split('/');
                const conversationUuid = (pathParts[1] === 'chat' && pathParts[2]) ? pathParts[2] : null;

                if (!conversationUuid || conversationUuid === 'new') {
                    return false;
                }

                // 检查是否已经为当前对话初始化过
                if (this.isInitialized && this.currentConversationUuid === conversationUuid) {
                    return true;
                }

                // 初始化新的对话树
                await this.getConversationHistory(conversationUuid);
                this.currentConversationUuid = conversationUuid;
                this.isInitialized = true;
                return true;
            } catch (error) {
                console.warn(`对话树初始化失败:`, error);
                this.isInitialized = false;
            }
            return false;
        },

        // 检测对话切换，重置初始化状态
        checkConversationChange() {
            const currentUrl = window.location.href;
            const pathParts = new URL(currentUrl).pathname.split('/');
            const conversationUuid = (pathParts[1] === 'chat' && pathParts[2]) ? pathParts[2] : null;

            if (conversationUuid !== this.currentConversationUuid) {
                console.log(`检测到对话切换: ${this.currentConversationUuid?.slice(-8) || 'none'} → ${conversationUuid?.slice(-8) || 'none'}`);
                this.isInitialized = false;
                this.conversationTree = null;
                this.currentLinearBranch = null;
                this.currentConversationUuid = conversationUuid;
            }
        },

        buildLinearBranchFromDOM(turns) {
            // 基于DOM的串行父子关系构建分支
            const branch = [];
            let expectedParentUuid = Config.INITIAL_PARENT_UUID; // 根节点UUID（虚拟，不在前端显示）

            // 预先提取所有兄弟信息，避免重复调用
            const turnsWithSiblingInfo = turns.map(turn => ({
                turn,
                siblingInfo: this.extractSiblingInfo(turn)
            }));

            // 由于根节点不在前端显示，第一个DOM回合对应根节点的直接子节点
            for (let i = 0; i < turnsWithSiblingInfo.length; i++) {
                const { turn, siblingInfo } = turnsWithSiblingInfo[i];
                const nodeUuid = this.findNodeByPositionWithCachedInfo(turn, expectedParentUuid, siblingInfo);

                if (nodeUuid) {
                    const node = { ...this.conversationTree.nodes[nodeUuid], uuid: nodeUuid };
                    // 检查是否为脏数据，如果是则跳过（正常情况下不应该发生，因为脏数据不应该出现在DOM中）
                    if (!node._isDirtyData) {
                        branch.push(node);
                        expectedParentUuid = nodeUuid; // 下一个节点的父节点就是当前节点
                    } else {
                        console.warn(`DOM回合 ${i + 1} 匹配到脏数据节点，跳过: ${nodeUuid.slice(-8)}`);
                    }
                } else {
                    console.warn(`DOM回合 ${i + 1} 无法匹配节点 (期望父: ${expectedParentUuid.slice(-8)})`);
                    break; // 中断构建，因为父子关系链断裂
                }
            }

            return branch;
        },

        findNodeByPosition(turnElement, expectedParentUuid) {
            // 基于位置信息在对话树中找到精确的节点
            const siblingInfo = this.extractSiblingInfo(turnElement);
            return this.findNodeByPositionWithCachedInfo(turnElement, expectedParentUuid, siblingInfo);
        },

        findNodeByPositionWithCachedInfo(turnElement, expectedParentUuid, siblingInfo) {
            // 基于位置信息和缓存的兄弟信息在对话树中找到精确的节点
            const isUser = !!turnElement.querySelector('[data-testid="user-message"]');
            const expectedSender = isUser ? 'human' : 'assistant';
            const { nodes, childrenMap } = this.conversationTree;

            // 获取期望父节点的所有子节点，排除脏数据
            const siblings = childrenMap[expectedParentUuid] || [];
            const sameTypeSiblings = siblings.filter(uuid =>
                nodes[uuid] && nodes[uuid].sender === expectedSender && !nodes[uuid]._isDirtyData
            );

            if (siblingInfo) {
                // 有兄弟信息时，使用精确位置匹配
                if (sameTypeSiblings.length === siblingInfo.totalSiblings) {
                    const targetIndex = siblingInfo.currentIndex;
                    if (targetIndex >= 0 && targetIndex < sameTypeSiblings.length) {
                        return sameTypeSiblings[targetIndex];
                    }
                } else {
                    console.warn(`兄弟数量不匹配: DOM显示${siblingInfo.totalSiblings}个, 树中有${sameTypeSiblings.length}个`);
                }
            } else {
                // 没有兄弟信息时的处理逻辑
                if (sameTypeSiblings.length === 1) {
                    return sameTypeSiblings[0];
                } else if (sameTypeSiblings.length > 1) {
                    // 选择时间最早的节点（通常是主分支）
                    const sortedSiblings = sameTypeSiblings.sort((a, b) =>
                        new Date(nodes[a].created_at) - new Date(nodes[b].created_at)
                    );
                    return sortedSiblings[0];
                }
            }

            return null;
        },

        findCurrentTurns() {
            // 基于实际DOM结构查找对话回合 - 只使用最精确的选择器
            const elements = document.querySelectorAll('div[data-test-render-count]');
            const validElements = Array.from(elements).filter(el => {
                // 检查是否包含用户消息或Claude响应内容
                const hasUserMessage = !!el.querySelector('[data-testid="user-message"]');
                const hasClaudeResponse = !!el.querySelector('.font-claude-response');

                // 必须是用户消息或Claude响应之一
                return hasUserMessage || hasClaudeResponse;
            });

            return validElements;
        },

        extractSiblingInfo(turnElement) {
            // 查找关键定位元素：<span class="self-center shrink-0 select-none font-small text-text-300">a / b</span>
            // 其中 b 代表包括自己在内总共有多少个兄弟节点，a 代表自己处于兄弟节点的第几个（1基索引）

            // 精确的类名匹配
            let siblingSpan = turnElement.querySelector('span.self-center.shrink-0.select-none.font-small.text-text-300');

            if (siblingSpan) {
                const text = siblingSpan.textContent?.trim();
                const match = text.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    const currentPosition = parseInt(match[1]); // 1基索引位置
                    const totalSiblings = parseInt(match[2]);   // 包括自己在内的总数

                    return {
                        currentIndex: currentPosition - 1, // 转换为0基索引用于数组操作
                        totalSiblings: totalSiblings
                    };
                }
            }

            return null;
        },

        extractNodeText(node) {
            if (node.content && Array.isArray(node.content)) {
                // 根据真实数据格式提取文本
                for (const contentBlock of node.content) {
                    if (contentBlock.type === 'text' && contentBlock.text) {
                        return contentBlock.text;
                    }
                }
            }
            return node.text || '';
        },

        // 检查目标节点是否在当前线性分支中
        isNodeInCurrentBranch(nodeUuid) {
            if (!this.currentLinearBranch) return false;
            return this.currentLinearBranch.some(node => node && node.uuid === nodeUuid);
        }
    };

    // =========================================================================
    // 5. 分支切换核心功能
    // =========================================================================
    const BranchSwitcher = {
        // 基础工具函数
        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // 切换到阶段性目标节点
        async switchToTargetStageNode(targetNodeUuid) {
            console.log(`${LOG_PREFIX} 尝试切换到阶段性目标节点: ${targetNodeUuid.slice(-8)}`);

            // 1. 判断阶段性目标节点是否在前端
            if (ClaudeAPI.isNodeInCurrentBranch(targetNodeUuid)) {
                console.log(`${LOG_PREFIX} 目标节点已在当前前端显示`);
                return true;
            }

            // 2. 判断阶段性目标节点的父节点是否在前端
            const { nodes } = ClaudeAPI.conversationTree;
            const targetNode = nodes[targetNodeUuid];
            if (!targetNode) {
                console.error(`${LOG_PREFIX} 找不到目标节点: ${targetNodeUuid.slice(-8)}`);
                return false;
            }

            // 检查目标节点是否为脏数据
            if (targetNode._isDirtyData) {
                console.error(`${LOG_PREFIX} 目标节点是脏数据，无法切换: ${targetNodeUuid.slice(-8)}`);
                return false;
            }

            const parentUuid = targetNode.parent_message_uuid || Config.INITIAL_PARENT_UUID;

            // 如果父节点是根节点，检查根节点是否等效在前端（即第一个节点的父节点）
            let isParentInFrontend = false;
            if (parentUuid === Config.INITIAL_PARENT_UUID) {
                // 根节点场景：只要当前分支有节点，根节点就等效在前端
                isParentInFrontend = ClaudeAPI.currentLinearBranch && ClaudeAPI.currentLinearBranch.length > 0;
            } else {
                isParentInFrontend = ClaudeAPI.isNodeInCurrentBranch(parentUuid);
            }

            if (!isParentInFrontend) {
                console.log(`${LOG_PREFIX} 目标节点的父节点不在前端显示: ${parentUuid.slice(-8)}`);
                return false;
            }

            // 3. 计算要执行的操作
            const { childrenMap } = ClaudeAPI.conversationTree;
            const siblings = childrenMap[parentUuid] || [];
            const sameTypeSiblings = siblings.filter(uuid =>
                nodes[uuid] && nodes[uuid].sender === targetNode.sender && !nodes[uuid]._isDirtyData
            );

            // 3.1 计算阶段性目标节点在其父节点的子节点中的位置index
            const targetIndex = sameTypeSiblings.indexOf(targetNodeUuid);
            if (targetIndex === -1) {
                console.error(`${LOG_PREFIX} 在兄弟节点中找不到目标节点`);
                return false;
            }

            // 3.2 计算当前前端显示的兄弟节点位置
            let currentIndex = -1;
            if (parentUuid === Config.INITIAL_PARENT_UUID) {
                // 根节点场景：查找第一个同类型节点
                if (ClaudeAPI.currentLinearBranch && ClaudeAPI.currentLinearBranch.length > 0) {
                    const firstNodeOfSameType = ClaudeAPI.currentLinearBranch.find(node =>
                        node && node.sender === targetNode.sender
                    );
                    if (firstNodeOfSameType) {
                        currentIndex = sameTypeSiblings.indexOf(firstNodeOfSameType.uuid);
                    }
                }
            } else {
                // 非根节点场景：查找父节点后的第一个同类型节点
                const parentIndexInBranch = ClaudeAPI.currentLinearBranch.findIndex(node =>
                    node && node.uuid === parentUuid
                );
                if (parentIndexInBranch !== -1) {
                    for (let i = parentIndexInBranch + 1; i < ClaudeAPI.currentLinearBranch.length; i++) {
                        const node = ClaudeAPI.currentLinearBranch[i];
                        if (node && node.sender === targetNode.sender) {
                            currentIndex = sameTypeSiblings.indexOf(node.uuid);
                            break;
                        }
                    }
                }
            }

            if (currentIndex === -1) {
                console.error(`${LOG_PREFIX} 无法确定当前同类型兄弟节点的位置`);
                return false;
            }

            // 3.3 计算位置差
            const diff = targetIndex - currentIndex;
            console.log(`${LOG_PREFIX} 需要切换 ${diff} 步 (目标位置: ${targetIndex}, 当前位置: ${currentIndex})`);

            if (diff === 0) {
                console.log(`${LOG_PREFIX} 已经在目标位置`);
                return true;
            }

            // 4. 执行切换操作
            const direction = diff > 0 ? 'right' : 'left';
            const steps = Math.abs(diff);

            // 找到要操作的前端节点索引
            let frontendNodeIndex = -1;
            if (parentUuid === Config.INITIAL_PARENT_UUID) {
                // 根节点场景：找到第一个同类型节点
                for (let i = 0; i < ClaudeAPI.currentLinearBranch.length; i++) {
                    const node = ClaudeAPI.currentLinearBranch[i];
                    if (node && node.sender === targetNode.sender) {
                        frontendNodeIndex = i + 1; // 转换为1基索引
                        break;
                    }
                }
            } else {
                // 非根节点场景：找到父节点后的第一个同类型节点
                const parentIndexInBranch = ClaudeAPI.currentLinearBranch.findIndex(node =>
                    node && node.uuid === parentUuid
                );
                if (parentIndexInBranch !== -1) {
                    for (let i = parentIndexInBranch + 1; i < ClaudeAPI.currentLinearBranch.length; i++) {
                        const node = ClaudeAPI.currentLinearBranch[i];
                        if (node && node.sender === targetNode.sender) {
                            frontendNodeIndex = i + 1; // 转换为1基索引
                            break;
                        }
                    }
                }
            }

            if (frontendNodeIndex === -1) {
                console.error(`${LOG_PREFIX} 无法确定要操作的前端节点索引`);
                return false;
            }

            // 执行切换步骤
            for (let step = 0; step < steps; step++) {
                console.log(`${LOG_PREFIX} 执行第 ${step + 1}/${steps} 步 ${direction} 切换`);

                const success = await this.clickNodeSwitch(direction, frontendNodeIndex);
                if (!success) {
                    console.error(`${LOG_PREFIX} 第 ${step + 1} 步切换失败`);
                    return false;
                }

                // 等待切换完成
                await this.wait(300);

                // 更新当前分支状态
                await ClaudeAPI.updateCurrentLinearBranch();
            }

            // 5. 验证是否切换成功
            await this.wait(200);
            await ClaudeAPI.updateCurrentLinearBranch();

            const success = ClaudeAPI.isNodeInCurrentBranch(targetNodeUuid);
            console.log(`${LOG_PREFIX} 切换${success ? '成功' : '失败'}: ${targetNodeUuid.slice(-8)}`);

            return success;
        },

        // 递归切换到目标节点
        async switchToTargetNode(targetNodeUuid) {
            console.log(`${LOG_PREFIX} 开始切换到目标节点: ${targetNodeUuid.slice(-8)}`);

            // 确保对话树已初始化
            if (!ClaudeAPI.conversationTree) {
                await ClaudeAPI.tryInitializeConversationTree();
                if (!ClaudeAPI.conversationTree) {
                    console.error(`${LOG_PREFIX} 对话树未初始化`);
                    return false;
                }
            }

            // 更新当前分支状态
            await ClaudeAPI.updateCurrentLinearBranch();

            // 尝试直接切换到目标节点
            if (await this.switchToTargetStageNode(targetNodeUuid)) {
                return true;
            }

            // 如果直接切换失败，递归切换到父节点
            const { nodes } = ClaudeAPI.conversationTree;
            const targetNode = nodes[targetNodeUuid];
            if (!targetNode) {
                console.error(`${LOG_PREFIX} 找不到目标节点: ${targetNodeUuid.slice(-8)}`);
                return false;
            }

            // 检查目标节点是否为脏数据
            if (targetNode._isDirtyData) {
                console.error(`${LOG_PREFIX} 目标节点是脏数据，无法递归切换: ${targetNodeUuid.slice(-8)}`);
                return false;
            }

            const parentUuid = targetNode.parent_message_uuid;
            if (!parentUuid || parentUuid === Config.INITIAL_PARENT_UUID) {
                console.error(`${LOG_PREFIX} 已到达根节点，无法继续递归`);
                return false;
            }

            console.log(`${LOG_PREFIX} 递归切换到父节点: ${parentUuid.slice(-8)}`);

            // 递归调用切换到父节点
            if (await this.switchToTargetNode(parentUuid)) {
                // 父节点切换成功后，再次尝试切换到目标节点
                console.log(`${LOG_PREFIX} 父节点切换成功，重新尝试切换到目标节点`);
                return await this.switchToTargetStageNode(targetNodeUuid);
            } else {
                console.error(`${LOG_PREFIX} 递归失败，无法切换到父节点: ${parentUuid.slice(-8)}`);
                return false;
            }
        },

        // 通用切换函数（简化版，用于与现有按钮交互）
        async clickNodeSwitch(direction, frontendIndex = 1) {
            const turns = ClaudeAPI.findCurrentTurns();
            if (frontendIndex < 1 || frontendIndex > turns.length) {
                console.error(`${LOG_PREFIX} 前端节点索引超出范围。有效范围: 1-${turns.length}`);
                return false;
            }

            // 在指定的前端节点中查找切换按钮
            const targetTurn = turns[frontendIndex - 1];
            let buttonSelector;

            if (direction === 'right') {
                buttonSelector = 'button[type="button"]:not([disabled]) svg path[d*="M6.13378 3.16011"]';
            } else if (direction === 'left') {
                buttonSelector = 'button[type="button"] svg path[d*="M13.2402 3.07224"]';
            } else {
                console.error(`${LOG_PREFIX} 无效的方向参数。请使用 'left' 或 'right'`);
                return false;
            }

            const buttonPath = targetTurn.querySelector(buttonSelector);

            if (buttonPath) {
                const button = buttonPath.closest('button');
                if (button && !button.disabled) {
                    console.log(`${LOG_PREFIX} 点击前端节点#${frontendIndex}的${direction === 'right' ? '右' : '左'}切换按钮`);
                    button.click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    return true;
                }
            }

            console.error(`${LOG_PREFIX} 前端节点#${frontendIndex}没有可用的${direction === 'right' ? '右' : '左'}切换按钮`);
            return false;
        }
    };

    // =========================================================================
    // 6. 线性跳转功能
    // =========================================================================
    const LinearNavigator = {
        // 滚动到元素
        scrollToElement(element, topMargin = Config.topMargin) {
            if (!element) return;

            const anchor = this.findAnchor(element);
            const scroller = this.getScrollContainer(anchor);
            if (!scroller) return;

            const isWindow = scroller === document.documentElement ||
                            scroller === document.body ||
                            scroller === document.scrollingElement;

            const scrollerRect = isWindow ?
                { top: 0, height: window.innerHeight } :
                scroller.getBoundingClientRect();

            const anchorRect = anchor.getBoundingClientRect();
            const currentScrollTop = isWindow ? window.scrollY : scroller.scrollTop;
            const targetScrollTop = currentScrollTop + (anchorRect.top - scrollerRect.top) - topMargin;
            const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
            const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

            scroller.scrollTo({ top: finalScrollTop, behavior: 'smooth' });

            // 高亮效果
            this.addHighlight(element);
            if (anchor !== element) this.addHighlight(anchor);
        },

        findAnchor(turnElement) {
            const selectors = [
                '[data-testid="user-message"]',
                '.font-claude-response',
                'p', 'li', 'pre'
            ];

            for (const selector of selectors) {
                const element = turnElement.querySelector(selector);
                if (element && element.offsetParent) return element;
            }
            return turnElement;
        },

        getScrollContainer(element) {
            let el = element;
            while (el && el !== document.documentElement) {
                const style = getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                    el.scrollHeight > el.clientHeight) {
                    return el;
                }
                el = el.parentElement;
            }
            return document.scrollingElement || document.documentElement;
        },

        addHighlight(element) {
            element.classList.add('highlight-pulse');
            setTimeout(() => element.classList.remove('highlight-pulse'), 3100);
        },

        // 线性跳转到指定节点
        async jumpToNode(nodeUuid) {
            // 检查目标节点是否为脏数据
            if (ClaudeAPI.conversationTree) {
                const targetNode = ClaudeAPI.conversationTree.nodes[nodeUuid];
                if (targetNode && targetNode._isDirtyData) {
                    console.error(`${LOG_PREFIX} 目标节点是脏数据，无法跳转: ${nodeUuid.slice(-8)}`);
                    return false;
                }
            }

            // 首先更新当前线性分支状态
            await ClaudeAPI.updateCurrentLinearBranch();

            // 2.1 当前前端状态的线性分支包含该节点，直接跳转
            if (ClaudeAPI.isNodeInCurrentBranch(nodeUuid)) {
                this.jumpToNodeInCurrentBranch(nodeUuid);
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
            } else {
                // 2.2 当前前端状态的线性分支不包含该节点，执行跨分支跳转
                console.log(`${LOG_PREFIX} 目标节点不在当前分支中，开始跨分支跳转: ${nodeUuid.slice(-8)}`);

                // 调用分支切换器进行跨分支跳转
                const switchSuccess = await BranchSwitcher.switchToTargetNode(nodeUuid);

                if (switchSuccess) {
                    // 分支切换成功后，执行页面内跳转到目标节点
                    console.log(`${LOG_PREFIX} 分支切换成功，执行页面内跳转`);
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // 更新分支状态并跳转
                    await ClaudeAPI.updateCurrentLinearBranch();
                    this.jumpToNodeInCurrentBranch(nodeUuid);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return true;
                } else {
                    console.error(`${LOG_PREFIX} 跨分支跳转失败: ${nodeUuid.slice(-8)}`);
                    return false;
                }
            }
        },

        jumpToNodeInCurrentBranch(nodeUuid, cachedTurns = null) {
            // 在当前分支中跳转
            const element = document.getElementById(nodeUuid) ||
                           this.findElementByNodeUuid(nodeUuid, cachedTurns);
            if (element) {
                this.scrollToElement(element);
            }
        },

        findElementByNodeUuid(nodeUuid, cachedTurns = null) {
            // 直接通过ID查找
            const directElement = document.getElementById(nodeUuid);
            if (directElement) return directElement;

            // 基于位置在当前线性分支中查找对应的DOM元素
            if (!ClaudeAPI.currentLinearBranch) return null;

            // 找到目标节点在当前分支中的索引
            const nodeIndex = ClaudeAPI.currentLinearBranch.findIndex(node => node.uuid === nodeUuid);
            if (nodeIndex === -1) return null;

            // 使用缓存的turns或获取当前显示的所有回合
            const turns = cachedTurns || ClaudeAPI.findCurrentTurns();

            if (nodeIndex < turns.length) {
                return turns[nodeIndex];
            }

            return null;
        }
    };

    // =========================================================================
    // 7. 线性对话索引管理
    // =========================================================================
    const LinearTurnIndex = {
        generateId(index, urlHash = null) {
            const hash = urlHash || location.pathname.split('/').pop() || 'default';
            return `cpm-ln-turn-${hash}-${index + 1}`;
        },

        detectRole(turnElement) {
            const isUser = !!turnElement.querySelector('[data-testid="user-message"]');
            const isAssistant = !!turnElement.querySelector('.font-claude-response');

            if (isUser) return 'user';
            if (isAssistant) return 'assistant';
            return null;
        },

        build() {
            const turns = ClaudeAPI.findCurrentTurns();
            if (!turns.length) return [];

            const index = [];
            for (let i = 0; i < turns.length; i++) {
                const turnElement = turns[i];
                const role = this.detectRole(turnElement);
                if (!role) continue;

                turnElement.setAttribute('data-cpm-ln-turn', '1');

                const contentElement = turnElement.querySelector('[data-testid="user-message"]') ||
                                     turnElement.querySelector('.font-claude-response') ||
                                     turnElement;
                let preview = TextUtils.getPreview(contentElement);

                // 简化的附件检测逻辑：用户节点且无文本内容时显示附件图标
                if (role === 'user' && !preview) {
                    preview = 'attachment';
                }

                if (!preview) continue;

                if (!turnElement.id) {
                    turnElement.id = this.generateId(i);
                }

                index.push({
                    id: turnElement.id,
                    idx: i,
                    role,
                    preview,
                    element: turnElement
                });
            }

            return index;
        }
    };

    // =========================================================================
    // 8. 线性导航UI组件
    // =========================================================================
    class LinearNavUI {
        constructor() {
            this.element = null;
            this.isHovered = false;
            this.currentActiveId = null;
            this.isVisible = false;
        }

        create() {
            this.element = this.createElement();
            this.setupDrag();
            this.bindEvents();
            document.body.appendChild(this.element);
            return this;
        }

        createElement() {
            const nav = document.createElement('div');
            nav.id = 'cpm-ln-nav';
            nav.innerHTML = `
                <div class="cpm-ln-header">
                    <div style="display: flex; align-items: center; margin-left: -4px;">
                        <button class="cpm-ln-refresh" type="button" title="${t('linear.refresh')}">
                            <svg class="cpm-svg-icon" style="width:14px; height:14px;"><use href="#cpm-ln-icon-refresh"></use></svg>
                        </button>
                    </div>
                    <div class="cpm-ln-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px; height:16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                        </svg>
                        <span>${t('linear.title')}</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-right: -4px;">
                        <button class="cpm-ln-close" type="button" title="${t('linear.close')}">
                            <svg class="cpm-svg-icon" style="width:14px; height:14px;"><use href="#cpm-ln-icon-close"></use></svg>
                        </button>
                    </div>
                </div>
                <div class="cpm-ln-list"></div>
                <div class="cpm-ln-footer">
                    <button class="cpm-ln-nav-btn" type="button" data-action="top" title="${t('linear.top')}">
                        <svg class="cpm-svg-icon"><use href="#cpm-ln-icon-arrow-line-up"></use></svg>
                    </button>
                    <button class="cpm-ln-nav-btn arrow" type="button" data-action="prev" title="${t('linear.prev')}">
                        <svg class="cpm-svg-icon"><use href="#cpm-ln-icon-arrow-up"></use></svg>
                    </button>
                    <button class="cpm-ln-nav-btn arrow" type="button" data-action="next" title="${t('linear.next')}">
                        <svg class="cpm-svg-icon"><use href="#cpm-ln-icon-arrow-down"></use></svg>
                    </button>
                    <button class="cpm-ln-nav-btn" type="button" data-action="bottom" title="${t('linear.bottom')}">
                        <svg class="cpm-svg-icon"><use href="#cpm-ln-icon-arrow-line-down"></use></svg>
                    </button>
                </div>
            `;
            return nav;
        }

        setupDrag() {
            const header = this.element.querySelector('.cpm-ln-header');
            let isDragging = false, startX, startY, startLeft, startTop;

            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.element.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                this.element.style.left = `${startLeft + (e.clientX - startX)}px`;
                this.element.style.top = `${startTop + (e.clientY - startY)}px`;
                this.element.style.right = 'auto';
                this.element.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', () => { isDragging = false; });
        }

        bindEvents() {
            // 悬停状态
            this.element.addEventListener('mouseenter', () => { this.isHovered = true; });
            this.element.addEventListener('mouseleave', () => { this.isHovered = false; });

            // 防止选择
            this.element.addEventListener('dblclick', (e) => e.preventDefault(), { capture: true });
            this.element.addEventListener('selectstart', (e) => e.preventDefault(), { capture: true });
            this.element.addEventListener('mousedown', (e) => { if (e.detail > 1) e.preventDefault(); }, { capture: true });

            // 关闭按钮
            this.element.querySelector('.cpm-ln-close').addEventListener('click', () => {
                this.hide();
            });

            // 刷新
            this.element.querySelector('.cpm-ln-refresh').addEventListener('click', () => {
                this.onRefresh();
            });

            // 导航按钮
            this.element.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.onNavigate(action);
                });
            });

            // 列表点击
            const list = this.element.querySelector('.cpm-ln-list');
            list.addEventListener('click', (e) => {
                const item = e.target.closest('.cpm-ln-item');
                if (item && item.dataset.id) {
                    this.onItemClick(item.dataset.id);
                }
            });
        }

        show() {
            if (!this.isVisible) {
                this.isVisible = true;
                this.element.classList.add('visible');
                StorageManager.setPanelState(true);
            }
        }

        hide() {
            if (this.isVisible) {
                this.isVisible = false;
                this.element.classList.remove('visible');
                StorageManager.setPanelState(false);
            }
        }

        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
                this.onRefresh();
            }
        }

        render(indexData) {
            const list = this.element.querySelector('.cpm-ln-list');
            if (!indexData.length) {
                list.innerHTML = `<div class="cpm-ln-empty">${t('linear.empty')}</div>`;
                return;
            }

            list.innerHTML = '';
            for (const item of indexData) {
                const node = document.createElement('div');
                node.className = `cpm-ln-item ${item.role}`;
                node.dataset.id = item.id;

                // 检查是否为附件格式并添加图标
                const hasAttachmentFormat = item.preview === 'attachment';

                if (hasAttachmentFormat) {
                    node.innerHTML = `
                        <span class="cpm-ln-number">${item.idx + 1}.</span>
                        <span class="cpm-ln-text" title="${escapeHTML(item.preview)}" style="display:inline-flex;align-items:center;white-space:nowrap;">
                            <svg class="cpm-svg-icon" style="width:12px;height:12px;margin-right:3px;vertical-align:middle;"><use href="#cpm-ln-icon-paperclip"></use></svg>${escapeHTML(item.preview)}
                        </span>
                    `;
                } else {
                    node.innerHTML = `
                        <span class="cpm-ln-number">${item.idx + 1}.</span>
                        <span class="cpm-ln-text" title="${escapeHTML(item.preview)}">
                            ${escapeHTML(item.preview)}
                        </span>
                    `;
                }

                node.setAttribute('draggable', 'false');
                list.appendChild(node);
            }
        }

        setActive(id) {
            this.currentActiveId = id;

            const list = this.element.querySelector('.cpm-ln-list');
            list.querySelectorAll('.cpm-ln-item.active').forEach(n => n.classList.remove('active'));

            const activeItem = list.querySelector(`.cpm-ln-item[data-id="${id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');

                // 确保激活项可见
                const itemRect = activeItem.getBoundingClientRect();
                const listRect = list.getBoundingClientRect();
                if (itemRect.top < listRect.top) {
                    list.scrollTop += itemRect.top - listRect.top - 4;
                } else if (itemRect.bottom > listRect.bottom) {
                    list.scrollTop += itemRect.bottom - listRect.bottom + 4;
                }
            }
        }

        destroy() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }

        // 事件回调（由外部设置）
        onRefresh() {}
        onNavigate() {}
        onItemClick() {}
    }

    // =========================================================================
    // 9. 共享UI与逻辑模块
    // =========================================================================
    const SharedLogic = {

        async renderTreeView(container, messages, options = {}) {
            const { isForBranching = false, isNavigationMode = false, onNodeClick = () => {} } = options;
            container.innerHTML = '';

            if (!messages || messages.length === 0) {
                 container.innerHTML = `<p class="cpm-loading">${t('tree.empty')}${isForBranching ? t('tree.emptyForBranching') : ''}。</p>`;
                 return;
            }

            if (isForBranching && !isNavigationMode) {
                const rootBtn = document.createElement('div');
                rootBtn.id = 'cpm-branch-from-root-btn';
                rootBtn.textContent = t('navigator.branchFromRoot');
                rootBtn.onclick = () => onNodeClick(Config.INITIAL_PARENT_UUID, rootBtn);
                container.appendChild(rootBtn);
            }

            const { nodes, childrenMap, rootNodes } = ClaudeAPI.buildConversationTree(messages);
            const orgUuid = await ClaudeAPI.getOrgUuid();
            const baseUrl = window.location.origin;

            const renderNodeRecursive = (nodeUuid, indentLevel) => {
                const node = nodes[nodeUuid];
                if (!node) return;

                const nodeElement = document.createElement('div');
                nodeElement.className = 'cpm-tree-node';
                nodeElement.style.paddingLeft = `${indentLevel * 0}px`;

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
                    attachmentsHTML += `<div class="cpm-tree-attachments">└─ [${t('tree.attachments')}]:<ul>`;
                    allAttachments.forEach(file => {
                        if (file.type === 'text') {
                            const contentPreview = (file.extracted_content || '').substring(0, 25);
                            const escapedPreview = escapeHTML(contentPreview);
                            attachmentsHTML += `<li>- ${file.file_name} <span class="cpm-attachment-source">[Source: convert_document]</span> <span class="cpm-attachment-details">[ID: ${file.id}] [Preview: "${escapedPreview}..."]</span></li>`;

                        } else {
                            // 增强URL构造逻辑以支持blob类型
                            let fullUrl = '';
                            if (file.document_asset?.url) { // 优先使用显式URL
                                fullUrl = baseUrl + file.document_asset.url;
                            } else if (file.preview_url) { // 其次使用预览URL
                                fullUrl = baseUrl + file.preview_url;
                            } else if (file.file_kind === 'blob' && orgUuid && file.file_uuid) { // **新增**: 处理 blob 类型
                                fullUrl = `${baseUrl}/api/organizations/${orgUuid}/files/${file.file_uuid}/contents`;
                            } else if (orgUuid && file.file_uuid && file.file_name) { // 回退到旧的文档格式
                                const ext = file.file_name.includes('.') ? rsplit(file.file_name, '.', 1)[1] : '';
                                if (ext) fullUrl = `${baseUrl}/api/${orgUuid}/files/${file.file_uuid}/document_${ext.replace('.','')}/${file.file_name}`;
                            }

                            const urlLink = fullUrl ? `<a href="${fullUrl}" target="_blank" class="cpm-attachment-url" title="${t('attachment.openInNewTab')}: ${fullUrl}">[View/Download URL]</a>` : '[URL Not Available]';
                            attachmentsHTML += `<li>- ${file.file_name} <span class="cpm-attachment-source">[Source: /upload | Type: ${file.file_kind || 'unknown'}]</span> ${urlLink}</li>`;
                        }
                    });
                    attachmentsHTML += '</ul></div>';
                }

                // 检测是否为脏数据节点
                const isDirtyNode = node._isDirtyData || (node.tree_id && node.tree_id.includes('-F'));
                const dirtyClass = isDirtyNode ? ' cpm-dirty-node' : '';
                const dirtyLabel = isDirtyNode ? ` [${t('tree.dirtyData')}]` : '';

                // 使用现代化DOM操作，避免HTML注入
                const header = document.createElement('div');
                header.className = `cpm-tree-node-header${dirtyClass}`;

                const idSpan = document.createElement('span');
                idSpan.className = 'cpm-tree-node-id';
                idSpan.textContent = `[${node.tree_id}]`;

                const senderSpan = document.createElement('span');
                senderSpan.className = `cpm-tree-node-sender sender-${sender.toLowerCase()}`;
                senderSpan.textContent = `${sender}${retryMarker}${dirtyLabel}:`;

                const previewSpan = document.createElement('span');
                previewSpan.className = 'cpm-tree-node-preview';
                previewSpan.textContent = preview || t('tree.attachmentOrToolOnly');

                header.append(idSpan, senderSpan, previewSpan);
                nodeElement.appendChild(header);

                // 附件HTML部分仍需要innerHTML（因为包含复杂HTML结构）
                if (attachmentsHTML) {
                    const attachmentsDiv = document.createElement('div');
                    attachmentsDiv.innerHTML = attachmentsHTML;
                    nodeElement.appendChild(attachmentsDiv);
                }

                // 根据模式决定哪些节点可以点击（脏数据节点不可点击）
                const isClickable = !isDirtyNode && (isNavigationMode ? true : (isForBranching && node.sender === 'assistant'));

                if (isClickable) {
                    nodeElement.classList.add('cpm-node-clickable');
                    nodeElement.title = isNavigationMode ? t('navigator.clickToNavigate') : t('navigator.clickToContinue');
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
            const { nodes } = ClaudeAPI.buildConversationTree(historyData.chat_messages);
            const allAttachments = [];
            for (const node of Object.values(nodes)) {
                (node.attachments || []).forEach(file => allAttachments.push({ type: 'text', content: file.extracted_content, ...file }));
                (node.files || []).forEach(file => allAttachments.push({ type: 'binary', ...file }));
                (node.files_v2 || []).forEach(file => allAttachments.push({ type: 'binary', ...file }));
            }

            if (allAttachments.length > 0) {
                statusCallback(t('export.foundAttachments', 'export.foundAttachments', allAttachments.length), 'info');
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                if (!orgInfo) throw new Error(t('export.cannotGetOrgInfo'));

                for (let i = 0; i < allAttachments.length; i++) {
                    const file = allAttachments[i];
                    let fileName;
                    
                    // 双分割策略处理文件名
                    let extensionForCheck; // 用于检查的部分 (最后一个点)
                    let baseNameForRestore, extensionForRestore; // 用于还原的部分 (第一个点)
                    
                    if (file.file_name && file.file_name.includes('.')) {
                        // 按最后一个点分割 - 用于检查扩展名类型
                        const lastDotIndex = file.file_name.lastIndexOf('.');
                        extensionForCheck = file.file_name.substring(lastDotIndex);
                        
                        // 按第一个点分割 - 用于还原完整扩展名
                        const firstDotIndex = file.file_name.indexOf('.');
                        baseNameForRestore = file.file_name.substring(0, firstDotIndex);
                        extensionForRestore = file.file_name.substring(firstDotIndex);
                    } else {
                        // 没有扩展名的情况
                        baseNameForRestore = file.file_name || 'unknown_file';
                        extensionForCheck = extensionForRestore = '';
                    }

                    if (file.type === 'text') {
                        // 统一使用第一个点分割的结果构造文件名
                        fileName = `${baseNameForRestore}_[${file.id || 'no-id'}]${extensionForRestore}`;
                        
                        // 对于 ContentExtractorHandler 中的文件类型，添加.txt后缀
                        if (extensionForCheck && Config.ContentExtractorHandler.includes(extensionForCheck.toLowerCase())) {
                            fileName += '.txt';
                        }
                    } else if (file.type === 'binary' && file.file_uuid) {
                        // 二进制文件使用第一个点分割的结果，保留完整扩展名
                        fileName = `${baseNameForRestore}_[${file.file_uuid}]${extensionForRestore}`;
                    }

                    if (!fileName) continue;

                    try {
                        await exportDirHandle.getFileHandle(fileName, { create: false });
                        statusCallback(t('export.skipExistingFile', 'export.skipExistingFile', i + 1, allAttachments.length, fileName), 'info');
                        continue;
                    } catch (error) {
                        if (error.name !== 'NotFoundError') {
                            console.error(t('error.checkingFile', 'error.checkingFile', fileName) + ':', error);
                            statusCallback(t('status.checkingFile').replace('{0}', fileName), 'error');
                            continue;
                        }
                    }

                    statusCallback(t('export.downloading', 'export.downloading', i + 1, allAttachments.length, fileName), 'info');
                    try {
                        let fileContent;
                        if (file.type === 'text') {
                             fileContent = new Blob([file.content || ""], { type: 'text/plain;charset=utf-8' });
                        } else {
                            // 增强URL构造逻辑以支持blob类型
                            let downloadUrl;
                            if (file.document_asset?.url) { // 优先使用显式URL
                                downloadUrl = file.document_asset.url;
                            } else if (file.preview_url) { // 其次使用预览URL
                                downloadUrl = file.preview_url;
                            } else if (file.file_kind === 'blob' && orgInfo.uuid && file.file_uuid) { // **新增**: 处理 blob 类型
                                downloadUrl = `/api/organizations/${orgInfo.uuid}/files/${file.file_uuid}/contents`;
                            } else if (orgInfo.uuid && file.file_uuid && file.file_name) { // 回退到旧的文档格式
                               const ext = file.file_name.includes('.') ? rsplit(file.file_name, '.', 1)[1] : '';
                               downloadUrl = `/api/${orgInfo.uuid}/files/${file.file_uuid}/document_${ext.replace('.','')}/${file.file_name}`;
                            }

                            if(!downloadUrl) throw new Error(t('export.noDownloadUrl'));
                            fileContent = await ClaudeAPI.downloadFile(downloadUrl);
                        }
                        const fileHandle = await exportDirHandle.getFileHandle(fileName, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(fileContent);
                        await writable.close();
                    } catch (err) {
                        console.error(`处理附件 ${fileName} 失败:`, err);
                        statusCallback(t('export.processAttachmentFailed', 'export.processAttachmentFailed', fileName), 'error');
                    }
                }
            }
        },
        async performExportOriginal(convUuid, statusCallback) {
            if (typeof window.showDirectoryPicker !== 'function') throw new Error(t('error.browserNotSupported'));
            statusCallback(t('export.requestingFolder'), 'info');
            let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') { statusCallback(t('export.userCancelled'), 'info', 3000); return; }
                throw err;
            }

            try {
                const historyData = await ClaudeAPI.getConversationHistory(convUuid);
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                if (!orgInfo) throw new Error(t('export.orgInfoRequired'));

                statusCallback(t('export.creatingDirectory'), 'info');
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
                statusCallback(t('status.writingFile').replace('{0}', historyFileName), 'info');
                const historyFileHandle = await exportDirHandle.getFileHandle(historyFileName, { create: true });
                const writableHistory = await historyFileHandle.createWritable();
                await writableHistory.write(JSON.stringify(historyData, null, 2));
                await writableHistory.close();

                await this.exportAttachmentsForConversation(historyData, exportDirHandle, statusCallback);

                statusCallback(t('export.originalComplete'), 'success', 5000);
            } catch (error) {
                console.error("原始导出失败:", error);
                statusCallback(`${t('export.originalFailed')}: ${error.message}`, 'error', 5000);
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
            if (typeof window.showDirectoryPicker !== 'function') throw new Error(t('error.browserNotSupported'));
            statusCallback(t('export.requestingFolder'), 'info');
             let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') { statusCallback(t('export.userCancelled'), 'info', 3000); return; }
                throw err;
            }

            try {
                const historyData = await ClaudeAPI.getConversationHistory(convUuid);
                const orgInfo = await ClaudeAPI.getOrganizationInfo();
                 if (!orgInfo) throw new Error(t('export.orgInfoRequired'));

                statusCallback(t('export.creatingDirectory'), 'info');
                const orgName = (orgInfo.name || "unknown_org").replace(/'s Organization$/, "");
                const safeTitle = (historyData.name || "Untitled").replace(/[<>:"/\\|?*]/g, '_');
                const pathParts = [`Claude_Exports`, `[${orgName}]`, `[Custom]_[${safeTitle}]_[${convUuid}]`];

                let currentDirHandle = rootDirHandle;
                for (const part of pathParts) {
                    currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true });
                }
                const exportDirHandle = currentDirHandle;

                statusCallback(t('status.convertingData'), 'info');
                const transformedData = this.transformConversation(historyData, settings);
                const jsonString = JSON.stringify(transformedData, null, 2);

                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                const historyFileName = `history-${timestamp}.json`;
                statusCallback(t('status.writingFile').replace('{0}', historyFileName), 'info');
                const historyFileHandle = await exportDirHandle.getFileHandle(historyFileName, { create: true });
                const writableHistory = await historyFileHandle.createWritable();
                await writableHistory.write(jsonString);
                await writableHistory.close();

                if (settings.attachments.mode !== 'none') {
                    await this.exportAttachmentsForConversation(historyData, exportDirHandle, statusCallback);
                }

                statusCallback(t('exportStatus.customComplete'), 'success', 5000);
            } catch (error) {
                console.error(t('export.customFailed') + ':', error);
                statusCallback(`${t('exportStatus.customFailed')}: ${error.message}`, 'error', 5000);
            }
        },
        async performAutoRename(convUuid) {
            const langPrompt = GM_getValue('renameLang', '中文');
            const maxRounds = parseInt(GM_getValue('renameRounds', 2), 10);
            const historyData = await ClaudeAPI.getConversationHistory(convUuid);
            const roundsToUse = Math.min(Math.floor(historyData.chat_messages.length / 2), maxRounds);
            if (roundsToUse < 1) throw new Error(t('error.insufficientRounds'));
            const messagesToProcess = historyData.chat_messages.slice(0, roundsToUse * 2);
            let messageParts = [];
            messagesToProcess.forEach((msg, index) => {
                const senderLabel = `Message ${index + 1} (${msg.sender === 'human' ? 'User' : 'Assistant'})`;
                let textContent = Array.isArray(msg.content) ? msg.content.filter(b => b.type === 'text' && b.text).map(b => b.text).join('\n') : '';
                if (!textContent && msg.text) textContent = msg.text;
                if (textContent.trim()) messageParts.push(`${senderLabel}:\n\n${textContent.trim()}`);
            });
            if (messageParts.length === 0) throw new Error(t('error.noValidTextContent'));
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
        isManagerButtonVisible: true,

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
                        <symbol id="cpm-icon-tree-studio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="3" x2="6" y2="15" stroke-linecap="round"></line><circle cx="16" cy="8" r="2"></circle><circle cx="6" cy="18" r="2"></circle><path d="M16 11a8 8 0 0 1 -8 7" stroke-linecap="round"></path><g transform="translate(14.5, 14.5) scale(0.5)" fill="currentColor" stroke="none"><path fill-rule="evenodd" d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768c-.433.36-.928.649-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.993 4.993 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206l-1.047-1.814a.5.5 0 0 1 .14-.656l1.517-1.09a5.033 5.033 0 0 1 0-1.694l-1.516-1.09a.5.5 0 0 1-.141-.656L2.46 3.593a.5.5 0 0 1 .639-.206l1.703.769c.433-.36.928.65 1.466-.848l.186-1.858Zm-.177 7.567-.022-.037a2 2 0 0 1 3.466-1.997l.022.037a2 2 0 0 1-3.466 1.997Z" clip-rule="evenodd" /></g></symbol>
                        <symbol id="cpm-icon-attachment" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></symbol>
                        <symbol id="cpm-icon-pdf-mode-off" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></symbol>
                        <symbol id="cpm-icon-pdf-mode-on" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></symbol>
                        <symbol id="cpm-icon-help" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></symbol>
                        <symbol id="cpm-ln-icon-paperclip" viewBox="0 0 20 20" fill="currentColor" stroke-width="0.5">
                            <g transform="scale(1.2) translate(-1.67, -1.67)">
                                <path d="M6.0678 2.16105C7.46414 1.61127 9.04215 2.29797 9.59221 3.69425L12.7983 11.8339C13.1238 12.6606 12.7177 13.5952 11.891 13.9208L11.8149 13.9511C10.9883 14.2765 10.0535 13.8695 9.72795 13.0429L8.02678 8.7255C7.92565 8.46868 8.05228 8.17836 8.30901 8.07706C8.56594 7.97586 8.85624 8.10236 8.95744 8.35929L10.6586 12.6767C10.7819 12.9894 11.1359 13.1436 11.4487 13.0204L11.5248 12.9901C11.8377 12.8669 11.9908 12.5129 11.8676 12.2001L8.66155 4.06046C8.31383 3.17839 7.31727 2.74467 6.43498 3.09171L6.28069 3.15226C5.39843 3.49996 4.96466 4.4974 5.31194 5.3798L9.18108 15.2011C9.75314 16.6533 11.3938 17.3667 12.8461 16.7948L13.0766 16.705C14.5288 16.1329 15.2432 14.4913 14.6713 13.039L12.308 7.03898C12.2069 6.78212 12.3325 6.49177 12.5893 6.39054C12.8461 6.28961 13.1365 6.41605 13.2377 6.67277L15.601 12.6728C16.3753 14.6389 15.4089 16.8601 13.4428 17.6347L13.2133 17.7255C11.2472 18.4998 9.025 17.5342 8.25041 15.5683L4.38225 5.74698C3.83217 4.35052 4.51801 2.77168 5.91448 2.22159L6.0678 2.16105Z"/>
                            </g>
                        </symbol>
                        <symbol id="cpm-ln-icon-linear-navigator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                        </symbol>
                        <symbol id="cpm-ln-icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </symbol>
                        <symbol id="cpm-ln-icon-arrow-line-up" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M205.66,138.34a8,8,0,0,1-11.32,11.32L136,91.31V224a8,8,0,0,1-16,0V91.31L61.66,149.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0ZM216,32H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
                        </symbol>
                        <symbol id="cpm-ln-icon-arrow-line-down" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M50.34,117.66a8,8,0,0,1,11.32-11.32L120,164.69V32a8,8,0,0,1,16,0V164.69l58.34-58.35a8,8,0,0,1,11.32,11.32l-72,72a8,8,0,0,1-11.32,0ZM216,208H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
                        </symbol>
                        <symbol id="cpm-ln-icon-arrow-up" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z"></path>
                        </symbol>
                        <symbol id="cpm-ln-icon-arrow-down" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </symbol>
                        <symbol id="cpm-ln-icon-close" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
                        </symbol>
                        <symbol id="cpm-icon-close" viewBox="0 0 256 256" fill="currentColor"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></symbol>
                        <symbol id="cpm-icon-batch-export-original" viewBox="0 0 24 24"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /><text x="2" y="7" font-family="Arial, Helvetica, sans-serif" font-size="5" fill="currentColor" stroke="none">bat</text></symbol>
                        <symbol id="cpm-icon-batch-export-custom" viewBox="0 0 24 24"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /><text x="2" y="7" font-family="Arial, Helvetica, sans-serif" font-size="5" fill="currentColor" stroke="none">bat</text><g transform="translate(16, 3) scale(0.5)" fill="currentColor" stroke="none"><path fill-rule="evenodd" d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768c-.433.36-.928.649-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.993 4.993 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206l-1.047-1.814a.5.5 0 0 1 .14-.656l1.517-1.09a5.033 5.033 0 0 1 0-1.694l-1.516-1.09a.5.5 0 0 1-.141-.656L2.46 3.593a.5.5 0 0 1 .639-.206l1.703.769c.433-.36.928.65 1.466-.848l.186-1.858Zm-.177 7.567-.022-.037a2 2 0 0 1 3.466-1.997l.022.037a2 2 0 0 1-3.466 1.997Z" clip-rule="evenodd" /></g></symbol>
                    </defs>
                </svg>
            `;
            document.body.appendChild(svgDefs);

            const managerButton = document.createElement('button');
            managerButton.id = 'cpm-manager-button';
            managerButton.innerHTML = t('manager.title');
            managerButton.title = t('tooltip.managerButton');
            document.body.appendChild(managerButton);

            const mainPanel = document.createElement('div');
            mainPanel.id = 'cpm-main-panel';
            mainPanel.className = 'cpm-panel';
            mainPanel.innerHTML = `
                <div class="cpm-header">
                    <h2>${t('manager.title')}</h2>
                    <div class="cpm-header-actions">
                        <a href="${Config.URL_GITHUB_REPO}" target="_blank" class="cpm-icon-btn" title="${t('tooltip.githubLink')}"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-github"></use></svg></a>
                        <a href="${Config.URL_STUDIO_REPO}" target="_blank" class="cpm-icon-btn" title="${t('tooltip.studioLink')}"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-tree-studio"></use></svg></a>
                        <button id="cpm-open-settings-button" title="${t('tooltip.settingsButton')}" class="cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-settings"></use></svg></button>
                        <button class="cpm-close-button cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button>
                    </div>
                </div>
                <div class="cpm-toolbar">
                    <div class="cpm-toolbar-group"><button class="cpm-btn" id="cpm-select-all">${t('manager.selectAll')}</button><button class="cpm-btn" id="cpm-select-none">${t('manager.selectNone')}</button><button class="cpm-btn" id="cpm-select-invert">${t('manager.selectInvert')}</button></div>
                    <div class="cpm-toolbar-group"><input type="search" id="cpm-search-box" placeholder="${t('toolbar.searchPlaceholder')}"/></div>
                    <div class="cpm-toolbar-group"><label>${t('toolbar.sort')}</label><select id="cpm-sort-select"><option value="updated_at_desc">${t('sort.updatedDesc')}</option><option value="updated_at_asc">${t('sort.updatedAsc')}</option><option value="name_asc">${t('sort.nameAsc')}</option><option value="name_desc">${t('sort.nameDesc')}</option></select></div>
                    <div class="cpm-toolbar-group"><label>${t('toolbar.filter')}</label><select id="cpm-filter-select"><option value="all">${t('filter.all')}</option><option value="starred">${t('filter.starred')}</option><option value="unstarred">${t('filter.unstarred')}</option><option value="ascii_only">${t('filter.asciiOnly')}</option><option value="non_ascii">${t('filter.nonAscii')}</option></select></div>
                    <button class="cpm-icon-btn" id="cpm-refresh" title="${t('manager.refresh')}"><svg class="cpm-svg-icon"><use href="#cpm-icon-refresh"></use></svg></button>
                </div>
                <div class="cpm-actions"><button class="cpm-action-btn" id="cpm-batch-star">${t('manager.batchStar')}</button><button class="cpm-action-btn" id="cpm-batch-unstar">${t('manager.batchUnstar')}</button><button class="cpm-action-btn" id="cpm-batch-rename">${t('manager.batchRename')}</button><button class="cpm-action-btn cpm-danger-btn" id="cpm-batch-delete">${t('manager.batchDelete')}</button><span style="flex-grow: 1;"></span><button class="cpm-icon-btn cpm-batch-export-btn" id="cpm-batch-export-original" title="${t('export.batchOriginal')}"><svg class="cpm-svg-icon" style="width:20px; height:20px;" stroke-width="1.5"><use href="#cpm-icon-batch-export-original"></use></svg></button><button class="cpm-icon-btn cpm-batch-export-btn" id="cpm-batch-export-custom" title="${t('export.batchCustom')}"><svg class="cpm-svg-icon" style="width:20px; height:20px;" stroke-width="1.5"><use href="#cpm-icon-batch-export-custom"></use></svg></button></div>
                <div class="cpm-list-container"><p class="cpm-loading">${t('manager.refreshButtonTip')}</p></div>
                <div class="cpm-status-bar">${t('manager.ready')}</div>`;
            document.body.appendChild(mainPanel);

            const settingsPanel = document.createElement('div');
            settingsPanel.id = 'cpm-settings-panel';
            settingsPanel.className = 'cpm-panel';

            const settingsHeader = `<div class="cpm-header"><h2>${t('settings.title')}</h2><button class="cpm-close-button cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button></div>`;
            const settingsContent = document.createElement('div');
            settingsContent.className = 'cpm-settings-content';

            for (const module of SettingsRegistry.modules) {
                const section = document.createElement('div');
                section.className = 'cpm-setting-section';
                section.innerHTML = `<h3 class="cpm-setting-section-title">${module.title}</h3>` + module.render();
                settingsContent.appendChild(section);
            }

            const settingsButtons = `<div class="cpm-settings-buttons"><button id="cpm-back-to-main" class="cpm-btn">${t('settings.backToMain')}</button><button id="cpm-save-settings-button" class="cpm-btn cpm-primary-btn">${t('settings.save')}</button></div>`;

            settingsPanel.innerHTML = settingsHeader;
            settingsPanel.appendChild(settingsContent);
            settingsPanel.insertAdjacentHTML('beforeend', settingsButtons);
            document.body.appendChild(settingsPanel);


            const treePanel = document.createElement('div');
            treePanel.id = 'cpm-tree-panel';
            treePanel.className = 'cpm-panel cpm-tree-panel-override';
            treePanel.innerHTML = `
                <div class="cpm-header"><h2 id="cpm-tree-title">${t('tree.preview')}</h2><button id="cpm-tree-close-button" class="cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button></div>
                <div id="cpm-tree-container" class="cpm-tree-container"><p class="cpm-loading">${t('tree.loading')}</p></div>`;
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
            document.getElementById('cpm-batch-export-original').onclick = () => this.handleBatchExport('original');
            document.getElementById('cpm-batch-export-custom').onclick = () => this.handleBatchExport('custom');
            document.getElementById('cpm-save-settings-button').onclick = () => this.saveSettings();
            document.getElementById('cpm-tree-close-button').onclick = () => this.hidePanel('cpm-tree-panel');

            // 添加Ctrl+M键盘快捷键监听
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'm') {
                    e.preventDefault();
                    this.toggleManagerButtonVisibility();
                }
            });
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
            this.updateStatus(t('settings.saved'), 'success', 3000);
            this.togglePanel('cpm-main-panel');
        },
        async loadConversations() {
            const listContainer = document.querySelector('#cpm-main-panel .cpm-list-container');
            listContainer.innerHTML = `<p class="cpm-loading">${t('manager.loading')}</p>`;
            this.updateStatus(t('manager.loading'), 'info');
            try {
                const convos = await ManagerService.loadConversations();
                this.renderConversationList();
                this.updateStatus(`${t('status.loadedSessions')} ${convos.length} ${t('exportStatus.sessions')}。`, 'info');
            } catch (error) {
                listContainer.innerHTML = `<p class="cpm-error">${t('error.loadSessionsFailed')}: ${error.message}</p>`;
                this.updateStatus(t('status.loadFailed'), 'error');
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
            if (conversationsToRender.length === 0) { listContainer.innerHTML = `<p>${t('manager.noResults')}</p>`; return; }
            const ul = document.createElement('ul');
            ul.className = 'cpm-convo-list';
            conversationsToRender.forEach(convo => {
                const li = document.createElement('li');
                li.dataset.uuid = convo.uuid;
                const titleText = convo.name || t('treeView.untitled');
                let highlightedTitle = titleText;
                if (this.currentSearch) highlightedTitle = titleText.replace(new RegExp(this.escapeRegExp(this.currentSearch), 'gi'), (match) => `<span class="cpm-highlight">${match}</span>`);
                const star = convo.is_starred ? '<span class="cpm-star">★</span>' : '';
                li.innerHTML = `
                    <input type="checkbox" class="cpm-checkbox" data-uuid="${convo.uuid}">
                    <div class="cpm-convo-details"><span class="cpm-convo-title">${star}${highlightedTitle}</span><span class="cpm-convo-date">${new Date(convo.updated_at).toLocaleString()}</span></div>
                    <div class="cpm-convo-actions">
                        <button class="cpm-icon-btn cpm-action-rename" title="${t('action.manualRename')}"><svg class="cpm-svg-icon"><use href="#cpm-icon-edit"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-tree" title="${t('action.previewTree')}"><svg class="cpm-svg-icon"><use href="#cpm-icon-tree"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-export-original" title="${t('export.original')}"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-export-original"></use></svg></button>
                        <button class="cpm-icon-btn cpm-action-export-custom" title="${t('export.custom')}"><svg class="cpm-svg-icon" stroke-width="1.5"><use href="#cpm-icon-export-custom"></use></svg></button>
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
            detailsDiv.innerHTML = `<input type="text" class="cpm-edit-input" value="${escapeHTML(originalTitle)}">`;
            actionsDiv.innerHTML = `<button class="cpm-icon-btn cpm-action-save" title="${t('common.save')}"><svg class="cpm-svg-icon"><use href="#cpm-icon-save"></use></svg></button><button class="cpm-icon-btn cpm-action-cancel" title="${t('common.cancel')}"><svg class="cpm-svg-icon"><use href="#cpm-icon-cancel"></use></svg></button>`;
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
            this.updateStatus(t('status.savingTitle'), 'info');
            try {
                await ManagerService.performManualRename(uuid, newTitle);
                this.updateStatus(t('status.saveSuccess'), 'success');
                const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
                const star = convo.is_starred ? '<span class="cpm-star">★</span>' : '';
                li.dataset.originalDetails = li.dataset.originalDetails.replace(/>(★)?.*?<\/span>/, `>${star}${newTitle}</span>`);
                this.exitEditMode(li);
            } catch (error) {
                this.updateStatus(`${t('status.saveFailed')}: ${error.message}`, 'error');
                input.disabled = false;
                input.focus();
            }
        },
        async handleTreeView(uuid) {
            const treePanel = document.getElementById('cpm-tree-panel');
            const treeContainer = document.getElementById('cpm-tree-container');
            const treeTitle = document.getElementById('cpm-tree-title');
            const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
            treeTitle.textContent = `${t('treeView.prefix')}${convo ? (convo.name || t('treeView.untitled')) : t('treeView.loading')}`;
            treeContainer.innerHTML = `<p class="cpm-loading">${t('navigator.loadingHistory')}</p>`;
            treePanel.style.display = 'flex';
            try {
                const historyData = await ClaudeAPI.getConversationHistory(uuid);
                await SharedLogic.renderTreeView(treeContainer, historyData.chat_messages);
            } catch (error) {
                console.error(error);
                treeContainer.innerHTML = `<p class="cpm-error">${t('error.cannotLoadTree')}: ${error.message}</p>`;
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
                    s.textContent = t('status.ready');
                    s.classList.remove('is-error', 'is-success');
                }, timeout);
            }
        },
        async handleBatchOperation(opName, serviceFunc, opType, ...args) {
            const uuids = this.getSelectedUuids();
            if (uuids.length === 0) { alert(t('error.selectSessions').replace('{0}', opName)); return; }
            if (opType === 'delete' && !confirm(t('batchOps.confirmDelete').replace('{0}', uuids.length))) return;
            document.querySelectorAll('.cpm-action-btn').forEach(btn => btn.disabled = true);
            this.updateStatus(t('status.batchProcessing').replace('{0}', opName).replace('{1}', uuids.length), 'info');
            let successCount = 0;
            try {
                if (opType === 'rename') {
                     for (let i = 0; i < uuids.length; i++) {
                        this.updateStatus(t('status.batchItemProcessing').replace('{0}', opName).replace('{1}', i + 1).replace('{2}', uuids.length), 'info');
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
                             this.updateStatus(`${t('status.batchItemFailed').replace('{0}', i+1)}: ${error.message}`, 'error');
                             await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                        if (i < uuids.length - 1) await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } else {
                    successCount = await serviceFunc(uuids, ...args);
                }
                this.updateStatus(t('status.batchOperationComplete').replace('{0}', opName).replace('{1}', successCount).replace('{2}', uuids.length), 'success', 4000);
            } catch(e) { this.updateStatus(`${t('status.batchOperationFailed').replace('{0}', opName)}: ${e.message}`, 'error', 5000); }
            const refreshSettingKey = opType === 'delete' ? 'refreshAfterDelete' : opType === 'star' ? 'refreshAfterStar' : 'refreshAfterRename';
            if (GM_getValue(refreshSettingKey, false)) {
                this.updateStatus(document.querySelector('#cpm-main-panel .cpm-status-bar').textContent + t('status.refreshingFromServer'), 'info');
                await this.loadConversations();
            } else { this.renderConversationList(); }
            document.querySelectorAll('.cpm-action-btn').forEach(btn => btn.disabled = false);
        },
        handleBatchRename() { this.handleBatchOperation(t('operation.rename'), ManagerService.performAutoRename.bind(ManagerService), 'rename'); },
        handleBatchDelete() { this.handleBatchOperation(t('operation.delete'), ManagerService.performBatchDelete.bind(ManagerService), 'delete'); },
        handleBatchStar(isStarring) { this.handleBatchOperation(isStarring ? t('operation.star') : t('operation.unstar'), ManagerService.performBatchStarAction.bind(ManagerService), 'star', isStarring); },
        handleBatchExport(type) {
            const uuids = this.getSelectedUuids();
            if (uuids.length === 0) { alert(t('error.selectExportSessions')); return; }

            if (type === 'original') {
                this.performBatchExportOriginal(uuids);
            } else if (type === 'custom') {
                this.showBatchExportModal(uuids);
            }
        },
        async performBatchExportOriginal(uuids) {
            if (typeof window.showDirectoryPicker !== 'function') {
                alert(t('error.browserNotSupported'));
                return;
            }

            this.updateStatus(t('status.batchExportPreparing').replace('{0}', uuids.length), 'info');

            let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') {
                    this.updateStatus(t('export.userCancelled'), 'info', 3000);
                    return;
                }
                throw err;
            }

            let successCount = 0;
            for (let i = 0; i < uuids.length; i++) {
                const uuid = uuids[i];
                const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
                const title = convo ? (convo.name || t('treeView.untitled')) : t('treeView.loading');

                this.updateStatus(t('export.exportingProgress', 'export.exportingProgress', i + 1, uuids.length, title), 'info');

                try {
                    await this.exportSingleConversation(uuid, rootDirHandle, 'original');
                    successCount++;
                } catch (error) {
                    console.error(t('export.sessionFailed', 'export.sessionFailed', uuid) + ':', error);
                    this.updateStatus(t('export.exportFailed', 'export.exportFailed', i + 1, uuids.length, error.message), 'error');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                if (i < uuids.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            this.updateStatus(t('export.batchComplete', 'export.batchComplete', successCount, uuids.length), 'success', 5000);
        },
        async exportSingleConversation(uuid, rootDirHandle, type) {
            const historyData = await ClaudeAPI.getConversationHistory(uuid);
            const orgInfo = await ClaudeAPI.getOrganizationInfo();
            if (!orgInfo) throw new Error(t('export.orgInfoRequired'));

            const orgName = (orgInfo.name || "unknown_org").replace(/'s Organization$/, "");
            const safeTitle = (historyData.name || "Untitled").replace(/[<>:"/\\|?*]/g, '_');
            const pathParts = [`Claude_Exports`, `[${orgName}]`, `[${type === 'original' ? 'Original' : 'Custom'}]_[${safeTitle}]_[${uuid}]`];

            let currentDirHandle = rootDirHandle;
            for (const part of pathParts) {
                currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true });
            }
            const exportDirHandle = currentDirHandle;

            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const historyFileName = `history-${timestamp}.json`;

            let dataToWrite;
            if (type === 'original') {
                dataToWrite = historyData;
            } else if (type === 'custom') {
                const settings = this.tempBatchExportSettings;
                dataToWrite = ManagerService.transformConversation(historyData, settings);
            }

            const historyFileHandle = await exportDirHandle.getFileHandle(historyFileName, { create: true });
            const writableHistory = await historyFileHandle.createWritable();
            await writableHistory.write(JSON.stringify(dataToWrite, null, 2));
            await writableHistory.close();

            if (type === 'original' || (type === 'custom' && this.tempBatchExportSettings.attachments.mode !== 'none')) {
                await ManagerService.exportAttachmentsForConversation(historyData, exportDirHandle, () => {});
            }
        },
        showBatchExportModal(uuids) {
            document.querySelector('.cpm-modal-overlay')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'cpm-modal-overlay';

            const modalContent = document.createElement('div');
            modalContent.className = 'cpm-panel cpm-export-modal-content';
            modalContent.style.display = 'flex';
            modalContent.innerHTML = `
                <div class="cpm-header">
                    <h2>${t('exportSettings.batchCustomOptions')} (${uuids.length} ${t('exportStatus.sessions')})</h2>
                    <button class="cpm-close-button cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button>
                </div>
                <div class="cpm-settings-content">
                    ${this.createExportSettingsHTML(false)}
                </div>
                <div class="cpm-settings-buttons">
                    <button id="cpm-batch-export-now-btn" class="cpm-btn cpm-primary-btn">${t('exportSettings.batchExportNow')}</button>
                </div>
            `;
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);

            this.loadExportSettings(modalContent);
            this.setupSubOptionDisabling(modalContent);

            overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
            modalContent.querySelector('.cpm-close-button').onclick = () => overlay.remove();
            modalContent.querySelector('#cpm-batch-export-now-btn').onclick = async () => {
                try {
                    const currentSettings = this.getExportSettings(modalContent);
                    this.tempBatchExportSettings = currentSettings;
                    modalContent.querySelector('#cpm-batch-export-now-btn').disabled = true;
                    modalContent.querySelector('#cpm-batch-export-now-btn').textContent = t('status.preparingExport');
                    overlay.remove();
                    await this.performBatchExportCustom(uuids);
                } catch (error) {
                    console.error(`${LOG_PREFIX} 批量导出失败:`, error);
                    this.updateStatus(`${t('status.batchExportFailed')}: ${error.message}`, 'error');
                }
            };
        },
        async performBatchExportCustom(uuids) {
            if (typeof window.showDirectoryPicker !== 'function') {
                alert(t('error.browserNotSupported'));
                return;
            }

            this.updateStatus(`${t('exportStatus.batchPreparing')} ${uuids.length} ${t('exportStatus.sessions')}...`, 'info');

            let rootDirHandle;
            try {
                rootDirHandle = await window.showDirectoryPicker();
            } catch (err) {
                if (err.name === 'AbortError') {
                    this.updateStatus(t('export.userCancelled'), 'info', 3000);
                    return;
                }
                throw err;
            }

            let successCount = 0;
            for (let i = 0; i < uuids.length; i++) {
                const uuid = uuids[i];
                const convo = ManagerService.conversationsCache.find(c => c.uuid === uuid);
                const title = convo ? (convo.name || t('treeView.untitled')) : t('treeView.loading');

                this.updateStatus(t('export.exportingProgress', 'export.exportingProgress', i + 1, uuids.length, title), 'info');

                try {
                    await this.exportSingleConversation(uuid, rootDirHandle, 'custom');
                    successCount++;
                } catch (error) {
                    console.error(t('export.sessionFailed', 'export.sessionFailed', uuid) + ':', error);
                    this.updateStatus(t('export.exportFailed', 'export.exportFailed', i + 1, uuids.length, error.message), 'error');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                if (i < uuids.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            delete this.tempBatchExportSettings;
            this.updateStatus(t('export.batchComplete').replace('{0}', successCount).replace('{1}', uuids.length), 'success', 5000);
        },

        createExportSettingsHTML(forSettingsPanel = false) {
            const maybeRemoveTitle = forSettingsPanel ? '' : `<h3 class="cpm-setting-section-title">${t('settings.exportDefaults')}</h3>`;
            return `
                ${maybeRemoveTitle}
                <div class="cpm-setting-group" data-section="export-metadata">
                    <h4>${t('exportSettings.basicInfo')}</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-include"><label for="cpm-export-meta-include">${t('exportSettings.keepMetadata')}</label></div>
                    <div class="cpm-setting-sub-group" data-parent="meta-include">
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-title"><label for="cpm-export-meta-title">${t('exportSettings.title')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-summary"><label for="cpm-export-meta-summary">${t('exportSettings.summary')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-main-timestamps"><label for="cpm-export-meta-main-timestamps">${t('exportSettings.sessionTimestamp')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-meta-conv-settings"><label for="cpm-export-meta-conv-settings">${t('exportSettings.sessionSettings')}</label></div>
                    </div>
                </div>
                 <div class="cpm-setting-group" data-section="export-message">
                    <h4>${t('exportSettings.messageStructure')}</h4>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-sender"><label for="cpm-export-msg-sender">${t('exportSettings.sender')}</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-uuids"><label for="cpm-export-msg-uuids">${t('exportSettings.messageUuids')}</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-msg-other-meta"><label for="cpm-export-msg-other-meta">${t('exportSettings.otherMeta')}</label></div>
                </div>
                <div class="cpm-setting-group" data-section="export-timestamps">
                    <h4>${t('exportSettings.timestampInfo')}</h4>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-message"><label for="cpm-export-ts-message">${t('exportSettings.messageTimestamp')}</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-content"><label for="cpm-export-ts-content">${t('exportSettings.contentTimestamp')}</label></div>
                     <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-ts-attachment"><label for="cpm-export-ts-attachment">${t('exportSettings.attachmentTimestamp')}</label></div>
                </div>
                 <div class="cpm-setting-group" data-section="export-content">
                    <h4>${t('exportSettings.coreContent')}</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-content-text"><label for="cpm-export-content-text">${t('exportSettings.textContent')}</label></div>
                    <div class="cpm-setting-item">
                        <label class="cpm-settings-label">${t('exportSettings.attachmentInfo')}</label>
                        <select id="cpm-export-attachments-mode">
                            <option value="full">${t('exportSettings.attachmentFull')}</option>
                            <option value="metadata_only">${t('exportSettings.attachmentMetaOnly')}</option>
                            <option value="none">${t('exportSettings.attachmentNone')}</option>
                        </select>
                    </div>
                </div>
                 <div class="cpm-setting-group" data-section="export-advanced">
                    <h4>${t('exportSettings.advancedContent')}</h4>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-thinking"><label for="cpm-export-adv-thinking">${t('exportSettings.thinkingProcess')}</label></div>
                    <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tools-include"><label for="cpm-export-adv-tools-include">${t('exportSettings.toolRecords')}</label></div>
                    <div class="cpm-setting-sub-group" data-parent="adv-tools-include">
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-websearch"><label for="cpm-export-adv-tool-websearch">${t('exportSettings.webSearch')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-repl"><label for="cpm-export-adv-tool-repl">${t('exportSettings.codeAnalysis')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-artifacts"><label for="cpm-export-adv-tool-artifacts">${t('exportSettings.artifactCreation')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-other"><label for="cpm-export-adv-tool-other">${t('exportSettings.otherTools')}</label></div>
                        <div class="cpm-setting-item"><input type="checkbox" id="cpm-export-adv-tool-only-successful"><label for="cpm-export-adv-tool-only-successful">${t('exportSettings.successfulOnly')}</label></div>
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
                <div class="cpm-header"><h2>${t('exportSettings.customOptions')}</h2><button class="cpm-close-button cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button></div>
                <div class="cpm-settings-content">
                    ${this.createExportSettingsHTML(false)}
                </div>
                <div class="cpm-settings-buttons">
                    <button id="cpm-export-now-btn" class="cpm-btn cpm-primary-btn">${t('exportSettings.exportNow')}</button>
                </div>
            `;
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);

            this.loadExportSettings(modalContent);
            this.setupSubOptionDisabling(modalContent);

            overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
            modalContent.querySelector('.cpm-close-button').onclick = () => overlay.remove();
            modalContent.querySelector('#cpm-export-now-btn').onclick = async () => {
                try {
                    const currentSettings = this.getExportSettings(modalContent);
                    modalContent.querySelector('#cpm-export-now-btn').disabled = true;
                    modalContent.querySelector('#cpm-export-now-btn').textContent = t('status.exporting');
                    await ManagerService.performExportCustom(uuid, currentSettings, this.updateStatus.bind(this));
                    overlay.remove();
                } catch (error) {
                    console.error(`${LOG_PREFIX} 导出失败:`, error);
                    this.updateStatus(`${t('status.exportFailed')}: ${error.message}`, 'error');
                    modalContent.querySelector('#cpm-export-now-btn').disabled = false;
                    modalContent.querySelector('#cpm-export-now-btn').textContent = t('exportSettings.exportNow');
                }
            };
        },

        toggleManagerButtonVisibility() {
            this.isManagerButtonVisible = !this.isManagerButtonVisible;
            const managerButton = document.getElementById('cpm-manager-button');
            if (managerButton) {
                managerButton.style.display = this.isManagerButtonVisible ? 'block' : 'none';
                console.log(LOG_PREFIX, `Manager按钮已${this.isManagerButtonVisible ? '显示' : '隐藏'} (Ctrl+M)`);
            }
        }
    };


    // =========================================================================
    // 8. 聊天增强模块 (Enhancer Modules)
    // =========================================================================
    const NavigatorEnhancer = {
        state: {
            conversationUUID: null,
            selectedParentMessageUUID: null,
            currentMode: 'branch' // 'branch' 或 'navigate'
        },
        init() {
            this.cleanup();
            this.createNavigatorButton();
        },
        updateState(currentUrl) {
            const pathParts = new URL(currentUrl).pathname.split('/');
            this.state.conversationUUID = (pathParts[1] === 'chat' && pathParts[2]) ? pathParts[2] : null;
            if (!this.state.conversationUUID) this.state.selectedParentMessageUUID = null;
            this.updateStatusIndicator();
        },
        createNavigatorButton() {
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
            button.title = t('tooltip.navigatorButton');
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
            modalContent.className = 'cpm-panel cpm-navigator-panel-override';
            modalContent.style.display = 'flex';
            modalContent.onclick = (e) => e.stopPropagation();
            modalContent.innerHTML = `
                <div class="cpm-header">
                    <h2>${t('navigator.title')}</h2>
                    <button id="cpm-navigator-modal-close-btn" class="cpm-icon-btn"><svg class="cpm-svg-icon"><use href="#cpm-icon-close"></use></svg></button>
                </div>
                <div class="cpm-mode-selector">
                    <button id="cpm-branch-mode-btn" class="cpm-mode-btn ${this.state.currentMode === 'branch' ? 'active' : ''}">${t('navigator.branchMode')}</button>
                    <button id="cpm-navigate-mode-btn" class="cpm-mode-btn ${this.state.currentMode === 'navigate' ? 'active' : ''}">${t('navigator.navigateMode')}</button>
                </div>
                <div id="cpm-navigator-tree-container" class="cpm-tree-container"></div>`;

            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);

            // 绑定事件
            overlay.querySelector('#cpm-navigator-modal-close-btn').onclick = () => overlay.remove();
            overlay.querySelector('#cpm-branch-mode-btn').onclick = () => this.switchMode('branch', modalContent);
            overlay.querySelector('#cpm-navigate-mode-btn').onclick = () => this.switchMode('navigate', modalContent);

            // 加载内容
            await this.loadModalContent(modalContent);
        },

        switchMode(mode, modalContent) {
            this.state.currentMode = mode;
            modalContent.querySelector('.cpm-mode-btn.active')?.classList.remove('active');
            modalContent.querySelector(`#cpm-${mode === 'branch' ? 'branch' : 'navigate'}-mode-btn`).classList.add('active');
            this.loadModalContent(modalContent);
        },

        async loadModalContent(modalContent) {
            const treeContainer = modalContent.querySelector('#cpm-navigator-tree-container');
            if (this.state.conversationUUID) {
                treeContainer.innerHTML = `<p class="cpm-loading">${t('navigator.loading')}</p>`;
                try {
                    // 使用智能缓存机制，避免重复请求
                    await ClaudeAPI.tryInitializeConversationTree();

                    if (!ClaudeAPI.conversationTree) {
                        throw new Error(t('error.cannotGetConvoData'));
                    }

                    // 从缓存的对话树获取消息数据
                    const messages = Object.values(ClaudeAPI.conversationTree.nodes);

                    await SharedLogic.renderTreeView(treeContainer, messages, {
                        isForBranching: this.state.currentMode === 'branch',
                        isNavigationMode: this.state.currentMode === 'navigate',
                        onNodeClick: (uuid, element) => this.handleNodeClick(uuid, element)
                    });
                } catch (error) {
                    treeContainer.innerHTML = `<p class="cpm-error">${t('status.loadFailed')}: ${error.message}</p>`;
                }
            } else {
                treeContainer.innerHTML = `<p class="cpm-loading">${t('navigator.notInChat')}</p>`;
            }
        },

        handleNodeClick(uuid, element) {
            if (this.state.currentMode === 'branch') {
                // 延续模式：设置分支点
                this.selectBranchPoint(uuid, element);
            } else {
                // 导航模式：直接跳转
                this.navigateToNode(uuid, element);
            }
        },

        selectBranchPoint(uuid, element) {
            this.state.selectedParentMessageUUID = uuid;
            document.querySelectorAll('.cpm-node-selected').forEach(n => n.classList.remove('cpm-node-selected'));
            element.classList.add('cpm-node-selected');
            this.updateStatusIndicator();
            setTimeout(() => document.querySelector('.cpm-modal-overlay')?.remove(), 300);
        },

        async navigateToNode(uuid, element) {
            document.querySelectorAll('.cpm-node-selected').forEach(n => n.classList.remove('cpm-node-selected'));
            element.classList.add('cpm-node-selected');

            // 立即关闭面板
            setTimeout(() => document.querySelector('.cpm-modal-overlay')?.remove(), 300);

            // 执行导航（跨分支跳转）
            LinearNavigator.jumpToNode(uuid);
        },
        updateStatusIndicator() {
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            if (!toolbar) return;
            document.getElementById('cpm-branch-status-indicator')?.remove();
            if (this.state.selectedParentMessageUUID) {
                const indicator = document.createElement('span');
                indicator.id = 'cpm-branch-status-indicator';
                indicator.textContent = t('navigator.branchSelected');
                indicator.title = `${t('navigator.nextMessageFrom')}\nUUID: ${this.state.selectedParentMessageUUID}`;
                toolbar.appendChild(indicator);
            }
        },
        cleanup() {
            document.querySelector('#cpm-branch-btn')?.closest('div.relative.shrink-0').remove();
            document.getElementById('cpm-branch-status-indicator')?.remove();
        }
    };

    const LinearNavEnhancer = {
        ui: null,
        currentUrl: location.href,
        refreshTimer: 0,
        forceRefreshTimer: null,
        observer: null,
        isBooting: false,

        init() {
            this.cleanup();
            this.createLinearNavigatorButton();
            // 检查是否需要自动启动面板
            this.checkAutoStart();
        },

        cleanup() {
            document.querySelector('#cpm-ln-linear-navigator-btn')?.closest('div.relative.shrink-0').remove();
            if (this.ui) {
                this.ui.destroy();
                this.ui = null;
            }
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            if (this.forceRefreshTimer) {
                clearInterval(this.forceRefreshTimer);
                this.forceRefreshTimer = null;
            }
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = 0;
            }
        },

        createLinearNavigatorButton() {
            if (document.getElementById('cpm-ln-linear-navigator-btn')) return;
            const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
            if (!toolbar) return;
            const emptyArea = toolbar.querySelector(Config.EMPTY_AREA_SELECTOR);
            if (!emptyArea) return;

            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = "relative shrink-0";
            const button = document.createElement('button');
            button.id = 'cpm-ln-linear-navigator-btn';
            button.type = 'button';
            button.title = t('tooltip.linearNavButton');
            button.className = "inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:shadow-none disabled:drop-shadow-none border-0.5 transition-all h-8 min-w-8 rounded-lg flex items-center px-[7.5px] group !pointer-events-auto !outline-offset-1 text-text-300 border-border-300 active:scale-[0.98] hover:text-text-200/90 hover:bg-bg-100";
            button.style.fontWeight = "normal";
            button.innerHTML = `<div class="flex flex-row items-center justify-center gap-1"><svg class="cpm-svg-icon" style="width:16px; height:16px;"><use href="#cpm-ln-icon-linear-navigator"></use></svg></div>`;
            button.onclick = () => this.toggleLinearNavigator();
            wrapperDiv.appendChild(button);
            toolbar.insertBefore(wrapperDiv, emptyArea);
        },

        checkAutoStart() {
            // 延迟检查，确保页面元素完全加载
            const tryAutoStart = (attempt = 0) => {
                const maxAttempts = 5;
                const delay = 2000 + (attempt * 1000); // 逐渐增加延迟

                setTimeout(() => {
                    // 检查页面是否稳定（工具栏存在且没有正在进行清理）
                    const toolbar = document.querySelector(Config.TOOLBAR_SELECTOR);
                    const hasButton = document.getElementById('cpm-ln-linear-navigator-btn');

                    if (toolbar && hasButton && StorageManager.getPanelState()) {
                        // 确保不会与现有的UI冲突
                        if (!this.ui) {
                            this.toggleLinearNavigator();
                        }
                    } else if (attempt < maxAttempts && toolbar) {
                        // 如果页面还不稳定但工具栏存在，继续尝试
                        tryAutoStart(attempt + 1);
                    }
                }, delay);
            };

            tryAutoStart();
        },

        toggleLinearNavigator() {
            if (!this.ui) {
                this.boot();
            }
            this.ui.toggle();
        },

        boot() {
            if (this.ui || this.isBooting) return;
            this.isBooting = true;

            try {
                this.ui = new LinearNavUI().create();
                this.setupUICallbacks();
                this.setupObserver();
                this.setupEventListeners();
                this.startAutoRefresh();
            } finally {
                this.isBooting = false;
            }
        },

        setupUICallbacks() {
            this.ui.onRefresh = () => this.refresh({ ignoreHover: true, force: true });
            this.ui.onNavigate = (action) => this.navigate(action);
            this.ui.onItemClick = (id) => this.jumpToItem(id);
        },

        setupObserver() {
            if (this.observer) this.observer.disconnect();

            this.observer = new MutationObserver(() => {
                this.refresh({ delay: Config.refreshInterval });
            });

            this.observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        },

        setupEventListeners() {
            // 发送消息后的快速刷新
            const handleSend = () => this.burstRefresh();

            document.addEventListener('click', (e) => {
                if (e.target.closest('button[type="submit"], [aria-label*="Send"]')) {
                    handleSend();
                }
            }, true);

            document.addEventListener('keydown', (e) => {
                const target = e.target;
                if ((target.tagName === 'TEXTAREA' || target.isContentEditable) &&
                    e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSend();
                }
            }, true);

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) this.refresh({ force: true });
            });
        },

        startAutoRefresh() {
            if (this.forceRefreshTimer) clearInterval(this.forceRefreshTimer);
            this.forceRefreshTimer = setInterval(() => {
                this.refresh({ force: true });
            }, 10000); // 10秒自动刷新
        },

        refresh({ delay = 80, force = false, ignoreHover = false } = {}) {
            if (this.ui && this.ui.isHovered && !ignoreHover) return;

            if (force) {
                if (this.refreshTimer) {
                    clearTimeout(this.refreshTimer);
                    this.refreshTimer = 0;
                }
                this.doRefresh();
                return;
            }

            if (this.refreshTimer) clearTimeout(this.refreshTimer);
            this.refreshTimer = setTimeout(() => {
                this.refreshTimer = 0;
                this.doRefresh();
            }, delay);
        },

        doRefresh() {
            if (!this.ui) return;

            try {
                const indexData = LinearTurnIndex.build();
                this.ui.render(indexData);
            } catch (e) {
                console.error('Linear refresh error:', e);
            }
        },

        burstRefresh(duration = 6000, interval = 160) {
            const endTime = Date.now() + duration;
            const tick = () => {
                this.refresh({ force: true, ignoreHover: true });
                if (Date.now() < endTime) {
                    setTimeout(tick, interval);
                }
            };
            tick();
        },

        navigate(action) {
            const indexData = LinearTurnIndex.build();
            if (!indexData.length) return;

            if (action === 'top' || action === 'bottom') {
                const turns = ClaudeAPI.findCurrentTurns();
                if (!turns.length) return;

                const targetTurn = action === 'top' ? turns[0] : turns[turns.length - 1];
                const topMargin = action === 'bottom' ? -window.innerHeight : Config.topMargin;
                LinearNavigator.scrollToElement(targetTurn, topMargin);

                if (targetTurn && targetTurn.id) {
                    setTimeout(() => this.ui.setActive(targetTurn.id), 150);
                }
                return;
            }

            const currentIndex = indexData.findIndex(item => item.id === this.ui.currentActiveId);
            const delta = action === 'prev' ? -1 : 1;
            let nextIndex;

            if (currentIndex < 0) {
                nextIndex = delta > 0 ? 0 : indexData.length - 1;
            } else {
                nextIndex = Math.max(0, Math.min(indexData.length - 1, currentIndex + delta));
            }

            const nextItem = indexData[nextIndex];
            if (nextItem) {
                this.jumpToItem(nextItem.id);
            }
        },

        jumpToItem(id) {
            const element = document.getElementById(id);
            if (element) {
                this.ui.setActive(id);
                LinearNavigator.scrollToElement(element);
            }
        },

        updateState(currentUrl) {
            if (currentUrl !== this.currentUrl) {
                this.currentUrl = currentUrl;
                if (this.ui && this.ui.isVisible) {
                    this.refresh({ force: true });
                }
            }
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
                <button class="inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-0.5 transition-all h-8 min-w-8 rounded-lg flex items-center px-[7.5px] group !pointer-events-auto !outline-offset-1 text-text-300 border-border-300 active:scale-[0.98] hover:text-text-200/90 hover:bg-bg-100" type="button" id="cpm-attachment-power-btn" aria-label="${t('tooltip.pdfButton')}" title="${t('tooltip.pdfButton')}">
                    <div class="flex flex-row items-center justify-center gap-1"><svg class="cpm-svg-icon" style="width:16px; height:16px; stroke-width:1.8;"><use href="#cpm-icon-attachment"></use></svg></div>
                </button>
                <div class="w-[24rem] absolute max-w-[calc(100vw-16px)] bottom-10 block hidden" id="cpm-attachment-power-menu">
                    <div class="relative w-full will-change-transform h-auto overflow-y-auto overscroll-auto flex z-dropdown bg-bg-000 rounded-lg overflow-hidden border-border-300 border-0.5 shadow-diffused shadow-[hsl(var(--always-black)/6%)] flex-col-reverse" style="max-height: 340px;">
                        <div class="flex flex-col min-h-0 w-full !ease-out justify-end" style="height: auto;">
                            <div class="w-full">
                                <div class="p-1.5 flex flex-col">
                                    <button class="group flex w-full items-center text-left gap-2.5 py-auto px-1.5 text-[0.875rem] text-text-200 rounded-md transition-colors select-none active:!scale-100 hover:bg-bg-200/50 hover:text-text-000 h-[2rem]">
                                        <div id="cpm-dynamic-icon-container" class="group/icon min-w-4 min-h-4 flex items-center justify-center text-text-300 shrink-0 group-hover:text-text-100">
                                            <div id="cpm-icon-mode-off"><svg class="cpm-svg-icon" style="width:16px; height:16px; stroke-width:1.8;"><use href="#cpm-icon-pdf-mode-off"></use></svg></div>
                                            <div id="cpm-icon-mode-on" class="hidden"><svg class="cpm-svg-icon" style="width:16px; height:16px; stroke-width:1.8;"><use href="#cpm-icon-pdf-mode-on"></use></svg></div>
                                        </div>
                                        <div class="flex flex-col flex-1 min-w-0"><p class="text-[0.9375rem] text-text-300 group-hover:text-text-100">${t('pdf.forceModeText')}</p></div>
                                        <div class="flex items-center justify-center text-text-400" title="${t('tooltip.pdfHelp')}"><svg class="cpm-svg-icon" style="width:16px; height:16px; stroke-width:1.5;"><use href="#cpm-icon-help"></use></svg></div>
                                        <div class="group/switch relative select-none cursor-pointer ml-2">
                                            <input class="peer sr-only" type="checkbox" id="cpm-attachment-mode-toggle-switch">
                                            <div class="border-border-300 rounded-full peer:can-focus peer-disabled:opacity-50 bg-bg-500 transition-colors peer-checked:bg-accent-secondary-100" style="width: 28px; height: 16px;"></div>
                                            <div id="cpm-attachment-mode-toggle-slider" class="absolute start-[2px] top-[2px] rounded-full transition-all group-hover/switch:opacity-80 bg-white transition" style="height: 12px; width: 12px;"></div>
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
            const slider = document.getElementById('cpm-attachment-mode-toggle-slider');
            if (slider) {
                slider.style.transform = isInitialForceMode ? 'translateX(12px)' : '';
            }

            triggerBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); });

            const buttonInsideMenu = menu.querySelector('button.group');
            buttonInsideMenu.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                toggleSwitch.checked = !toggleSwitch.checked;
                const isForceMode = toggleSwitch.checked;

                this.state.forceUploadMode = isForceMode ? 'force' : 'default';
                this.updateSubPanelIcon(isForceMode);
                const slider = document.getElementById('cpm-attachment-mode-toggle-slider');
                if (slider) {
                    slider.style.transform = isForceMode ? 'translateX(12px)' : '';
                }
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
                        <span>${t('attachment.title')}</span>
                        <button class="cpm-icon-btn cpm-attachment-panel-close-btn" title="${t('attachment.close')}">
                             <svg class="cpm-svg-icon" style="width:16px; height:16px;"><use href="#cpm-icon-close"></use></svg>
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

                this.panelObserver = new MutationObserver(() => {
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
                <button class="cpm-preview-delete-btn" data-uuid="${fileInfo.uuid}" title="${t('attachment.removeFile')}">
                    <svg class="cpm-svg-icon" style="width:12px; height:12px;"><use href="#cpm-icon-close"></use></svg>
                </button>
                <a href="${previewUrl}" target="_blank" rel="noopener noreferrer" class="cpm-preview-thumbnail-link" title="${t('attachment.clickPreview')}: ${fileInfo.fileName}">
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

                if (url.includes('/completion') && (AttachmentEnhancer.state.stagedAttachments.length > 0 || NavigatorEnhancer.state.selectedParentMessageUUID)) {
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

                            if (NavigatorEnhancer.state.selectedParentMessageUUID) {
                                console.log("执行分支注入...");
                                payload.parent_message_uuid = NavigatorEnhancer.state.selectedParentMessageUUID;
                                NavigatorEnhancer.state.selectedParentMessageUUID = null;
                                setTimeout(() => NavigatorEnhancer.updateStatusIndicator(), 0);
                                console.log("分支注入完成。");
                            }

                            options.body = JSON.stringify(payload);
                        } catch (e) { console.error(LOG_PREFIX, "修改/completion请求体失败:", e);
                        } finally { console.groupEnd(); }
                    }
                }

                // 执行原始请求
                const response = originalFetch.apply(this, args);

                // 拦截 /completion 和 /retry_completion 的响应
                if (url.includes('/completion') || url.includes('/retry_completion')) {
                    return response.then(async (originalResponse) => {
                        try {
                            // 检查响应是否成功
                            if (originalResponse.ok) {
                                console.log(`%c${LOG_PREFIX} 响应拦截: ${url.includes('/retry_completion') ? '/retry_completion' : '/completion'} 请求成功完成`, 'color: #10b981; font-weight: bold;');

                                // 延迟清除对话树缓存，确保服务器端数据已更新完成
                                setTimeout(() => {
                                    ClaudeAPI.isInitialized = false;
                                    ClaudeAPI.conversationTree = null;
                                    ClaudeAPI.currentLinearBranch = null;
                                    console.log(`%c${LOG_PREFIX} 已清除对话树缓存，下次导航器访问时将重新获取最新数据`, 'color: #10b981;');
                                }, 500); // 延迟500ms，等待服务器处理完成
                            }
                        } catch (error) {
                            console.warn(`${LOG_PREFIX} 响应处理时出错:`, error);
                        }

                        return originalResponse;
                    }).catch((error) => {
                        console.error(`${LOG_PREFIX} 请求失败:`, error);
                        throw error;
                    });
                }

                return response;
            };
        },
        startObserver() {
            this.observer = new MutationObserver(() => this.onPageChange());
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.onPageChange();
        },
        cleanup() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            ThemeManager.cleanup();
        },
        onPageChange() {
            const currentUrl = location.href;

            // 检测对话切换
            ClaudeAPI.checkConversationChange();

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
                NavigatorEnhancer.init();
                AttachmentEnhancer.init();
                LinearNavEnhancer.init();
                NavigatorEnhancer.updateState(currentUrl);
                LinearNavEnhancer.updateState(currentUrl);
            } else {
                NavigatorEnhancer.cleanup();
                AttachmentEnhancer.cleanup();
                LinearNavEnhancer.cleanup();
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
            --cpm-mode-active: #2563eb; --cpm-mode-inactive: #6b7280;
        }
        body[cpm-theme='light'] #cpm-back-to-main,
        body[cpm-theme='light'] #cpm-batch-export-now-btn {
        color: hsl(var(--cpm-text-000)) !important;
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
        .cpm-batch-export-btn { background-color: hsl(var(--cpm-bg-300)); border: 1px solid hsl(var(--cpm-border-300)); padding: 8px; border-radius: 6px; }
        .cpm-batch-export-btn:hover { background-color: hsl(var(--cpm-bg-400)); border-color: hsl(var(--cpm-accent-secondary-100)); }
        .cpm-batch-export-btn svg { width: 20px !important; height: 20px !important; }
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
        .cpm-navigator-panel-override { width: 90vw; max-width: 1200px; height: 90vh; }
        .cpm-tree-container { flex-grow: 1; overflow-y: auto; overflow-x: auto; padding: 20px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 14px; background-color: hsl(var(--cpm-bg-200)); }
        .cpm-tree-node { margin-bottom: 10px; border-radius: 6px; min-width: fit-content; }
        .cpm-tree-node-header { margin: 0 0 5px 0; display: flex; align-items: baseline; gap: 10px; flex-wrap: nowrap; padding: 4px; white-space: nowrap; }
        .cpm-tree-node-id { color: hsl(var(--cpm-text-400)); font-size: 12px; flex-shrink: 0; }
        .cpm-tree-node-sender { font-weight: bold; flex-shrink: 0; }
        .sender-you { color: var(--cpm-sender-you-color); }
        .sender-claude { color: var(--cpm-sender-claude-color); }
        .cpm-tree-node-preview { color: hsl(var(--cpm-text-200)); white-space: nowrap; }
        .cpm-tree-attachments { color: hsl(var(--cpm-text-300)); font-size: 12px; padding-left: 20px; }
        .cpm-tree-attachments ul { list-style: none; padding-left: 10px; margin: 5px 0 0 0; }
        .cpm-tree-attachments li { margin-bottom: 4px; }
        .cpm-attachment-source { color: hsl(var(--cpm-accent-pro-100)); margin: 0 5px; font-style: italic; }
        .cpm-attachment-details { color: hsl(var(--cpm-text-400)); }
        .cpm-attachment-url { color: hsl(var(--cpm-accent-secondary-100)); text-decoration: none; }
        .cpm-attachment-url:hover { text-decoration: underline; }

        /* --- DIRTY DATA NODE STYLES --- */
        .cpm-dirty-node .cpm-tree-node-id { color: hsl(var(--cpm-danger-000)) !important; }
        .cpm-dirty-node .cpm-tree-node-sender { color: hsl(var(--cpm-danger-000)) !important; }

        /* --- ENHANCER-SPECIFIC STYLES --- */
        #cpm-branch-status-indicator { background-color: var(--cpm-branch-selected-bg); color: var(--cpm-branch-selected-text); padding: 2px 8px; font-size: 12px; border-radius: 12px; margin-left: 8px; font-weight: 500; animation: cpm-fadeIn 0.3s ease; }
        @keyframes cpm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        #cpm-branch-from-root-btn { border: 1px dashed hsl(var(--cpm-border-300)); padding: 10px; margin-bottom: 20px; text-align: center; font-weight: bold; color: hsl(var(--cpm-text-200)); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .cpm-node-clickable { cursor: pointer; transition: background-color 0.2s; }
        .cpm-node-clickable:hover, #cpm-branch-from-root-btn:hover { background-color: var(--cpm-branch-hover-bg); }
        .cpm-node-selected, #cpm-branch-from-root-btn.cpm-node-selected { background-color: var(--cpm-branch-selected-bg) !important; color: var(--cpm-branch-selected-text) !important; }
        .cpm-node-selected .cpm-tree-node-sender, .cpm-node-selected .cpm-tree-node-preview, .cpm-node-selected .cpm-tree-node-id { color: var(--cpm-branch-selected-text) !important; }

        /* --- MODE SELECTOR --- */
        .cpm-mode-selector { display: flex; gap: 8px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--cpm-border-200)); }
        .cpm-mode-btn { padding: 8px 16px; border: 1px solid hsl(var(--cpm-border-300)); background: transparent; color: var(--cpm-mode-inactive); border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; }
        .cpm-mode-btn:hover { background-color: hsl(var(--cpm-bg-200)); }
        .cpm-mode-btn.active { background-color: var(--cpm-mode-active); color: white; border-color: var(--cpm-mode-active); }

        /* --- 高亮动画 --- */
        .highlight-pulse { animation: cpm-highlight-pulse 3s ease-out; }
        @keyframes cpm-highlight-pulse {
            0%, 100% { background-color: rgba(255, 243, 205, 0); }
            20% { background-color: rgba(255, 243, 205, 1); }
        }
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

        /* --- LINEAR NAVIGATION UI --- */
        /* 基础容器 */
        #cpm-ln-nav {
            position: fixed;
            top: 120px;
            right: 20px;
            width: auto;
            min-width: 80px;
            max-width: 210px;
            z-index: 2147483647 !important;
            font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            pointer-events: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            background-color: hsl(var(--cpm-bg-100));
            border: 1px solid hsl(var(--cpm-border-300));
            border-radius: 8px;
            box-shadow: 0 10px 25px hsla(var(--cpm-text-000), 0.15);
        }
        #cpm-ln-nav.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
        #cpm-ln-nav * { user-select: none; }

        /* 头部区域 */
        .cpm-ln-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
            margin-bottom: 4px;
            cursor: move;
            min-width: 100px;
            border-bottom: 1px solid hsl(var(--cpm-border-200));
        }

        .cpm-ln-title {
            font: 600 11px/1 inherit;
            color: hsl(var(--cpm-text-200));
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .cpm-ln-title svg { width: 12px; height: 12px; }

        .cpm-ln-close, .cpm-ln-refresh {
            width: 22px;
            height: 22px;
            font-size: 14px;
            background: none;
            border: none;
            color: hsl(var(--cpm-text-400));
            cursor: pointer;
            padding: 3px;
            border-radius: 4px;
            transition: color 0.2s, background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .cpm-ln-close:hover, .cpm-ln-refresh:hover {
            color: hsl(var(--cpm-text-100));
            background-color: hsl(var(--cpm-bg-200));
        }

        /* 列表区域 */
        .cpm-ln-list {
            max-height: 400px;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px;
        }
        .cpm-ln-list::-webkit-scrollbar { width: 3px; }
        .cpm-ln-list::-webkit-scrollbar-thumb {
            background: hsla(var(--cpm-text-400), 0.3);
            border-radius: 2px;
        }
        .cpm-ln-list::-webkit-scrollbar-thumb:hover {
            background: hsla(var(--cpm-text-400), 0.5);
        }

        /* 列表项 */
        .cpm-ln-item {
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 12px;
            min-height: 24px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: auto;
            min-width: 60px;
            max-width: 190px;
            background-color: hsl(var(--cpm-bg-200));
        }
        .cpm-ln-item:hover {
            transform: translateX(2px);
            box-shadow: 0 2px 6px hsla(var(--cpm-always-black), 0.12);
            background-color: hsl(var(--cpm-bg-300));
        }

        /* 用户/助手样式 */
        .cpm-ln-item.user {
            color: hsl(var(--cpm-accent-secondary-100));
            border-left: 3px solid hsl(var(--cpm-accent-secondary-100));
            font-weight: 500;
        }
        .cpm-ln-item.assistant {
            color: hsl(var(--cpm-accent-brand));
            border-left: 3px solid hsl(var(--cpm-accent-brand));
            font-weight: 500;
        }
        .cpm-ln-item.active {
            border: 2px solid hsl(var(--cpm-accent-pro-100));
            box-shadow: 0 2px 8px hsla(var(--cpm-accent-pro-100), 0.2);
            background-color: hsl(var(--cpm-bg-400));
        }

        .cpm-ln-number {
            margin-right: 4px;
            font: 600 11px/1 inherit;
            color: hsl(var(--cpm-text-400));
        }

        .cpm-ln-empty {
            padding: 10px;
            text-align: center;
            color: hsl(var(--cpm-text-400));
            font-size: 11px;
            min-height: 20px;
        }

        /* 上下置顶置底按钮 */
        .cpm-ln-footer {
            margin-top: 8px;
            display: flex;
            gap: 4px;
            padding: 8px;
            border-top: 1px solid hsl(var(--cpm-border-200));
        }

        /* 导航按钮统一样式（四个按钮共用） */
        .cpm-ln-nav-btn {
            flex: 1 1 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            color: hsl(var(--cpm-text-300));
            background: hsl(var(--cpm-bg-200));
            border: 1px solid hsl(var(--cpm-border-300));
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            line-height: 1;
        }
        .cpm-ln-nav-btn .cpm-svg-icon {
            width: 14px;
            height: 14px;
        }
        .cpm-ln-nav-btn:hover {
            color: hsl(var(--cpm-text-100));
            border-color: hsl(var(--cpm-accent-secondary-100));
            background-color: hsl(var(--cpm-bg-300));
        }

    `);


    // =========================================================================
    // 11. 辅助工具 & 启动脚本
    // =========================================================================

    App.init();

})(unsafeWindow);