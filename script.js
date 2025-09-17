// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// CTA button click handlers
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
        // Show analysis modal
        showAnalysisModal();
    });
});

// Analysis modal functionality
function showAnalysisModal() {
    const modal = createModal();
    document.body.appendChild(modal);

    // Animate modal entrance
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>开始AI股票分析</h2>
            <form id="analysis-form">
                <div class="form-group">
                    <label for="stock-code">股票代码/名称</label>
                    <input type="text" id="stock-code" placeholder="请输入股票代码或名称" required>
                </div>
                <div class="form-group">
                    <label for="analysis-type">分析类型</label>
                    <select id="analysis-type">
                        <option value="comprehensive">综合分析</option>
                        <option value="technical">技术分析</option>
                        <option value="fundamental">基本面分析</option>
                        <option value="news">新闻情绪分析</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="time-frame">时间周期</label>
                    <select id="time-frame">
                        <option value="1d">1天</option>
                        <option value="1w">1周</option>
                        <option value="1m">1个月</option>
                        <option value="3m">3个月</option>
                        <option value="1y">1年</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">开始分析</button>
            </form>
            <div class="analysis-result" id="analysis-result"></div>
        </div>
    `;

    // Close modal functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Form submission
    modal.querySelector('#analysis-form').addEventListener('submit', (e) => {
        e.preventDefault();
        performAnalysis(modal);
    });

    return modal;
}

function performAnalysis(modal) {
    const stockCode = modal.querySelector('#stock-code').value;
    const analysisType = modal.querySelector('#analysis-type').value;
    const timeFrame = modal.querySelector('#time-frame').value;
    const resultDiv = modal.querySelector('#analysis-result');

    // Show loading
    resultDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>AI正在分析中...</p>
        </div>
    `;
    resultDiv.style.display = 'block';

    // Simulate analysis (replace with actual API call)
    setTimeout(() => {
        const prediction = Math.floor(Math.random() * 30) + 70; // Random between 70-100
        const trend = Math.random() > 0.5 ? '上涨' : '下跌';
        const percentage = (Math.random() * 20 + 5).toFixed(2);

        resultDiv.innerHTML = `
            <div class="result-success">
                <h3>分析完成</h3>
                <div class="result-details">
                    <div class="result-item">
                        <span class="label">股票代码：</span>
                        <span class="value">${stockCode.toUpperCase()}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">预测准确率：</span>
                        <span class="value highlight">${prediction}%</span>
                    </div>
                    <div class="result-item">
                        <span class="label">趋势预测：</span>
                        <span class="value ${trend === '上涨' ? 'up' : 'down'}">${trend} ${percentage}%</span>
                    </div>
                    <div class="result-item">
                        <span class="label">建议操作：</span>
                        <span class="value">${trend === '上涨' ? '买入' : '观望'}</span>
                    </div>
                </div>
                <button class="download-btn" onclick="downloadReport()">下载完整报告</button>
            </div>
        `;
    }, 2000);
}

function downloadReport() {
    alert('报告生成中，请稍候...');
    // Implement actual download functionality
}

// Add modal styles dynamically
const modalStyles = document.createElement('style');
modalStyles.textContent = `
.modal {
    display: flex;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal.show {
    opacity: 1;
}

.modal-content {
    background: linear-gradient(135deg, #1a237e, #0f1535);
    border-radius: 20px;
    padding: 40px;
    max-width: 500px;
    width: 90%;
    position: relative;
    transform: scale(0.9);
    transition: transform 0.3s ease;
    border: 1px solid rgba(255, 162, 0, 0.3);
}

.modal.show .modal-content {
    transform: scale(1);
}

.close-modal {
    position: absolute;
    right: 20px;
    top: 20px;
    font-size: 30px;
    color: #fff;
    cursor: pointer;
    transition: color 0.3s ease;
}

.close-modal:hover {
    color: #ffa200;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #ffa200;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 16px;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #ffa200;
    background: rgba(255, 255, 255, 0.15);
}

.submit-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #ffa200, #ff6b00);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 162, 0, 0.4);
}

.analysis-result {
    display: none;
    margin-top: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.loading {
    text-align: center;
    padding: 20px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 162, 0, 0.3);
    border-top-color: #ffa200;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.result-success {
    animation: fadeIn 0.5s ease;
}

.result-details {
    margin: 20px 0;
}

.result-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.result-item .label {
    color: #b0b0b0;
}

.result-item .value {
    color: #fff;
    font-weight: 600;
}

.result-item .value.highlight {
    color: #4caf50;
    font-size: 1.2em;
}

.result-item .value.up {
    color: #4caf50;
}

.result-item .value.down {
    color: #f44336;
}

.download-btn {
    width: 100%;
    padding: 12px;
    background: #25D366;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.download-btn:hover {
    background: #1FA855;
    transform: translateY(-2px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(modalStyles);

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.querySelectorAll('.features, .how-it-works, .cta-section').forEach(section => {
    observer.observe(section);
});

// Add scroll animation styles
const scrollStyles = document.createElement('style');
scrollStyles.textContent = `
.features,
.how-it-works,
.cta-section {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.animate-in {
    opacity: 1;
    transform: translateY(0);
}
`;
document.head.appendChild(scrollStyles);

// WhatsApp link handler
document.querySelector('.whatsapp-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const message = encodeURIComponent('你好，我想获取AI股票分析报告');
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
});

// Add hover effects to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Dynamic year update
document.addEventListener('DOMContentLoaded', () => {
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
});

// Performance optimization - lazy load images if any
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}