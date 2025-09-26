# Notification Frontend Implementation Documentation

## Overview

The Aurevia frontend notification system provides a comprehensive real-time notification experience with a luxury vintage design theme. It integrates seamlessly with the backend notification module using WebSocket connections and REST APIs.

## Architecture

### Component Structure

```
components/
├── notifications/
│   ├── notification-provider.tsx     # Context provider with WebSocket
│   ├── notification-bell.tsx         # Header notification bell
│   ├── notification-list.tsx         # Notification list component
│   ├── notification-settings.tsx     # User preference settings
│   └── notification-test.tsx         # Testing interface
└── auth/
    └── user-nav.tsx                   # Updated with notification bell

app/
└── (user)/
    └── notifications/
        └── page.tsx                   # Main notifications page
```

### State Management Flow

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   WebSocket Server  │───▶│  NotificationProvider│───▶│    UI Components    │
│   (Backend)         │    │  (React Context)     │    │  (Bell, List, etc.) │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────┐
                           │   Local State        │
                           │ - notifications[]    │
                           │ - unreadCount        │
                           │ - isConnected        │
                           │ - socket             │
                           └──────────────────────┘
```

## Key Features

### 1. **Real-time Notifications**
- WebSocket connection to backend notification service
- Automatic reconnection on connection loss
- Live notification badge updates
- Browser notification support

### 2. **Vintage Luxury Design**
- Copper and walnut color scheme
- Playfair Display and Cormorant fonts
- Smooth animations and transitions
- Responsive design for all devices

### 3. **Comprehensive UI Components**
- **Notification Bell**: Header dropdown with unread count
- **Notification List**: Scrollable list with filters
- **Settings Panel**: User preference management  
- **Test Interface**: Development testing tools

### 4. **User Experience**
- Click-to-read functionality
- Smart navigation to related entities
- Search and filter capabilities
- Mark all as read functionality

## Component Details

### NotificationProvider

**Location**: `components/notifications/notification-provider.tsx`

**Purpose**: Central state management and WebSocket integration

**Key Features**:
- React Context for state sharing
- WebSocket connection management
- API integration for CRUD operations
- Browser notification handling

**Usage**:
```jsx
// Wrap app in provider
<NotificationProvider>
  <App />
</NotificationProvider>

// Use in components
const { state, markAsRead, markAllAsRead } = useNotifications()
```

**WebSocket Events**:
- `new_notification` - Receives new notifications
- `unread_count` - Updates unread count
- `recent_notifications` - Initial notification load
- `broadcast_notification` - System announcements

### NotificationBell

**Location**: `components/notifications/notification-bell.tsx`

**Purpose**: Header notification indicator with dropdown

**Features**:
- Animated notification badge
- Click-outside-to-close dropdown
- Real-time unread count updates
- Connection status indicator

**Visual States**:
- **No notifications**: Regular bell icon
- **Unread notifications**: Pulsing bell with animated badge
- **Disconnected**: Disabled state

### NotificationList

**Location**: `components/notifications/notification-list.tsx`

**Purpose**: Displays notifications with interactions

**Features**:
- Icon-based notification type indication
- Time-ago formatting using date-fns
- Color-coded notification types
- Click-to-navigate functionality
- Empty state handling

**Notification Types**:
- 🗨️ **Chat Messages** - Blue theme
- 📅 **Bookings** - Green/Red based on status
- ⭐ **Reviews** - Copper theme
- 🏨 **Hotels** - Green/Red based on approval
- 💳 **Payments** - Green/Red based on success
- 📢 **Announcements** - Copper theme

### NotificationSettings

**Location**: `components/notifications/notification-settings.tsx`

**Purpose**: User notification preferences management

**Features**:
- Toggle switches for each notification type
- Three delivery methods per type:
  - In-app notifications
  - Email notifications
  - Browser notifications
- Real-time preference updates
- Browser permission management

### NotificationTest

**Location**: `components/notifications/notification-test.tsx`

**Purpose**: Development testing interface

**Features**:
- Send test notifications for each type
- Visual feedback on send status
- Connection status monitoring
- Testing instructions

## Styling and Design

### Color Palette

```css
/* Primary Colors */
--walnut-darkest: #1A0F08    /* Background */
--walnut-dark: #241611       /* Card backgrounds */
--copper-accent: #CD7F32     /* Accent color */
--cream-light: #FFF8DC       /* Text color */

/* Notification Type Colors */
--success: #10B981           /* Confirmations, approvals */
--danger: #EF4444            /* Cancellations, failures */
--info: #3B82F6              /* General notifications */
```

### Typography

```css
/* Font Families */
font-playfair: "Playfair Display", serif    /* Headers */
font-cormorant: "Cormorant Garamond", serif /* Body text */
font-cinzel: "Cinzel", serif                /* Labels */

/* Vintage Sizes */
text-vintage-xs: 0.75rem
text-vintage-sm: 0.875rem  
text-vintage-base: 1rem
text-vintage-lg: 1.125rem
text-vintage-xl: 1.25rem
```

### Animations

- **Badge Bounce**: New notification indicator
- **Pulse**: Unread notification bell
- **Fade In**: Notification list items
- **Slide In**: Dropdown menus
- **Spin**: Loading indicators

## API Integration

### Configuration

```bash
# Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Endpoints Used

```typescript
// Fetch notifications
GET /notifications?page=1&limit=20&type=CHAT_MESSAGE&status=UNREAD

// Mark as read  
PUT /notifications/{id}/mark
Body: { status: "READ" }

// Mark all as read
PUT /notifications/mark-all-read

// Get preferences
GET /notifications/preferences

// Update preferences
PUT /notifications/preferences/{type}
Body: { in_app_enabled: true, email_enabled: false }

// Send test notification
POST /notifications
Body: { type, user_id, title, message, metadata }
```

### Authentication

All API calls include JWT token from NextAuth session:
```typescript
headers: {
  'Authorization': `Bearer ${session.accessToken}`,
  'Content-Type': 'application/json'
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd aurevia-client
npm install date-fns  # Already included in package.json
```

### 2. Environment Setup

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001
```

### 3. Integration

The notification system is already integrated:
- ✅ Provider wrapped in `app/layout.tsx`
- ✅ Bell component added to `components/auth/user-nav.tsx`
- ✅ Pages created in `app/(user)/notifications/`

### 4. Start Development

```bash
npm run dev
```

Frontend runs on: `http://localhost:3001`

## Testing Guide

### 1. Manual Testing

**Start Both Servers:**
```bash
# Backend (Terminal 1)
cd tigo-server
npm run start:dev

# Frontend (Terminal 2)  
cd aurevia-client
npm run dev
```

**Test Steps:**
1. **Login**: Navigate to `http://localhost:3001` and login
2. **Notification Bell**: Check header for notification bell
3. **Test Interface**: Go to `/notifications` → "Test" tab
4. **Send Notifications**: Click "Send Test" buttons
5. **Real-time Updates**: Watch bell badge update in real-time
6. **Dropdown**: Click bell to see notification dropdown
7. **Full Page**: Navigate to notifications page
8. **Settings**: Test preference toggles
9. **Browser Notifications**: Enable browser permissions

### 2. WebSocket Testing

**Connection Status:**
- Green dot = Connected
- Red dot = Disconnected

**Real-time Events:**
- Send chat message → Check for notification
- Create booking → Check for notification  
- System announcements → Check broadcast

### 3. API Testing

**Test API Endpoints:**
```bash
# Get notifications
curl -X GET "http://localhost:3001/api/notifications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mark as read
curl -X PUT "http://localhost:3001/api/notifications/ID/mark" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "READ"}'
```

## Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
```javascript
// Check console for errors
// Verify backend is running on port 3000
// Check JWT token validity
```

**2. Notifications Not Appearing**
```javascript
// Check user preferences
// Verify API responses in Network tab
// Check WebSocket messages in DevTools
```

**3. Styling Issues**
```javascript
// Verify Tailwind classes are working
// Check if fonts are loading properly
// Inspect element for CSS conflicts
```

**4. Build Errors**
```bash
# Fix TypeScript errors
npm run build

# Check ESLint warnings
npm run lint
```

### Debug Mode

Enable console logging by adding to notification provider:
```javascript
const DEBUG = process.env.NODE_ENV === 'development'
if (DEBUG) console.log('Notification event:', event)
```

## Performance Considerations

### Optimization Strategies

**1. Connection Management**
- Single WebSocket connection per user
- Automatic reconnection with exponential backoff
- Connection cleanup on unmount

**2. State Updates**
- Efficient reducer for state management
- Minimal re-renders with proper dependencies
- Memoized components where needed

**3. API Calls**
- Debounced preference updates
- Batch operations where possible
- Error handling and retry logic

### Memory Management

- WebSocket cleanup on component unmount
- Notification list pagination
- Limited recent notifications cache
- Proper event listener cleanup

## Future Enhancements

### Phase 2 Features

1. **Push Notifications**
   - Service Worker integration
   - Push notification permissions
   - Background notification handling

2. **Advanced Filtering**
   - Date range filters
   - Advanced search capabilities
   - Saved filter presets

3. **Notification Actions**
   - Quick reply for chat notifications
   - Approve/reject buttons for bookings
   - Inline actions without navigation

4. **Customization**
   - User-defined notification sounds
   - Custom notification templates
   - Theme customization

### Mobile Improvements

1. **Progressive Web App**
   - Offline notification caching
   - Home screen installation
   - Native app-like experience

2. **Touch Interactions**
   - Swipe to mark as read
   - Pull-to-refresh
   - Touch-friendly interface

## Contributing

### Code Standards

1. **TypeScript**: Strict typing for all components
2. **ESLint**: Follow project linting rules
3. **Tailwind**: Use existing design system
4. **Accessibility**: WCAG 2.1 AA compliance

### Testing Requirements

1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: WebSocket connection tests
3. **E2E Tests**: Cypress for user flows
4. **Performance Tests**: Lighthouse scores

### Development Workflow

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with screenshots
5. Pass code review
6. Deploy to staging for testing

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Compatibility**: Next.js 15.2.4, React 19.0.0, TypeScript 5.7.3
