/**
 * Main Application for Phone Analysis App
 * Entry point and initialization
 */

/**
 * Initialize the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    debug('Initializing application...');
    
    try {
        // Hiển thị màn hình loading
        showLoading();
        
        // Đợi một chút để đảm bảo DOM đã sẵn sàng
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Khởi tạo theo thứ tự an toàn
        const modules = [
            { name: "Auth", init: initializeAuth },
            { name: "UI", init: initializeUI },
            { name: "Chat", init: initializeChat }
        ];
        
        let authResult = { authenticated: false };
        
        // Khởi tạo từng module theo thứ tự
        for (let module of modules) {
            try {
                debug(`Initializing ${module.name} service...`);
                const result = await module.init();
                
                if (module.name === "Auth") {
                    authResult = result;
                }
                
                debug(`${module.name} initialized successfully`);
            } catch (error) {
                debug(`${module.name} initialization failed:`, error);
                
                // Xử lý lỗi khởi tạo cho từng module
                if (module.name === "Auth") {
                    authResult = { authenticated: false, error };
                    continue; // Tiếp tục với module tiếp theo
                } else if (module.name === "UI") {
                    // Thử khởi tạo UI đơn giản nếu khởi tạo đầy đủ thất bại
                    initializeFallbackUI();
                } else if (module.name === "Chat") {
                    // Hiển thị thông báo lỗi nhưng vẫn tiếp tục
                    showSimpleErrorMessage("Khởi tạo chat thất bại. Một số tính năng có thể không hoạt động.");
                }
            }
        }
        
        // Hiển thị container phù hợp dựa vào kết quả xác thực
        showAppropriateContainer(authResult.authenticated);
        
        // Áp dụng các sửa lỗi sau khi khởi tạo
        applyFixes();
        
        // Ẩn màn hình loading
        hideLoading();
        
        debug('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorMessage('Không thể khởi tạo ứng dụng. Vui lòng tải lại trang: ' + error.message);
        hideLoading();
    }
});

/**
 * Hiển thị màn hình loading
 */
function showLoading() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
}

/**
 * Ẩn màn hình loading
 */
function hideLoading() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
}

/**
 * Hiển thị container thích hợp dựa trên trạng thái xác thực
 * @param {boolean} isAuthenticated - Trạng thái xác thực của người dùng
 */
function showAppropriateContainer(isAuthenticated) {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer && appContainer) {
        if (isAuthenticated) {
            // Nếu đã đăng nhập: hiển thị ứng dụng, ẩn form đăng nhập
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            // Cập nhật thông tin người dùng
            updateUserInfo();
        } else {
            // Nếu chưa đăng nhập: hiển thị form đăng nhập, ẩn ứng dụng
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }
}

/**
 * Cập nhật thông tin người dùng trong giao diện
 */
function updateUserInfo() {
    const currentUser = typeof Auth !== 'undefined' && Auth.getCurrentUser ? Auth.getCurrentUser() : null;
    
    if (currentUser) {
        const userNameElement = document.getElementById('user-name');
        const accountNameElement = document.getElementById('account-name');
        const accountEmailElement = document.getElementById('account-email');
        const accountCreatedElement = document.getElementById('account-created');
        
        if (userNameElement) {
            userNameElement.textContent = `Xin chào, ${currentUser.name}`;
        }
        
        if (accountNameElement) {
            accountNameElement.textContent = currentUser.name;
        }
        
        if (accountEmailElement) {
            accountEmailElement.textContent = currentUser.email;
        }
        
        if (accountCreatedElement && currentUser.createdAt) {
            const createdDate = new Date(currentUser.createdAt);
            accountCreatedElement.textContent = createdDate.toLocaleDateString('vi-VN');
        }
    }
}

/**
 * Initialize authentication
 */
/**
 * Cải thiện hàm initializeAuth trong app.js
 * Thêm xử lý lỗi tốt hơn và timeout
 */

async function initializeAuth() {
    debug('Initializing Auth service...');
    
    try {
        // Thêm xử lý timeout cho Auth.init
        const authInitPromise = Auth.init();
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                debug('Auth initialization timeout, continuing with default state');
                resolve({ authenticated: false, timeout: true });
            }, 5000); // 5 giây là thời gian tối đa chờ khởi tạo Auth
        });
        
        // Chạy cả hai promise với Promise.race
        const authResult = await Promise.race([authInitPromise, timeoutPromise]);
        
        if (authResult.timeout) {
            console.warn('Authentication service timed out. Continuing with offline mode.');
            // Có thể hiển thị thông báo cho người dùng biết rằng đang ở chế độ offline
        }
        
        debug('Auth initialization result:', authResult);
        
        return authResult;
    } catch (error) {
        console.error('Auth initialization failed:', error);
        // Trả về đối tượng mặc định để ứng dụng vẫn tiếp tục
        return { authenticated: false, error: error.message };
    }
}
/**
 * Initialize UI components
 */
async function initializeUI() {
    debug('Initializing UI service...');
    
    try {
        // Kiểm tra xem UI đã được định nghĩa chưa
        if (typeof UI === 'undefined' || !UI) {
            throw new Error('UI module is not defined');
        }
        
        if (typeof UI.init !== 'function') {
            throw new Error('UI.init is not a function');
        }
        
        // Initialize UI service
        UI.init();
        
        debug('UI initialized successfully');
        return true;
    } catch (error) {
        console.error('UI initialization failed:', error);
        throw error;
    }
}

/**
 * Initialize chat functionality
 */
async function initializeChat() {
    debug('Initializing Chat service...');
    
    try {
        // Kiểm tra xem Chat đã được định nghĩa chưa
        if (typeof Chat === 'undefined' || !Chat) {
            throw new Error('Chat module is not defined');
        }
        
        if (typeof Chat.init !== 'function') {
            throw new Error('Chat.init is not a function');
        }
        
        // Initialize chat service
        const result = Chat.init();
        
        debug('Chat initialized successfully');
        return result;
    } catch (error) {
        console.error('Chat initialization failed:', error);
        throw error;
    }
}

/**
 * Khởi tạo UI dự phòng (đơn giản) khi khởi tạo chính thất bại
 */
function initializeFallbackUI() {
    debug('Initializing fallback UI...');
    
    try {
        // Kiểm tra nếu UI đã được định nghĩa
        if (typeof UI === 'undefined' || !UI) {
            // Tạo đối tượng UI cơ bản
            window.UI = {
                init: function() {
                    debug('Fallback UI initialized');
                },
                
                addUserMessage: function(text) {
                    const chatMessages = document.getElementById('chat-messages');
                    if (!chatMessages) return null;
                    
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message user-message';
                    messageElement.innerHTML = `<div class="message-content">${text}</div>`;
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    return `msg_user_${Date.now()}`;
                },
                
                addBotMessage: function(text) {
                    const chatMessages = document.getElementById('chat-messages');
                    if (!chatMessages) return null;
                    
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message bot-message';
                    messageElement.innerHTML = `<div class="message-content">${text}</div>`;
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    return `msg_bot_${Date.now()}`;
                },
                
                showTypingIndicator: function() {
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) {
                        typingIndicator.classList.remove('hidden');
                    }
                },
                
                hideTypingIndicator: function() {
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) {
                        typingIndicator.classList.add('hidden');
                    }
                },
                
                scrollToBottom: function() {
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
                },
                
                clearChat: function() {
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) chatMessages.innerHTML = '';
                },
                
                loadAnalysisHistory: function() {
                    debug('History loading not available in fallback UI');
                    return Promise.resolve([]);
                },
                
                toggleInfoPanel: function() {
                    const infoPanel = document.getElementById('info-panel');
                    const overlay = document.getElementById('overlay');
                    if (infoPanel && overlay) {
                        infoPanel.classList.toggle('visible');
                        overlay.classList.toggle('visible');
                    }
                },
                
                closeInfoPanel: function() {
                    const infoPanel = document.getElementById('info-panel');
                    const overlay = document.getElementById('overlay');
                    if (infoPanel && overlay) {
                        infoPanel.classList.remove('visible');
                        overlay.classList.remove('visible');
                    }
                },
                
                formatPhoneNumber: function(phoneNumber) {
                    if (!phoneNumber) return '';
                    const cleaned = String(phoneNumber).replace(/\D/g, '');
                    if (cleaned.length === 10) {
                        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
                    } else if (cleaned.length === 11) {
                        return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
                    }
                    return cleaned;
                },
                
                setLoading: function(isLoading) {
                    // Vô hiệu/kích hoạt các nút và input
                    const buttons = document.querySelectorAll('button');
                    const inputs = document.querySelectorAll('input');
                    
                    buttons.forEach(button => {
                        button.disabled = isLoading;
                    });
                    
                    inputs.forEach(input => {
                        input.disabled = isLoading;
                    });
                }
            };
            
            // Thêm thông báo về UI dự phòng
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="message bot-message">
                        <div class="message-content">
                            <strong>Chú ý:</strong> Ứng dụng đang chạy ở chế độ đơn giản do gặp lỗi khởi tạo.
                            Một số tính năng có thể không hoạt động. Vui lòng tải lại trang nếu bạn gặp vấn đề.
                        </div>
                    </div>
                `;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Fallback UI initialization failed:', error);
        return false;
    }
}

/**
 * Hiển thị thông báo lỗi đơn giản
 */
function showSimpleErrorMessage(message) {
    try {
        const errorElement = document.createElement('div');
        errorElement.className = 'simple-error-message';
        errorElement.textContent = message;
        
        // Định dạng thông báo lỗi
        errorElement.style.backgroundColor = '#ffebee';
        errorElement.style.color = '#d32f2f';
        errorElement.style.padding = '10px 15px';
        errorElement.style.borderRadius = '4px';
        errorElement.style.margin = '10px 0';
        errorElement.style.fontSize = '14px';
        errorElement.style.textAlign = 'center';
        
        // Thêm vào chat hoặc container phù hợp
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(errorElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.insertBefore(errorElement, appContainer.firstChild);
            }
        }
    } catch (error) {
        console.error('Error showing simple message:', error);
    }
}

/**
 * Show error message to the user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('app-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'app-error';
        errorElement.style.position = 'fixed';
        errorElement.style.top = '10px';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translateX(-50%)';
        errorElement.style.backgroundColor = 'var(--danger-color, #f44336)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '10px 20px';
        errorElement.style.borderRadius = 'var(--radius-md, 8px)';
        errorElement.style.boxShadow = 'var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1))';
        errorElement.style.zIndex = '9999';
        errorElement.style.maxWidth = '80%';
        errorElement.style.textAlign = 'center';
        
        document.body.appendChild(errorElement);
    }
    
    // Update error message
    errorElement.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.addEventListener('click', function() {
        errorElement.remove();
    });
    
    errorElement.appendChild(closeButton);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 10000);
}

/**
 * Áp dụng các sửa lỗi sau khi khởi tạo
 */
function applyFixes() {
    // Sửa lỗi tab thông tin
    fixInfoTabs();
    
    // Sửa lỗi hiển thị typing indicator
    fixTypingIndicator();
    
    // Sửa lỗi khung chat
    fixChatFramework();
}

/**
 * Sửa lỗi tab thông tin
 */
function fixInfoTabs() {
    const tabs = document.querySelectorAll('.info-tab-button');
    if (!tabs.length) return;
    
    // Thêm CSS sửa lỗi hiển thị tab
    const style = document.createElement('style');
    style.textContent = `
        /* Fix cho tab thông tin */
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
    `;
    document.head.appendChild(style);
    
    // Sửa hàm xử lý tab thông tin
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (!tabName) return;
            
            // Cập nhật trạng thái active của tab
            const allTabs = document.querySelectorAll('.info-tab-button');
            allTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Cập nhật nội dung tab
            const allContents = document.querySelectorAll('.info-tab-content');
            allContents.forEach(c => c.classList.remove('active'));
            
            const targetContent = document.getElementById(`${tabName}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

/**
 * Sửa lỗi hiển thị typing indicator
 */
function fixTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (!typingIndicator) return;
    
    // Đảm bảo typing indicator ẩn khi khởi tạo
    typingIndicator.classList.add('hidden');
    
    // Thêm CSS cho typing indicator
    const style = document.createElement('style');
    style.textContent = `
        /* Sửa lỗi hiển thị typing indicator */
        #typing-indicator.hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Sửa lỗi khung chat
 */
function fixChatFramework() {
    console.log('Installing comprehensive chat fix');
    
    setTimeout(function() {
        try {
            // Tham chiếu đến các phần tử cần thiết
            const userInput = document.getElementById('user-input');
            const sendButton = document.getElementById('send-button');
            const chatMessages = document.getElementById('chat-messages');
            
            if (userInput && sendButton && chatMessages) {
                console.log('Chat elements found, applying fix');
                
                // Xóa tất cả sự kiện hiện có
                const newInput = userInput.cloneNode(true);
                userInput.parentNode.replaceChild(newInput, userInput);
                
                const newButton = sendButton.cloneNode(true);
                sendButton.parentNode.replaceChild(newButton, sendButton);
                
                // Hàm trực tiếp xử lý tin nhắn
                function processMessage() {
                    const text = newInput.value.trim();
                    if (!text) return;
                    
                    console.log('Processing message:', text);
                    
                    // Hiển thị tin nhắn người dùng
                    if (typeof UI !== 'undefined' && UI && typeof UI.addUserMessage === 'function') {
                        UI.addUserMessage(text);
                    } else {
                        // Fallback nếu UI không khả dụng
                        const template = document.getElementById('user-message-template');
                        if (template) {
                            const messageElement = template.content.cloneNode(true);
                            const messageDiv = messageElement.querySelector('.message');
                            messageDiv.id = `msg_user_${Date.now()}`;
                            messageDiv.querySelector('.message-content').textContent = text;
                            chatMessages.appendChild(messageElement);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    }
                    
                    // Xóa nội dung input
                    newInput.value = '';
                    
                    // Hiển thị indicator đang nhập
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) {
                        typingIndicator.classList.remove('hidden');
                    }
                    
                    // Xử lý tin nhắn
                    try {
                        if (window.Chat && typeof window.Chat.processUserInput === 'function') {
                            window.Chat.processUserInput(text);
                        } else {
                            console.error('Chat.processUserInput is not a function');
                            
                            // Fallback nếu không tìm thấy Chat.processUserInput
                            setTimeout(() => {
                                const botTemplate = document.getElementById('bot-message-template');
                                if (botTemplate) {
                                    const botElement = botTemplate.content.cloneNode(true);
                                    const botDiv = botElement.querySelector('.message');
                                    botDiv.id = `msg_bot_${Date.now()}`;
                                    botDiv.querySelector('.message-content').textContent = 
                                        `Đã nhận tin nhắn của bạn: "${text}". Tuy nhiên, hệ thống xử lý không phản hồi.`;
                                    chatMessages.appendChild(botElement);
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                                
                                if (typingIndicator) {
                                    typingIndicator.classList.add('hidden');
                                }
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('Error calling processUserInput:', error);
                        // Ẩn typing indicator nếu có lỗi
                        if (typingIndicator) {
                            typingIndicator.classList.add('hidden');
                        }
                    }
                }
                
                // Thiết lập sự kiện mới
                newInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        processMessage();
                    }
                });
                
                newButton.addEventListener('click', processMessage);
                
                // Tập trung vào input
                newInput.focus();
                
                console.log('Chat fix applied successfully');
            } else {
                console.error('Could not find all required chat elements');
            }
        } catch (error) {
            console.error('Error applying chat fix:', error);
        }
    }, 500); // Đợi 0.5 giây để đảm bảo các script khác đã chạy xong
}

/**
 * Handle window resize event
 * Adjusts UI based on screen size
 */
window.addEventListener('resize', function() {
    // Close info panel on mobile when resizing to desktop
    if (window.innerWidth > 992) {
        if (typeof UI !== 'undefined' && UI && typeof UI.closeInfoPanel === 'function') {
            UI.closeInfoPanel();
        } else {
            // Fallback nếu UI không khả dụng
            const infoPanel = document.getElementById('info-panel');
            const overlay = document.getElementById('overlay');
            if (infoPanel && overlay) {
                infoPanel.classList.remove('visible');
                overlay.classList.remove('visible');
            }
        }
    }
});

// Lắng nghe sự kiện thay đổi trạng thái đăng nhập
document.addEventListener('authStateChanged', function() {
    const isLoggedIn = typeof Auth !== 'undefined' && Auth && typeof Auth.isAuthenticated === 'function' 
        ? Auth.isAuthenticated() 
        : false;
        
    debug('Auth state changed event:', isLoggedIn ? 'Logged in' : 'Logged out');
    
    // Cập nhật UI dựa trên trạng thái đăng nhập
    showAppropriateContainer(isLoggedIn);
    
    // Nếu đăng nhập thành công, tải lịch sử phân tích
    if (isLoggedIn && typeof UI !== 'undefined' && UI && typeof UI.loadAnalysisHistory === 'function') {
        UI.loadAnalysisHistory().catch(error => {
            debug('Error loading history:', error);
        });
    }
});
// Lắng nghe sự kiện lỗi xác thực
document.addEventListener('authError', function(e) {
    debug('Auth error event received:', e.detail);
    
    // Hiển thị thông báo lỗi cho người dùng
    showAuthErrorMessage(e.detail.message);
    
    // Hiển thị container đăng nhập
    showAppropriateContainer(false);
});

/**
 * Hiển thị thông báo lỗi xác thực
 * @param {string} message - Nội dung thông báo lỗi
 */
function showAuthErrorMessage(message) {
    // Tạo hoặc lấy phần tử thông báo lỗi
    let errorElement = document.getElementById('auth-error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'auth-error-message';
        errorElement.className = 'auth-error-message';
        
        // Định dạng thông báo lỗi
        errorElement.style.backgroundColor = 'var(--danger-light, #ffebee)';
        errorElement.style.color = 'var(--danger-color, #f44336)';
        errorElement.style.padding = '10px 15px';
        errorElement.style.borderRadius = 'var(--radius-md, 8px)';
        errorElement.style.marginBottom = '15px';
        errorElement.style.textAlign = 'center';
        errorElement.style.fontWeight = '500';
        errorElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        errorElement.style.borderLeft = '3px solid var(--danger-color, #f44336)';
        errorElement.style.animation = 'fadeIn 0.3s ease-out';
        
        // Thêm vào auth container
        const authContainer = document.querySelector('.auth-box');
        if (authContainer) {
            authContainer.insertBefore(errorElement, authContainer.firstChild);
        }
    }
    
    // Cập nhật nội dung thông báo
    errorElement.textContent = message;
    
    // Tự động ẩn sau 15 giây
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.style.opacity = '0';
            errorElement.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 500);
        }
    }, 15000);
}

// Thêm CSS animation cho thông báo
function addAuthErrorStyles() {
    const styleExists = document.getElementById('auth-error-styles');
    if (styleExists) return;
    
    const style = document.createElement('style');
    style.id = 'auth-error-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .auth-error-message {
            animation: fadeIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// Gọi thêm CSS khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function addStyles() {
    addAuthErrorStyles();
    // Chỉ gọi một lần
    document.removeEventListener('DOMContentLoaded', addStyles);
});
