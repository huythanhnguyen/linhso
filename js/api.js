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
     * Analyze a phone number
     * @param {string} phoneNumber - Phone number to analyze
     * @returns {Promise} Analysis response
     */
    async function analyzePhoneNumber(phoneNumber) {
        try {
            // Normalize phone number by removing non-digit characters
            const normalizedNumber = phoneNumber.replace(/\D/g, '');
            
            const response = await request(CONFIG.ANALYSIS.ANALYZE, 'POST', { phoneNumber: normalizedNumber });
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
    async function getAnalysisHistory() {
        return await request(CONFIG.ANALYSIS.HISTORY, 'GET');
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
     * Ask a question about a phone number
     * @param {string} phoneNumber - Phone number context
     * @param {string} question - User's question
     * @returns {Promise} Question response
     */
    async function askQuestion(phoneNumber, question) {
        return await request(CONFIG.ANALYSIS.QUESTION, 'POST', {
            phoneNumber,
            question
        });
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
