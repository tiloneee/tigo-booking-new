const redis = require('redis');

const commands = {
  status: 'Show Redis status and chat metrics',
  clear: 'Clear all chat data (use with caution)',
  users: 'List all online users',
  rooms: 'List all active chat rooms',
  monitor: 'Monitor chat events in real-time',
  help: 'Show this help message'
};

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    console.log('🛠️  Redis Admin Tool for Tigo Chat');
    console.log('==================================');
    console.log('Usage: node scripts/redis-admin.js <command>\n');
    console.log('Available commands:');
    Object.entries(commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(10)} - ${desc}`);
    });
    return;
  }

  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();

    switch (command) {
      case 'status':
        await showStatus(client);
        break;
      case 'clear':
        await clearChatData(client);
        break;
      case 'users':
        await listOnlineUsers(client);
        break;
      case 'rooms':
        await listActiveRooms(client);
        break;
      case 'monitor':
        await monitorEvents(client);
        return; // Don't close connection for monitoring
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/redis-admin.js help" for available commands');
    }

    await client.quit();
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    process.exit(1);
  }
}

async function showStatus(client) {
  console.log('📊 Redis Status Report');
  console.log('=====================');

  // Basic info
  const info = await client.info();
  const lines = info.split('\r\n');
  
  const version = lines.find(line => line.startsWith('redis_version:'));
  const uptime = lines.find(line => line.startsWith('uptime_in_seconds:'));
  const memory = lines.find(line => line.startsWith('used_memory_human:'));
  const clients = lines.find(line => line.startsWith('connected_clients:'));
  
  console.log(`🔧 ${version}`);
  if (uptime) {
    const seconds = parseInt(uptime.split(':')[1]);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    console.log(`⏰ Uptime: ${hours}h ${minutes}m`);
  }
  console.log(`💾 ${memory}`);
  console.log(`👥 ${clients}`);

  // Chat-specific metrics
  const onlineUsers = await client.keys('user:*:online');
  const activeRooms = await client.keys('room:*:users');
  const chatKeys = await client.keys('*chat*');

  console.log('\n💬 Chat Metrics:');
  console.log(`   Online users: ${onlineUsers.length}`);
  console.log(`   Active rooms: ${activeRooms.length}`);
  console.log(`   Chat keys: ${chatKeys.length}`);
}

async function clearChatData(client) {
  console.log('🧹 Clearing Chat Data');
  console.log('=====================');
  
  console.log('⚠️  WARNING: This will delete all chat-related data!');
  console.log('This includes:');
  console.log('  - User online status');
  console.log('  - Room memberships');
  console.log('  - Chat events cache');
  console.log('\nNote: This does NOT delete messages from PostgreSQL database.');
  
  // In a real scenario, you'd want confirmation here
  // For this demo, we'll just show what would be deleted
  
  const patterns = ['user:*:online', 'room:*:users', '*chat*'];
  let totalKeys = 0;
  
  for (const pattern of patterns) {
    const keys = await client.keys(pattern);
    console.log(`📋 Found ${keys.length} keys matching "${pattern}"`);
    totalKeys += keys.length;
    
    if (keys.length > 0) {
      // Uncomment the next line to actually delete
      // await client.del(keys);
      console.log(`   Would delete: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
    }
  }
  
  console.log(`\n📊 Total keys that would be cleared: ${totalKeys}`);
  console.log('💡 To actually clear data, uncomment the deletion line in the script');
}

async function listOnlineUsers(client) {
  console.log('👤 Online Users');
  console.log('===============');

  const userKeys = await client.keys('user:*:online');
  
  if (userKeys.length === 0) {
    console.log('ℹ️  No users currently online');
    return;
  }

  console.log(`Found ${userKeys.length} online users:`);
  
  for (const key of userKeys) {
    const userId = key.split(':')[1];
    const ttl = await client.ttl(key);
    const expiresIn = ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : 'no expiry';
    console.log(`  👤 ${userId} (expires in: ${expiresIn})`);
  }
}

async function listActiveRooms(client) {
  console.log('🏠 Active Chat Rooms');
  console.log('===================');

  const roomKeys = await client.keys('room:*:users');
  
  if (roomKeys.length === 0) {
    console.log('ℹ️  No active chat rooms');
    return;
  }

  console.log(`Found ${roomKeys.length} active rooms:`);
  
  for (const key of roomKeys) {
    const roomId = key.split(':')[1];
    const users = await client.sMembers(key);
    console.log(`  🏠 Room ${roomId}:`);
    console.log(`     👥 ${users.length} users: ${users.join(', ')}`);
  }
}

async function monitorEvents(client) {
  console.log('📡 Real-time Chat Event Monitor');
  console.log('===============================');
  console.log('Listening for chat events... (Press Ctrl+C to stop)\n');

  const subscriber = client.duplicate();
  await subscriber.connect();
  
  await subscriber.subscribe('chat:events', (message) => {
    try {
      const event = JSON.parse(message);
      const timestamp = new Date().toLocaleTimeString();
      const roomId = event.roomId ? event.roomId.substring(0, 8) + '...' : 'unknown';
      
      switch (event.event) {
        case 'new_message':
          const sender = event.data?.sender?.first_name || 'Unknown';
          const content = event.data?.content?.substring(0, 50) || '';
          console.log(`💬 [${timestamp}] ${sender} sent message in room ${roomId}: "${content}${content.length >= 50 ? '...' : ''}"`);
          break;
        case 'messages_read':
          console.log(`👁️  [${timestamp}] Messages marked as read in room ${roomId}`);
          break;
        case 'message_deleted':
          console.log(`🗑️  [${timestamp}] Message deleted in room ${roomId}`);
          break;
        default:
          console.log(`📢 [${timestamp}] Event: ${event.event} in room ${roomId}`);
      }
    } catch (error) {
      console.log(`⚠️  [${new Date().toLocaleTimeString()}] Invalid event format: ${message}`);
    }
  });

  process.on('SIGINT', async () => {
    console.log('\n👋 Stopping event monitor...');
    await subscriber.quit();
    await client.quit();
    process.exit(0);
  });
}

main();
