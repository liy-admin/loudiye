// 联系方式轮询组件 - 可嵌入到任何页面
(function() {
    'use strict';

    // 配置
    const CONFIG = {
        apiUrl: 'https://your-worker.workers.dev', // 替换为你的 Cloudflare Worker URL
        refreshInterval: 30000, // 30秒自动刷新一次联系方式
        position: 'bottom-right', // 位置: bottom-right, bottom-left, top-right, top-left
        theme: 'dark', // 主题: dark, light
        autoRotate: true, // 是否自动轮换
        showMultiple: false, // 是否同时显示多个联系方式
        maxContacts: 3 // 最多同时显示的联系方式数量
    };

    // 组件类
    class ContactWidget {
        constructor(options = {}) {
            this.config = { ...CONFIG, ...options };
            this.currentContact = null;
            this.contacts = [];
            this.container = null;
            this.refreshTimer = null;
            this.init();
        }

        // 初始化
        init() {
            this.createStyles();
            this.createContainer();
            this.loadContact();

            if (this.config.autoRotate) {
                this.startAutoRotate();
            }
        }

        // 创建样式
        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .cw-widget {
                    position: fixed;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .cw-widget.bottom-right {
                    bottom: 20px;
                    right: 20px;
                }

                .cw-widget.bottom-left {
                    bottom: 20px;
                    left: 20px;
                }

                .cw-widget.top-right {
                    top: 20px;
                    right: 20px;
                }

                .cw-widget.top-left {
                    top: 20px;
                    left: 20px;
                }

                .cw-toggle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    color: white;
                    font-size: 24px;
                }

                .cw-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
                }

                .cw-panel {
                    position: absolute;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    padding: 20px;
                    min-width: 300px;
                    display: none;
                    animation: cwSlideIn 0.3s ease-out;
                }

                .cw-panel.show {
                    display: block;
                }

                .cw-widget.bottom-right .cw-panel,
                .cw-widget.bottom-left .cw-panel {
                    bottom: 80px;
                }

                .cw-widget.top-right .cw-panel,
                .cw-widget.top-left .cw-panel {
                    top: 80px;
                }

                .cw-widget.bottom-right .cw-panel,
                .cw-widget.top-right .cw-panel {
                    right: 0;
                }

                .cw-widget.bottom-left .cw-panel,
                .cw-widget.top-left .cw-panel {
                    left: 0;
                }

                @keyframes cwSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .cw-panel.dark {
                    background: #2a2a2a;
                    color: white;
                }

                .cw-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .cw-panel.dark .cw-header {
                    border-bottom-color: #444;
                }

                .cw-title {
                    font-size: 16px;
                    font-weight: 600;
                }

                .cw-close {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #f0f0f0;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.3s;
                }

                .cw-panel.dark .cw-close {
                    background: #444;
                    color: white;
                }

                .cw-close:hover {
                    background: #e0e0e0;
                }

                .cw-contact {
                    padding: 15px;
                    background: #f8f8f8;
                    border-radius: 10px;
                    margin-bottom: 10px;
                    transition: all 0.3s;
                }

                .cw-panel.dark .cw-contact {
                    background: #333;
                }

                .cw-contact:hover {
                    transform: translateX(5px);
                }

                .cw-contact-type {
                    display: inline-block;
                    padding: 2px 8px;
                    background: #667eea;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    margin-bottom: 8px;
                }

                .cw-contact-name {
                    font-weight: 500;
                    margin-bottom: 5px;
                }

                .cw-contact-value {
                    color: #666;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .cw-panel.dark .cw-contact-value {
                    color: #aaa;
                }

                .cw-contact-value:hover {
                    color: #667eea;
                }

                .cw-copy-icon {
                    width: 16px;
                    height: 16px;
                    opacity: 0.6;
                }

                .cw-qrcode {
                    width: 150px;
                    height: 150px;
                    margin-top: 10px;
                    border: 2px solid #f0f0f0;
                    border-radius: 8px;
                }

                .cw-panel.dark .cw-qrcode {
                    border-color: #444;
                }

                .cw-action-button {
                    display: inline-block;
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.3s;
                }

                .cw-action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .cw-loading {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                }

                .cw-panel.dark .cw-loading {
                    color: #aaa;
                }

                .cw-refresh {
                    margin-top: 10px;
                    text-align: center;
                }

                .cw-refresh button {
                    padding: 6px 12px;
                    background: #f0f0f0;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.3s;
                }

                .cw-panel.dark .cw-refresh button {
                    background: #444;
                    color: white;
                }

                .cw-refresh button:hover {
                    background: #e0e0e0;
                }

                .cw-panel.dark .cw-refresh button:hover {
                    background: #555;
                }

                @media (max-width: 480px) {
                    .cw-panel {
                        min-width: 260px;
                        right: -20px !important;
                        left: auto !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 创建容器
        createContainer() {
            // 主容器
            this.container = document.createElement('div');
            this.container.className = `cw-widget ${this.config.position}`;

            // 切换按钮
            const toggle = document.createElement('div');
            toggle.className = 'cw-toggle';
            toggle.innerHTML = '💬';
            toggle.onclick = () => this.togglePanel();

            // 面板
            const panel = document.createElement('div');
            panel.className = `cw-panel ${this.config.theme}`;
            panel.innerHTML = `
                <div class="cw-header">
                    <div class="cw-title">联系我们</div>
                    <button class="cw-close" onclick="contactWidget.togglePanel()">✕</button>
                </div>
                <div class="cw-content">
                    <div class="cw-loading">加载中...</div>
                </div>
                <div class="cw-refresh">
                    <button onclick="contactWidget.loadContact()">刷新联系方式</button>
                </div>
            `;

            this.container.appendChild(toggle);
            this.container.appendChild(panel);
            document.body.appendChild(this.container);
        }

        // 切换面板显示
        togglePanel() {
            const panel = this.container.querySelector('.cw-panel');
            panel.classList.toggle('show');

            if (panel.classList.contains('show') && !this.currentContact) {
                this.loadContact();
            }
        }

        // 加载联系方式
        async loadContact() {
            const content = this.container.querySelector('.cw-content');
            content.innerHTML = '<div class="cw-loading">加载中...</div>';

            try {
                let contacts = [];

                if (this.config.showMultiple) {
                    // 加载多个联系方式
                    const response = await fetch(`${this.config.apiUrl}/api/contacts/all`);
                    const data = await response.json();
                    contacts = data.contacts.filter(c => c.available).slice(0, this.config.maxContacts);
                } else {
                    // 加载单个联系方式
                    const response = await fetch(`${this.config.apiUrl}/api/contact`);
                    const data = await response.json();
                    contacts = [data.contact];
                }

                this.contacts = contacts;
                this.displayContacts(contacts);
            } catch (error) {
                console.error('Failed to load contact:', error);
                content.innerHTML = `
                    <div style="text-align: center; color: #999;">
                        加载失败，请稍后重试
                    </div>
                `;
            }
        }

        // 显示联系方式
        displayContacts(contacts) {
            const content = this.container.querySelector('.cw-content');
            let html = '';

            contacts.forEach(contact => {
                html += this.renderContact(contact);
            });

            content.innerHTML = html;
        }

        // 渲染单个联系方式
        renderContact(contact) {
            let html = '<div class="cw-contact">';

            // 类型标签
            const typeLabels = {
                wechat: '微信',
                qq: 'QQ',
                phone: '电话',
                telegram: 'Telegram',
                email: '邮箱'
            };
            html += `<span class="cw-contact-type">${typeLabels[contact.type] || contact.type}</span>`;

            // 名称
            if (contact.name) {
                html += `<div class="cw-contact-name">${contact.name}</div>`;
            }

            // 联系方式值
            html += `
                <div class="cw-contact-value" onclick="contactWidget.copyToClipboard('${contact.value}')">
                    ${contact.value}
                    <svg class="cw-copy-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </div>
            `;

            // 二维码
            if (contact.qrcode) {
                html += `<img src="${contact.qrcode}" alt="二维码" class="cw-qrcode">`;
            }

            // 操作按钮
            if (contact.link) {
                html += `<a href="${contact.link}" target="_blank" class="cw-action-button">立即咨询</a>`;
            } else if (contact.type === 'phone') {
                html += `<a href="tel:${contact.value.replace(/\s+/g, '')}" class="cw-action-button">立即拨打</a>`;
            }

            html += '</div>';
            return html;
        }

        // 复制到剪贴板
        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast('已复制到剪贴板');
                }).catch(err => {
                    console.error('复制失败:', err);
                    this.fallbackCopy(text);
                });
            } else {
                this.fallbackCopy(text);
            }
        }

        // 降级复制方案
        fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showToast('已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
            }
            document.body.removeChild(textarea);
        }

        // 显示提示
        showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 10000;
                font-size: 14px;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 2000);
        }

        // 开始自动轮换
        startAutoRotate() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            this.refreshTimer = setInterval(() => {
                if (this.container.querySelector('.cw-panel.show')) {
                    this.loadContact();
                }
            }, this.config.refreshInterval);
        }

        // 停止自动轮换
        stopAutoRotate() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        }

        // 销毁组件
        destroy() {
            this.stopAutoRotate();
            if (this.container) {
                document.body.removeChild(this.container);
            }
        }
    }

    // 导出到全局
    window.ContactWidget = ContactWidget;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.contactWidget = new ContactWidget();
        });
    } else {
        window.contactWidget = new ContactWidget();
    }
})();

// 使用示例
// 在页面中引入此脚本后，可以通过以下方式自定义配置：
/*
<script>
    // 方式1：在脚本加载前设置全局配置
    window.ContactWidgetConfig = {
        apiUrl: 'https://your-worker.workers.dev',
        position: 'bottom-left',
        theme: 'light',
        autoRotate: false
    };
</script>
<script src="contact-widget.js"></script>

// 方式2：手动初始化
<script src="contact-widget.js"></script>
<script>
    // 销毁自动创建的实例
    if (window.contactWidget) {
        window.contactWidget.destroy();
    }

    // 创建新实例
    window.contactWidget = new ContactWidget({
        apiUrl: 'https://your-worker.workers.dev',
        position: 'top-right',
        theme: 'dark',
        showMultiple: true,
        maxContacts: 3
    });
</script>
*/