// Emergency fix for Chat.processUserInput
document.addEventListener('DOMContentLoaded', function() {
    console.log("Applying emergency Chat fix");
    
    // Create a function to check and repair the Chat object
    function ensureChatFunctions() {
        console.log("Checking Chat object status...");
        
        // Create Chat object if it doesn't exist
        if (typeof window.Chat === 'undefined') {
            console.log("Chat object doesn't exist, creating it");
            window.Chat = {};
        }
        
        // Create processUserInput if it doesn't exist
        if (typeof window.Chat.processUserInput !== 'function') {
            console.log("Creating Chat.processUserInput function");
            
            window.Chat.processUserInput = async function(input) {
                console.log("Emergency processUserInput called with:", input);
                
                try {
                    // Show typing indicator
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) typingIndicator.classList.remove('hidden');
                    
                    // Check if it's a phone number (simple validation)
                    const isPhoneNumber = /^0\d{9,10}$/.test(input.replace(/\D/g, ''));
                    const cleanedInput = input.replace(/\D/g, '');
                    
                    if (isPhoneNumber) {
                        console.log("Processing as phone number:", cleanedInput);
                        try {
                            // Try to call API
                            const response = await API.analyzePhoneNumber(cleanedInput);
                            console.log("Phone analysis response:", response);
                            
                            if (response && response.success) {
                                // Get the analysis data
                                const analysisData = response.analysis;
                                
                                // Create message
                                let message = `Đã phân tích số điện thoại ${cleanedInput}.`;
                                if (analysisData && analysisData.geminiResponse) {
                                    message = analysisData.geminiResponse;
                                }
                                
                                // Display message with analysis
                                UI.addBotMessage(message, analysisData);
                            } else {
                                UI.addBotMessage("Không thể phân tích số điện thoại. Vui lòng thử lại sau.");
                            }
                        } catch (error) {
                            console.error("API call failed:", error);
                            UI.addBotMessage("Xin lỗi, không thể kết nối tới dịch vụ phân tích. Vui lòng thử lại sau.");
                        }
                    } else {
                        // It's a question, not a phone number
                        UI.addBotMessage("Để phân tích số điện thoại, vui lòng nhập số điện thoại bắt đầu bằng số 0 và có 10-11 chữ số.");
                    }
                } catch (err) {
                    console.error("Error in processUserInput:", err);
                    UI.addBotMessage("Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.");
                } finally {
                    // Hide typing indicator
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) typingIndicator.classList.add('hidden');
                }
            };
        }
        
        // Create init function if it doesn't exist
        if (typeof window.Chat.init !== 'function') {
            console.log("Creating Chat.init function");
            window.Chat.init = function() {
                console.log("Emergency Chat.init called");
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const welcomeMsg = "Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.";
                    UI.addBotMessage(welcomeMsg);
                }
                return true;
            };
        }
        
        console.log("Chat object repair completed");
    }
    
    // Run the fix immediately
    ensureChatFunctions();
    
    // Also run the fix after a delay to catch any overwrites
    setTimeout(ensureChatFunctions, 1000);
    
    // And run once more before chat input handling
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    if (userInput && sendButton) {
        userInput.addEventListener('focus', ensureChatFunctions);
        sendButton.addEventListener('mouseenter', ensureChatFunctions);
    }
    
    // Fix UI.addBotMessage to handle analysis data properly
    if (typeof UI !== 'undefined' && typeof UI.addBotMessage === 'function') {
        console.log("Checking UI.addBotMessage for analysis support");
        
        // Store original function to check if it handles analysis data
        const originalAddBotMessage = UI.addBotMessage;
        
        // Test if the original function accepts analysis data
        const messageElement = document.createElement('div');
        messageElement.id = "test-msg-" + Date.now();
        messageElement.className = "message bot-message";
        messageElement.innerHTML = '<div class="message-content">Test</div>';
        
        // Add to document temporarily to test
        document.body.appendChild(messageElement);
        
        // Override with enhanced version if needed
        UI.addBotMessage = function(text, analysisData = null) {
            console.log("Enhanced addBotMessage called with analysis data:", Boolean(analysisData));
            
            // Call original function
            const messageId = originalAddBotMessage.call(this, text);
            
            // Add analysis data if provided
            if (analysisData) {
                try {
                    const messageElement = document.getElementById(messageId);
                    if (messageElement) {
                        console.log("Adding analysis data to message");
                        
                        // Simple display for analysis data
                        const analysisContainer = document.createElement('div');
                        analysisContainer.className = 'analysis-container';
                        
                        const phoneNumber = analysisData.phoneNumber || '';
                        const formattedPhone = (function(phone) {
                            if (!phone) return '';
                            const cleaned = String(phone).replace(/\D/g, '');
                            if (cleaned.length === 10) {
                                return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
                            } else if (cleaned.length === 11) {
                                return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
                            }
                            return cleaned;
                        })(phoneNumber);
                        
                        // Create basic analysis HTML
                        analysisContainer.innerHTML = `
                            <div class="analysis-title">Phân tích số: <span class="phone-number">${formattedPhone}</span></div>
                            <div class="analysis-content">
                                <div class="analysis-section">
                                    <h4>Cân bằng năng lượng</h4>
                                    <div class="energy-balance">
                                        <div class="balance-text ${getBalanceClass(analysisData)}">
                                            ${getBalanceText(analysisData)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Add to message
                        messageElement.appendChild(analysisContainer);
                    }
                } catch (err) {
                    console.error("Error adding analysis to message:", err);
                }
            }
            
            return messageId;
        };
        
        // Remove test element
        document.body.removeChild(messageElement);
        
        // Helper functions for analysis display
        function getBalanceClass(data) {
            const result = data.result || data;
            if (!result || !result.balance) return 'unknown';
            
            switch(result.balance) {
                case 'BALANCED': return 'balanced';
                case 'CAT_HEAVY': return 'cat-heavy';
                case 'HUNG_HEAVY': return 'hung-heavy';
                default: return 'unknown';
            }
        }
        
        function getBalanceText(data) {
            const result = data.result || data;
            if (!result || !result.balance) return 'Cân bằng không xác định';
            
            switch(result.balance) {
                case 'BALANCED': return 'Cân bằng tốt giữa sao cát và hung';
                case 'CAT_HEAVY': return 'Thiên về sao cát (>70%)';
                case 'HUNG_HEAVY': return 'Thiên về sao hung (>70%)';
                default: return 'Cân bằng không xác định';
            }
        }
    }
    
    console.log("Emergency chat fixes applied");
});
    // Enhanced analysis display to show ALL information
    document.addEventListener('DOMContentLoaded', function() {
        console.log("Applying comprehensive analysis display");
        
        // Create an enhanced version of UI.addBotMessage to handle analysis data better
        function enhanceUIAddBotMessage() {
            if (typeof UI === 'undefined' || typeof UI.addBotMessage !== 'function') {
                console.error("UI.addBotMessage not found, waiting...");
                setTimeout(enhanceUIAddBotMessage, 500);
                return;
            }
            
            // Store the original function
            const originalAddBotMessage = UI.addBotMessage;
            
            // Replace with enhanced version
            UI.addBotMessage = function(text, analysisData = null) {
                // Call original function to add basic message
                const messageId = originalAddBotMessage.call(this, text);
                
                // If there's analysis data, enhance the display
                if (analysisData && messageId) {
                    console.log("Adding comprehensive analysis display", analysisData);
                    setTimeout(() => {
                        try {
                            const messageElement = document.getElementById(messageId);
                            if (!messageElement) return;
                            
                            // Check if analysis container already exists
                            let analysisContainer = messageElement.querySelector('.analysis-container');
                            
                            if (!analysisContainer) {
                                // Create new analysis container
                                analysisContainer = document.createElement('div');
                                analysisContainer.className = 'analysis-container';
                                messageElement.appendChild(analysisContainer);
                            }
                            
                            // Get the phone number and analysis result
                            const phoneNumber = analysisData.phoneNumber || '';
                            const result = analysisData.result || analysisData;
                            
                            // Format phone number
                            const formattedPhone = (function(phone) {
                                if (!phone) return '';
                                const cleaned = String(phone).replace(/\D/g, '');
                                if (cleaned.length === 10) {
                                    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
                                } else if (cleaned.length === 11) {
                                    return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
                                }
                                return cleaned;
                            })(phoneNumber);
                            
                            // Create HTML for the summary section (always visible)
                            let html = `
                                <div class="analysis-title">Phân tích số: <span class="phone-number">${formattedPhone}</span></div>
                                <div class="analysis-summary">
                                    <div class="summary-item">
                                        <div class="balance-text ${getBalanceClass(result)}">
                                            ${getBalanceText(result)}
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            // Create HTML for the detailed section (toggleable)
                            html += `<div class="analysis-details">`;
                            
                            // 1. Energy Level Section
                            html += `
                                <div class="analysis-section">
                                    <h4>Cân bằng năng lượng</h4>
                                    <div class="energy-balance">
                            `;
                            
                            // Add energy levels if available
                            if (result.energyLevel) {
                                html += `
                                    <div class="energy-levels">
                                        <div class="energy-item">
                                            <span class="energy-label">Tổng:</span>
                                            <span class="energy-value">${result.energyLevel.total || 0}</span>
                                        </div>
                                        <div class="energy-item">
                                            <span class="energy-label">Cát:</span>
                                            <span class="energy-value positive">${result.energyLevel.cat || 0}</span>
                                        </div>
                                        <div class="energy-item">
                                            <span class="energy-label">Hung:</span>
                                            <span class="energy-value negative">${Math.abs(result.energyLevel.hung || 0)}</span>
                                        </div>
                                        <div class="energy-item">
                                            <span class="energy-label">Tỷ lệ:</span>
                                            <span class="energy-value">${result.energyLevel.ratio ? result.energyLevel.ratio.toFixed(2) : 'N/A'}</span>
                                        </div>
                                    </div>
                                `;
                            }
                            
                            html += `</div></div>`;
                            
                            // 2. Star Sequence Section - ALL stars
                            if (result.starSequence && result.starSequence.length > 0) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Các sao (${result.starSequence.length})</h4>
                                        <div class="star-list">
                                `;
                                
                                const sortedStars = [...result.starSequence];
                                
                                sortedStars.forEach(star => {
                                    html += `
                                        <div class="star-item">
                                            <div class="star-header">
                                                <span class="star-name ${star.nature === 'Cát' ? 'auspicious' : (star.nature === 'Hung' ? 'inauspicious' : 'unknown')}">
                                                    ${star.name}
                                                </span>
                                                <span class="star-nature ${star.nature === 'Cát' ? 'auspicious' : (star.nature === 'Hung' ? 'inauspicious' : 'unknown')}">
                                                    ${star.nature}
                                                </span>
                                            </div>
                                            <div class="star-details">
                                                <span class="star-pair">Cặp số: ${star.originalPair}</span>
                                                <span class="star-energy">Năng lượng: ${star.energyLevel}/4</span>
                                            </div>
                                            <div class="star-description">${star.description || ''}</div>
                                        </div>
                                    `;
                                });
                                
                                html += `</div></div>`;
                            }
                            
                            // 3. Key Combinations Section
                            if (result.keyCombinations && result.keyCombinations.length > 0) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Tổ hợp số đặc biệt (${result.keyCombinations.length})</h4>
                                        <div class="combo-list">
                                `;
                                
                                result.keyCombinations.forEach(combo => {
                                    html += `
                                        <div class="combo-item">
                                            <div class="combo-header">
                                                <div class="combo-value">${combo.value}</div>
                                                <div class="combo-type">${combo.type || ''}</div>
                                            </div>
                                            <div class="combo-desc">${combo.description}</div>
                                            <div class="combo-position">Vị trí: ${combo.position || ''}</div>
                                        </div>
                                    `;
                                });
                                
                                html += `</div></div>`;
                            }
                            
                            // 4. Key Positions Section
                            if (result.keyPositions) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Vị trí quan trọng</h4>
                                        <div class="position-list">
                                `;
                                
                                if (result.keyPositions.lastDigit) {
                                    html += `
                                        <div class="position-item">
                                            <div class="position-header">
                                                <div class="position-name">Số cuối: ${result.keyPositions.lastDigit.value}</div>
                                            </div>
                                            <div class="position-meaning">${result.keyPositions.lastDigit.meaning || ''}</div>
                                        </div>
                                    `;
                                }
                                
                                if (result.keyPositions.thirdFromEnd) {
                                    html += `
                                        <div class="position-item">
                                            <div class="position-header">
                                                <div class="position-name">Số thứ 3 từ cuối: ${result.keyPositions.thirdFromEnd.value}</div>
                                            </div>
                                            <div class="position-meaning">${result.keyPositions.thirdFromEnd.meaning || ''}</div>
                                        </div>
                                    `;
                                }
                                
                                if (result.keyPositions.fifthFromEnd) {
                                    html += `
                                        <div class="position-item">
                                            <div class="position-header">
                                                <div class="position-name">Số thứ 5 từ cuối: ${result.keyPositions.fifthFromEnd.value}</div>
                                            </div>
                                            <div class="position-meaning">${result.keyPositions.fifthFromEnd.meaning || ''}</div>
                                        </div>
                                    `;
                                }
                                
                                html += `</div></div>`;
                            }
                            
                            // 5. Last 3 Digits Analysis
                            if (result.last3DigitsAnalysis) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Phân tích 3 số cuối</h4>
                                        <div class="last3-analysis">
                                            <div class="last3-digits">
                                                <strong>3 số cuối:</strong> ${result.last3DigitsAnalysis.lastThreeDigits}
                                            </div>
                                `;
                                
                                if (result.last3DigitsAnalysis.firstPair && result.last3DigitsAnalysis.firstPair.starInfo) {
                                    html += `
                                        <div class="last3-pair">
                                            <strong>Cặp đầu:</strong> ${result.last3DigitsAnalysis.firstPair.pair} 
                                            - ${result.last3DigitsAnalysis.firstPair.starInfo.name || ''}
                                            (${result.last3DigitsAnalysis.firstPair.starInfo.nature || ''})
                                        </div>
                                    `;
                                }
                                
                                if (result.last3DigitsAnalysis.secondPair && result.last3DigitsAnalysis.secondPair.starInfo) {
                                    html += `
                                        <div class="last3-pair">
                                            <strong>Cặp sau:</strong> ${result.last3DigitsAnalysis.secondPair.pair}
                                            - ${result.last3DigitsAnalysis.secondPair.starInfo.name || ''}
                                            (${result.last3DigitsAnalysis.secondPair.starInfo.nature || ''})
                                        </div>
                                    `;
                                }
                                
                                if (result.last3DigitsAnalysis.specialCombination) {
                                    html += `
                                        <div class="last3-special">
                                            <strong>Tổ hợp đặc biệt:</strong> ${result.last3DigitsAnalysis.specialCombination}
                                        </div>
                                    `;
                                }
                                
                                html += `</div></div>`;
                            }
                            
                            // 6. Warnings Section
                            if (result.dangerousCombinations && result.dangerousCombinations.length > 0) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Cảnh báo (${result.dangerousCombinations.length})</h4>
                                        <div class="warning-list">
                                `;
                                
                                result.dangerousCombinations.forEach(warning => {
                                    html += `
                                        <div class="warning-item">
                                            <div class="warning-header">
                                                <div class="warning-value">${warning.combination}</div>
                                                <div class="warning-position">${warning.position || ''}</div>
                                            </div>
                                            <div class="warning-desc">${warning.description}</div>
                                            ${warning.meanings ? `<div class="warning-meanings">${warning.meanings}</div>` : ''}
                                        </div>
                                    `;
                                });
                                
                                html += `</div></div>`;
                            }
                            
                            // 7. Special Attribute
                            if (result.specialAttribute) {
                                html += `
                                    <div class="analysis-section">
                                        <h4>Thuộc tính đặc biệt</h4>
                                        <div class="special-attribute">${result.specialAttribute}</div>
                                    </div>
                                `;
                            }
                            
                            // Close the details section
                            html += `</div>`;
                            
                            // Add toggle button
                            html += `<button class="details-toggle" data-expanded="false">chi tiết</button>`;
                            
                            // Set the HTML
                            analysisContainer.innerHTML = html;
                            
                            // Add event listener to toggle button
                            const toggleButton = analysisContainer.querySelector('.details-toggle');
                            if (toggleButton) {
                                toggleButton.addEventListener('click', function() {
                                    const isExpanded = this.getAttribute('data-expanded') === 'true';
                                    this.setAttribute('data-expanded', !isExpanded);
                                    
                                    const detailsSection = analysisContainer.querySelector('.analysis-details');
                                    if (detailsSection) {
                                        detailsSection.style.display = !isExpanded ? 'block' : 'none';
                                    }
                                    
                                    this.textContent = !isExpanded ? ' Xem them' : 'Xem chi tiết';
                                });
                                
                                // Trigger click to hide details by default
                                toggleButton.click();
                            }
                        } catch (error) {
                            console.error("Error creating comprehensive analysis display:", error);
                        }
                    }, 100);
                }
                
                return messageId;
            };
            
            console.log("Comprehensive UI.addBotMessage installed");
        }
        
        // Helper functions
        function getBalanceClass(data) {
            if (!data || !data.balance) return 'unknown';
            
            switch(data.balance) {
                case 'BALANCED': return 'balanced';
                case 'CAT_HEAVY': return 'cat-heavy';
                case 'HUNG_HEAVY': return 'hung-heavy';
                default: return 'unknown';
            }
        }
        
        function getBalanceText(data) {
            if (!data || !data.balance) return 'Cân bằng không xác định';
            
            switch(data.balance) {
                case 'BALANCED': return 'Cân bằng tốt giữa sao cát và hung';
                case 'CAT_HEAVY': return 'Thiên về sao cát (>70%)';
                case 'HUNG_HEAVY': return 'Thiên về sao hung (>70%)';
                default: return 'Cân bằng không xác định';
            }
        }
        
        // Add comprehensive styling for the analysis display
        const style = document.createElement('style');
        style.textContent = `
            .analysis-container {
                background-color: white;
                border-radius: 8px;
                padding: 16px;
                margin-top: 10px;
                border-left: 3px solid #4361ee;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .analysis-title {
                font-weight: 600;
                margin-bottom: 12px;
                color: #4361ee;
                font-size: 1.1rem;
            }
            
            .analysis-summary {
                margin-bottom: 10px;
            }
            
            .analysis-details {
                display: none; /* Hidden by default */
                border-top: 1px solid #eee;
                padding-top: 10px;
                margin-top: 10px;
            }
            
            .analysis-section {
                margin-bottom: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }
            
            .analysis-section h4 {
                font-size: 1rem;
                margin-bottom: 12px;
                color: #4361ee;
                font-weight: 600;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
            }
            
            /* Energy Balance */
            .energy-balance {
                background-color: white;
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            }
            
            .balance-text {
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 0.95rem;
                display: inline-block;
            }
            
            .balance-text.balanced {
                background-color: rgba(33, 150, 243, 0.1);
                color: #2196f3;
                border-left: 3px solid #2196f3;
            }
            
            .balance-text.cat-heavy {
                background-color: rgba(76, 175, 80, 0.1);
                color: #4caf50;
                border-left: 3px solid #4caf50;
            }
            
            .balance-text.hung-heavy {
                background-color: rgba(244, 67, 54, 0.1);
                color: #f44336;
                border-left: 3px solid #f44336;
            }
            
            .energy-levels {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 12px;
            }
            
            .energy-item {
                flex: 1;
                min-width: 100px;
                text-align: center;
                padding: 8px;
                border-radius: 6px;
                background-color: white;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
            }
            
            .energy-label {
                display: block;
                font-size: 0.8rem;
                color: #666;
                margin-bottom: 4px;
            }
            
            .energy-value {
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .energy-value.positive {
                color: #4caf50;
            }
            
            .energy-value.negative {
                color: #f44336;
            }
            
            /* Star List */
            .star-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .star-item {
                background-color: white;
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
            }
            
            .star-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .star-name {
                font-weight: 600;
                font-size: 1rem;
            }
            
            .star-nature {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            
            .star-name.auspicious, .star-nature.auspicious {
                color: #4caf50;
            }
            
            .star-nature.auspicious {
                background-color: rgba(76, 175, 80, 0.1);
            }
            
            .star-name.inauspicious, .star-nature.inauspicious {
                color: #f44336;
            }
            
            .star-nature.inauspicious {
                background-color: rgba(244, 67, 54, 0.1);
            }
            
            .star-details {
                display: flex;
                gap: 15px;
                margin-bottom: 8px;
                font-size: 0.9rem;
                color: #555;
            }
            
            .star-description {
                font-size: 0.9rem;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 8px;
            }
            
            /* Key Combinations */
            .combo-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .combo-item {
                background-color: white;
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
            }
            
            .combo-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .combo-value {
                font-weight: bold;
                font-size: 1.1rem;
                color: #4361ee;
            }
            
            .combo-type {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                background-color: rgba(67, 97, 238, 0.1);
                color: #4361ee;
            }
            
            .combo-desc {
                font-size: 0.95rem;
                margin-bottom: 8px;
            }
            
            .combo-position {
                font-size: 0.85rem;
                color: #777;
            }
            
            /* Key Positions */
            .position-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .position-item {
                background-color: white;
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
            }
            
            .position-header {
                margin-bottom: 8px;
            }
            
            .position-name {
                font-weight: 600;
                color: #4361ee;
            }
            
            .position-meaning {
                font-size: 0.95rem;
                color: #555;
            }
            
            /* Last 3 Digits Analysis */
            .last3-analysis {
                background-color: white;
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
            }
            
            .last3-digits {
                font-size: 1.1rem;
                margin-bottom: 10px;
                color: #4361ee;
            }
            
            .last3-pair {
                margin-bottom: 8px;
                font-size: 0.95rem;
            }
            
            .last3-special {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #eee;
                font-size: 0.95rem;
            }
            
            /* Warnings */
            .warning-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .warning-item {
                background-color: rgba(244, 67, 54, 0.05);
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border-left: 3px solid #f44336;
            }
            
            .warning-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .warning-value {
                font-weight: bold;
                font-size: 1.05rem;
                color: #f44336;
            }
            
            .warning-position {
                font-size: 0.85rem;
                color: #777;
            }
            
            .warning-desc {
                font-size: 0.95rem;
                margin-bottom: 8px;
            }
            
            .warning-meanings {
                font-size: 0.9rem;
                color: #555;
                border-top: 1px solid rgba(244, 67, 54, 0.2);
                padding-top: 8px;
            }
            
            /* Special Attribute */
            .special-attribute {
                background-color: white;
                padding: 12px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid #eee;
                font-size: 0.95rem;
                color: #4361ee;
                font-weight: 500;
            }
            
            /* Toggle Button */
            .details-toggle {
                background-color: #f0f0f0;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                margin-top: 10px;
                cursor: pointer;
                font-size: 0.95rem;
                color: #555;
                width: 100%;
                text-align: center;
                transition: background-color 0.2s, transform 0.1s;
                font-weight: 500;
            }
            
            .details-toggle:hover {
                background-color: #e0e0e0;
            }
            
            .details-toggle:active {
                transform: scale(0.98);
            }
            
            .details-toggle[data-expanded="true"] {
                background-color: #e3f2fd;
                color: #2196f3;
            }
        `;
        document.head.appendChild(style);
        
        // Apply the enhancement
        enhanceUIAddBotMessage();
        
        // Add global delegation for toggle button
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('details-toggle')) {
                const button = e.target;
                const container = button.closest('.analysis-container');
                if (!container) return;
                
                const detailsSection = container.querySelector('.analysis-details');
                if (!detailsSection) return;
                
                const isExpanded = button.getAttribute('data-expanded') === 'true';
                button.setAttribute('data-expanded', !isExpanded);
                button.textContent = !isExpanded ? 'Xem chi tiết' : 'Xem them';
                
                detailsSection.style.display = !isExpanded ? 'block' : 'none';
            }
        });
        
        console.log("Comprehensive analysis display applied");
    });