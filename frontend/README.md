# StreamFlix Frontend

A modern, responsive streaming platform frontend built with React, TypeScript, and shadcn/ui components.

## 🚀 Features

- **Modern UI/UX**: Built with shadcn/ui and Tailwind CSS for a Netflix-like experience
- **TypeScript**: Full type safety and better developer experience
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **Authentication**: Complete auth flow with login, register, and password reset
- **Content Management**: Browse, search, and watch movies/TV shows
- **Video Player**: Custom video player with controls and progress tracking
- **Subscription Management**: Billing, payment methods, and plan management
- **Dark/Light Mode**: System-aware theme switching
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized with lazy loading and code splitting

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API + Custom Hooks
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Deployment**: Docker ready

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Authentication components
│   │   ├── content/         # Content-related components
│   │   ├── admin/           # Admin panel components
│   │   ├── user/            # User profile components
│   │   └── common/          # Shared components
│   ├── pages/               # Page components
│   ├── context/             # React contexts
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   └── styles/              # Global styles
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── Dockerfile
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your API endpoints and other settings.

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

### Environment Variables

Key environment variables to configure:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_CDN_URL=http://localhost:3001/cdn

# Payment (Stripe)
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Social Login
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
```

## 📚 Key Components

### Authentication
- **Login/Register**: Complete auth flow with validation
- **Password Reset**: Forgot password functionality
- **Social Login**: Google and Facebook integration
- **Protected Routes**: Role-based access control

### Content Management
- **Hero Component**: Featured content showcase
- **Movie Cards**: Content display with hover effects
- **Video Player**: Custom player with quality selection
- **Search**: Advanced search with filters and suggestions
- **Watchlist**: Save content for later viewing

### User Features
- **Profile Management**: Update personal information
- **Subscription**: Plan selection and billing
- **Viewing History**: Track watched content
- **Continue Watching**: Resume playback

### Admin Panel
- **Content Management**: Add/edit movies and shows
- **User Management**: View and manage users
- **Analytics Dashboard**: View platform statistics
- **Settings**: Configure platform settings

## 🎨 UI Components

Built with shadcn/ui for consistency and accessibility:

- **Button**: Various sizes and variants
- **Input**: Form inputs with validation
- **Card**: Content containers
- **Avatar**: User profile images
- **Badge**: Status and category indicators
- **Select**: Dropdown selections
- **Tabs**: Tabbed content organization
- **Toast**: Notification system
- **Loading**: Skeleton loaders and spinners

## 🔧 Development Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Type checking
npm run type-check
```

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t streamflix-frontend .

# Run container
docker run -p 80:80 streamflix-frontend
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:

- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px  
- **Desktop**: 1025px and above
- **Large Desktop**: 1441px and above

## 🎯 Performance Optimizations

- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Service worker for offline functionality
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Tree Shaking**: Remove unused code
- **Compression**: Gzip compression in production

## 🔒 Security Features

- **Content Security Policy**: XSS protection
- **CSRF Protection**: Cross-site request forgery prevention
- **JWT Handling**: Secure token storage and refresh
- **Input Validation**: Client-side validation
- **Role-based Access**: Protected routes and components

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ComponentName.test.tsx
```

## 📈 Analytics Integration

Supports multiple analytics providers:

- **Google Analytics**: Page views and events
- **Mixpanel**: User behavior tracking
- **Sentry**: Error monitoring and performance

## 🌐 Internationalization

Ready for i18n with:

- **Language Detection**: Browser and user preferences
- **RTL Support**: Right-to-left languages
- **Date/Time Formatting**: Locale-specific formatting
- **Number Formatting**: Currency and numeric values

## 🚀 Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### AWS S3 + CloudFront
```bash
npm run build
aws s3 sync build/ s3://your-bucket-name
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@streamflix.com or create an issue in the repository.

---

Built with ❤️ by the StreamFlix team