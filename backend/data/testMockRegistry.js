/**
 * Simple test to verify mock voter registry functionality
 */
const { verifyVoterCredentials, getAllValidVoters } = require('./mockVoterRegistry');

console.log('Testing Mock Voter Registry...\n');

// Test with exact registry data
console.log('Available voters in registry:');
const voters = getAllValidVoters();
voters.forEach((voter, index) => {
  console.log(`${index + 1}. Name: "${voter.name}", Voter ID: ${voter.voterId}, NIN: ${voter.nin}`);
});
console.log('\n');

// Test 1: Valid credentials - exact match
console.log('Test 1: Valid credentials (exact match)');
const test1 = verifyVoterCredentials("12345678901234567890", "VT20240001", "John Mwangi Doe");
console.log('Result:', test1);
console.log('Expected: isValid = true\n');

// Test 2: Valid credentials - partial match
console.log('Test 2: Valid credentials (partial match)');
const test2 = verifyVoterCredentials("12345678901234567890", "VT20240001", "John Doe");
console.log('Result:', test2);
console.log('Expected: isValid = true\n');

// Test 3: Invalid NIN/Voter ID combination
console.log('Test 3: Invalid NIN/Voter ID combination');
const test3 = verifyVoterCredentials("12345678901234567890", "VT20240999", "John Doe");
console.log('Result:', test3);
console.log('Expected: isValid = false\n');

// Test 4: Name mismatch
console.log('Test 4: Name mismatch');
const test4 = verifyVoterCredentials("12345678901234567890", "VT20240001", "Completely Wrong Name");
console.log('Result:', test4);
console.log('Expected: isValid = false\n');

// Test 5: Test with Mary's data
console.log('Test 5: Mary Amina Hassan');
const test5 = verifyVoterCredentials("09876543210987654321", "VT20240002", "Mary Amina Hassan");
console.log('Result:', test5);
console.log('Expected: isValid = true\n');

console.log('All tests completed!');
