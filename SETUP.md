# Back2You - Development Setup Guide

This guide will help you set up the Back2You Lost & Found Platform for development on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/NandiniSharma2-2/Back2You.git
cd Back2You
```

### 2. Install Dependencies

```bash
# Install root dependencies (includes concurrently for running both servers)
npm install

# Install all dependencies for both backend and frontend
npm run install:all
```

### 3. Environment Setup

Create environment files:

```bash
# Backend environment
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=back2you

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Database Setup

```bash
# Create database and run migrations
npm run migrate

# Seed database with initial data
npm run seed
```

### 5. Start Development Servers

```bash
# Option 1: Start both servers simultaneously
npm run dev

# Option 2: Start servers separately
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 📁 Project Structure

```
Back2You/
├── backend/                 # Node.js Express API server
│   ├── src/
│   │   ├── config/         # Database and service configurations
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication, validation, error handling
│   │   ├── repositories/   # Database access layer
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Helper functions and utilities
│   │   └── server.js       # Application entry point
│   └── uploads/            # Local file storage (development)
│
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API clients and utilities
│   │   └── styles/         # CSS and styling
│   └── public/             # Static assets
│
└── screenshots/            # Application screenshots
```

## 🔧 Development Commands

### Root Level Commands

```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only  
npm run dev:frontend

# Build for production
npm run build

# Run tests
npm run test

# Database operations
npm run migrate    # Run database migrations
npm run seed       # Seed database with test data
npm run setup      # Complete setup (install + migrate + seed)
```

### Backend Commands

```bash
cd backend

# Development with auto-reload
npm run dev

# Production mode
npm start

# Database operations
npm run migrate
npm run seed

# Testing
npm test
npm run test:coverage
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## 🗄️ Database Schema

The application uses MySQL with the following main tables:

- **users** - User accounts and profiles
- **lost_items** - Lost item reports
- **found_items** - Found item reports  
- **claims** - Item claim requests
- **messages** - Chat system messages
- **notifications** - User notifications
- **categories** - Item categories
- **audit_logs** - System audit trail

## 🔑 Default Test Accounts

After seeding, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@back2you.com | SuperAdmin@123 |
| Regular User | john@example.com | User@123456 |
| Demo User | jane@example.com | User@123456 |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Items
- `GET /api/lost-items` - List lost items
- `POST /api/lost-items` - Create lost item report
- `GET /api/found-items` - List found items
- `POST /api/found-items` - Create found item report

### Claims
- `POST /api/claims` - Submit item claim
- `GET /api/claims` - Get user claims
- `PUT /api/claims/:id` - Update claim status

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
Error: Access denied for user 'root'@'localhost'
```
- Check your MySQL credentials in `.env`
- Ensure MySQL server is running
- Verify database exists or run migrations

**Port Already in Use**
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
- Change PORT in backend `.env` file
- Or kill the process using the port: `npx kill-port 5000`

**Module Not Found**
```bash
Error: Cannot find module 'xyz'
```
- Run `npm install` in the appropriate directory
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **Database Reset**: Run `npm run migrate` followed by `npm run seed` to reset database
3. **Logs**: Check backend logs in `backend/logs/` directory
4. **API Testing**: Use tools like Postman or curl to test API endpoints

## 📱 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_production_jwt_secret_much_longer_and_more_secure
CLOUDINARY_CLOUD_NAME=your_production_cloudinary_cloud
# ... other production configs
```

### Build Commands

```bash
# Build frontend for production
cd frontend && npm run build

# The build files will be in frontend/dist/
# Serve these static files with your web server
```

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

If you encounter any issues:

1. Check this setup guide first
2. Search existing [GitHub Issues](https://github.com/NandiniSharma2-2/Back2You/issues)
3. Create a new issue with detailed information
4. Include error logs and steps to reproduce

---

**Happy Coding! 🚀**