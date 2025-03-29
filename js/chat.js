/**
 * Chat Service for Phone Analysis App
 * Handles chat interactions and phone number analysis
 */

const Chat = (function() {
    // Chat state
    const state = {
        conversationHistory: [],
        currentAnalysis: null,
        processingInput: false,
        context: {
            lastInputType: null,  // 'phone', 'question', 'followup', 'general'
            lastPhoneNumber: null,
            questionCount: 0
        }
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
            // Thêm vào lịch sử trò chuyện
            addToHistory('user', input);
            
            // Phân tích loại đầu vào
            const inputType = detectInputType(input);
            debug('Detected input type:', inputType);
            
            // Xử lý dựa vào loại input
            switch(inputType) {
                case 'phone':
                    // Lưu số điện thoại hiện tại và loại đầu vào
                    state.context.lastInputType = 'phone';
                    state.context.lastPhoneNumber = input.replace(/\D/g, '');
                    state.context.questionCount = 0;
                    
                    await processPhoneNumber(input);
                    break;
                    
                case 'followup':
                    // Tăng số lượng câu hỏi đã hỏi
                    state.context.questionCount++;
                    state.context.lastInputType = 'followup';
                    
                    await processFollowUpQuestion(input);
                    break;
                    
                case 'general':
                    state.context.lastInputType = 'general';
                    await processGeneralQuestion(input);
                    break;
                    
                case 'compare':
                    state.context.lastInputType = 'compare';
                    await processCompareRequest(input);
                    break;
                    
                default:
                    // Mặc định xử lý như câu hỏi dựa trên ngữ cảnh
                    if (state.context.lastPhoneNumber) {
                        state.context.questionCount++;
                        state.context.lastInputType = 'question';
                        await processQuestion(input);
                    } else {
                        state.context.lastInputType = 'general';
                        await processGeneralQuestion(input);
                    }
                    break;
            }
        } catch (error) {
            debug('Error processing input:', error);
            UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.');
            addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.');
        } finally {
            // Hide typing indicator
            UI.hideTypingIndicator();
            
            // Reset processing state
            state.processingInput = false;
        }
    }
    
    /**
     * Phát hiện loại đầu vào của người dùng
     * @param {string} input - Đầu vào người dùng
     * @returns {string} Loại đầu vào ('phone', 'followup', 'general', 'compare')
     */
    function detectInputType(input) {
        // Chuẩn hóa đầu vào
        const cleanInput = input.trim().toLowerCase();
        
        // Kiểm tra nếu là số điện thoại
        const phonePattern = /^[0-9\s\.\-\+\(\)]{8,15}$/;
        if (phonePattern.test(cleanInput.replace(/\D/g, ''))) {
            return 'phone';
        }
        
        // Kiểm tra nếu là yêu cầu so sánh
        const compareKeywords = [
            'so sánh', 'đối chiếu', 'so với', 'so với nhau', 'so le',
            'số nào tốt hơn', 'số nào hay hơn', 'số nào phù hợp hơn',
            'số nào thích hợp hơn', 'số nào mạnh hơn'
        ];
        
        // Kiểm tra xem có chứa từ khóa so sánh và ít nhất hai số điện thoại
        const hasCompareKeyword = compareKeywords.some(keyword => cleanInput.includes(keyword));
        const phoneNumbers = extractPhoneNumbers(cleanInput);
        
        if (hasCompareKeyword && phoneNumbers.length >= 2) {
            return 'compare';
        }
        
        // Kiểm tra nếu là câu hỏi tiếp theo dựa vào từ khóa
        const followupKeywords = [
            'vậy còn', 'thế còn', 'vậy thì', 'liên quan đến', 
            'điểm mạnh', 'điểm yếu', 'vậy', 'thế', 'tiếp theo', 
            'còn nữa', 'thêm', 'chi tiết hơn', 'nói thêm', 
            'giải thích thêm', 'ngoài ra'
        ];
        
        const questionKeywords = [
            'tại sao', 'vì sao', 'như thế nào', 'có ý nghĩa gì',
            'là gì', 'có nghĩa gì', 'để làm gì', 'nên làm gì',
            'làm sao', 'cách nào', 'cải thiện', 'giải quyết'
        ];
        
        // Nếu ngữ cảnh trước đó là về số điện thoại và câu hiện tại có vẻ là follow-up
        if (state.context.lastInputType && 
            (state.context.lastInputType === 'phone' || state.context.lastInputType === 'question' || state.context.lastInputType === 'followup') &&
            (followupKeywords.some(keyword => cleanInput.includes(keyword)) || 
             questionKeywords.some(keyword => cleanInput.includes(keyword)))) {
            return 'followup';
        }
        
        // Kiểm tra nếu là câu hỏi chung về chiêm tinh học số
        const generalKeywords = [
            'ý nghĩa số', 'con số', 'các số', 'ba số', 'tứ cát', 'tứ hung', 'bát tinh',
            'chiêm tinh học số', 'phong thủy số', 'phương pháp', 'nguyên lý',
            'phân tích số', 'quy tắc', 'cách xem', 'ý nghĩa bát tinh'
        ];
        
        if (generalKeywords.some(keyword => cleanInput.includes(keyword))) {
            return 'general';
        }
        
        // Mặc định dựa vào ngữ cảnh
        return state.context.lastInputType ? 'followup' : 'general';
    }
    
    /**
     * Trích xuất các số điện thoại từ một chuỗi
     * @param {string} text - Văn bản đầu vào
     * @returns {Array} Mảng các số điện thoại tìm thấy
     */
    function extractPhoneNumbers(text) {
        // Tìm các mẫu có thể là số điện thoại
        const phonePattern = /(\b\d{10}\b|\b\d{4}[\s\.-]?\d{3}[\s\.-]?\d{3}\b|\b\d{3}[\s\.-]?\d{3}[\s\.-]?\d{4}\b)/g;
        const matches = text.match(phonePattern) || [];
        
        // Lọc và chuẩn hóa các kết quả
        return matches.map(match => match.replace(/\D/g, ''));
    }
    
    /**
     * Process a phone number
     * @param {string} phoneNumber - Phone number to process
     */
    async function processPhoneNumber(phoneNumber) {
        try {
            // Gửi số điện thoại đến API
            const response = await API.analyzePhoneNumber(phoneNumber);
            debug('API Response:', response);
            
            if (response.success) {
                // Store current analysis
                const analysisData = response.analysis;
                state.currentAnalysis = analysisData;
                
                // Check if interpretation is available
                let interpretation = '';
                if (analysisData && analysisData.geminiResponse) {
                    interpretation = analysisData.geminiResponse;
                } else if (typeof analysisData === 'string') {
                    interpretation = analysisData;
                } else if (analysisData && analysisData.answer) {
                    interpretation = analysisData.answer;
                } else if (response.data && response.data.answer) {
                    interpretation = response.data.answer;
                } else {
                    interpretation = `Đã phân tích số điện thoại ${phoneNumber}. Không tìm thấy thông tin chi tiết.`;
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
    
    /**
     * Process a question about a phone number
     * @param {string} question - Question to process
     */
    async function processQuestion(question) {
        try {
            // Đảm bảo rằng chúng ta có một số điện thoại trong ngữ cảnh
            if (!state.context.lastPhoneNumber) {
                UI.addBotMessage('Bạn cần nhập số điện thoại trước khi hỏi câu hỏi về nó. Hãy nhập một số điện thoại để tôi phân tích.');
                addToHistory('assistant', 'Bạn cần nhập số điện thoại trước khi hỏi câu hỏi về nó. Hãy nhập một số điện thoại để tôi phân tích.');
                return;
            }
            
            // Sử dụng phiên bản mới của askQuestion với cú pháp đối tượng
            const response = await API.askQuestion({
                question: question,
                phoneNumber: state.context.lastPhoneNumber,
                type: 'question'
            });
            
            if (response.success) {
                // Trích xuất câu trả lời
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
                const errorMsg = response.message || 'Không thể trả lời câu hỏi. Vui lòng thử lại.';
                UI.addBotMessage(errorMsg);
                addToHistory('assistant', errorMsg);
            }
        } catch (error) {
            debug('Error processing question:', error);
            UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
            addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Process a follow-up question
     * @param {string} question - Follow-up question to process
     */
    async function processFollowUpQuestion(question) {
        try {
            // Tạo payload cho câu hỏi follow-up
            const payload = {
                question: question,
                type: 'followup'
            };
            
            // Thêm số điện thoại hiện tại nếu có
            if (state.context.lastPhoneNumber) {
                payload.phoneNumber = state.context.lastPhoneNumber;
            }
            
            // Gọi API
            const response = await API.askQuestion(payload);
            
            if (response.success) {
                // Trích xuất câu trả lời
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
                const errorMsg = response.message || 'Không thể trả lời câu hỏi. Vui lòng thử lại.';
                UI.addBotMessage(errorMsg);
                addToHistory('assistant', errorMsg);
            }
        } catch (error) {
            debug('Error processing follow-up question:', error);
            
            // Thử xử lý như câu hỏi chung nếu xử lý follow-up thất bại
            try {
                debug('Falling back to general question processing');
                await processGeneralQuestion(question);
            } catch (fallbackError) {
                debug('Fallback also failed:', fallbackError);
                UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
                addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
            }
        }
    }
    
    /**
     * Process a general question about numerology
     * @param {string} question - General question to process
     */
    async function processGeneralQuestion(question) {
        try {
            // Gọi API với loại câu hỏi general
            const response = await API.askQuestion({
                question: question,
                type: 'general'
            });
            
            if (response.success) {
                // Trích xuất câu trả lời
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
                const errorMsg = response.message || 'Không thể trả lời câu hỏi. Vui lòng thử lại.';
                UI.addBotMessage(errorMsg);
                addToHistory('assistant', errorMsg);
            }
        } catch (error) {
            debug('Error processing general question:', error);
            UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
            addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Process a request to compare phone numbers
     * @param {string} input - User input containing phone numbers to compare
     */
    async function processCompareRequest(input) {
        try {
            // Trích xuất các số điện thoại từ đầu vào
            const phoneNumbers = extractPhoneNumbers(input);
            
            if (phoneNumbers.length < 2) {
                UI.addBotMessage('Để so sánh số điện thoại, vui lòng cung cấp ít nhất 2 số điện thoại.');
                addToHistory('assistant', 'Để so sánh số điện thoại, vui lòng cung cấp ít nhất 2 số điện thoại.');
                return;
            }
            
            // Gọi API với loại câu hỏi compare
            const response = await API.askQuestion({
                question: input,
                phoneNumbers: phoneNumbers,
                type: 'compare'
            });
            
            if (response.success) {
                // Trích xuất câu trả lời
                let answer = '';
                if (response.analysis && response.analysis.answer) {
                    answer = response.analysis.answer;
                } else if (response.data && response.data.answer) {
                    answer = response.data.answer;
                } else if (typeof response.data === 'string') {
                    answer = response.data;
                } else {
                    answer = `Đã so sánh các số điện thoại: ${phoneNumbers.join(', ')}. Không tìm thấy thông tin chi tiết về so sánh.`;
                }
                
                UI.addBotMessage(answer);
                addToHistory('assistant', answer);
            } else {
                const errorMsg = response.message || 'Không thể so sánh các số điện thoại. Vui lòng thử lại.';
                UI.addBotMessage(errorMsg);
                addToHistory('assistant', errorMsg);
            }
        } catch (error) {
            debug('Error processing compare request:', error);
            UI.addBotMessage('Xin lỗi, đã xảy ra lỗi khi so sánh các số điện thoại. Vui lòng thử lại sau.');
            addToHistory('assistant', 'Xin lỗi, đã xảy ra lỗi khi so sánh các số điện thoại. Vui lòng thử lại sau.');
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
        state.context = {
            lastInputType: null,
            lastPhoneNumber: null,
            questionCount: 0
        };
        
        debug('Conversation history and context cleared');
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