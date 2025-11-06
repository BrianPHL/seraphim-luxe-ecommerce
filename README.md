# Seraphim Luxe | Style Without Boundaries

A full-stack luxury e-commerce platform built with modern web technologies, featuring AI-powered chatbot assistance, real-time live agent support, comprehensive admin management, and seamless payment integration.

## 🌟 Features

### Customer-Facing Features
- **Product Catalog**: Browse and filter luxury products with advanced search capabilities
- **Shopping Cart & Wishlist**: Manage desired items and proceed to secure checkout
- **PayPal Integration**: Secure payment processing with multi-currency support
- **Order Management**: Track order status with detailed order history
- **Product Reviews**: Rate and review products with helpful voting system
- **AI Chatbot**: Google Gemini AI-powered assistant for product inquiries and support
- **Live Agent Chat**: Real-time customer support with agent escalation
- **Support Tickets**: Create and manage support tickets for complex issues
- **User Profiles**: Manage account information, addresses, and preferences
- **OAuth Authentication**: Sign in with Google or email/password
- **Email Verification**: Secure account creation with OTP verification
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable browsing

### Admin Panel Features
- **Analytics Dashboard**: Real-time insights with Chart.js visualizations
- **Order Management**: Process orders, update status, and handle refunds
- **Product Management**: CRUD operations with Cloudinary image uploads
- **Stock Management**: Track inventory with stock history and low-stock alerts
- **Category Management**: Organize products with categories and subcategories
- **CMS**: Manage banners, promotions, and static page content
- **Account Management**: User administration with suspension capabilities
- **Audit Trail**: Comprehensive logging of all system activities
- **Live Agent Chats**: Claim and manage customer chat sessions
- **Support Tickets**: Respond to and resolve customer support requests
- **Platform Settings**: Configure site-wide settings and preferences
- **Real-time Notifications**: SSE-based updates for orders, chats, and tickets

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with latest features
- **React Router 7** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Chart.js** - Data visualization
- **CSS Modules** - Scoped styling

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web application framework
- **MySQL 2** - Database with connection pooling
- **Better Auth** - Authentication system with OAuth support
- **Nodemailer/Resend** - Email services for notifications

### APIs & Integrations
- **Google Gemini AI** - AI-powered chatbot assistance
- **PayPal SDK** - Payment processing
- **Cloudinary** - Image hosting and optimization
- **Google OAuth** - Social authentication
- **Server-Sent Events (SSE)** - Real-time updates

### Development Tools
- **ESLint** - Code linting
- **Nodemon** - Development auto-reload
- **Concurrently** - Run multiple scripts simultaneously

## 📁 Project Structure

```bash
seraphim-luxe/
├── client/ # React frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── contexts/ # React Context providers
│ │ ├── hooks/ # Custom React hooks
│ │ ├── pages/ # Page components
│ │ ├── routes/ # Route configuration
│ │ └── utils/ # Utility functions
│ └── vite.config.js
├── server/ # Express backend
│ ├── apis/ # Third-party API configurations
│ ├── routes/ # API route handlers
│ └── utils/ # Server utilities
├── sql/ # Database schemas
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- PayPal Developer Account
- Cloudinary Account
- Google OAuth Credentials
- Google Gemini API Key
- Email Service (Resend or Nodemailer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BrianPHL/seraphim-luxe-ecommerce.git
   cd seraphim-luxe-ecommerce
2. **Install dependencies**
   ```bash
    npm install
3. **Configure environment variables**
Create a .env file in the root directory:
   ```bash
    # Server
    PORT=3000
    NODE_ENV=development
    
    # Database
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=seraphim_luxe
    
    # Authentication
    BETTER_AUTH_SECRET=your_secret_key
    
    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    
    # PayPal
    PAYPAL_CLIENT_ID=your_paypal_client_id
    PAYPAL_CLIENT_SECRET=your_paypal_client_secret
    
    # Cloudinary
    CLOUDINARY_NAME=your_cloudinary_name
    CLOUDINARY_KEY=your_cloudinary_key
    CLOUDINARY_SECRET=your_cloudinary_secret
    
    # Google Gemini AI
    GEMINI_API_KEY=your_gemini_api_key
    
    # Email (Resend)
    RESEND_API_KEY=your_resend_api_key
4. **Set up the database**
    ```bash
    # Import the main database schema
    mysql -u your_db_user -p seraphim_luxe < server/sql/seraphim_luxe.sql

    # Import individual table schemas from server/sql/tables/
5. **Run the application**
    Development mode (runs both frontend and backend):
    ```bash
    npm run dev
    ```
    
    Production mode
    ```bash
    npm run build
    npm start
6. **Access the application**
- Frontend: http://localhost:5173 (development)
- Backend API: http://localhost:3000
- Admin Panel: http://localhost:5173/admin

## 🔑 Key Features Explained

### Authentication System
- Built with **Better Auth** for robust session management
- Email/password authentication with email verification via OTP
- Google OAuth integration with automatic account linking
- Role-based access control (customer/admin)
- Account suspension capabilities
- Secure password reset flow

### AI Chatbot
- Powered by Google Gemini AI for natural language understanding
- Context-aware responses based on user role (customer/admin)
- Predefined questions for quick assistance
- Persistent chat history stored in database
- Seamless escalation to live agent support

### Live Agent Chat
- Real-time bidirectional communication using Server-Sent Events (SSE)
- Queue system for customer requests (waiting/active/concluded)
- Agent claim mechanism to prevent conflicts
- Perpetual chat history across sessions
- Audience-targeted messages (customer-only, admin-only, or all)
- Auto-reconnect for concluded sessions

### Payment Processing
- PayPal SDK integration for secure transactions
- Multi-currency support with automatic conversion
- Order creation and capture flow
- Detailed payment tracking and history

### Image Management
- Cloudinary integration for optimized image delivery
- Multiple product images with primary image selection
- Automatic format optimization and responsive images
- Image upload with validation

### Real-time Updates
- Server-Sent Events for instant notifications
- Live order status updates
- Chat message delivery
- Stock level alerts
- Support ticket notifications

## 📊 Database Schema

The application uses MySQL with a well-organized schema structure. All database files are located in the `sql/` directory:

### Schema Structure
```bash
sql/
├── seraphim_luxe.sql # Main database schema with all tables
├── accounts/ # User account tables
│ ├── accounts.sql # User authentication and profiles
│ └── account_addresses.sql # User shipping/billing addresses
├── products/ # Product-related tables
│ ├── products.sql # Product catalog
│ ├── product_categories.sql # Product categories
│ ├── product_subcategories.sql # Product subcategories
│ ├── product_images.sql # Product image storage
│ ├── product_reviews.sql # Customer product reviews
│ ├── product_review_helpful.sql # Review helpfulness votes
│ └── products_promotions.sql # Product promotion associations
├── orders/ # Order management tables
│ ├── orders.sql # Main orders table
│ ├── order_items.sql # Individual order items
│ ├── order_status_history.sql # Order status tracking
│ ├── order_tracking.sql # Shipping tracking information
│ └── order_refunds.sql # Order refund records
├── oauth/ # Authentication tables
│ ├── oauth_sessions.sql # User session management
│ ├── oauth_accounts.sql # OAuth provider accounts
│ └── oauth_verifications.sql # Email/OTP verifications
├── chatbot/ # AI chatbot tables
│ ├── chatbot_sessions.sql # Chat conversation history
│ └── chatbot_predefined_questions.sql # Predefined FAQ questions
├── live_chat/ # Live agent support tables
│ ├── live_chat_rooms.sql # Chat room management
│ └── live_chat_messages.sql # Chat messages
├── support_tickets/ # Support ticket system tables
│ ├── support_tickets.sql # Ticket records
│ └── support_ticket_messages.sql # Ticket conversation threads
├── cms/ # Content management tables
│ ├── cms.sql # Static page content
│ ├── cms_banners.sql # Homepage/promotional banners
│ └── cms_promotions.sql # Promotional campaigns
├── notifications/ # Notification system tables
│ ├── notifications.sql # User notifications
│ └── notification_preferences.sql # User notification settings
└── other/ # Additional system tables
├── carts.sql # Shopping cart items
├── wishlist.sql # User wishlists
├── stocks_history.sql # Inventory tracking history
├── audit_trail.sql # System activity logging
└── platform_settings.sql # Global platform settings
```

### Database Setup

The database can be set up in two ways:

**Option 1: Import the complete schema**
```bash
mysql -u your_db_user -p seraphim_luxe < [seraphim_luxe.sql](http://_vscodecontentref_/20)
```

**Option 1: Import individual table schemas (useful for updates or selective installation)**
```bash
# Import specific tables from their respective folders
mysql -u your_db_user -p seraphim_luxe < sql/accounts/accounts.sql
mysql -u your_db_user -p seraphim_luxe < sql/products/products.sql
# ... and so on
```

### Key Tables Overview
- accounts - User authentication, profiles, preferences, and role management
- products - Product catalog with categories, subcategories, and images
- orders - Complete order lifecycle with items, status tracking, and refunds
- carts / wishlist - Shopping cart and wishlist management
- product_reviews - Customer reviews with helpfulness voting system
- live_chat_rooms / live_chat_messages - Real-time agent support system
- chatbot_sessions - AI chatbot conversation history
- support_tickets / support_ticket_messages - Ticket-based support system
- oauth_sessions / oauth_accounts / oauth_verifications - Authentication and session management
- notifications - User notification system with preferences
- cms / cms_banners / cms_promotions - Content management system
- audit_trail - Comprehensive system activity logging for security and compliance
- stocks_history - Product inventory tracking and changes
- platform_settings - Global application configuration

The schema is designed with referential integrity, proper indexing, and optimized for both read and write operations to support the e-commerce platform's requirements.

## 🔒 Security Features

- Bcrypt password hashing
- JWT session tokens
- CORS configuration for production
- SQL injection prevention with parameterized queries
- XSS protection
- Environment variable protection
- Role-based access control
- Email verification requirements
- Rate limiting on sensitive endpoints

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Bri** ([BrianPHL](https://github.com/BrianPHL)) - Lead Developer, Full-stack Developer, Database Specialist, UI/UX Designer, Quality Assurance Tester, Technical Writer
- **Railey** ([raileyyyy](https://github.com/raileyyyy)) - Full-stack Developer, Database Specialist, Technical Writer
- **Sean** ([OS1R1S-26](https://github.com/OS1R1S-26)) - Full-Stack Developer, Technical Writer
- **Aidan** ([AiD4HN](https://github.com/AiD4HN)) - Full-Stack Developer, UI/UX Designer, Technical Writer
- **Elli** ([GeraldElliRamos](https://github.com/GeraldElliRamos)) - Full-Stack Developer, Technical Writer

## 🎓 Acknowledgments

This project was developed as an academic demonstration and received a perfect score. It showcases:
- Modern full-stack development practices
- Real-world e-commerce functionality
- AI integration in web applications
- Real-time communication patterns
- Comprehensive admin management systems

---

**Note**: This is a demonstration project. For production deployment, ensure all security best practices are followed, including proper secret management, SSL/TLS configuration, and regular security audits.