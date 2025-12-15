// API Configuration
const API_CONFIG = {
    // Your deployed Vercel backend URL
    BASE_URL: 'https://eventica-backend.vercel.app/api/v1',

    // For local development, uncomment the line below
    // BASE_URL: 'http://localhost:3000/api/v1',

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