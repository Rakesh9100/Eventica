// API Configuration
const API_CONFIG = {
    // Automatically detect environment
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3002/api/v1'  // Local backend for local development
        : 'https://eventica-backend.vercel.app/api/v1', // Production backend

    ENDPOINTS: {
        // Auth endpoints
        REGISTER: '/auth/signup',
        LOGIN: '/auth/login',

        // Event endpoints
        EVENTS: '/event/allevents',
        ADD_EVENT: '/event/add',
        DELETE_EVENT: '/event/delete',
        GET_EVENT: '/event',

        // Profile endpoints
        PROFILE: '/profile'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[endpoint];
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}