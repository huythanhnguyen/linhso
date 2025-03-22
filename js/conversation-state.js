/**
 * conversation-state.js
 * Manages conversation state, history, and persistence for the phone analysis chatbot
 */

// Conversation State Manager
const ConversationState = (function() {
    // Configuration
    const CONFIG = {
        MAX_CONVERSATION_LENGTH: 100,
        MAX_ANALYSIS_HISTORY: 5,
        STORAGE_KEY: 'phoneAnalysisChatbotState',
        DEBUG: false
    };
    
    // State object - holds all conversation data
    const state = {
        // Conversation messages
        conversationHistory: [],
        
        // Currently active analysis
        currentAnalysis: null,
        
        // History of previous analyses
        analysisHistory: [],
        
        // Metadata
        lastInteraction: null,
        
        // Initialization flag
        initialized: false
    };
    
    /**
     * Initialize the conversation state
     * @param {Object} options - Optional configuration options
     */
    function init(options = {}) {
        if (state.initialized) return;
        
        // Override config with provided options
        if (options) {
            Object.assign(CONFIG, options);
        }
        
        // Load saved state from localStorage
        loadState();
        
        state.initialized = true;
        if (CONFIG.DEBUG) console.log('ConversationState initialized');
    }
    
    /**
     * Add a message to conversation history
     * @param {string} role - 'user' or 'assistant'
     * @param {string} content - Message content
     * @param {Object} analysisData - Optional analysis data
     * @returns {string} - Generated message ID
     */
    function addMessage(role, content, analysisData = null) {
        // Generate a unique ID for the message
        const messageId = `msg_${role}_${Date.now()}`;
        
        const message = {
            id: messageId,
            role,
            content,
            timestamp: new Date().toISOString(),
            analysisData: analysisData ? { ...analysisData } : null
        };
        
        state.conversationHistory.push(message);
        
        // Update last interaction time
        state.lastInteraction = new Date();
        
        // Trim history if it exceeds maximum length
        if (state.conversationHistory.length > CONFIG.MAX_CONVERSATION_LENGTH) {
            state.conversationHistory = state.conversationHistory.slice(
                -CONFIG.MAX_CONVERSATION_LENGTH
            );
        }
        
        return messageId;
    }
    
    /**
     * Get message by ID
     * @param {string} messageId - ID of the message to retrieve
     * @returns {Object|null} - Message object or null if not found
     */
    function getMessage(messageId) {
        return state.conversationHistory.find(msg => msg.id === messageId) || null;
    }
    
    /**
     * Get all conversation history
     * @returns {Array} - Array of message objects
     */
    function getConversationHistory() {
        return [...state.conversationHistory];
    }
    
    /**
     * Get recent conversation history
     * @param {number} exchanges - Number of exchanges to include (each exchange is a user-assistant pair)
     * @returns {Array} - Array of recent message objects
     */
    function getRecentHistory(exchanges = 3) {
        const maxMessages = exchanges * 2; // Each exchange has 2 messages
        return state.conversationHistory.slice(-maxMessages);
    }
    
    /**
     * Set current analysis
     * @param {Object} analysisData - Analysis data to set as current
     */
    function setCurrentAnalysis(analysisData) {
        if (!analysisData) return;
        
        state.currentAnalysis = { ...analysisData };
        
        // Add to analysis history
        addToAnalysisHistory(analysisData);
    }
    
    /**
     * Get current analysis
     * @returns {Object|null} - Current analysis data or null if none
     */
    function getCurrentAnalysis() {
        return state.currentAnalysis ? { ...state.currentAnalysis } : null;
    }
    
    /**
     * Add analysis to history
     * @param {Object} analysisData - Analysis data to add to history
     */
    function addToAnalysisHistory(analysisData) {
        if (!analysisData || !analysisData.phoneNumber) return;
        
        // Check if this phone number already exists in history
        const existingIndex = state.analysisHistory.findIndex(
            item => item.phoneNumber === analysisData.phoneNumber
        );
        
        if (existingIndex !== -1) {
            // Update existing entry
            state.analysisHistory[existingIndex] = {
                ...analysisData,
                lastAccessed: new Date().toISOString()
            };
        } else {
            // Add new entry
            state.analysisHistory.push({
                ...analysisData,
                added: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            });
            
            // Trim history if it exceeds maximum length
            if (state.analysisHistory.length > CONFIG.MAX_ANALYSIS_HISTORY) {
                // Sort by lastAccessed (newest first) before trimming
                state.analysisHistory.sort((a, b) => 
                    new Date(b.lastAccessed) - new Date(a.lastAccessed)
                );
                
                // Keep only the most recent entries
                state.analysisHistory = state.analysisHistory.slice(0, CONFIG.MAX_ANALYSIS_HISTORY);
            }
        }
    }
    
    /**
     * Get analysis history
     * @returns {Array} - Array of analysis history items
     */
    function getAnalysisHistory() {
        return [...state.analysisHistory];
    }
    
    /**
     * Get analysis by phone number
     * @param {string} phoneNumber - Phone number to look up
     * @returns {Object|null} - Analysis data or null if not found
     */
    function getAnalysisByPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        
        // Clean up phone number for comparison
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        const analysis = state.analysisHistory.find(item => {
            const itemClean = item.phoneNumber.replace(/\D/g, '');
            return itemClean === cleanNumber;
        });
        
        if (analysis) {
            // Update last accessed timestamp
            analysis.lastAccessed = new Date().toISOString();
            
            // Return a copy of the analysis
            return { ...analysis };
        }
        
        return null;
    }
    
    /**
     * Clear conversation history
     */
    function clearConversation() {
        state.conversationHistory = [];
        state.lastInteraction = new Date();
    }
    
    /**
     * Clear analysis history
     */
    function clearAnalysisHistory() {
        state.analysisHistory = [];
        state.currentAnalysis = null;
    }
    
    /**
     * Reset entire state
     */
    function resetState() {
        state.conversationHistory = [];
        state.currentAnalysis = null;
        state.analysisHistory = [];
        state.lastInteraction = new Date();
    }
    
    /**
     * Save state to localStorage
     */
    function saveState() {
        try {
            const serializedState = JSON.stringify({
                conversationHistory: state.conversationHistory,
                currentAnalysis: state.currentAnalysis ? state.currentAnalysis.phoneNumber : null,
                analysisHistory: state.analysisHistory,
                lastInteraction: state.lastInteraction ? state.lastInteraction.toISOString() : null
            });
            
            localStorage.setItem(CONFIG.STORAGE_KEY, serializedState);
            
            if (CONFIG.DEBUG) console.log('Conversation state saved to localStorage');
        } catch (error) {
            console.error('Error saving conversation state:', error);
        }
    }
    
    /**
     * Load state from localStorage
     */
    function loadState() {
        try {
            const serializedState = localStorage.getItem(CONFIG.STORAGE_KEY);
            
            if (serializedState) {
                const loadedState = JSON.parse(serializedState);
                
                // Restore conversation history
                state.conversationHistory = loadedState.conversationHistory || [];
                
                // Restore analysis history
                state.analysisHistory = loadedState.analysisHistory || [];
                
                // Restore current analysis from history
                if (loadedState.currentAnalysis && state.analysisHistory.length > 0) {
                    const current = state.analysisHistory.find(
                        item => item.phoneNumber === loadedState.currentAnalysis
                    );
                    
                    if (current) {
                        state.currentAnalysis = current;
                    }
                }
                
                // Restore last interaction timestamp
                if (loadedState.lastInteraction) {
                    state.lastInteraction = new Date(loadedState.lastInteraction);
                }
                
                if (CONFIG.DEBUG) console.log('Conversation state loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading conversation state:', error);
            
            // Reset state if loading fails
            resetState();
        }
    }
    
    /**
     * Add feedback to a message
     * @param {string} messageId - ID of the message
     * @param {string} feedbackType - Type of feedback ('positive' or 'negative')
     * @param {string} feedbackText - Optional feedback text
     */
    function addFeedback(messageId, feedbackType, feedbackText = '') {
        const message = getMessage(messageId);
        
        if (message) {
            message.feedback = {
                type: feedbackType,
                text: feedbackText,
                timestamp: new Date().toISOString()
            };
            
            if (CONFIG.DEBUG) console.log(`Added ${feedbackType} feedback to message ${messageId}`);
        }
    }
    
    /**
     * Get state size metrics
     * @returns {Object} - State size information
     */
    function getStateSize() {
        const serializedState = JSON.stringify({
            conversationHistory: state.conversationHistory,
            currentAnalysis: state.currentAnalysis,
            analysisHistory: state.analysisHistory
        });
        
        return {
            totalBytes: new Blob([serializedState]).size,
            conversationMessages: state.conversationHistory.length,
            analysisHistoryItems: state.analysisHistory.length
        };
    }
    
    // Public API
    return {
        init,
        addMessage,
        getMessage,
        getConversationHistory,
        getRecentHistory,
        setCurrentAnalysis,
        getCurrentAnalysis,
        getAnalysisHistory,
        getAnalysisByPhoneNumber,
        clearConversation,
        clearAnalysisHistory,
        resetState,
        saveState,
        loadState,
        addFeedback,
        getStateSize
    };
})();

// Export the ConversationState object for use in other modules
window.ConversationState = ConversationState;
