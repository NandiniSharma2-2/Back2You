# Back2You - Lost & Found Platform 🔍

A modern, intelligent lost and found platform that helps reunite people with their lost belongings through smart matching algorithms and community collaboration.

## 🌟 Features

### 🔮 Smart Recovery Network
- **Intelligent Matching**: Advanced algorithms analyze keywords, locations, and descriptions to find perfect matches
- **Real-time Notifications**: Instant updates when matches are found or when someone responds to your reports
- **Secure Verification**: Multi-layer verification system with photo evidence and ownership proofs
- **Community Driven**: Trusted network of verified members helping each other recover belongings

### 🎯 Core Functionality
- **Report Lost Items**: Quick and easy reporting with photo uploads and detailed descriptions
- **Report Found Items**: Help others by reporting items you've found
- **Smart Search**: AI-powered search to find matches across the entire network
- **Claim System**: Secure claiming process with verification steps
- **Real-time Chat**: In-app messaging between finders and owners
- **Location Tracking**: Optional location services for better matching

## 🖼️ Screenshots

> **Note**: Screenshots are available in the `/screenshots` directory. To view them, please check the [SCREENSHOTS.md](./SCREENSHOTS.md) file for detailed visual documentation.

### Key Features Showcased:
- **🏠 Landing Page**: Modern futuristic design with animated backgrounds and interactive elements
- **📝 Report Lost Item**: Intuitive form for reporting lost belongings with detailed categorization  
- **🔍 Report Found Item**: Easy-to-use interface for reporting found items to help others
- **🔔 Notifications System**: Real-time notification system for matching alerts and updates
- **📦 Found Items Dashboard**: Clean dashboard to manage your found item reports

*For detailed visual tour with full screenshots, see [SCREENSHOTS.md](./SCREENSHOTS.md)*

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MySQL** database with optimized queries
- **Socket.io** for real-time communications
- **JWT** authentication with bcrypt encryption
- **Multer** & **Cloudinary** for image handling
- **Winston** for comprehensive logging
- **Express Validator** for input validation

### Frontend
- **React 18** with modern hooks and context
- **Vite** for lightning-fast development
- **Tailwind CSS** for responsive design
- **Framer Motion** for smooth animations
- **Axios** for API communications
- **React Router** for navigation
- **Socket.io Client** for real-time features

### DevOps & Tools
- **Docker** support for containerization
- **ESLint** for code quality
- **Git** version control
- **npm** package management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Set up database
npm run migrate
npm run seed

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=back2you

# JWT
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=24h

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server
PORT=5000
NODE_ENV=development
```

## 📱 Usage

1. **Register/Login**: Create an account or sign in with existing credentials
2. **Report Lost Item**: Fill out the form with item details, photos, and location
3. **Browse Found Items**: Search through reported found items using filters
4. **Smart Matching**: The system automatically matches lost and found items
5. **Get Notifications**: Receive real-time alerts for potential matches
6. **Claim Items**: Use the secure verification process to claim your belongings
7. **Chat & Coordinate**: Communicate with finders through the in-app messaging system

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Lost Items
- `GET /api/lost-items` - Get all lost items
- `POST /api/lost-items` - Report lost item
- `GET /api/lost-items/:id` - Get specific lost item
- `PUT /api/lost-items/:id` - Update lost item
- `DELETE /api/lost-items/:id` - Delete lost item

### Found Items
- `GET /api/found-items` - Get all found items
- `POST /api/found-items` - Report found item
- `GET /api/found-items/:id` - Get specific found item
- `PUT /api/found-items/:id` - Update found item

### Claims
- `POST /api/claims` - Submit item claim
- `GET /api/claims` - Get user claims
- `PUT /api/claims/:id` - Update claim status

## 🏗️ Project Structure

```
Back2You/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and service configurations
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication, validation, etc.
│   │   ├── repositories/    # Database access layer
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Helper functions and utilities
│   │   └── server.js        # Application entry point
│   ├── uploads/             # Local file storage
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API and utility libraries
│   │   ├── styles/          # CSS and Tailwind styles
│   │   └── App.jsx          # Main React component
│   └── package.json
│
├── screenshots/             # Application screenshots
├── .gitignore
└── README.md
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Development Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced ML matching algorithms
- [ ] Integration with social media platforms
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Public API for third-party integrations
- [ ] Blockchain-based verification system

## 🔒 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Input validation and sanitization
- XSS protection
- Rate limiting on API endpoints
- Secure file upload handling
- CORS configuration
- Environment variable protection

## 📊 Performance Optimizations

- Database query optimization
- Image compression and CDN delivery
- Lazy loading for components
- API response caching
- Real-time updates with Socket.io
- Responsive design for all devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Nandini Sharma** - *Project Creator* - [GitHub Profile](https://github.com/NandiniSharma2-2)

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this platform
- Inspiration from modern lost and found solutions
- Community feedback that shaped the user experience
- Open source libraries that made this project possible

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/NandiniSharma2-2/Back2You/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

**Built with ❤️ for the community to help reunite people with their lost belongings.**