/**
 * API service for connecting frontend to backend
 * Contains methods for authentication, voter, admin, and auditor operations
 */

// API base URL configuration (can be adjusted based on environment)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Helper function to make API requests
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise} Promise with response data
 */
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Auth API
export const authAPI = {
  // Register a new voter
  register: async (userData) => {
    return apiRequest('/api/auth/register', 'POST', userData);
  },

  // Login user (voter, admin, or auditor)
  login: async (credentials) => {
    return apiRequest('/api/auth/login', 'POST', credentials);
  },
  
  // Submit MFA code for admin/auditor
  submitMFA: async (data, token) => {
    return apiRequest('/api/auth/verify-2fa', 'POST', data, token);
  },

  // Get current logged in user
  getCurrentUser: async (token) => {
    return apiRequest('/api/auth/me', 'GET', null, token);
  },
  
  // Setup 2FA (generate secret)
  setup2FA: async (token) => {
    return apiRequest('/api/auth/setup-2fa', 'POST', null, token);
  },
  
  // Verify and enable 2FA
  verifySetup2FA: async (data, token) => {
    return apiRequest('/api/auth/verify-setup-2fa', 'POST', data, token);
  },
  
  // Disable 2FA
  disable2FA: async (data, token) => {
    return apiRequest('/api/auth/disable-2fa', 'POST', data, token);
  }
};

// Voter API
export const voterAPI = {
  // Get all candidates for voting
  getCandidates: async (token) => {
    return apiRequest('/api/voter/candidates', 'GET', null, token);
  },
    // Cast a vote
  castVote: async (voteData, token) => {
    return apiRequest('/api/voter/vote', 'POST', voteData, token);
  },
  
  // Get voter's vote confirmation
  getMyVote: async (token) => {
    return apiRequest('/api/voter/confirmation', 'GET', null, token);
  }
};

// Admin API
export const adminAPI = {
  // Get all candidates
  getCandidates: async (token) => {
    return apiRequest('/api/admin/candidates', 'GET', null, token);
  },
  
  // Add new candidate
  addCandidate: async (candidateData, token) => {
    return apiRequest('/api/admin/candidates', 'POST', candidateData, token);
  },
  
  // Edit candidate
  updateCandidate: async (id, candidateData, token) => {
    return apiRequest(`/api/admin/candidates/${id}`, 'PUT', candidateData, token);
  },
  
  // Delete candidate
  deleteCandidate: async (id, token) => {
    return apiRequest(`/api/admin/candidates/${id}`, 'DELETE', null, token);
  },
  
  // Get all voters
  getVoters: async (token) => {
    return apiRequest('/api/admin/voters', 'GET', null, token);
  },
  
  // Verify voter
  verifyVoter: async (id, token) => {
    return apiRequest(`/api/admin/voters/${id}/verify`, 'PATCH', { verified: true }, token);
  },
  
  // Get voting statistics
  getStatistics: async (token) => {
    return apiRequest('/api/admin/statistics', 'GET', null, token);
  },
  
  // Get system logs
  getSystemLogs: async (token) => {
    return apiRequest('/api/admin/logs', 'GET', null, token);
  }
};

// Auditor API
export const auditorAPI = {
  // Get vote count per candidate
  getVoteCount: async (token) => {
    return apiRequest('/api/auditor/vote-count', 'GET', null, token);
  },
  
  // Get vote chain for verification
  getVoteChain: async (token) => {
    return apiRequest('/api/auditor/vote-chain', 'GET', null, token);
  },
  
  // Verify vote chain integrity
  verifyVoteChain: async (token) => {
    return apiRequest('/api/auditor/verify-chain', 'GET', null, token);
  },
  
  // Get system logs
  getSystemLogs: async (token) => {
    return apiRequest('/api/auditor/logs', 'GET', null, token);
  },
    // Get system status
  getSystemStatus: async (token) => {
    return apiRequest('/api/auditor/system-status', 'GET', null, token);
  },
  
  // Download integrity report
  getIntegrityReport: async (token) => {
    return apiRequest('/api/auditor/integrity-report', 'GET', null, token);
  }
};
