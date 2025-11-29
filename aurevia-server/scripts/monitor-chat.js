const redis = require('redis');

async function monitorChat() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('🔍 Chat System Monitor Started');
    console.log('================================');

    // Function to display current status
    async function showStatus() {
      console.clear();
      console.log('🔍 Tigo Chat System - Live Monitor');
      console.log('==================================');
      console.log(`⏰ ${new Date().toLocaleString()}\n`);

      // Monitor online users
      const onlineUserKeys = await client.keys('user:*:online');
      console.log(`👤 Online users: ${onlineUserKeys.length}`);

      // Monitor active rooms
      const roomKeys = await client.keys('room:*:users');
      console.log(`🏠 Active rooms: ${roomKeys.length}`);

      // Show room details
      if (roomKeys.length > 0) {
        console.log('\n📋 Room Details:');
        for (const roomKey of roomKeys.slice(0, 10)) { // Show first 10 rooms
          const users = await client.sMembers(roomKey);
          const roomId = roomKey.split(':')[1].substring(0, 8) + '...';
          console.log(`  🏠 ${roomId}: ${users.length} users`);
        }
      }

      // Redis stats
      const info = await client.info('stats');
      const statsLines = info.split('\r\n');
      const commandsProcessed = statsLines.find(line => line.startsWith('total_commands_processed:'));
      const opsPerSec = statsLines.find(line => line.startsWith('instantaneous_ops_per_sec:'));
      
      console.log('\n📊 Redis Performance:');
      if (commandsProcessed) console.log(`  ${commandsProcessed}`);
      if (opsPerSec) console.log(`  ${opsPerSec}`);

      // Memory usage
      const memInfo = await client.info('memory');
      const memLines = memInfo.split('\r\n');
      const usedMemory = memLines.find(line => line.startsWith('used_memory_human:'));
      if (usedMemory) console.log(`  ${usedMemory}`);

      console.log('\n📡 Listening for real-time chat events...');
      console.log('Press Ctrl+C to stop monitoring\n');
    }

    // Show initial status
    await showStatus();

    // Monitor chat events (subscribe to pub/sub)
    const subscriber = client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('chat:events', (message) => {
      try {
        const event = JSON.parse(message);
        const timestamp = new Date().toLocaleTimeString();
        
        switch (event.event) {
          case 'new_message':
            console.log(`🔔 [${timestamp}] New message in room ${event.roomId.substring(0, 8)}...`);
            break;
          case 'messages_read':
            console.log(`👁️  [${timestamp}] Messages read in room ${event.roomId.substring(0, 8)}...`);
            break;
          case 'message_deleted':
            console.log(`🗑️  [${timestamp}] Message deleted in room ${event.roomId.substring(0, 8)}...`);
            break;
          default:
            console.log(`📢 [${timestamp}] Event: ${event.event}`);
        }
      } catch (error) {
        console.log(`⚠️  [${new Date().toLocaleTimeString()}] Invalid event format`);
      }
    });

    // Refresh status every 30 seconds
    setInterval(showStatus, 30000);

    // Keep monitoring
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Stopping monitor...');
      await subscriber.quit();
      await client.quit();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Monitor error:', error.message);
    console.log('\n💡 Make sure Redis is running:');
    console.log('   ./scripts/start-redis.sh');
    console.log('   or: docker run -d --name tigo-redis -p 6379:6379 redis:7-alpine');
    process.exit(1);
  }
}

monitorChat();
