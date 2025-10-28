# Bug Fix: Room Fetch Error

## 🐛 Issue
When fetching rooms for a hotel in the dashboard, the application crashed with:
```
TypeError: Cannot read properties of undefined (reading 'owner')
at RoomService.sanitizeRoomOwnerData
```

## 🔍 Root Cause
In `tigo-server/src/modules/hotel/services/room.service.ts`:

1. Multiple methods (`findByHotel()`, `getAvailability()`) query rooms without loading the `hotel` relation
2. These methods call `sanitizeRoomsOwnerData()` to remove sensitive owner information
3. The `sanitizeRoomOwnerData()` method tried to access `room.hotel.owner` without checking if:
   - `room` exists (could be undefined in mapped arrays)
   - `room.hotel` was loaded
   - `room.hotel.owner` exists
4. Since the `hotel` relation wasn't included in the queries, accessing these properties caused crashes

## ✅ Fix Applied

### File: `tigo-server/src/modules/hotel/services/room.service.ts`

**Before:**
```typescript
private sanitizeRoomOwnerData(room: Room): void {
  console.log('🔍 Sanitizing room owner data:', room);
  this.sanitizeUserObject(room.hotel.owner, this.SENSITIVE_OWNER_FIELDS);
}
```

**After:**
```typescript
private sanitizeRoomOwnerData(room: Room): void {
  // Only sanitize if room, hotel and owner are loaded
  if (room && room.hotel && room.hotel.owner) {
    this.sanitizeUserObject(room.hotel.owner, this.SENSITIVE_OWNER_FIELDS);
  }
}

private sanitizeRoomsOwnerData(rooms: Room[]): void {
  // Filter out any undefined/null rooms before sanitizing
  rooms.filter(room => room).forEach((room) => this.sanitizeRoomOwnerData(room));
}
```

### Additional Cleanup
Also removed debug console.log statements from `findByHotel()` method for cleaner code.

## 🧪 Testing
1. Restart the NestJS server
2. Login to dashboard as Admin or HotelOwner
3. Expand a hotel to view its rooms
4. Click on a room to view availability
5. Click the settings (gear) icon to manage availability
6. All operations should now work without errors

## 📝 Impact
- ✅ Dashboard can now successfully fetch and display rooms for hotels
- ✅ Room availability can be viewed without errors
- ✅ Add Room, Edit Room, and Manage Availability features will work correctly
- ✅ No breaking changes to existing functionality
- ✅ Code is now more defensive with comprehensive null checks
- ✅ Handles edge cases where relations aren't loaded or rooms are undefined

## 🔮 Prevention
This type of issue can be prevented by:
1. Always checking for optional relations before accessing nested properties
2. Using TypeScript's optional chaining (`room.hotel?.owner`)
3. Explicitly loading required relations in queries if they're needed
4. Writing unit tests that cover different query scenarios

## ✅ Status
**Fixed and Ready** - Server needs to be restarted to apply changes.
