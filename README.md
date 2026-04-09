# Public Service Complaint Management System

A full-stack web application for citizens to file public service complaints and for admins to manage them.

## Prerequisites
- Node.js installed
- MongoDB installed and running locally

## Quick Start

### 1. Backend Setup
The backend runs on port **5001**.

```bash
cd backend
npm install
# Seed the database (Optional, creates test users)
node seed.js 
# Start the server
npm start
```

### 2. Frontend Setup
The frontend runs on port **5173**.

```bash
cd frontend
npm install
npm run dev
```

## Accessing the App
Open your browser and navigate to: [http://localhost:5173](http://localhost:5173)

## Test Credentials (from Seed)
- **Citizen**: `john@example.com` / `password123`
- **Admin**: `admin@example.com` / `admin`

## Features
- **Citizen**: Register, Login, File Complaint (with location & image), View History.
- **Admin**: Login, View All Complaints, Update Status (Pending -> In Progress -> Resolved).

## Configuration
- **Backend Config**: `backend/.env` (Port 5001)
- **Frontend API**: `frontend/src/api.js` (Points to localhost:5001)
