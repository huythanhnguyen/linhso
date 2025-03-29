/**
 * API Service for Phone Analysis App
 * Handles all requests to the backend API
 */

const API = (function() {
    /**
     * Send a request to the API
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request data (for POST, PUT, PATCH)
     * @param {boolean} auth - Whether to include authentication token
     * @returns {Promise} Response from the API
     */
    async function request(endpoint, method = 'GET', data = null, auth = true) {
        // Construct the full URL
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        
        // Setup request options
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add authentication token if required
        if (auth) {
            const token = getAuthToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            } else if (auth) {
                // Return a rejected promise instead of throwing an error immediately
                return Promise.reject(new Error('Không tìm thấy token xác thực'));
            }
        }
        
        // Add request body if data is provided
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            // Use AbortController for timeout
            const controller = new AbortController();
            options.signal = controller.signal;
            
            // Create a timeout that aborts the fetch
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, CONFIG.REQUEST_TIMEOUT || 30000); // Default to 30 seconds if not configured
            
            // Send the request
            const response = await fetch(url, options);
            
            // Clear timeout
            clearTimeout(timeoutId);
            // Check for authentication errors 
            if (response.status === 401) {
                // Token không hợp lệ hoặc đã hết hạn
                debug('Authentication error: 401 Unauthorized');
                
                // Phát sự kiện thông báo lỗi xác thực
                const authErrorEvent = new CustomEvent('authError', {
                    detail: { 
                        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
                        endpoint: endpoint
                    }
                });
                document.dispatchEvent(authErrorEvent);
                
                // Thực hiện đăng xuất (không gọi API)
                if (window.Auth && typeof window.Auth.logout === 'function') {
                    // Tham số false để không gọi API logout
                    await window.Auth.logout(false);
                } else {
                    // Phương án dự phòng nếu không có Auth module
                    removeAuthToken();
                    removeUser();
                }
                
                const error = new Error('Phiên đăng nhập đã hết hạn');
                error.status = 401;
                error.isAuthError = true;
                throw error;
            }

            // Parse the response
            const responseData = await response.json();
            
            // Check if the request was successful
            if (!response.ok) {
                const error = new Error(responseData.message || 'API request failed');
                error.status = response.status;
                error.response = responseData;
                throw error;
            }
            
            return responseData;
        } catch (error) {
            if (error.name === 'AbortError') {
                debug('API Request Timeout:', endpoint);
                // Create a more descriptive error for timeout
                const timeoutError = new Error('Request timeout');
                timeoutError.isTimeout = true;
                throw timeoutError;
            }
            
            debug('API Error:', error);
            throw error;
        }
    }
    
    // Auth API
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login response
     */
    async function login(email, password) {
        try {
            const response = await request(CONFIG.AUTH.LOGIN, 'POST', { email, password }, false);
            
            if (response.token) {
                setAuthToken(response.token);
                setUser(response.user);
            }
            
            return response;
        } catch (error) {
            debug('Login error:', error);
            throw error;
        }
    }
    
    /**
     * Register a new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Register response
     */
    async function register(name, email, password) {
        try {
            const response = await request(CONFIG.AUTH.REGISTER, 'POST', { name, email, password }, false);
            
            if (response.token) {
                setAuthToken(response.token);
                setUser(response.user);
            }
            
            return response;
        } catch (error) {
            debug('Register error:', error);
            throw error;
        }
    }
    
    /**
     * Logout the current user
     * @returns {Promise} Logout response
     */
    async function logout() {
        try {
            await request(CONFIG.AUTH.LOGOUT, 'POST');
        } catch (error) {
            // Even if the server request fails, we still want to clear local storage
            debug('Logout error:', error);
        } finally {
            removeAuthToken();
            removeUser();
        }
        
        return { success: true };
    }
    
    /**
     * Verify the authentication token
     * @returns {Promise} Verification response
     */
    async function verifyToken() {
        try {
            const response = await request(CONFIG.AUTH.VERIFY_TOKEN, 'GET');
            return { valid: true, user: response.user };
        } catch (error) {
            // If the token is invalid, clear local storage
            removeAuthToken();
            removeUser();
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Change password response
     */
    async function changePassword(currentPassword, newPassword) {
        return await request(CONFIG.AUTH.CHANGE_PASSWORD, 'POST', {
            currentPassword,
            newPassword
        });
    }
    
    // User API
    
    /**
     * Get user profile
     * @returns {Promise} User profile
     */
    async function getUserProfile() {
        return await request(CONFIG.USER.PROFILE, 'GET');
    }
    
    /**
     * Update user profile
     * @param {object} profileData - Profile data to update
     * @returns {Promise} Update response
     */
    async function updateUserProfile(profileData) {
        return await request(CONFIG.USER.UPDATE_PROFILE, 'PUT', profileData);
    }
    
    // Analysis API
    
    /**
     * Analyze a phone number or any input
     * @param {string} input - User input to analyze
     * @returns {Promise} Analysis response
     */
    async function analyzePhoneNumber(input) {
        try {
            // Gửi input trực tiếp mà không xử lý
            const response = await request(CONFIG.ANALYSIS.ANALYZE, 'POST', { phoneNumber: input });
            debug('Received analysis response:', response);
            return response;
        } catch (error) {
            debug('Error in analyzePhoneNumber API call:', error);
            throw error;
        }
    }
    
    /**
     * Get analysis history
     * @returns {Promise} Analysis history
     */
  /**
 * Get analysis history with detailed error handling and logging
 * @param {number} limit - Optional limit for number of records to retrieve
 * @param {number} page - Optional page number for pagination
 * @returns {Promise} Analysis history object with data property containing records
 */
async function getAnalysisHistory(limit = 20, page = 1) {
    try {
        // Tạo query parameters nếu có
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit);
        if (page) queryParams.append('page', page);
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const endpoint = `${CONFIG.ANALYSIS.HISTORY}${queryString}`;
        
        // Kiểm tra xác thực trước khi gọi API
        const token = getAuthToken();
        if (!token) {
            console.warn('Attempting to get history without authentication token');
            return { success: false, message: 'Chưa đăng nhập', data: [] };
        }
        
        console.log('Calling API to get analysis history...');
        const response = await request(endpoint, 'GET');
        console.log('Analysis history API response:', response);
        
        // Kiểm tra định dạng dữ liệu phản hồi
        if (!response) {
            console.error('Empty response from history API');
            return { success: false, message: 'Không nhận được dữ liệu từ server', data: [] };
        }
        
        // Đảm bảo response có định dạng chuẩn
        if (!response.success && !response.data) {
            console.warn('Response from history API is missing success or data properties:', response);
            
            // Cố gắng bình thường hóa dữ liệu
            if (Array.isArray(response)) {
                // Nếu response là mảng, giả định đó là dữ liệu
                return { success: true, data: response };
            } else {
                // Nếu response là object nhưng không có data, bọc nó
                return { 
                    success: response.success !== false, 
                    message: response.message || 'Định dạng dữ liệu không đúng', 
                    data: response.data || []
                };
            }
        }
        
        // Kiểm tra xem phản hồi có thành công không
        if (response.success === false) {
            console.warn('Failed to retrieve history:', response.message);
            return response; // Trả về response nguyên bản
        }
        
        // Kiểm tra xem data có phải mảng không
        if (response.data && !Array.isArray(response.data)) {
            console.warn('History data is not an array:', response.data);
            return { 
                success: true, 
                message: 'Dữ liệu lịch sử không đúng định dạng',
                data: []
            };
        }
        
        // Log thông tin chi tiết nếu có dữ liệu
        if (response.data && response.data.length > 0) {
            console.log(`Retrieved ${response.data.length} history items`);
            console.log('First history item sample:', response.data[0]);
        } else {
            console.log('History is empty');
        }
        
        return response;
    } catch (error) {
        console.error('Error retrieving analysis history:', error);
        
        // Đảm bảo trả về object có cấu trúc nhất quán trong trường hợp lỗi
        return {
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử phân tích',
            error: error.toString(),
            data: []
        };
    }
}
    
    /**
     * Delete analysis history
     * @returns {Promise} Delete response
     */
    async function deleteAnalysisHistory() {
        return await request(CONFIG.ANALYSIS.DELETE_HISTORY, 'DELETE');
    }
    
    /**
     * Send feedback for an analysis
     * @param {string} analysisId - Analysis ID
     * @param {string} feedbackType - Feedback type (positive/negative)
     * @param {string} comment - Optional feedback comment
     * @returns {Promise} Feedback response
     */
    async function sendFeedback(analysisId, feedbackType, comment = '') {
        return await request(CONFIG.ANALYSIS.FEEDBACK, 'POST', {
            analysisId,
            feedbackType,
            comment
        });
    }
    
/**
 * Ask a question about a phone number with enhanced capabilities
 * @param {string|object} options - Phone number or options object
 * @param {string} [questionText] - User's question when first param is phoneNumber
 * @returns {Promise} Question response
 * 
 * Examples:
 * // Cú pháp cũ (vẫn được hỗ trợ)
 * askQuestion("0912345678", "Số này có ý nghĩa gì?");
 * 
 * // Cú pháp mới - câu hỏi chung
 * askQuestion({
 *   question: "Số 8 có ý nghĩa gì trong chiêm tinh học số?",
 *   type: "general"
 * });
 * 
 * // Câu hỏi theo dõi (follow-up)
 * askQuestion({
 *   question: "Làm sao để cải thiện tình trạng này?",
 *   phoneNumber: "0912345678", // tùy chọn
 *   type: "followup"
 * });
 * 
 * // So sánh các số điện thoại
 * askQuestion({
 *   question: "Số nào tốt hơn cho kinh doanh?",
 *   phoneNumbers: ["0912345678", "0987654321"],
 *   type: "compare"
 * });
 */
async function askQuestion(options, questionText) {
    try {
        // Xử lý cú pháp cũ: askQuestion(phoneNumber, question)
        if (typeof options === 'string') {
            return await request(CONFIG.ANALYSIS.QUESTION, 'POST', {
                phoneNumber: options,
                question: questionText,
                type: 'question'
            });
        }
        
        // Xử lý cú pháp mới: askQuestion({...})
        const payload = {
            question: options.question,
            type: options.type || 'question'
        };
        
        // Thêm các tham số tùy theo loại câu hỏi
        switch (payload.type) {
            case 'question':
                payload.phoneNumber = options.phoneNumber;
                break;
                
            case 'followup':
                // Có thể thêm phoneNumber tùy chọn để chỉ định context
                if (options.phoneNumber) {
                    payload.phoneNumber = options.phoneNumber;
                }
                break;
                
            case 'compare':
                if (!options.phoneNumbers || !Array.isArray(options.phoneNumbers)) {
                    throw new Error('Cần cung cấp mảng phoneNumbers để so sánh');
                }
                payload.phoneNumbers = options.phoneNumbers;
                break;
                
            case 'general':
                // Không cần tham số đặc biệt
                break;
                
            default:
                debug('Không nhận dạng được loại câu hỏi, sử dụng mặc định: question');
                payload.type = 'question';
                if (options.phoneNumber) {
                    payload.phoneNumber = options.phoneNumber;
                }
        }
        
        debug('Sending question with payload:', payload);
        return await request(CONFIG.ANALYSIS.QUESTION, 'POST', payload);
    } catch (error) {
        debug('Error in askQuestion API call:', error);
        throw error;
    }
}
    /**
     * Get recent analyses for the current user
     * @param {number} limit - Maximum number of items to return
     * @returns {Promise} Recent analyses
     */
    async function getRecentAnalyses(limit = 5) {
        return await request(`${CONFIG.ANALYSIS.RECENT}?limit=${limit}`, 'GET');
    }
    
    // Return public methods
    return {
        // Auth
        login,
        register,
        logout,
        verifyToken,
        changePassword,
        
        // User
        getUserProfile,
        updateUserProfile,
        
        // Analysis
        analyzePhoneNumber,
        getAnalysisHistory,
        deleteAnalysisHistory,
        sendFeedback,
        askQuestion,
        getRecentAnalyses,
        
        // Core
        request
    };
})();

// Export the API service for use in other modules
window.API = API;
