# Re:Moda Frontend

A modern, AI-powered wardrobe management and personal styling application built with React and Vite.

## 🎯 Overview

Re:Moda is a comprehensive wardrobe management platform that combines AI-powered outfit generation, wear tracking, and intelligent wardrobe analysis. Users can upload clothing items, generate outfits using AI, track wear patterns, and get personalized styling recommendations.

## ✨ Features

### 🎨 AI-Powered Outfit Generation
- **Virtual Try-On**: Generate outfits using AI avatar technology
- **Build Your Own**: Manually select tops, bottoms, and shoes to create outfits
- **Smart Recommendations**: AI suggests outfit combinations based on your wardrobe

### 👕 Wardrobe Management
- **Upload & Organize**: Upload clothing items with automatic categorization
- **Wear Tracking**: Track how often you wear each item
- **Smart Categories**: Automatic sorting into Tops, Bottoms, Shoes, and Unused
- **Batch Operations**: Move multiple items to unused based on wear patterns

### 🤖 AI Stylist Chat
- **Natural Language Commands**: Chat with AI stylist using natural language
- **MCP Server Integration**: Advanced AI processing for wardrobe management
- **Wardrobe Analysis**: Get insights about your clothing usage
- **Personalized Recommendations**: Receive outfit suggestions for any occasion

### 💰 Coin System
- **Earn Coins**: Gain coins through donations and wardrobe management
- **Spend on AI Features**: Use coins for AI-powered outfit generation
- **Thrift Store Integration**: Donate unused items and earn rewards

### 📊 Analytics & Insights
- **Wear Analysis**: Track which items you wear most/least
- **Donation Suggestions**: AI suggests items to donate based on usage
- **Wardrobe Statistics**: Comprehensive analysis of your clothing habits

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Re-Moda-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── assets/                 # Images, videos, and static files
├── components/            # Reusable React components
├── pages/                 # Main application pages
│   ├── HomePage.jsx      # Landing page with navigation
│   ├── SignInPage.jsx    # User authentication
│   ├── SignUpPage.jsx    # User registration
│   ├── UserPage.jsx      # Main wardrobe/closet interface
│   ├── UploadsPage.jsx   # Clothing item upload interface
│   ├── StylistChatPage.jsx # AI stylist chat interface
│   └── ThriftPage.jsx    # Thrift store and donation interface
├── config.js             # API configuration and constants
├── main.jsx             # Application entry point
└── index.js             # Root component
```

## 🎮 Key Features Explained

### AI Stylist Chat
The chat interface supports natural language commands for wardrobe management:

```javascript
// Example commands
"analyze my wardrobe"
"move items i haven't worn in 3 months to unused"
"move low wear items to unused"
"move blue shirt to unused"
```

### MCP Server Integration
Advanced AI processing through Model Context Protocol:

```javascript
// MCP server endpoint
POST /mcp/execute
{
  "command": "move items i haven't worn in 3 months to unused",
  "userId": "user_id"
}
```

### Wear Tracking System
Automatic wear count tracking and analysis:

```javascript
// Mark outfit as worn
PATCH /outfits/{outfitId}/worn
// Updates wear_count and last_worn_at for all items in outfit
```

### Coin System
Virtual currency for AI features:

```javascript
// Earn coins through donations
POST /users/me/coins/add
// Spend coins on AI features
POST /users/me/coins/spend
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login

### Wardrobe Management
- `GET /clothing-items` - Get user's clothing items
- `POST /clothing-items` - Upload new clothing item
- `PATCH /clothing-items/{id}/unused` - Move item to unused
- `PATCH /clothing-items/{id}/restore` - Restore from unused

### Outfit Management
- `GET /outfits` - Get user's outfits
- `POST /outfits` - Create new outfit
- `PATCH /outfits/{id}/favorite` - Toggle favorite status
- `PATCH /outfits/{id}/worn` - Mark outfit as worn

### AI Features
- `POST /outfits/generate-avatar` - Generate AI outfit
- `POST /chat/sessions/{id}/messages` - Send chat message
- `POST /mcp/execute` - Execute MCP commands

### Analytics
- `POST /mcp/analyze-wardrobe` - Wardrobe analysis
- `POST /mcp/donation-suggestions` - Get donation suggestions
- `POST /mcp/move-old-items` - Move old items to unused

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Hamburger menu for mobile navigation
- Touch-friendly interface

### Loading States
- Full-screen loading overlays
- Progress indicators for uploads
- Skeleton loading for content

### Toast Notifications
- Success, error, and info notifications
- Auto-dismissing messages
- Consistent styling across the app

### Animations
- Smooth transitions between pages
- Loading spinners and progress bars
- Hover effects and micro-interactions

## 🔒 Security Features

- JWT token authentication
- Secure API communication
- Input validation and sanitization
- Error handling and user feedback

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Netlify
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

- Use functional components with hooks
- Follow React best practices
- Use consistent naming conventions
- Add comments for complex logic
- Use TypeScript for type safety (future enhancement)

## 🐛 Known Issues

- Processing timeout for large upload batches
- Backend 500 errors for outfit creation (being investigated)
- MCP server integration requires backend setup

## 🚧 Roadmap

- [ ] TypeScript migration
- [ ] Unit and integration tests
- [ ] PWA capabilities
- [ ] Offline support
- [ ] Advanced analytics dashboard
- [ ] Social features (sharing outfits)
- [ ] Integration with e-commerce platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Development**: React, Vite, CSS3
- **AI Integration**: MCP Server, Natural Language Processing
- **Backend Integration**: RESTful APIs, JWT Authentication
- **UI/UX Design**: Modern, responsive design with animations


---

**Re:Moda** - Your AI-powered wardrobe companion! 🎉
