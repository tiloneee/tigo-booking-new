const redis = require('redis');

async function checkRedis() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    console.log("REDIS_URL", process.env.REDIS_URL);
    console.log("client", client);
    await client.connect();
    console.log('✅ Redis connection: OK');

    // Test basic operations
    await client.set('test:key', 'test:value', { EX: 5 });
    const value = await client.get('test:key');
    console.log('✅ Redis read/write: OK');

    // Check memory usage
    const info = await client.info('memory');
    const memoryLines = info.split('\r\n');
    const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'));
    console.log(`📊 ${usedMemory}`);

    // Check connected clients
    const clientInfo = await client.info('clients');
    const clientLines = clientInfo.split('\r\n');
    const connectedClients = clientLines.find(line => line.startsWith('connected_clients:'));
    console.log(`👥 ${connectedClients}`);

    // Check chat-specific keys
    const onlineUsers = await client.keys('user:*:online');
    const activeRooms = await client.keys('room:*:users');
    console.log(`💬 Chat Status:`);
    console.log(`   Online users: ${onlineUsers.length}`);
    console.log(`   Active rooms: ${activeRooms.length}`);

    await client.quit();
    console.log('\n🎉 Redis health check completed successfully!');
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    console.log('\n💡 Make sure Redis is running:');
    console.log('   Docker: docker run -d --name tigo-redis -p 6379:6379 redis:7-alpine');
    console.log('   Local:  redis-server');
    process.exit(1);
  }
}

checkRedis();
