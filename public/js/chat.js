/**
 * Chat Service for Phone Analysis App
 * Handles chat interactions and phone number analysis
 */

const Chat = (function() {
    // Chat state
    const state = {
        conversationHistory: [],
        currentAnalysis: null,
        processingInput: false
    };
    
    /**
 * Initialize the chat service
 */
function init() {
    try {
        // Kiểm tra xem UI đã được khởi tạo và chat-messages container đã tồn tại chưa
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            debug('Cannot initialize chat - chat-messages container not found');
            return false;
        }
        
        // Add welcome message
        UI.addBotMessage('Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.');
        
        return true;
    } catch (error) {
        debug('Error initializing chat:', error);
        return false;
    }
}
    
    /**
     * Process user input (message or phone number)
     * @param {string} input - User input text
     */
    async function processUserInput(input) {
        if (state.processingInput) return;
        
        state.processingInput = true;
        
        // Show typing indicator
        UI.showTypingIndicator();
        
        try {
            // Check if input is a phone number
            if (isPhoneNumber(input)) {
                await processPhoneNumber(input);
            } else {
                // Đây là một câu hỏi hoặc lệnh khác
                await processQuestion(input);
            }
        } catch (error) {
            debug('Error processing input:', error);
            UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.');
        } finally {
            // Hide typing indicator
            UI.hideTypingIndicator();
            
            // Reset processing state
            state.processingInput = false;
        }
    }
    
    /**
     * Check if input is a phone number
     * @param {string} input - User input text
     * @returns {boolean} Whether input is a phone number
     */
/**
 * Check if input is a phone number
 * @param {string} input - User input text
 * @returns {boolean} Whether input is a phone number
 */
function isPhoneNumber(input) {
    // Nếu đầu vào dài hơn 20 ký tự, có thể đây là câu hỏi chứ không phải số điện thoại
    if (input.length > 20) return false;
    
    // Remove any non-digit characters
    const cleaned = input.replace(/\D/g, '');
    
    // Nếu đầu vào chứa quá nhiều ký tự không phải số, có thể đây là câu hỏi
    if (cleaned.length < input.length * 0.7) return false;
    
    // Vietnamese phone numbers typically start with 0 and have 10-11 digits
    const phoneRegex = /^0\d{9,10}$/;
    
    return phoneRegex.test(cleaned);
}
    
  /**
 * Process a phone number
 * @param {string} phoneNumber - Phone number to process
 */
async function processPhoneNumber(phoneNumber) {
    try {
        // Clean the phone number
        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        
        // Request analysis from the API
        const response = await API.analyzePhoneNumber(cleanedNumber);
        debug('API Response:', response);
        
        if (response.success) {
            // Store current analysis - response có dữ liệu trong response.analysis
            const analysisData = response.analysis;
            state.currentAnalysis = analysisData;
            
            // Check if interpretation is available
            let interpretation = '';
            if (analysisData && analysisData.geminiResponse) {
                interpretation = analysisData.geminiResponse;
            } else if (typeof analysisData === 'string') {
                // Nếu dữ liệu là chuỗi, sử dụng nó làm kết quả phân tích
                interpretation = analysisData;
            } else {
                // Tạo phân tích tổng quát nếu không có kết quả chi tiết
                interpretation = `Đã phân tích số điện thoại ${cleanedNumber}. Đây là kết quả phân tích theo phương pháp Tứ Cát Tứ Hung.`;
            }
            
            // Add message with analysis data
            UI.addBotMessage(interpretation, analysisData);
            
            // Add to conversation history
            addToHistory('assistant', interpretation, analysisData);
        } else {
            const errorMsg = response.message || 'Không thể phân tích số điện thoại. Vui lòng thử lại.';
            UI.addBotMessage(errorMsg);
            addToHistory('assistant', errorMsg);
        }
    } catch (error) {
        debug('Error analyzing phone number:', error);
        UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi phân tích số điện thoại. Vui lòng thử lại sau.');
        addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi phân tích số điện thoại. Vui lòng thử lại sau.');
    }
}
async function processQuestion(question) {
    try {
        // Check if we have a current analysis for context
        if (state.currentAnalysis) {
            // Ask a question about the current phone number
            const response = await API.askQuestion(state.currentAnalysis.phoneNumber, question);
            
            if (response.success) {
                // Sửa đổi: kiểm tra cấu trúc phản hồi
                let answer = '';
                if (response.analysis && response.analysis.answer) {
                    answer = response.analysis.answer;
                } else if (response.data && response.data.answer) {
                    answer = response.data.answer;
                } else if (typeof response.data === 'string') {
                    answer = response.data;
                } else {
                    answer = 'Đã xử lý câu hỏi của bạn, nhưng không tìm thấy câu trả lời cụ thể.';
                }
                
                UI.addBotMessage(answer);
                addToHistory('assistant', answer);
            } else {
                UI.addBotMessage(response.message || 'Không thể trả lời câu hỏi. Vui lòng thử lại.');
                addToHistory('assistant', response.message || 'Không thể trả lời câu hỏi. Vui lòng thử lại.');
            }
        } else {
            // Phần còn lại của hàm giữ nguyên...
        }
    } catch (error) {
        debug('Error processing question:', error);
        UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
        addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
    }
}

    /**
     * Add a message to the conversation history
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     * @param {object} data - Optional additional data
     */
    function addToHistory(role, content, data = null) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString(),
            data
        };
        
        state.conversationHistory.push(message);
        
        // Keep history to a reasonable size
        if (state.conversationHistory.length > 20) {
            state.conversationHistory = state.conversationHistory.slice(-20);
        }
    }
    
    /**
     * Get recent conversation history
     * @param {number} count - Number of recent messages to retrieve
     * @returns {Array} Recent conversation history
     */
    function getRecentHistory(count = 5) {
        return state.conversationHistory.slice(-count);
    }
    
    /**
     * Get current analysis
     * @returns {object|null} Current analysis data or null
     */
    function getCurrentAnalysis() {
        return state.currentAnalysis;
    }
    
    /**
     * Clear conversation history
     */
    function clearHistory() {
        state.conversationHistory = [];
        state.currentAnalysis = null;
    }
    
    // Return public methods
    return {
        init,
        processUserInput,
        getRecentHistory,
        getCurrentAnalysis,
        clearHistory
    };
})();

// Export the Chat service for use in other modules
window.Chat = Chat;