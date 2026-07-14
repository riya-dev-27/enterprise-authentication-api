# 🚀 Enterprise Authentication API

A **production-ready Authentication & User Management REST API** built with **Node.js**, **Express.js**, **MongoDB Atlas**, and **JWT Authentication**.

This project provides secure user authentication, authorization, profile management, avatar management, email services, audit logging, admin functionalities, and dashboard APIs following production-level backend development practices.

---

#  Live Demo

**Render Deployment**

https://enterprise-authentication-api.onrender.com

---

#  GitHub Repository

https://github.com/riya-dev-27/enterprise-authentication-api

---

#  Features

## Authentication

- User Registration
- Secure Login
- JWT Authentication
- Refresh Access Token
- Secure Logout

## User Management

- Get Current User
- Update User Profile
- Change Password
- Delete Account

## Avatar Management

- Upload Avatar
- Update Avatar
- Delete Avatar

## Email Services

- Email Verification
- Forgot Password
- Reset Password

## Admin Panel

- Dashboard Statistics
- Get All Users
- Get User By ID
- Update User Role
- Update User Status
- Delete User
- Restore User

## Dashboard

- User Statistics
- Recent Users
- System Overview

## Security

- JWT Authentication
- Password Hashing (bcrypt)
- HTTP-only Cookies
- Helmet Security
- CORS Protection
- Rate Limiting
- Environment Variable Validation
- Centralized Error Handling

## Logging

- Audit Logs
- Request Tracking

---

# 🛠 Tech Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB Atlas
- Mongoose

## Authentication

- JSON Web Token (JWT)
- bcrypt

## Cloud Storage

- Cloudinary

## Email

- Nodemailer

## Security

- Helmet
- Express Rate Limit
- Cookie Parser
- CORS

## Deployment

- Render

---

#  Project Structure

```
enterprise-authentication-api
│
├── public
│
├── src
│   ├── controllers
│   ├── db
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── utils
│   ├── app.js
│   └── index.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/riya-dev-27/enterprise-authentication-api.git
```

Move inside the project

```bash
cd enterprise-authentication-api
```

Install dependencies

```bash
npm install
```

Create a `.env` file using `.env.example`.

Start the development server

```bash
npm run dev
```

For production

```bash
npm start
```

---

# 🔑 Environment Variables

Create a `.env` file and add the following variables.

```env
PORT=

MONGODB_URI=
DB_NAME=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

CORS_ORIGIN=
```

---

# 📌 API Base URL

```
https://enterprise-authentication-api.onrender.com/api/v1
```

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /auth/register |
| POST | /auth/login |
| POST | /auth/logout |
| POST | /auth/refresh-token |

---

## User

| Method | Endpoint |
|---------|----------|
| GET | /users/current-user |
| PATCH | /users/update-profile |
| PATCH | /users/change-password |
| DELETE | /users/delete-account |
| PATCH | /users/upload-avatar |
| PATCH | /users/update-avatar |
| DELETE | /users/delete-avatar |

---

## Admin

| Method | Endpoint |
|---------|----------|
| GET | /admin/dashboard |
| GET | /admin/users |
| GET | /admin/users/:id |
| PATCH | /admin/users/:id/role |
| PATCH | /admin/users/:id/status |
| DELETE | /admin/users/:id |
| PATCH | /admin/users/:id/restore |

---

## Dashboard

| Method | Endpoint |
|---------|----------|
| GET | /dashboard/stats |
| GET | /dashboard/recent-users |
| GET | /dashboard/audit-logs |

---

# 🔒 Security Features

- Password Hashing using bcrypt
- JWT Access Token
- Refresh Token Authentication
- HTTP-only Cookies
- Secure Cookie Configuration
- Helmet Middleware
- CORS Configuration
- Rate Limiting
- Environment Variable Validation
- Centralized Error Handling

---

#  Health Check

```
GET /
```

Response

```json
{
  "success": true,
  "message": "Enterprise Authentication API is running 🚀",
  "version": "1.0.0"
}
```

---

#  Deployment

The application is deployed on **Render**.

Live URL

```
https://enterprise-authentication-api.onrender.com
```

---

#  Future Improvements

- Two-Factor Authentication (2FA)
- OAuth (Google & GitHub Login)
- Docker Support
- Redis Token Blacklisting
- API Versioning
- Swagger Documentation
- CI/CD Pipeline
- Unit & Integration Testing

---

#  Author

**Riya**

GitHub

https://github.com/riya-dev-27

---

#  Support

If you found this project useful, consider giving it a  on GitHub.