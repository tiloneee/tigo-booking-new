# Chat System Architecture - Visual Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHAT SYSTEM ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   User Creates   │
│     Booking      │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    POST /chat/rooms/from-booking/:id                    │
│  • Fetch booking details (customer, hotel owner, hotel)                │
│  • Verify user permission                                              │
│  • Create/get chat room between customer & hotel owner                 │
│  • Link chat room to booking                                           │
└────────┬───────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           CHAT ROOM CREATED                             │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  chat_rooms table:                                            │     │
│  │  • id: uuid                                                   │     │
│  │  • participant1_id: customer_id                              │     │
│  │  • participant2_id: hotel_owner_id                           │     │
│  │  • booking_id: booking_uuid  ← NEW                           │     │
│  │  • hotel_id: hotel_uuid                                      │     │
│  │  • last_message_content: null                                │     │
│  │  • last_message_at: null                                     │     │
│  └──────────────────────────────────────────────────────────────┘     │
└────────┬───────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND OPENS CHAT UI                             │
│  BookingChat Component:                                                │
│  • Connects to WebSocket (Socket.IO)                                   │
│  • Loads message history                                               │
│  • Displays booking context (hotel, dates)                             │
│  • Shows other participant info                                        │
└────────┬───────────────────────────────────────────────────────────────┘
         │
         ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    USER TYPES MESSAGE
           │
           ▼
    ┌──────────────┐
    │ Send Message │
    │   (Client)   │
    └──────┬───────┘
           │
           ▼
    POST /chat/messages
    {
      chat_room_id: "uuid",
      content: "Hello!",
      type: "text"
    }
           │
           ▼
    ┌────────────────────────────────────┐
    │  ChatService.sendMessage()         │
    │  1. Verify room access             │
    │  2. Save to database              │
    │  3. Update last_message            │
    └────┬──────────────────────────┬────┘
         │                          │
         ▼                          ▼
    ┌─────────────┐         ┌──────────────────┐
    │ Publish to  │         │ Publish to Redis │
    │  Socket.IO  │         │  notification:   │
    │   (Real-    │         │     events       │
    │    time)    │         └────────┬─────────┘
    └─────┬───────┘                  │
          │                          ▼
          │                 ┌────────────────────┐
          │                 │ Notification       │
          │                 │   Service          │
          │                 │ Creates DB record  │
          │                 │ & sends to user    │
          │                 └────────────────────┘
          │
          ▼
    ALL CONNECTED CLIENTS
    IN ROOM RECEIVE MESSAGE
          │
          ▼
    ┌─────────────────────┐
    │  Message appears    │
    │  in chat UI         │
    │  • Auto-scroll      │
    │  • Read receipts    │
    │  • Timestamp        │
    └─────────────────────┘
```

## Data Model Comparison

### OLD SYSTEM (Role-Based)
```
┌─────────────────────────────────────┐
│          chat_rooms                 │
├─────────────────────────────────────┤
│ id                                  │
│ type  ← CUSTOMER_HOTEL_OWNER       │
│       ← CUSTOMER_ADMIN             │
│       ← HOTEL_OWNER_ADMIN          │
│ participant1_id                     │
│ participant2_id                     │
│ hotel_id                            │
│ ...                                 │
└─────────────────────────────────────┘
        │
        │ Required role validation
        │ Complex business logic
        ▼
```

### NEW SYSTEM (User-to-User)
```
┌─────────────────────────────────────┐
│          chat_rooms                 │
├─────────────────────────────────────┤
│ id                                  │
│ participant1_id  ← ANY USER         │
│ participant2_id  ← ANY USER         │
│ booking_id       ← NEW LINK         │
│ hotel_id                            │
│ ...                                 │
└─────────────────────────────────────┘
        │
        │ Simple validation
        │ Booking context included
        ▼
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                        │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BookingDetailsPage                                         │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │  Booking Info      │  │    BookingChat Component     │  │
│  │  • Hotel Name      │  │  ┌────────────────────────┐  │  │
│  │  • Dates           │  │  │   Chat Header          │  │  │
│  │  • Room Type       │  │  │   • Other User Info    │  │  │
│  │  • Price           │  │  │   • Online Status      │  │  │
│  │  • Status          │  │  │   • Booking Context    │  │  │
│  └────────────────────┘  │  └────────────────────────┘  │  │
│                          │  ┌────────────────────────┐  │  │
│                          │  │   Messages Area        │  │  │
│                          │  │   • ScrollArea         │  │  │
│                          │  │   • Message Bubbles    │  │  │
│                          │  │   • Timestamps         │  │  │
│                          │  │   • Read Receipts      │  │  │
│                          │  └────────────────────────┘  │  │
│                          │  ┌────────────────────────┐  │  │
│                          │  │   Message Input        │  │  │
│                          │  │   • Input Field        │  │  │
│                          │  │   • Send Button        │  │  │
│                          │  │   • Online Indicator   │  │  │
│                          │  └────────────────────────┘  │  │
│                          └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Real-Time Communication Flow

```
┌────────────┐                    ┌────────────┐
│  Customer  │                    │Hotel Owner │
│   Browser  │                    │   Browser  │
└─────┬──────┘                    └──────┬─────┘
      │                                  │
      │ WebSocket Connect                │ WebSocket Connect
      ├──────────────┐                   ├──────────────┐
      │              ▼                   │              ▼
      │     ┌─────────────────┐          │     ┌─────────────────┐
      │     │  Socket.IO      │          │     │  Socket.IO      │
      │     │  Connection 1   │          │     │  Connection 2   │
      │     └────────┬────────┘          │     └────────┬────────┘
      │              │                   │              │
      │              └───────────────────┴──────────────┘
      │                         │
      │                         ▼
      │              ┌──────────────────────┐
      │              │   ChatGateway        │
      │              │   (Backend)          │
      │              │   • Join room        │
      │              │   • Track online     │
      │              │   • Broadcast msgs   │
      │              └──────────┬───────────┘
      │                         │
      │                         ▼
      │              ┌──────────────────────┐
      │              │   Redis Pub/Sub      │
      │              │   • chat:events      │
      │              │   • notification:    │
      │              │     events           │
      │              └──────────────────────┘
      │
      │ Customer sends: "Hello!"
      ├────────────────────────────────────────►
      │                                    Message appears instantly
      │                                    ◄────────────────────────
      │
      │                                    Hotel Owner replies
      │ ◄────────────────────────────────────────
      │ Message appears instantly
```

## Notification Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

    New Message Sent
          │
          ▼
    ChatService.sendMessage()
          │
          ├─── Save to DB
          │
          ├─── Publish Socket.IO (real-time)
          │
          └─── Publish Redis Event
                    │
                    ▼
          ┌──────────────────────┐
          │  Redis Channel:      │
          │  notification:events │
          └──────┬───────────────┘
                 │
                 ▼
          ┌─────────────────────────┐
          │  NotificationService    │
          │  • Listens to Redis     │
          │  • Creates notification │
          │  • Stores in DB         │
          │  • Sends to user        │
          └──────┬──────────────────┘
                 │
                 ├──► Database (notifications table)
                 │
                 └──► User's connected clients
                          │
                          ▼
                    ┌──────────────┐
                    │ Notification │
                    │   Toast/     │
                    │   Alert      │
                    └──────────────┘
```

## Booking Integration Flow

```
┌──────────────────────────────────────────────────────────┐
│             BOOKING → CHAT INTEGRATION                    │
└──────────────────────────────────────────────────────────┘

    User Creates Booking
           │
           ▼
    ┌────────────────────┐
    │  hotel_bookings    │
    │  • id              │
    │  • user_id ────────┼──── Customer ID
    │  • hotel_id        │
    │  • hotel.owner_id ─┼──── Hotel Owner ID
    │  • check_in_date   │
    │  • check_out_date  │
    └──────┬─────────────┘
           │
           ▼
    POST /chat/rooms/from-booking/:id
           │
           ▼
    ┌─────────────────────────────────┐
    │  Create Chat Room               │
    │  participant1: customer_id      │
    │  participant2: hotel_owner_id   │
    │  booking_id: booking_id ← LINK  │
    │  hotel_id: hotel_id             │
    └──────┬──────────────────────────┘
           │
           ▼
    Chat Room Ready!
    Customer ←→ Hotel Owner
    
    Booking context available:
    • Hotel name
    • Check-in/out dates
    • Room type
    • Booking status
```

## File Structure

```
tigo-booking-new/
│
├── tigo-server/
│   ├── src/modules/chat/
│   │   ├── entities/
│   │   │   ├── chat-room.entity.ts ✓ User-to-user
│   │   │   └── chat-message.entity.ts
│   │   ├── dto/
│   │   │   ├── create-chat-room.dto.ts ✓ No type
│   │   │   └── chat-room-query.dto.ts ✓ +booking_id
│   │   ├── services/
│   │   │   ├── chat.service.ts ✓ +createFromBooking
│   │   │   └── redis.service.ts
│   │   ├── controllers/
│   │   │   └── chat.controller.ts ✓ New endpoint
│   │   ├── gateways/
│   │   │   └── chat.gateway.ts
│   │   └── chat.module.ts ✓ +HotelBooking
│   └── src/migrations/
│       └── update-chat-rooms-user-to-user.sql ✓ NEW
│
└── aurevia-client/
    ├── lib/api/
    │   └── chat.ts ✓ NEW - Full API client
    ├── components/
    │   ├── chat/
    │   │   └── booking-chat.tsx ✓ NEW - Main component
    │   └── ui/
    │       ├── input.tsx ✓ NEW
    │       ├── scroll-area.tsx ✓ NEW
    │       ├── avatar.tsx ✓ NEW
    │       └── separator.tsx ✓ NEW
    └── app/(user)/bookings/[bookingId]/
        └── page.tsx ✓ NEW - Example usage
```

---

## Legend

✓ = Modified or Created  
← = New Feature  
→ = Data Flow  
▼ = Process Flow
