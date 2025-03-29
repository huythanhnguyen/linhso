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
        // Gửi tất cả input đến xử lý, không cần kiểm tra loại input
        await processPhoneNumber(input);
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
 * Process a phone number or any user input
 * @param {string} input - User input to process
 */
async function processPhoneNumber(input) {
    try {
        // Gửi trực tiếp input đến API mà không cần validate hay normalize
        const response = await API.analyzePhoneNumber(input);
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
            } else if (analysisData && analysisData.answer) {
                // Kiểm tra nếu đây là câu trả lời cho câu hỏi
                interpretation = analysisData.answer;
            } else if (response.data && response.data.answer) {
                // Cấu trúc phản hồi khác
                interpretation = response.data.answer;
            } else {
                // Tạo phân tích tổng quát nếu không có kết quả chi tiết
                interpretation = `Đã phân tích nội dung "${input}". Đây là kết quả phân tích.`;
            }
            
            // Add message with analysis data
            UI.addBotMessage(interpretation, analysisData);
            
            // Add to conversation history
            addToHistory('assistant', interpretation, analysisData);
        } else {
            const errorMsg = response.message || 'Không thể phân tích nội dung. Vui lòng thử lại.';
            UI.addBotMessage(errorMsg);
            addToHistory('assistant', errorMsg);
        }
    } catch (error) {
        debug('Error analyzing input:', error);
        UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.');
        addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.');
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