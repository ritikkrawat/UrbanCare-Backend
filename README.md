# 🚀 UrbanCare Backend

Backend API for **UrbanCare – Civic Complaint Management System**, built using Node.js, Express, and MongoDB.

This backend powers authentication, complaint management, media handling, and real-time tracking features for the UrbanCare platform.

## 🌍 Live API

👉 https://urbancaredev.vercel.app/api/health  

## 📌 Overview

The UrbanCare backend is a **scalable REST API** that enables:

- Secure user authentication (JWT + OTP)
- Complaint submission with media support
- Complaint tracking using unique IDs
- Role-based access (User/Admin)
- Email notifications for OTP and confirmations
- Cloud-based media handling using Cloudinary

## ✨ Features

### 🔐 Authentication
- JWT-based authentication  
- OTP verification (registration + forgot password)  
- Login using email or mobile  
- Password hashing using bcrypt  

### 🧩 Complaint Management
- Submit complaints with:
  - Category & subcategory  
  - Address details  
  - Images & videos  
- Unique complaint ID generation (e.g., `CMP123456`)  
- Fetch user-specific complaints  
- Delete complaints (with ownership validation)  

### 🔍 Complaint Tracking
- Track complaints using unique complaint ID  
- Public tracking with email verification  
- Timeline-based status response  

### ☁️ Media Handling
- Cloudinary integration  
- Secure signed uploads  
- Supports multiple images (max 5) and videos (max 2)  

### 📧 Email Services
- OTP email for verification  
- Complaint confirmation email  
- Password reset support  

### 🛡 Security & Middleware
- Protected routes using JWT middleware  
- Role-based access handling  
- CORS configuration  
- Global error handling  
- 404 route handling  

## 🧠 Tech Stack

- Node.js  
- Express.js (v5)  
- MongoDB + Mongoose  
- JWT (jsonwebtoken)  
- bcryptjs  
- Multer  
- Cloudinary  
- Nodemailer  

## 🔌 API Endpoints

### 🔐 Auth Routes

POST /api/auth/register
POST /api/auth/login
POST /api/auth/send-otp
POST /api/auth/verify-registration-otp
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password

### 🧩 Complaint Routes

POST /api/complaint/submit
GET /api/complaint/my-complaints
DELETE /api/complaint/:id
GET /api/complaint/track/:complaintId

### 👤 User Routes

GET /api/user/profile

### 🛠 Admin Routes

(Manage complaints, users, analytics)

### ☁️ Cloudinary

GET /api/cloudinary/signature

### ❤️ Health Check

## 🛠 Installation & Setup

bash
# Clone repository
git clone https://github.com/ritikkrawat/UrbanCare-Backend

# Navigate to backend
cd backend

# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start

🔧 Environment Variables
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
