# SecureVote Tanzania - Backend API

This is the backend API for the SecureVote Tanzania voting system. The API is built with Node.js, Express, and MongoDB, implementing the security principles required for a tamper-proof and transparent digital voting system.

## System Overview

The SecureVote System allows verified Tanzanian citizens to vote digitally using their NIN and Voter ID, while enforcing vote integrity, access control, and tamper-proof logging. The system includes Admin, Voter, and System Validator (Auditor) roles.

## Features

- **Secure Authentication**: JWT-based authentication with role-based access control
- **Two-Factor Authentication**: MFA support for admin and auditor accounts
- **Blockchain-Inspired Vote Chain**: SHA-256 hashed vote chain for tamper detection
- **Comprehensive Audit Logging**: All system activities are logged for transparency
- **Voter Verification**: Two-step verification process with NIN and Voter ID
- **Candidate Management**: Admin tools for managing election candidates
- **Vote Analytics**: Anonymous vote statistics for admins and auditors
- **System Integrity Monitoring**: Tools for auditors to verify system health

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security Middleware**: helmet, cors, rate limiting
- **Logging**: winston and custom system logs

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` - Register a new voter
- `POST /api/auth/login` - Login existing user (all roles)
- `POST /api/auth/verify-2fa` - Verify 2FA token (for admin/auditor)
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Log out user
- `POST /api/auth/reset-password` - Request password reset

### Voter Routes

- `GET /api/voter/candidates` - View all candidates
- `POST /api/voter/vote` - Cast a vote for a candidate
- `GET /api/voter/confirmation` - Get vote confirmation
- `GET /api/voter/profile` - Get voter profile details

### Admin Routes

- `GET /api/admin/candidates` - View all candidates
- `POST /api/admin/candidates` - Add a new candidate
- `PUT /api/admin/candidates/:id` - Update a candidate
- `DELETE /api/admin/candidates/:id` - Delete a candidate
- `GET /api/admin/statistics` - View voting statistics
- `GET /api/admin/logs` - View system logs
- `GET /api/admin/voters` - View voter list
- `PUT /api/admin/voters/:id/verify` - Verify a voter

### Auditor Routes

- `GET /api/auditor/vote-count` - Get anonymized vote counts
- `GET /api/auditor/verify-chain` - Verify vote chain integrity
- `GET /api/auditor/vote-chain` - View the hash chain
- `GET /api/auditor/logs` - View system logs
- `GET /api/auditor/system-status` - Check system health
- `GET /api/auditor/integrity-report` - Generate integrity report

## Security Features

### Vote Security

- Votes are stored as a hash chain, with each vote linked to the previous vote
- Vote content is not directly linked to voter identity
- SHA-256 hashing ensures vote integrity
- Immutable vote records prevent tampering

### Access Control

- Role-based access control for voters, admins, and auditors
- Two-factor authentication for privileged roles
- JWT-based authentication with short-lived tokens

### Data Protection

- Password hashing with bcrypt
- Sensitive fields excluded from query results
- Minimal voter data exposure

### Audit Trail

- Comprehensive system logging
- All administrative actions are logged
- Vote verification is logged
- System health monitoring

## Installation and Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on the example
4. Start the server with `npm run dev`

## Development

### Environment Variables

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/secure-vote
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=24
CORS_ORIGIN=http://localhost:3000
```
