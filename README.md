# Connecting the Frontend and Backend

This document provides instructions on how to connect and run the SecureVote Tanzania application with both the frontend and backend working together.

## Prerequisites

- Node.js (>= 14.x)
- MongoDB (installed and running locally or accessible remotely)
- npm or yarn

## Configuration

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd e:\secure-vote\backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create or update `.env` file with proper configuration:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/secure-vote
   JWT_SECRET=secure_voting_system_secret_token
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7
   CORS_ORIGIN=http://localhost:3000
   LOG_LEVEL=info
   ```

4. Start the backend server:
   ```
   npm run start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd e:\secure-vote\frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make sure you have `.env.local` file with proper configuration:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

## Accessing the Application

Once both servers are running:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Authentication Flow

1. Register as a voter at http://localhost:3000/auth/register
2. Login with your credentials at http://localhost:3000/auth/login
3. For admin or auditor accounts, you'll need to complete MFA verification

## Available API Endpoints

### Auth Routes
- POST `/api/auth/register` - Register voter
- POST `/api/auth/login` - Login (voter, admin, auditor)
- POST `/api/auth/mfa-verify` - Verify MFA (admin, auditor)
- GET `/api/auth/me` - Get current user

### Voter Routes
- GET `/api/voter/candidates` - Get all candidates for voting
- POST `/api/voter/cast-vote` - Cast a vote
- GET `/api/voter/my-vote` - Get voter's vote (if exists)

### Admin Routes
- GET `/api/admin/candidates` - Get all candidates
- POST `/api/admin/candidates` - Add new candidate
- PUT `/api/admin/candidates/:id` - Edit candidate
- DELETE `/api/admin/candidates/:id` - Delete candidate
- GET `/api/admin/voters` - Get all voters
- PATCH `/api/admin/voters/:id/verify` - Verify voter
- GET `/api/admin/statistics` - Get voting statistics
- GET `/api/admin/logs` - Get system logs

### Auditor Routes
- GET `/api/auditor/vote-count` - Get vote count per candidate
- GET `/api/auditor/vote-chain` - Get vote chain for verification
- GET `/api/auditor/verify-chain` - Verify vote chain integrity
- GET `/api/auditor/logs` - Get system logs
- GET `/api/auditor/status` - Get system status
- GET `/api/auditor/integrity-report` - Download integrity report

## Troubleshooting

- If you encounter CORS errors, make sure the `CORS_ORIGIN` in the backend `.env` file matches your frontend URL.
- If MongoDB connection fails, check that MongoDB is running and accessible.
- If authentication fails, check that the JWT_SECRET is correctly set in the backend `.env` file.
