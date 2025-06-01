/**
 * Mock Voter Registry
 * This file contains predefined voter data for verification during registration
 * In a real system, this would be replaced with actual government voter registry API
 */

const mockVoterRegistry = [
  {
    nin: "12345678901234567890",
    voterId: "VT20240001",
    name: "John Mwangi Doe",
    isEligible: true
  },
  {
    nin: "09876543210987654321",
    voterId: "VT20240002", 
    name: "Mary Amina Hassan",
    isEligible: true
  },
  {
    nin: "11223344556677889900",
    voterId: "VT20240003",
    name: "Peter Juma Moshi",
    isEligible: true
  },
  {
    nin: "99887766554433221100",
    voterId: "VT20240004",
    name: "Grace Wanjiku Kimani",
    isEligible: true
  },
  {
    nin: "55667788990011223344",
    voterId: "VT20240005",
    name: "David Salum Ally",
    isEligible: true
  },
  {
    nin: "44556677889900112233",
    voterId: "VT20240006",
    name: "Sarah Consolata Mbeki",
    isEligible: true
  },
  {
    nin: "33445566778899001122",
    voterId: "VT20240007",
    name: "James Mrisho Ngasa",
    isEligible: true
  },
  {
    nin: "22334455667788990011",
    voterId: "VT20240008",
    name: "Elizabeth Fatuma Said",
    isEligible: true
  },
  {
    nin: "11223344556677889901",
    voterId: "VT20240009",
    name: "Robert Kilimo Msomi",
    isEligible: true
  },
  {
    nin: "10293847564738291028",
    voterId: "VT20240010",
    name: "Agnes Neema Joseph",
    isEligible: true
  }
];

/**
 * Verify voter credentials against the mock registry
 * @param {string} nin - National Identification Number
 * @param {string} voterId - Voter ID
 * @param {string} name - Full name of the voter
 * @returns {Object} Verification result
 */
const verifyVoterCredentials = (nin, voterId, name) => {
  // Find matching record in registry
  const registryRecord = mockVoterRegistry.find(record => 
    record.nin === nin && record.voterId === voterId
  );

  if (!registryRecord) {
    return {
      isValid: false,
      message: 'NIN and Voter ID combination not found in voter registry'
    };
  }

  if (!registryRecord.isEligible) {
    return {
      isValid: false,
      message: 'Voter is not eligible to vote'
    };
  }

  // Check if name matches (case insensitive, allowing for slight variations)
  const normalizedInputName = name.toLowerCase().trim();
  const normalizedRegistryName = registryRecord.name.toLowerCase().trim();
  
  // Allow for partial name matching (registry name should contain the input name or vice versa)
  const nameMatches = normalizedRegistryName.includes(normalizedInputName) || 
                     normalizedInputName.includes(normalizedRegistryName);

  if (!nameMatches) {
    return {
      isValid: false,
      message: 'Name does not match voter registry records'
    };
  }

  return {
    isValid: true,
    message: 'Voter credentials verified successfully',
    verifiedName: registryRecord.name
  };
};

/**
 * Get all valid voter records (for admin reference)
 * @returns {Array} Array of voter records without NIN (for security)
 */
const getAllValidVoters = () => {
  return mockVoterRegistry
    .filter(record => record.isEligible)
    .map(record => ({
      voterId: record.voterId,
      name: record.name,
      nin: `xxxxxxxxxxxxxx${record.nin.slice(-4)}` // Masked NIN
    }));
};

module.exports = {
  verifyVoterCredentials,
  getAllValidVoters,
  mockVoterRegistry
};