/**
 * UI Service for Phone Analysis App
 * Handles UI interactions and updates
 */

// Khởi tạo UI đối tượng toàn cục trước để tránh lỗi tham chiếu
window.UI = {};

// Sau đó sử dụng IIFE để định nghĩa và gán các phương thức
(function() {
    // UI state
    const state = {
        loading: false,
        currentAnalysis: null,
        analysisHistory: [],
        isInfoPanelVisible: false
    };
    
    /**
     * Initialize the UI
     */
    function init() {
        // Check if templates exist
        const botTemplate = document.getElementById('bot-message-template');
        const userTemplate = document.getElementById('user-message-template');
        
        if (!botTemplate || !userTemplate) {
            console.error('Chat templates not found. Please check HTML structure.');
        }
        
        // Set up UI event listeners
        setupEventListeners();
        
        // Set up tabs
        setupTabs();
        
        // Load history if user is authenticated
        if (isAuthenticated()) {
            loadAnalysisHistory();
        }
        
        // Enhance UI
        enhanceChatDisplay();
    }

    /**
     * Load and display analysis history
     */
    async function loadAnalysisHistory() {
        try {
            // Kiểm tra xác thực trước khi gọi API
            if (!isAuthenticated()) {
                debug('Not loading history - user not authenticated');
                return;
            }

            const historyContainer = document.getElementById('analysis-history');
            if (historyContainer) {
                // Hiển thị thông báo đang tải
                historyContainer.innerHTML = '<div class="empty-history-message">Đang tải lịch sử...</div>';
            }

            const historyResponse = await API.getAnalysisHistory();
            state.analysisHistory = historyResponse.data || [];
            
            renderAnalysisHistory();
            
        } catch (error) {
            debug('Error loading history:', error);
            const historyContainer = document.getElementById('analysis-history');
            if (historyContainer) {
                historyContainer.innerHTML = '<div class="empty-history-message">Không thể tải lịch sử. Vui lòng thử lại sau.</div>';
            }
        }
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Send button click
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.addEventListener('click', handleSendMessage);
        }
        
        // User input Enter key press
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
            });
        }
        
        // Clear chat button
        const clearChatButton = document.getElementById('clear-chat');
        if (clearChatButton) {
            clearChatButton.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện hiện tại?')) {
                    clearChat();
                }
            });
        }
        
        // Clear history button
        const clearHistoryButton = document.getElementById('clear-history');
        if (clearHistoryButton) {
            clearHistoryButton.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn xóa lịch sử phân tích?')) {
                    clearAnalysisHistory();
                }
            });
        }
        
        // Logout button
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        // Info panel toggle (mobile only)
        const toggleInfoButton = document.getElementById('toggle-info-panel');
        if (toggleInfoButton) {
            toggleInfoButton.addEventListener('click', toggleInfoPanel);
        }
        
        // Close info panel button
        const closeInfoButton = document.getElementById('close-info-panel');
        if (closeInfoButton) {
            closeInfoButton.addEventListener('click', closeInfoPanel);
        }
        
        // Overlay click (to close info panel)
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', closeInfoPanel);
        }
        
        // Change password button
        const changePasswordButton = document.getElementById('change-password-btn');
        if (changePasswordButton) {
            changePasswordButton.addEventListener('click', handleChangePassword);
        }
        
        // Login form
        const loginButton = document.getElementById('login-btn');
        if (loginButton) {
            loginButton.addEventListener('click', handleLogin);
        }
        
        // Register form
        const registerButton = document.getElementById('register-btn');
        if (registerButton) {
            registerButton.addEventListener('click', handleRegister);
        }
        
        // Auth tab buttons
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                switchAuthTab(tabName);
            });
        });
        
        // Category buttons (suggestion chips)
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('category-btn') || 
                e.target.parentElement.classList.contains('category-btn')) {
                const button = e.target.closest('.category-btn');
                if (button) {
                    handleCategoryClick(button);
                }
            }
        });
        
        // Feedback buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('feedback-btn') || 
                e.target.parentElement.classList.contains('feedback-btn')) {
                const button = e.target.closest('.feedback-btn');
                if (button) {
                    handleFeedbackClick(button);
                }
            }
        });
        
        // Details toggle in analysis container
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('details-toggle')) {
                toggleAnalysisDetails(e.target);
            }
        });
    }
    
    /**
     * Set up tabs in the info panel
     */
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.info-tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                switchInfoTab(tabName);
            });
        });
    }
    
    /**
     * Switch info tab
     * @param {string} tabName - Tab name to switch to
     */
    function switchInfoTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.info-tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetButton = document.querySelector(`.info-tab-button[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Update tab contents
        const tabContents = document.querySelectorAll('.info-tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }
    
    /**
     * Switch auth tab
     * @param {string} tabName - Tab name to switch to
     */
    function switchAuthTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.auth-tab');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetButton = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Update form visibility
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.classList.remove('active');
        });
        
        const targetForm = document.getElementById(`${tabName}-form`);
        if (targetForm) {
            targetForm.classList.add('active');
        }
        
        // Update title
        const authHeader = document.querySelector('.auth-header h3');
        if (authHeader) {
            authHeader.textContent = tabName === 'login' ? 'Đăng Nhập' : 'Đăng Ký';
        }
    }
    
    /**
     * Handle login form submission
     */
    async function handleLogin() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const messageElement = document.getElementById('login-message');
        
        if (!emailInput || !passwordInput || !messageElement) return;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate inputs
        if (!email || !password) {
            messageElement.textContent = 'Vui lòng nhập email và mật khẩu';
            return;
        }
        
        if (!Auth.isValidEmail(email)) {
            messageElement.textContent = 'Email không hợp lệ';
            return;
        }
        
        // Clear message and show loading state
        messageElement.textContent = 'Đang đăng nhập...';
        setLoading(true);
        
        // Attempt login
        try {
            const result = await Auth.login(email, password);
            
            setLoading(false);
            
            if (result.success) {
                messageElement.textContent = '';
                // Auth state change listener will handle UI changes
            } else {
                messageElement.textContent = result.error || 'Đăng nhập thất bại';
            }
        } catch (error) {
            setLoading(false);
            messageElement.textContent = 'Đăng nhập thất bại: ' + (error.message || 'Lỗi kết nối');
            console.error('Login error:', error);
        }
    }
    
    /**
     * Handle register form submission
     */
    async function handleRegister() {
        const nameInput = document.getElementById('register-name');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const messageElement = document.getElementById('register-message');
        
        if (!nameInput || !emailInput || !passwordInput || !messageElement) return;
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate inputs
        if (!name || !email || !password) {
            messageElement.textContent = 'Vui lòng điền đầy đủ thông tin';
            return;
        }
        
        if (!Auth.isValidEmail(email)) {
            messageElement.textContent = 'Email không hợp lệ';
            return;
        }
        
        if (!Auth.isValidPassword(password)) {
            messageElement.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            return;
        }
        
        // Clear message and show loading state
        messageElement.textContent = 'Đang đăng ký...';
        setLoading(true);
        
        // Attempt registration
        try {
            const result = await Auth.register(name, email, password);
            
            setLoading(false);
            
            if (result.success) {
                messageElement.textContent = '';
                // Auth state change listener will handle UI changes
            } else {
                messageElement.textContent = result.error || 'Đăng ký thất bại';
            }
        } catch (error) {
            setLoading(false);
            messageElement.textContent = 'Đăng ký thất bại: ' + (error.message || 'Lỗi kết nối');
            console.error('Register error:', error);
        }
    }
    
    /**
     * Handle logout
     */
    async function handleLogout() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            await Auth.logout();
            // Auth state change listener will handle UI changes
        }
    }
    
    /**
     * Handle change password
     */
    async function handleChangePassword() {
        const currentPasswordInput = document.getElementById('current-password');
        const newPasswordInput = document.getElementById('new-password');
        const messageElement = document.getElementById('password-message');
        
        if (!currentPasswordInput || !newPasswordInput || !messageElement) return;
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        
        // Validate inputs
        if (!currentPassword || !newPassword) {
            messageElement.textContent = 'Vui lòng nhập đầy đủ thông tin';
            return;
        }
        
        if (!Auth.isValidPassword(newPassword)) {
            messageElement.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự';
            return;
        }
        
        // Clear message and show loading state
        messageElement.textContent = 'Đang cập nhật...';
        setLoading(true);
        
        // Attempt to change password
        try {
            const result = await Auth.changePassword(currentPassword, newPassword);
            
            setLoading(false);
            
            if (result.success) {
                messageElement.textContent = 'Đã cập nhật mật khẩu thành công';
                messageElement.style.color = 'var(--success-color)';
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
            } else {
                messageElement.textContent = result.error || 'Không thể cập nhật mật khẩu';
                messageElement.style.color = 'var(--danger-color)';
            }
        } catch (error) {
            setLoading(false);
            messageElement.textContent = 'Không thể cập nhật: ' + (error.message || 'Lỗi kết nối');
            messageElement.style.color = 'var(--danger-color)';
        }
    }
    
   /**
     * Handle sending a message
     */
    function handleSendMessage() {
        const userInput = document.getElementById('user-input');
        if (!userInput) return;
        
        const text = userInput.value.trim();
        if (!text) return;
        
        try {
            // Add user message
            const messageId = addUserMessage(text);
            
            if (messageId === null) {
                debug('Failed to add user message - skipping processing');
                return;
            }
            
            // Clear input
            userInput.value = '';
            
            // Process the message
            if (typeof Chat !== 'undefined' && Chat && typeof Chat.processUserInput === 'function') {
                Chat.processUserInput(text);
            } else {
                console.error('Chat.processUserInput is not available');
                addBotMessage('Xin lỗi, hệ thống xử lý tin nhắn hiện không khả dụng. Vui lòng thử lại sau.');
            }
        } catch (error) {
            debug('Error in handleSendMessage:', error);
            addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.');
        }
    }
    
    /**
     * Handle category button click
     * @param {HTMLElement} button - Clicked button
     */
    function handleCategoryClick(button) {
        const category = button.getAttribute('data-category');
        
        // Check if this button is already selected
        if (button.classList.contains('selected')) {
            return;
        }
        
        // Highlight the selected button
        const parentContainer = button.closest('.suggestion-chips');
        if (parentContainer) {
            const buttons = parentContainer.querySelectorAll('.category-btn');
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
        
        // Choose appropriate question based on category
        let question = '';
        switch (category) {
            case 'business':
                question = 'Số điện thoại này ảnh hưởng thế nào đến công việc kinh doanh?';
                break;
            case 'love':
                question = 'Số điện thoại này có ý nghĩa gì về tình duyên của tôi?';
                break;
            case 'wealth':
                question = 'Số điện thoại này ảnh hưởng thế nào đến tài chính của tôi?';
                break;
            case 'health':
                question = 'Số điện thoại này có liên quan đến sức khỏe của tôi không?';
                break;
            default:
                question = 'Hãy phân tích thêm về ' + category;
        }
        
        // Add user message
        addUserMessage(question);
        
        // Process the question
        if (typeof Chat !== 'undefined' && Chat && typeof Chat.processUserInput === 'function') {
            Chat.processUserInput(question);
        } else {
            console.error('Chat.processUserInput is not available');
            addBotMessage('Xin lỗi, hệ thống xử lý tin nhắn hiện không khả dụng. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Handle feedback button click
     * @param {HTMLElement} button - Clicked button
     */
    function handleFeedbackClick(button) {
        // Get feedback type (positive/negative)
        const isPositive = button.classList.contains('positive');
        const feedbackType = isPositive ? 'positive' : 'negative';
        
        // Get message ID
        const messageContainer = button.closest('.message');
        const messageId = messageContainer ? messageContainer.id : null;
        
        if (!messageId) return;
        
        // Disable all buttons in the feedback group
        const feedbackContainer = button.closest('.feedback-buttons');
        if (feedbackContainer) {
            const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
            
            // Highlight the selected button
            button.classList.add('selected');
            
            // Add thank you message
            const thankYouMsg = document.createElement('div');
            thankYouMsg.className = 'feedback-thanks';
            thankYouMsg.textContent = 'Cảm ơn phản hồi của bạn!';
            feedbackContainer.appendChild(thankYouMsg);
        }
        
        // Submit feedback to the server
        if (state.currentAnalysis) {
            API.sendFeedback(state.currentAnalysis._id, feedbackType).catch(error => {
                debug('Error sending feedback:', error);
            });
        }
        
        // If negative feedback, prompt for more details
        if (feedbackType === 'negative') {
            setTimeout(() => {
                addBotMessage('Bạn có thể cho biết điều gì chưa chính xác để tôi cải thiện không?');
            }, 500);
        }
    }
    
    /**
     * Toggle analysis details
     * @param {HTMLElement} button - Details toggle button
     */
    function toggleAnalysisDetails(button) {
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        const analysisContainer = button.closest('.analysis-container');
        
        if (!analysisContainer) return;
        
        if (isExpanded) {
            // Hide details
            const detailedView = analysisContainer.querySelector('.detailed-view');
            if (detailedView) {
                detailedView.remove();
            }
            
            button.textContent = 'Xem chi tiết';
            button.setAttribute('data-expanded', 'false');
        } else {
            // Show details
            if (state.currentAnalysis) {
                const detailedView = createDetailedView(state.currentAnalysis);
                analysisContainer.appendChild(detailedView);
            }
            
            button.textContent = 'Ẩn chi tiết';
            button.setAttribute('data-expanded', 'true');
        }
    }
    
    /**
     * Create detailed view for analysis data
     * @param {object} analysisData - The analysis data
     * @returns {HTMLElement} The detailed view element
     */
    function createDetailedView(analysisData) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'detailed-view';
        
        // 1. Full Star Sequence
        const starsSection = document.createElement('div');
        starsSection.className = 'detail-section';
        starsSection.innerHTML = '<h4>Tất cả các sao</h4>';
        
        const starTable = document.createElement('table');
        starTable.className = 'star-table';
        starTable.innerHTML = `
            <thead>
                <tr>
                    <th>Cặp số</th>
                    <th>Tên sao</th>
                    <th>Tính chất</th>
                    <th>Năng lượng</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tableBody = starTable.querySelector('tbody');
        
        if (analysisData.starSequence && analysisData.starSequence.length > 0) {
            analysisData.starSequence.forEach(star => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${star.originalPair || ''}</td>
                    <td>${star.name || 'Không xác định'}</td>
                    <td class="${star.nature === 'Cát' ? 'auspicious' : (star.nature === 'Hung' ? 'inauspicious' : 'unknown')}">
                        ${star.nature || 'Không xác định'}
                    </td>
                    <td>${star.energyLevel || 0}</td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        starsSection.appendChild(starTable);
        detailsContainer.appendChild(starsSection);
        
        // 2. Key Combinations
        if (analysisData.keyCombinations && analysisData.keyCombinations.length > 0) {
            const combosSection = document.createElement('div');
            combosSection.className = 'detail-section';
            combosSection.innerHTML = '<h4>Tổ hợp số đặc biệt</h4>';
            
            const combosList = document.createElement('ul');
            combosList.className = 'combos-list';
            
            analysisData.keyCombinations.forEach(combo => {
                const item = document.createElement('li');
                item.className = 'combo-item';
                item.innerHTML = `
                    <div class="combo-value">${combo.value || ''}</div>
                    <div class="combo-desc">${combo.description || ''}</div>
                `;
                combosList.appendChild(item);
            });
            
            combosSection.appendChild(combosList);
            detailsContainer.appendChild(combosSection);
        }
        
        // 3. Warning Combinations
        if (analysisData.dangerousCombinations && analysisData.dangerousCombinations.length > 0) {
            const warningsSection = document.createElement('div');
            warningsSection.className = 'detail-section warnings';
            warningsSection.innerHTML = '<h4>Cảnh báo</h4>';
            
            const warningsList = document.createElement('ul');
            warningsList.className = 'warnings-list';
            
            analysisData.dangerousCombinations.forEach(warning => {
                const item = document.createElement('li');
                item.className = 'warning-item';
                item.innerHTML = `
                    <div class="warning-value">${warning.combination || ''}</div>
                    <div class="warning-desc">${warning.description || ''}</div>
                `;
                warningsList.appendChild(item);
            });
            
            warningsSection.appendChild(warningsList);
            detailsContainer.appendChild(warningsSection);
        }
        
        // 4. Key Positions
        if (analysisData.keyPositions) {
            const positionsSection = document.createElement('div');
            positionsSection.className = 'detail-section';
            positionsSection.innerHTML = '<h4>Vị trí quan trọng</h4>';
            
            const positionsList = document.createElement('ul');
            positionsList.className = 'positions-list';
            
            if (analysisData.keyPositions.lastDigit) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số cuối (${analysisData.keyPositions.lastDigit.value}):</strong> ${analysisData.keyPositions.lastDigit.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            if (analysisData.keyPositions.thirdFromEnd) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số thứ 3 từ cuối (${analysisData.keyPositions.thirdFromEnd.value}):</strong> ${analysisData.keyPositions.thirdFromEnd.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            if (analysisData.keyPositions.fifthFromEnd) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số thứ 5 từ cuối (${analysisData.keyPositions.fifthFromEnd.value}):</strong> ${analysisData.keyPositions.fifthFromEnd.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            positionsSection.appendChild(positionsList);
            detailsContainer.appendChild(positionsSection);
        }
        
        return detailsContainer;
    }
    
    /**
     * Toggle the info panel
     */
    function toggleInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        const overlay = document.getElementById('overlay');
        
        if (infoPanel && overlay) {
            state.isInfoPanelVisible = !state.isInfoPanelVisible;
            
            infoPanel.classList.toggle('visible', state.isInfoPanelVisible);
            overlay.classList.toggle('visible', state.isInfoPanelVisible);
        }
    }
    
    /**
     * Close the info panel
     */
    function closeInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        const overlay = document.getElementById('overlay');
        
        if (infoPanel && overlay) {
            state.isInfoPanelVisible = false;
            
            infoPanel.classList.remove('visible');
            overlay.classList.remove('visible');
        }
    }
    
   /**
     * Add a user message to the chat
     * @param {string} text - Message content
     * @returns {string} Message ID
     */
    function addUserMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        const userMessageTemplate = document.getElementById('user-message-template');
        
        if (!chatMessages || !userMessageTemplate) {
            debug('Cannot add user message - missing DOM elements');
            return null;
        }

        try {
            const messageId = `msg_user_${Date.now()}`;
            const messageElement = userMessageTemplate.content.cloneNode(true);
            const messageDiv = messageElement.querySelector('.message');
            
            if (!messageDiv) {
                debug('Cannot add user message - template structure issue');
                return null;
            }
            
            messageDiv.id = messageId;
            
         const messageContentDiv = messageDiv.querySelector('.message-content');
                if (messageContentDiv) {
                    // Định dạng văn bản để dễ đọc hơn
                    const formattedText = formatBotMessage(text);
                    messageContentDiv.innerHTML = formattedText;
                }
            
            chatMessages.appendChild(messageElement);
            scrollToBottom();
            
            return messageId;
        } catch (error) {
            debug('Error adding user message:', error);
            return null;
        }
    }
    /**
     * Hàm mới để định dạng nội dung tin nhắn bot
     */
    function formatBotMessage(text) {
        if (!text) return '';
        
        // Thay thế định dạng đậm **text** bằng thẻ <strong>
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Chia thành các đoạn
        formattedText = formattedText.split('\n\n').map(paragraph => {
            if (!paragraph.trim()) return '';
            return `<p>${paragraph}</p>`;
        }).join('');
        
        // Xử lý danh sách nếu có
        formattedText = formattedText.replace(/<p>- (.*?)<\/p>/g, '<li>$1</li>');
        formattedText = formattedText.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
        formattedText = formattedText.replace(/<\/ul><ul>/g, '');
        
        return formattedText;
    }
    /**
     * Add a bot message to the chat
     * @param {string} text - Message content
     * @param {object} analysisData - Optional analysis data
     * @returns {string} Message ID
     */
    function addBotMessage(text, analysisData = null) {
        const chatMessages = document.getElementById('chat-messages');
        const botMessageTemplate = document.getElementById('bot-message-template');
        
        if (!chatMessages || !botMessageTemplate) {
            debug('Cannot add bot message - missing DOM elements');
            return null;
        }

        try {
            const messageId = `msg_bot_${Date.now()}`;
            const messageElement = botMessageTemplate.content.cloneNode(true);
            const messageDiv = messageElement.querySelector('.message');
            
            if (!messageDiv) {
                debug('Cannot add bot message - template structure issue');
                return null;
            }
            
            messageDiv.id = messageId;
            
            const messageContentDiv = messageDiv.querySelector('.message-content');
            if (messageContentDiv) {
                messageContentDiv.textContent = text;
            }
            
            // Add feedback buttons
            const feedbackButtons = messageDiv.querySelector('.feedback-buttons');
            if (feedbackButtons) {
                feedbackButtons.classList.remove('hidden');
            }
            
            if (analysisData) {
                // Thêm nút gợi ý câu hỏi
                const suggestionText = document.createElement('div');
                suggestionText.className = 'suggestion-text';
                suggestionText.innerHTML = '<p>Bạn có thể hỏi thêm về:</p>';
                messageDiv.appendChild(suggestionText);
                
                // Thêm ví dụ câu hỏi có thể hỏi
                const questionExamples = [
                    "Số này ảnh hưởng thế nào đến sự nghiệp của tôi?",
                    "Mối quan hệ với người khác có tốt không?",
                    "Số này có phải là số may mắn không?",
                    "Tôi có nên giữ số điện thoại này không?"
                ];
                
                const exampleContainer = document.createElement('div');
                exampleContainer.className = 'question-examples';
                
                questionExamples.forEach(q => {
                    const exampleBtn = document.createElement('button');
                    exampleBtn.className = 'example-question-btn';
                    exampleBtn.textContent = q;
                    exampleBtn.addEventListener('click', () => {
                        const userInput = document.getElementById('user-input');
                        if (userInput) {
                            userInput.value = q;
                            userInput.focus();
                        }
                    });
                    exampleContainer.appendChild(exampleBtn);
                });
                
                messageDiv.appendChild(exampleContainer);
                
                // Lưu phân tích hiện tại
                state.currentAnalysis = analysisData;
                
                // Cải thiện hiển thị phân tích
                setTimeout(() => {
                    enhanceAnalysisDisplay(analysisData);
                    enhanceSuggestions();
                }, 100);
            }
            
            chatMessages.appendChild(messageElement);
            scrollToBottom();
            
            return messageId;
        } catch (error) {
            debug('Error adding bot message:', error);
            return null;
        }
    }
    
    function formatAnalysisData(data) {
        const analysisElement = document.getElementById('analysis-container-template').content.cloneNode(true);
        const container = analysisElement.querySelector('.analysis-container');
        
        // Kiểm tra cấu trúc dữ liệu và lấy kết quả phân tích
        const analysisResult = data.result || data;
        
        // Set phone number
        container.querySelector('.phone-number').textContent = formatPhoneNumber(data.phoneNumber);
        
        // Add star sequence (top 3 by energy level)
        const starList = container.querySelector('.star-list');
        
        // Đảm bảo starSequence tồn tại trong dữ liệu
        if (analysisResult.starSequence && analysisResult.starSequence.length > 0) {
            // Sort stars by energy level (highest first)
            const sortedStars = [...analysisResult.starSequence].sort((a, b) => b.energyLevel - a.energyLevel);
            
            // Display top stars
            const topStars = sortedStars.slice(0, 3);
            topStars.forEach(star => {
                const starItem = document.createElement('div');
                starItem.className = 'star-item';
                
                const starName = document.createElement('span');
                starName.className = `star-name ${star.nature === 'Cát' ? 'auspicious' : (star.nature === 'Hung' ? 'inauspicious' : 'unknown')}`;
                starName.textContent = star.name;
                
                const starPair = document.createElement('span');
                starPair.className = 'star-pair';
                starPair.textContent = star.originalPair;
                
                starItem.appendChild(starName);
                starItem.appendChild(starPair);
                starList.appendChild(starItem);
            });
        }
        
        // Add energy balance information
        const energyBalance = container.querySelector('.energy-balance');
        
        const balanceText = document.createElement('div');
        
        // Kiểm tra và sử dụng giá trị balance
        if (analysisResult.balance) {
            switch(analysisResult.balance) {
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
        
        // Add energy levels - kiểm tra và sử dụng energyLevel
        if (analysisResult.energyLevel) {
            const energyLevels = document.createElement('div');
            energyLevels.className = 'energy-levels';
            energyLevels.innerHTML = `
                <div class="energy-item">
                    <span class="energy-label">Tổng:</span>
                    <span class="energy-value">${analysisResult.energyLevel.total || 0}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Cát:</span>
                    <span class="energy-value positive">${analysisResult.energyLevel.cat || 0}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Hung:</span>
                    <span class="energy-value negative">${analysisResult.energyLevel.hung || 0}</span>
                </div>
            `;
            energyBalance.appendChild(energyLevels);
        }
        
        return container;
    }
    
    /**
     * Format a phone number for display
     * @param {string} phoneNumber - Raw phone number
     * @returns {string} Formatted phone number
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
     * Show the typing indicator
     */
    function showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the typing indicator
     */
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Set loading state
     * @param {boolean} isLoading - Whether loading is in progress
     */
    function setLoading(isLoading) {
        state.loading = isLoading;
        
        // Disable interactive elements during loading
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
    }
    
    /**
     * Scroll the chat to the bottom
     */
    function scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    /**
     * Clear the chat messages
     */
    function clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Add welcome message
            addBotMessage('Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.');
        }
        
        // Reset current analysis
        state.currentAnalysis = null;
    }
    
    /**
     * Clear the analysis history
     */
    async function clearAnalysisHistory() {
        try {
            await API.deleteAnalysisHistory();
            
            // Clear history display
            const historyContainer = document.getElementById('analysis-history');
            if (historyContainer) {
                historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
            }
            
            // Clear state
            state.analysisHistory = [];
            
        } catch (error) {
            debug('Error clearing history:', error);
            alert('Không thể xóa lịch sử. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Render analysis history
     */
    /**
 * Render analysis history
 */
function renderAnalysisHistory() {
    const historyContainer = document.getElementById('analysis-history');
    if (!historyContainer) return;
    
    // Clear container
    historyContainer.innerHTML = '';
    
    // Check if history is empty
    if (!state.analysisHistory || state.analysisHistory.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
        return;
    }
    
    // Sắp xếp lịch sử theo thời gian, mới nhất lên đầu
    const sortedHistory = [...state.analysisHistory].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Add history items
    sortedHistory.forEach(analysis => {
        const historyTemplate = document.getElementById('history-item-template');
        if (!historyTemplate) return;
        
        const historyElement = historyTemplate.content.cloneNode(true);
        const historyItem = historyElement.querySelector('.history-item');
        
        // Format phone number
        historyItem.querySelector('.history-phone').textContent = formatPhoneNumber(analysis.phoneNumber);
        
        // Format date
        const date = new Date(analysis.createdAt);
        
        // Tạo thành phần thời gian và thông tin cân bằng
        const timeContainer = historyItem.querySelector('.history-time');
        timeContainer.innerHTML = '';
        
        // Hiển thị thời gian
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatDate(date);
        timeContainer.appendChild(timeSpan);
        
        // Hiển thị thông tin cân bằng nếu có
        if (analysis.result && analysis.result.balance) {
            const balanceSpan = document.createElement('span');
            balanceSpan.className = 'history-balance';
            
            switch(analysis.result.balance) {
                case 'BALANCED':
                    balanceSpan.classList.add('balanced');
                    balanceSpan.innerHTML = '<i class="fas fa-balance-scale"></i> Cân bằng';
                    break;
                case 'CAT_HEAVY':
                    balanceSpan.classList.add('cat-heavy');
                    balanceSpan.innerHTML = '<i class="fas fa-sun"></i> Thiên cát';
                    break;
                case 'HUNG_HEAVY':
                    balanceSpan.classList.add('hung-heavy');
                    balanceSpan.innerHTML = '<i class="fas fa-cloud"></i> Thiên hung';
                    break;
            }
            
            timeContainer.appendChild(balanceSpan);
        }
        
        // Thêm thông tin về năng lượng
        if (analysis.result && analysis.result.energyLevel) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'history-meta';
            
            // Stars info
            if (analysis.result.starSequence && analysis.result.starSequence.length > 0) {
                const starCount = analysis.result.starSequence.length;
                metaDiv.innerHTML += `<span><i class="fas fa-star"></i> ${starCount} sao</span>`;
            }
            
            // Energy rating
            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'rating';
            
            const catDiv = document.createElement('span');
            catDiv.className = 'cat-rating';
            catDiv.innerHTML = `<i class="fas fa-plus-circle"></i> ${analysis.result.energyLevel.cat || 0}`;
            
            const hungDiv = document.createElement('span');
            hungDiv.className = 'hung-rating';
            hungDiv.innerHTML = `<i class="fas fa-minus-circle"></i> ${Math.abs(analysis.result.energyLevel.hung || 0)}`;
            
            ratingDiv.appendChild(catDiv);
            ratingDiv.appendChild(hungDiv);
            metaDiv.appendChild(ratingDiv);
            
            historyItem.appendChild(metaDiv);
        }
        
        // Add click handler
        historyItem.addEventListener('click', () => {
            // Add user message with the phone number
            addUserMessage(analysis.phoneNumber);
            
            // Process the phone number
            Chat.processUserInput(analysis.phoneNumber);
            
            // Close info panel on mobile
            if (window.innerWidth <= 992) {
                closeInfoPanel();
            }
        });
        
        historyContainer.appendChild(historyElement);
    });
}
    /**
     * Format a date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    function formatDate(date) {
        if (!date) return '';
        
        // Get today and yesterday for comparison
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format time
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;
        
        // Format date
        if (date.toDateString() === today.toDateString()) {
            return `Hôm nay, ${time}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Hôm qua, ${time}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }
    
    /* Các hàm cải tiến UI */
    function enhanceAnalysisDisplay(analysisData) {
        // Thêm hiệu ứng khi có kết quả phân tích mới
        const analysisContainers = document.querySelectorAll('.analysis-container');
        if (analysisContainers.length > 0) {
            const lastContainer = analysisContainers[analysisContainers.length - 1];
            lastContainer.classList.add('highlight-new');
            
            // Xóa hiệu ứng sau 2 giây
            setTimeout(() => {
                lastContainer.classList.remove('highlight-new');
            }, 2000);
        }
        
        // Thêm biểu đồ trực quan cho cân bằng năng lượng
        if (analysisData && analysisData.energyLevel) {
            addEnergyChart(analysisData.energyLevel);
        }
    }
    
    function addEnergyChart(energyLevel) {
        const energyBalance = document.querySelector('.energy-balance');
        if (!energyBalance) return;
        
        // Tạo phần tử canvas cho biểu đồ
        const chartContainer = document.createElement('div');
        chartContainer.className = 'energy-chart-container';
        chartContainer.style.marginTop = '15px';
        chartContainer.style.height = '120px';
        
        // Thêm canvas vào container
        const canvas = document.createElement('canvas');
        canvas.id = 'energy-chart';
        canvas.height = 120;
        chartContainer.appendChild(canvas);
        
        // Thêm container vào energy balance
        energyBalance.appendChild(chartContainer);
        
        // Vẽ biểu đồ đơn giản bằng canvas
        const ctx = canvas.getContext('2d');
        const totalWidth = canvas.width;
        const height = 30;
        const y = 30;
        
        // Tính tỷ lệ
        const total = energyLevel.cat + Math.abs(energyLevel.hung);
        const catWidth = total > 0 ? (energyLevel.cat / total) * totalWidth : 0;
        
        // Vẽ thanh Cát (màu xanh)
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, y, catWidth, height);
        
        // Vẽ thanh Hung (màu đỏ)
        ctx.fillStyle = '#f44336';
        ctx.fillRect(catWidth, y, totalWidth - catWidth, height);
        
        // Thêm nhãn
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`Cát: ${energyLevel.cat}`, 10, y - 5);
        ctx.fillText(`Hung: ${energyLevel.hung}`, totalWidth - 80, y - 5);
        
        // Thêm đường phân chia giữa
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(catWidth, y - 10);
        ctx.lineTo(catWidth, y + height + 10);
        ctx.stroke();
        
        // Thêm nhãn phần trăm
        const catPercent = total > 0 ? Math.round((energyLevel.cat / total) * 100) : 0;
        const hungPercent = 100 - catPercent;
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${catPercent}%`, catWidth / 2 - 15, y + height / 2 + 5);
        ctx.fillText(`${hungPercent}%`, catWidth + (totalWidth - catWidth) / 2 - 15, y + height / 2 + 5);
    }
    
    function enhanceSuggestions() {
        const suggestionChips = document.querySelectorAll('.suggestion-chips');
        
        suggestionChips.forEach(container => {
            // Thêm gợi ý về cách sử dụng
            const helpText = document.createElement('div');
            helpText.className = 'suggestion-help';
            helpText.textContent = 'Nhấn vào các gợi ý dưới đây để xem thêm thông tin:';
            helpText.style.fontSize = '0.9rem';
            helpText.style.color = '#666';
            helpText.style.marginBottom = '8px';
            
            container.insertBefore(helpText, container.firstChild);
            
            // Thêm hiệu ứng nhấp nháy để thu hút sự chú ý
            const buttons = container.querySelectorAll('.category-btn');
            
            buttons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.classList.add('pulse-animation');
                    
                    setTimeout(() => {
                        btn.classList.remove('pulse-animation');
                    }, 1000);
                }, index * 300);
            });
        });
    }
    // Thêm listener cho nút đăng xuất thay thế
    const logoutBtnAlt = document.getElementById('logout-btn-alt');
    if (logoutBtnAlt) {
        logoutBtnAlt.addEventListener('click', handleLogout);
    }
    function enhanceChatDisplay() {
        // Thêm hướng dẫn nhanh vào đầu chat
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length === 0) {
            const guideElement = document.createElement('div');
            guideElement.className = 'quick-guide';
            guideElement.innerHTML = `
                <div class="guide-title">
                    <i class="fas fa-lightbulb"></i> Hướng dẫn nhanh
                </div>
                <div class="guide-content">
                    <p>Nhập số điện thoại (VD: 0931328208) và nhấn Enter để phân tích.</p>
                    <p>Bạn cũng có thể đặt các câu hỏi về ý nghĩa của số.</p>
                </div>
            `;
            
            guideElement.style.background = '#f8f9fa';
            guideElement.style.padding = '12px 15px';
            guideElement.style.borderRadius = '8px';
            guideElement.style.margin = '10px 0 20px';
            guideElement.style.border = '1px solid #e0e0e0';
            
            chatMessages.appendChild(guideElement);
        }
    }
    
    // Thêm các phương thức vào đối tượng UI toàn cục
    window.UI.init = init;
    window.UI.addUserMessage = addUserMessage;
    window.UI.addBotMessage = addBotMessage;
    window.UI.showTypingIndicator = showTypingIndicator;
    window.UI.hideTypingIndicator = hideTypingIndicator;
    window.UI.scrollToBottom = scrollToBottom;
    window.UI.clearChat = clearChat;
    window.UI.toggleInfoPanel = toggleInfoPanel;
    window.UI.closeInfoPanel = closeInfoPanel;
    window.UI.renderAnalysisHistory = renderAnalysisHistory;
    window.UI.loadAnalysisHistory = loadAnalysisHistory;
    window.UI.setLoading = setLoading;
    window.UI.formatPhoneNumber = formatPhoneNumber;
    window.UI.enhanceAnalysisDisplay = enhanceAnalysisDisplay;
    window.UI.enhanceSuggestions = enhanceSuggestions;
    window.UI.enhanceChatDisplay = enhanceChatDisplay;
    
    // Thêm CSS hiệu ứng
    document.addEventListener('DOMContentLoaded', function() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-animation {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(67, 97, 238, 0.4); }
                100% { transform: scale(1); }
            }
            
            .pulse-animation {
                animation: pulse-animation 1s ease-in-out;
            }
            
            .highlight-new {
                animation: highlight 1s ease-in-out;
            }
            
            @keyframes highlight {
                0% { box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1); }
                50% { box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.4); }
                100% { box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1); }
            }
            
            .energy-chart-container {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 10px;
                background: white;
            }
            
            .quick-guide .guide-title {
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--primary-color);
            }
            
            /* Sửa lỗi hiển thị tab thông tin */
            .info-tabs {
                display: flex;
                width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                background-color: #f8f8f8;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .info-tabs::-webkit-scrollbar {
                display: none;
            }
            
            .info-tab-button {
                flex: 1;
                min-width: 80px;
                white-space: nowrap;
                padding: 10px 15px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                color: #666;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }
            
            .info-tab-button.active {
                border-bottom-color: var(--primary-color);
                color: var(--primary-color);
                font-weight: 600;
                background-color: rgba(67, 97, 238, 0.05);
            }
            
            /* Sửa lỗi hiển thị typing indicator */
            #typing-indicator.hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    });
})();
/**
 * Thêm hiệu ứng ripple khi click vào tabs
 * Thêm vào cuối file js của bạn hoặc tạo file mới
 */

document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.info-tab-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Thêm biến màu primary-color-rgb vào CSS root
    // Cần thiết cho hiệu ứng ripple
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
    
    // Chuyển đổi hex sang rgb
    const rgb = hexToRgb(primaryColor) || {r: 67, g: 97, b: 238}; // Giá trị mặc định nếu chuyển đổi thất bại
    root.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
});

// Hàm chuyển đổi màu hex sang rgb
function hexToRgb(hex) {
    // Loại bỏ # nếu có
    hex = hex.replace(/^#/, '');
    
    // Xử lý cả hex ngắn và dài
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
