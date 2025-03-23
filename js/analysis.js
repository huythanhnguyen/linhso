// === Phiên bản đơn giản hóa cho analysis.js ===

/**
 * Hàm chuẩn hóa dữ liệu phân tích
 */
// Thêm hàm này vào phần đầu của file analysis.js
function normalizeAnalysisData(data) {
    // Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
    const normalized = { ...data };
    
    // Kiểm tra và chuẩn hóa dữ liệu
    
    // 1. Đảm bảo có phoneNumber
    if (!normalized.phoneNumber && data.result && data.result.phoneNumber) {
        normalized.phoneNumber = data.result.phoneNumber;
    }
    
    // 2. Đảm bảo có các thuộc tính quan trọng
    if (data.result) {
        // Lấy dữ liệu từ result nếu không có trực tiếp
        if (!normalized.balance && data.result.balance) {
            normalized.balance = data.result.balance;
        }
        
        if (!normalized.energyLevel && data.result.energyLevel) {
            normalized.energyLevel = data.result.energyLevel;
        }
        
        if (!normalized.starSequence && data.result.starSequence) {
            normalized.starSequence = data.result.starSequence;
        }
        
        if (!normalized.starCombinations && data.result.starCombinations) {
            normalized.starCombinations = data.result.starCombinations;
        }
        
        if (!normalized.keyCombinations && data.result.keyCombinations) {
            normalized.keyCombinations = data.result.keyCombinations;
        }
        
        if (!normalized.dangerousCombinations && data.result.dangerousCombinations) {
            normalized.dangerousCombinations = data.result.dangerousCombinations;
        }
    }
    
    // 3. Đảm bảo các mảng không undefined
    if (!normalized.starSequence) normalized.starSequence = [];
    if (!normalized.starCombinations) normalized.starCombinations = [];
    if (!normalized.keyCombinations) normalized.keyCombinations = [];
    if (!normalized.dangerousCombinations) normalized.dangerousCombinations = [];
    
    console.log('Dữ liệu sau chuẩn hóa:', normalized);
    return normalized;
}

// Sau đó, sửa đổi các hàm gọi đến dữ liệu phân tích
// Ví dụ:
// Trong hàm createAnalysisElement:
function createAnalysisElement(analysisData) {
    // Chuẩn hóa dữ liệu
    analysisData = normalizeAnalysisData(analysisData);
    
    // Phần còn lại của hàm...
}

// Trong hàm createDetailModal:
function createDetailModal(analysisData) {
    // Chuẩn hóa dữ liệu
    analysisData = normalizeAnalysisData(analysisData);
    
    // Phần còn lại của hàm...
}
/**
 * Hàm định dạng số điện thoại
 */
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    const cleaned = String(phoneNumber).replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (cleaned.length === 11) {
        return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    
    return cleaned;
}

/**
 * Hàm tạo phần tử phân tích
 * @param {object} analysisData - Dữ liệu phân tích từ API
 * @returns {HTMLElement} - Phần tử DOM chứa dữ liệu phân tích
 */
function createAnalysisElement(analysisData) {
    // Chuẩn hóa dữ liệu
    analysisData = normalizeAnalysisData(analysisData);
    
    // Tạo phần tử từ template
    const template = document.getElementById('analysis-container-template');
    if (!template) {
        console.error('Template phân tích không tìm thấy');
        return null;
    }
    
    const analysisElement = template.content.cloneNode(true);
    const container = analysisElement.querySelector('.analysis-container');
    
    // Điền số điện thoại
    container.querySelector('.phone-number').textContent = formatPhoneNumber(analysisData.phoneNumber);
    
    // Render các sao chủ đạo
    renderStars(container, analysisData.starSequence);
    
    // Render tổ hợp sao
    renderStarCombinations(container, analysisData.starCombinations);
    
    // Render cân bằng năng lượng
    renderEnergyBalance(container, analysisData);
    
    // Thiết lập sự kiện cho nút toggle chi tiết
    const toggleBtn = container.querySelector('.details-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            console.log("Đã nhấn nút chi tiết!", analysisData);
            // Kiểm tra trạng thái hiển thị chi tiết
            const isExpanded = this.getAttribute('data-expanded') === 'true';
            
            if (isExpanded) {
                // Nếu đang mở, ẩn chi tiết
                const detailedView = container.querySelector('.detailed-view');
                if (detailedView) {
                    detailedView.remove();
                }
                
                this.textContent = 'Xem chi tiết';
                this.setAttribute('data-expanded', 'false');
            } else {
                // Nếu đang ẩn, hiển thị chi tiết
                showDetailModal(analysisData);
                
                this.textContent = 'Ẩn chi tiết';
                this.setAttribute('data-expanded', 'true');
            }
        });
    }
    
    // Thêm lớp CSS để hiển thị animation khi mới tạo
    container.classList.add('highlight-new');
    
    // Xóa lớp CSS sau 2 giây
    setTimeout(() => {
        container.classList.remove('highlight-new');
    }, 2000);
    
    return container;
}

/**
 * Hàm hiển thị các sao
 */
function renderStars(container, stars) {
    if (!stars || !stars.length) return;
    
    const starList = container.querySelector('.star-list');
    if (!starList) return;
    
    // Xóa nội dung cũ
    starList.innerHTML = '';
    
    // Sắp xếp sao theo năng lượng (cao nhất trước)
    const sortedStars = [...stars].sort((a, b) => b.energyLevel - a.energyLevel);
    
    // Hiển thị tối đa 3 sao
    const displayStars = sortedStars.slice(0, 3);
    
    // Tạo phần tử cho mỗi sao
    displayStars.forEach(star => {
        const starItem = document.createElement('div');
        starItem.className = `star-item ${star.nature === 'Cát' ? 'cat' : star.nature === 'Hung' ? 'hung' : ''}`;
        
        // Xác định màu cho energy dots dựa trên nature của sao
        const dotType = star.nature === 'Cát' ? 'cat' : 
                       (star.nature === 'Hung' ? 'hung' : 
                       (star.nature === 'Cát hóa hung' ? 'cat-hung' : 'neutral'));
        
        // Tạo HTML cho dots hiển thị năng lượng
        let energyDotsHTML = '';
        for (let i = 0; i < 4; i++) {
            energyDotsHTML += `<div class="energy-dot ${dotType} ${i < star.energyLevel ? 'active' : ''}"></div>`;
        }
        
        // Nội dung star item
        starItem.innerHTML = `
            <div class="star-header">
                <div class="star-name">${star.name}</div>
                <div class="star-pair">${star.originalPair}</div>
            </div>
            <div class="star-energy">
                <div class="energy-label">Năng lượng:</div>
                <div class="energy-indicator">
                    ${energyDotsHTML}
                </div>
            </div>
        `;
        
        // Thêm vào danh sách
        starList.appendChild(starItem);
    });
}

/**
 * Hàm hiển thị tổ hợp sao
 */
function renderStarCombinations(container, starCombinations) {
    if (!starCombinations || !starCombinations.length) return;
    
    const starCombosContainer = container.querySelector('.star-combinations-list');
    if (!starCombosContainer) return;
    
    // Xóa nội dung cũ
    starCombosContainer.innerHTML = '';
    
    // Hiển thị tối đa 2 tổ hợp
    const displayCombos = starCombinations.slice(0, 2);
    
    // Thêm từng tổ hợp sao
    displayCombos.forEach(combo => {
        const comboItem = document.createElement('div');
        comboItem.className = 'star-combo-item';
        
        const firstStarNature = combo.firstStar && combo.firstStar.nature === 'Cát' ? 'auspicious' : 
                             (combo.firstStar && combo.firstStar.nature === 'Hung' ? 'inauspicious' : '');
                             
        const secondStarNature = combo.secondStar && combo.secondStar.nature === 'Cát' ? 'auspicious' : 
                              (combo.secondStar && combo.secondStar.nature === 'Hung' ? 'inauspicious' : '');
        
        // Tính tổng năng lượng
        const firstStarEnergy = combo.firstStar ? combo.firstStar.energyLevel || 0 : 0;
        const secondStarEnergy = combo.secondStar ? combo.secondStar.energyLevel || 0 : 0;
        const totalEnergy = combo.totalEnergy || (firstStarEnergy + secondStarEnergy);
        
        // Xác định màu dựa vào tính chất của tổ hợp
        const isPositive = combo.isPositive || 
                         (combo.firstStar && combo.secondStar && 
                          combo.firstStar.nature === 'Cát' && 
                          combo.secondStar.nature === 'Cát');
                          
        const isNegative = combo.isNegative || 
                         (combo.firstStar && combo.secondStar && 
                          combo.firstStar.nature === 'Hung' && 
                          combo.secondStar.nature === 'Hung');
                          
        const dotType = isPositive ? 'cat' : (isNegative ? 'hung' : 'mixed');
        
        // Tạo HTML cho dots hiển thị năng lượng (tối đa 8 dots)
        let energyDotsHTML = '';
        const maxDots = 8; // Max là 8 dots (2 sao * 4 năng lượng mỗi sao)
        const energyLevel = Math.min(totalEnergy, maxDots);
        
        for (let i = 0; i < maxDots; i++) {
            energyDotsHTML += `<div class="energy-dot ${dotType} ${i < energyLevel ? 'active' : ''}"></div>`;
        }
        
        // HTML cho tổ hợp
        comboItem.innerHTML = `
            <div class="star-combo-header">
                <span class="star-name ${firstStarNature}">${combo.firstStar ? combo.firstStar.name : ''}</span>
                <span class="combo-plus">+</span>
                <span class="star-name ${secondStarNature}">${combo.secondStar ? combo.secondStar.name : ''}</span>
            </div>
            <div class="star-combo-energy">
                <div class="energy-label">Tổng năng lượng: ${totalEnergy}</div>
                <div class="energy-indicator">
                    ${energyDotsHTML}
                </div>
            </div>
            <div class="star-combo-desc">${combo.description || ''}</div>
        `;
        
        // Thêm vào container
        starCombosContainer.appendChild(comboItem);
    });
}

/**
 * Hàm hiển thị cân bằng năng lượng
 */
function renderEnergyBalance(container, analysisData) {
    if (!analysisData || !analysisData.energyLevel) return;
    
    const energyBalance = container.querySelector('.energy-balance');
    if (!energyBalance) return;
    
    // Xóa nội dung cũ
    energyBalance.innerHTML = '';
    
    // Tạo text hiển thị cân bằng
    const balanceText = document.createElement('div');
    
    // Kiểm tra và sử dụng giá trị balance
    if (analysisData.balance) {
        switch(analysisData.balance) {
            case 'BALANCED':
                balanceText.textContent = 'Cân bằng tốt giữa sao cát và hung';
                balanceText.className = 'balance-text balanced';
                break;
            case 'CAT_HEAVY':
                balanceText.textContent = 'Thiên về sao cát (>70%)';
                balanceText.className = 'balance-text cat-heavy';
                break;
            case 'HUNG_HEAVY':
                balanceText.textContent = 'Thiên về sao hung (>70%)';
                balanceText.className = 'balance-text hung-heavy';
                break;
            default:
                balanceText.textContent = 'Cân bằng không xác định';
                balanceText.className = 'balance-text unknown';
        }
    } else {
        balanceText.textContent = 'Cân bằng không xác định';
        balanceText.className = 'balance-text unknown';
    }
    
    energyBalance.appendChild(balanceText);
    
    // Thêm mức năng lượng
    const totalEnergy = analysisData.energyLevel.total || 0;
    const catEnergy = analysisData.energyLevel.cat || 0;
    const hungEnergy = Math.abs(analysisData.energyLevel.hung || 0);
    
    // HTML cho energy levels
    const energyLevelsHtml = `
        <div class="energy-levels">
            <div class="energy-item">
                <span class="energy-label">Tổng:</span>
                <span class="energy-value">${totalEnergy}</span>
            </div>
            <div class="energy-item">
                <span class="energy-label">Cát:</span>
                <span class="energy-value positive">${catEnergy}</span>
            </div>
            <div class="energy-item">
                <span class="energy-label">Hung:</span>
                <span class="energy-value negative">${hungEnergy}</span>
            </div>
            ${analysisData.energyLevel.ratio ? `
            <div class="energy-item">
                <span class="energy-label">Tỷ lệ:</span>
                <span class="energy-value">${analysisData.energyLevel.ratio.toFixed(2)}</span>
            </div>` : ''}
        </div>
    `;
    
    energyBalance.innerHTML += energyLevelsHtml;
    
    // Thêm biểu đồ trực quan (nếu cần)
    if (window.addEnergyChart && typeof window.addEnergyChart === 'function') {
        window.addEnergyChart(analysisData.energyLevel);
    }
}
/**
 * Hàm hiển thị modal chi tiết
 */
function showDetailModal(analysisData) {
    // Chuẩn hóa dữ liệu
    analysisData = normalizeAnalysisData(analysisData);
    
    console.log("Dữ liệu phân tích cho modal:", analysisData);
    
    // Xóa modal cũ nếu có
    let existingModal = document.getElementById('analysis-detail-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Tạo modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'analysis-detail-modal';
    modalContainer.className = 'modal-container';
    
    // Tạo nội dung modal
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chi tiết phân tích số: <span>${formatPhoneNumber(analysisData.phoneNumber)}</span></h3>
                <button class="modal-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <!-- Phần các sao -->
                <h4 style="margin-top: 0; color: var(--primary-color);">Các Sao</h4>
                <div class="stars-detail">
               
                ${analysisData.starSequence.length > 0 ? 
                    analysisData.starSequence.map(star => {
                        const dotType = star.nature === 'Cát' ? 'cat' : 
                                      (star.nature === 'Hung' ? 'hung' : 
                                      (star.nature === 'Cát hóa hung' ? 'cat-hung' : 'neutral'));
                        
                        let energyDotsHTML = '';
                        for (let i = 0; i < 4; i++) {
                            energyDotsHTML += `<div class="energy-dot ${dotType} ${i < star.energyLevel ? 'active' : ''}"></div>`;
                        }
                        
                        return `
                        <div class="star-detail-item ${star.nature === 'Cát' ? 'cat' : star.nature === 'Hung' ? 'hung' : ''}">
                            <div class="star-detail-name">${star.name}</div>
                            <div class="star-detail-pair">${star.originalPair}</div>
                            <div class="star-detail-nature">${star.nature}</div>
                            <div class="star-detail-energy">
                                <span>Năng lượng: ${star.energyLevel}/4</span>
                                <div class="energy-indicator detail-energy">
                                    ${energyDotsHTML}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('') : 
                    '<div class="empty-detail">Không có sao nào.</div>'
                }
                </div>
                
                <!-- Phần tổ hợp sao -->
                <h4 style="margin-top: 20px; color: var(--primary-color);">Tổ Hợp Sao</h4>
                <div class="star-combos-detail">
                
                ${analysisData.starCombinations.length > 0 ? 
                    analysisData.starCombinations.map(combo => {
                        // Tính tổng năng lượng
                        const firstStarEnergy = combo.firstStar ? combo.firstStar.energyLevel || 0 : 0;
                        const secondStarEnergy = combo.secondStar ? combo.secondStar.energyLevel || 0 : 0;
                        const totalEnergy = combo.totalEnergy || (firstStarEnergy + secondStarEnergy);
                        
                        // Xác định màu dựa vào tính chất
                        const isPositive = combo.isPositive || 
                                       (combo.firstStar && combo.secondStar && 
                                        combo.firstStar.nature === 'Cát' && 
                                        combo.secondStar.nature === 'Cát');
                                        
                        const isNegative = combo.isNegative || 
                                       (combo.firstStar && combo.secondStar && 
                                        combo.firstStar.nature === 'Hung' && 
                                        combo.secondStar.nature === 'Hung');
                                        
                        const dotType = isPositive ? 'cat' : (isNegative ? 'hung' : 'mixed');
                        
                        // Tạo HTML cho dots
                        let energyDotsHTML = '';
                        const maxDots = 8;
                        const energyLevel = Math.min(totalEnergy, maxDots);
                        
                        for (let i = 0; i < maxDots; i++) {
                            energyDotsHTML += `<div class="energy-dot ${dotType} ${i < energyLevel ? 'active' : ''}"></div>`;
                        }
                        
                        return `
                        <div class="star-combo-detail">
                            <div class="combo-header">
                                <span class="${combo.firstStar && combo.firstStar.nature === 'Cát' ? 'auspicious' : (combo.firstStar && combo.firstStar.nature === 'Hung' ? 'inauspicious' : '')}">${combo.firstStar ? combo.firstStar.name : ''}</span>
                                <span class="plus">+</span>
                                <span class="${combo.secondStar && combo.secondStar.nature === 'Cát' ? 'auspicious' : (combo.secondStar && combo.secondStar.nature === 'Hung' ? 'inauspicious' : '')}">${combo.secondStar ? combo.secondStar.name : ''}</span>
                            </div>
                            <div class="combo-energy">
                                <span>Tổng năng lượng: ${totalEnergy}</span>
                                <div class="energy-indicator detail-energy">
                                    ${energyDotsHTML}
                                </div>
                            </div>
                            <div class="combo-description">${combo.description || ''}</div>
                        </div>
                        `;
                    }).join('') : 
                    '<div class="empty-detail">Không có tổ hợp sao nào.</div>'
                }
                </div>
                
                <!-- Phần tổ hợp số -->
                <h4 style="margin-top: 20px; color: var(--primary-color);">Tổ Hợp Số</h4>
                <div class="key-combos-detail">
                    ${analysisData.keyCombinations.length > 0 ? 
                        analysisData.keyCombinations.map(combo => `
                            <div class="key-combo-detail">
                                <div class="combo-value">${combo.value || ''}</div>
                                <div class="combo-description">${combo.description || ''}</div>
                            </div>
                        `).join('') : 
                        '<div class="empty-detail">Không có tổ hợp số đặc biệt nào.</div>'
                    }
                </div>
                
                <!-- Phần cảnh báo -->
                <h4 style="margin-top: 20px; color: var(--primary-color);">Cảnh Báo</h4>
                <div class="warnings-detail">
                    ${analysisData.dangerousCombinations.length > 0 ? 
                        analysisData.dangerousCombinations.map(warning => `
                            <div class="warning-detail">
                                <div class="warning-combo">${warning.combination || ''}</div>
                                <div class="warning-description">${warning.description || ''}</div>
                            </div>
                        `).join('') : 
                        '<div class="empty-detail">Không có cảnh báo nào.</div>'
                    }
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào body
    document.body.appendChild(modalContainer);
    
    // Thêm style cho modal
    if (!document.getElementById('simple-modal-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'simple-modal-styles';
        styleElement.textContent = `
            .modal-container {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .modal-container.active {
                display: flex;
            }
            
            .modal-content {
                background-color: white;
                border-radius: 8px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            }
            
            .modal-header {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color, #3f37c9));
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: white;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .modal-close-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .modal-body {
                flex: 1;
                overflow-y: auto;
                max-height: calc(90vh - 60px);
            }
            
            /* Chi tiết các sao */
            .stars-detail {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .star-detail-item {
                background-color: #f9f9fa;
                border-radius: 6px;
                padding: 10px;
                border-left: 3px solid #ddd;
            }
            
            .star-detail-item.cat {
                border-left-color: #4caf50;
            }
            
            .star-detail-item.hung {
                border-left-color: #f44336;
            }
            
            .star-detail-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .star-detail-item.cat .star-detail-name {
                color: #4caf50;
            }
            
            .star-detail-item.hung .star-detail-name {
                color: #f44336;
            }
            
            .star-detail-pair {
                display: inline-block;
                background-color: #eee;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.8rem;
                margin-bottom: 5px;
            }
            
            .star-detail-nature {
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .star-detail-energy {
                font-size: 0.9rem;
                color: #666;
            }
            
            /* Chi tiết tổ hợp sao */
            .star-combos-detail {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .star-combo-detail {
                background-color: #f9f9fa;
                border-radius: 6px;
                padding: 15px;
            }
            
            .combo-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .combo-header span {
                padding: 3px 8px;
                border-radius: 4px;
            }
            
            .combo-header .auspicious {
                background-color: rgba(76, 175, 80, 0.1);
                color: #4caf50;
            }
            
            .combo-header .inauspicious {
                background-color: rgba(244, 67, 54, 0.1);
                color: #f44336;
            }
            
            .combo-header .plus {
                margin: 0 5px;
                font-weight: bold;
            }
            
            .combo-description {
                color: #333;
                line-height: 1.4;
            }
            
            /* Chi tiết tổ hợp số */
            .key-combos-detail {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .key-combo-detail {
                background-color: #f9f9fa;
                border-radius: 6px;
                padding: 15px;
                border-left: 3px solid var(--primary-color);
            }
            
            .combo-value {
                font-weight: bold;
                font-size: 1.1rem;
                margin-bottom: 8px;
            }
            
            /* Chi tiết cảnh báo */
            .warnings-detail {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .warning-detail {
                background-color: rgba(244, 67, 54, 0.05);
                border-radius: 6px;
                padding: 15px;
                border-left: 3px solid #f44336;
            }
            
            .warning-combo {
                font-weight: bold;
                color: #f44336;
                margin-bottom: 8px;
            }
            
            .empty-detail {
                color: #666;
                font-style: italic;
                text-align: center;
                padding: 15px;
            }
            
            /* Responsive */
            @media (max-width: 576px) {
                .stars-detail {
                    grid-template-columns: 1fr;
                }
                
                .modal-content {
                    width: 95%;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Hiển thị modal
    setTimeout(() => {
        modalContainer.classList.add('active');
    }, 10);
    
    // Thêm sự kiện cho nút đóng
    modalContainer.querySelector('.modal-close-btn').addEventListener('click', function() {
        modalContainer.classList.remove('active');
        setTimeout(() => {
            if (modalContainer.parentNode) {
                modalContainer.parentNode.removeChild(modalContainer);
            }
        }, 300);
    });
    
    // Thêm sự kiện cho việc click bên ngoài modal
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            modalContainer.classList.remove('active');
            setTimeout(() => {
                if (modalContainer.parentNode) {
                    modalContainer.parentNode.removeChild(modalContainer);
                }
            }, 300);
        }
    });
}

/**
 * Hàm thêm phần tử phân tích vào tin nhắn bot
 */
function addAnalysisToMessage(messageElement, analysisData) {
    if (!messageElement || !analysisData) return;
    
    console.log("Thêm phân tích vào tin nhắn:", messageElement.id);
    
    // Tìm phần tử phân tích hiện có (nếu có) và xóa
    const existingAnalysis = messageElement.querySelector('.analysis-container');
    if (existingAnalysis) {
        existingAnalysis.remove();
    }
    
    // Tạo phần tử phân tích mới
    const analysisElement = createAnalysisElement(analysisData);
    if (!analysisElement) return;
    
    // Thêm sau message-content
    const messageContent = messageElement.querySelector('.message-content');
    if (messageContent) {
        messageContent.insertAdjacentElement('afterend', analysisElement);
    } else {
        messageElement.appendChild(analysisElement);
    }
    
    // Kích hoạt suggestion chips
    const suggestionChips = messageElement.querySelector('.suggestion-chips');
    if (suggestionChips) {
        suggestionChips.classList.remove('hidden');
    }
    
    // Kích hoạt feedback buttons
    const feedbackButtons = messageElement.querySelector('.feedback-buttons');
    if (feedbackButtons) {
        feedbackButtons.classList.remove('hidden');
    }
}

/**
 * Cập nhật hàm addBotMessage hiện có để hỗ trợ hiển thị phân tích
 */
function updateAddBotMessage() {
    // Lưu tham chiếu đến hàm gốc
    const originalAddBotMessage = window.UI ? window.UI.addBotMessage : null;
    
    if (!originalAddBotMessage) {
        console.error('Không tìm thấy hàm addBotMessage để cập nhật');
        return;
    }
    
    // Ghi đè hàm
    window.UI.addBotMessage = function(text, analysisData = null) {
        console.log('Gọi addBotMessage với phân tích:', analysisData ? 'có dữ liệu' : 'không có dữ liệu');
        
        // Gọi hàm gốc để thêm tin nhắn
        const messageId = originalAddBotMessage.call(this, text);
        
        // Nếu có dữ liệu phân tích, thêm vào tin nhắn
        if (analysisData) {
            console.log('Thêm phân tích vào tin nhắn:', messageId);
            
            const messageElement = document.getElementById(messageId);
            if (messageElement) {
                addAnalysisToMessage(messageElement, analysisData);
            }
        }
        
        return messageId;
    };
    
    console.log('Đã cập nhật hàm addBotMessage để hỗ trợ hiển thị phân tích');
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    console.log('Khởi tạo phân tích số điện thoại');
    
    // Cập nhật hàm addBotMessage
    updateAddBotMessage();
    
    console.log('Khởi tạo phân tích số điện thoại hoàn tất');
    
    // Kiểm tra các thành phần UI
    setTimeout(() => {
        const templates = {
            'Bot message template': document.getElementById('bot-message-template'),
            'User message template': document.getElementById('user-message-template'),
            'Analysis container template': document.getElementById('analysis-container-template')
        };
        
        for (const [name, template] of Object.entries(templates)) {
            console.log(`${name}: ${template ? 'OK' : 'MISSING'}`);
        }
    }, 1000);
});
