# Request Hub Feature

## Overview
The Request Hub is a centralized page where users can manage two types of requests:
1. **Topup User Balance** - Add funds to their account
2. **Create Hotel Request** - Submit new hotel requests for platform approval

## Location
- **URL**: `/requests`
- **File**: `aurevia-client/app/(user)/requests/page.tsx`

## Access
Users can access the Request Hub through:
- The user dropdown menu in the header (when logged in)
- Direct navigation to `/requests`

## Features

### Tab 1: Topup Balance
- Displays current user balance
- Input field for topup amount
- Quick select buttons ($10, $50, $100, $500)
- Form validation (minimum $1.00)
- Success/error toast notifications

### Tab 2: Hotel Request
- Form fields:
  - Hotel Name (required)
  - Hotel Address (required)
  - Hotel Description (required, textarea)
  - Starting Price per night (required, numeric)
  - Hotel Images (multiple file upload)
- Success/error toast notifications

## Design Theme
The Request Hub follows the luxury vintage theme of Aurevia:
- **Colors**: Walnut dark background with copper/gold accents
- **Fonts**: Playfair Display, Cormorant Garamond, Cinzel
- **UI Components**: Custom styled tabs, cards, inputs, and buttons
- **Icons**: Lucide React icons with copper accent colors

## Components Used
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `Card`, `CardContent`, `CardHeader` - Container components
- `Button` - Action buttons
- `Input` - Form inputs
- `ProtectedRoute` - Authentication wrapper
- `Header` - Navigation header
- `Toaster` (sonner) - Toast notifications

## Dependencies Added
- `@radix-ui/react-tabs` - Accessible tab component
- `sonner` - Toast notification library

## Navigation Updates
The `user-nav.tsx` component has been updated to include a "Requests" link in the dropdown menu with a FileText icon.

## Future Enhancements
The following features are marked as TODO and need backend implementation:
1. Actual topup API endpoint integration
2. Hotel request submission API endpoint
3. Request history/status tracking
4. Admin approval workflow for requests
5. Payment gateway integration for topups

## Styling Details
- Background: Gradient from walnut-darkest to walnut-dark
- Cards: Semi-transparent with copper accent borders and backdrop blur
- Inputs: Dark walnut background with copper accent focus states
- Buttons: Copper gradient with hover effects and shadows
- Text: Cream-light with copper accents
