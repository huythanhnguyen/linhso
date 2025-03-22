/**
 * Configuration file for Phone Analysis App
 * Contains API endpoints and other configuration settings
 */

const CONFIG = {
    // API Base URL - Change this to match your server's address
    API_BASE_URL: 'http://localhost:5000/api',
    
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        VERIFY_TOKEN: '/auth/me',
        CHANGE_PASSWORD: '/auth/change-password'
    },
    
    // User endpoints
    USER: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
    },
    
    // Analysis endpoints
    ANALYSIS: {
        ANALYZE: '/analysis/analyze',
        HISTORY: '/analysis/history',
        FEEDBACK: '/analysis/feedback',
        RECENT: '/analysis/recent',
        QUESTION: '/analysis/question',
        DELETE_HISTORY: '/analysis/history'
    },
    
    // Local storage keys
    STORAGE: {
        TOKEN: 'phone_analysis_token',
        USER: 'phone_analysis_user',
        THEME: 'phone_analysis_theme'
    },
    
    // Timeout for API requests in ms
    REQUEST_TIMEOUT: 15000,
    
    // Maximum number of analysis history items to display
    MAX_HISTORY_ITEMS: 10,
    
    // Delay for the typing indicator animation in ms
    TYPING_DELAY: 1000,
    
    // Debug mode - set to false in production
    DEBUG: true
};

// Function to get the token from local storage
function getAuthToken() {
    return localStorage.getItem(CONFIG.STORAGE.TOKEN);
}

// Function to set the token in local storage
function setAuthToken(token) {
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
}

// Function to remove the token from local storage
function removeAuthToken() {
    localStorage.removeItem(CONFIG.STORAGE.TOKEN);
}

// Function to get the user from local storage
function getUser() {
    const userJson = localStorage.getItem(CONFIG.STORAGE.USER);
    return userJson ? JSON.parse(userJson) : null;
}

// Function to set the user in local storage
function setUser(user) {
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
}

// Function to remove the user from local storage
function removeUser() {
    localStorage.removeItem(CONFIG.STORAGE.USER);
}

// Function to check if the user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Function to log debug messages
function debug(...args) {
    if (CONFIG.DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Export functions for use in other modules
window.CONFIG = CONFIG;
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
window.getUser = getUser;
window.setUser = setUser;
window.removeUser = removeUser;
window.isAuthenticated = isAuthenticated;
window.debug = debug;