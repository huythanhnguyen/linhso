/**
 * Authentication Service for Phone Analysis App
 * Handles user authentication, registration, and session management
 */

const Auth = (function() {
    // Current authenticated user
    let currentUser = null;
    
    // Event for auth state change
    const authStateChanged = new CustomEvent('authStateChanged');
    
    /**
     * Initialize the auth service
     * @returns {Promise} Initialization result
     */
    /**
 * Sửa hàm init trong Auth service
 * Thêm xử lý lỗi tốt hơn và timeout cho verifyToken
 */

async function init() {
    try {
        // Get user from local storage
        const storedUser = getUser();
        const token = getAuthToken();
        
        if (token && storedUser) {
            currentUser = storedUser;
            
            // Thêm xử lý timeout cho verifyToken
            try {
                // Sử dụng Promise với timeout
                const verifyPromise = API.verifyToken();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Token verification timeout'));
                    }, 3000); // 3 giây là đủ cho việc xác thực token
                });
                
                // Chạy cả hai promise với Promise.race
                const { valid, user } = await Promise.race([verifyPromise, timeoutPromise]);
                
                if (valid && user) {
                    // Update the user data with the latest from the server
                    currentUser = user;
                    setUser(user);
                    
                    return { authenticated: true, user };
                } else {
                    // Token is invalid, log the user out
                    await logout(false); // Không gửi request đến server
                    return { authenticated: false };
                }
            } catch (error) {
                // Xử lý timeout hoặc lỗi xác thực khác
                debug('Error verifying token:', error);
                
                // Nếu là lỗi timeout, sử dụng thông tin hiện có
                if (error.message === 'Token verification timeout' || error.message === 'Request timeout') {
                    debug('Using cached user data due to server timeout');
                    return { authenticated: true, user: currentUser };
                }
                
                // Nếu là lỗi khác, đăng xuất
                await logout(false);
                return { authenticated: false, error };
            }
        }
        
        return { authenticated: false };
    } catch (error) {
        debug('Auth init error:', error);
        return { authenticated: false, error };
    }
}
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login result
     */
    async function login(email, password) {
        try {
            const response = await API.login(email, password);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Đăng nhập thất bại' };
            }
            
            currentUser = response.user;
            
            // Kích hoạt sự kiện thay đổi trạng thái xác thực
            document.dispatchEvent(authStateChanged);
            
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message || 'Đăng nhập thất bại' };
        }
    }
    
    /**
     * Register a new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Registration result
     */
    async function register(name, email, password) {
        try {
            const response = await API.register(name, email, password);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Đăng ký thất bại' };
            }
            
            currentUser = response.user;
            
            // Kích hoạt sự kiện thay đổi trạng thái xác thực
            document.dispatchEvent(authStateChanged);
            
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message || 'Đăng ký thất bại' };
        }
    }
    
    /**
     * Logout the current user
     * @param {boolean} callServer - Whether to call server logout API
     * @returns {Promise} Logout result
     */
    async function logout(callServer = true) {
        try {
            if (callServer) {
                await API.logout();
            }
        } catch (error) {
            debug('Logout error:', error);
        } finally {
            // Luôn xóa dữ liệu đăng nhập khỏi local storage
            removeAuthToken();
            removeUser();
            
            // Cập nhật trạng thái người dùng hiện tại
            currentUser = null;
            
            // Kích hoạt sự kiện thay đổi trạng thái xác thực
            document.dispatchEvent(authStateChanged);
        }
        
        return { success: true };
    }
    
    /**
     * Get the current authenticated user
     * @returns {object|null} Current user or null if not authenticated
     */
    function getCurrentUser() {
        return currentUser;
    }
    
    /**
     * Check if a user is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    function isAuthenticated() {
        return !!currentUser && !!getAuthToken();
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Change password result
     */
    async function changePassword(currentPassword, newPassword) {
        try {
            const response = await API.changePassword(currentPassword, newPassword);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Không thể thay đổi mật khẩu' };
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Không thể thay đổi mật khẩu' };
        }
    }
    
    /**
     * Check if an email is valid
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Check if a password is valid
     * @param {string} password - Password to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function isValidPassword(password) {
        // At least 6 characters
        return password && password.length >= 6;
    }
    
    // Return public methods
    return {
        init,
        login,
        register,
        logout,
        getCurrentUser,
        isAuthenticated,
        changePassword,
        isValidEmail,
        isValidPassword
    };
})();

// Export the Auth service for use in other modules
window.Auth = Auth;