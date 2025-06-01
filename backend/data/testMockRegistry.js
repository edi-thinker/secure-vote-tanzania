/**
 * Simple test to verify mock voter registry functionality
 */
const { verifyVoterCredentials, getAllValidVoters } = require('./mockVoterRegistry');

console.log('Testing Mock Voter Registry...\n');

// Test 1: Valid credentials
console.log('Test 1: Valid credentials');
const test1 = verifyVoterCredentials("12345678901234567890", "VT20240001", "John Mwangi Doe");
console.log('Result:', test1);
console.log('Expected: isValid = true\n');

// Test 2: Invalid NIN/Voter ID combination
console.log('Test 2: Invalid NIN/Voter ID combination');
const test2 = verifyVoterCredentials("12345678901234567890", "VT20240999", "John Doe");
console.log('Result:', test2);
console.log('Expected: isValid = false\n');

// Test 3: Name mismatch
console.log('Test 3: Name mismatch');
const test3 = verifyVoterCredentials("12345678901234567890", "VT20240001", "Wrong Name");
console.log('Result:', test3);
console.log('Expected: isValid = false\n');

// Test 4: Partial name match (should work)
console.log('Test 4: Partial name match');
const test4 = verifyVoterCredentials("12345678901234567890", "VT20240001", "John Doe");
console.log('Result:', test4);
console.log('Expected: isValid = true\n');

// Test 5: Get all valid voters
console.log('Test 5: Get all valid voters');
const test5 = getAllValidVoters();
console.log('Number of valid voters:', test5.length);
console.log('First voter:', test5[0]);
console.log('Expected: 10 voters with masked NIDs\n');

console.log('All tests completed!');
