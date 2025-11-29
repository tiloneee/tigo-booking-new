const redis = require('redis');

async function quickCheck() {
  console.log('🔍 Quick Redis Check for Tigo Chat');
  console.log('==================================');

  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    // Test connection
    await client.connect();
    const pong = await client.ping();
    console.log(`✅ Redis PING: ${pong}`);

    // Test basic operations
    const testKey = `test:${Date.now()}`;
    await client.set(testKey, 'working', { EX: 5 });
    const value = await client.get(testKey);
    console.log(`✅ Read/Write test: ${value === 'working' ? 'PASSED' : 'FAILED'}`);

    // Check server info
    const serverInfo = await client.info('server');
    const version = serverInfo.split('\r\n').find(line => line.startsWith('redis_version:'));
    console.log(`📦 ${version}`);

    // Check if chat system is using Redis
    const chatKeys = await client.keys('*chat*');
    const userKeys = await client.keys('user:*:online');
    const roomKeys = await client.keys('room:*:users');
    
    console.log('\n💬 Chat System Status:');
    console.log(`   Chat keys: ${chatKeys.length}`);
    console.log(`   Online users: ${userKeys.length}`);
    console.log(`   Active rooms: ${roomKeys.length}`);

    if (userKeys.length > 0 || roomKeys.length > 0) {
      console.log('✅ Chat system is actively using Redis');
    } else {
      console.log('ℹ️  No active chat sessions (this is normal for a new system)');
    }

    await client.quit();
    
    console.log('\n🎯 Status: Redis is ready for chat system!');
    console.log('\n📚 For detailed monitoring, run:');
    console.log('   node scripts/monitor-chat.js');
    
  } catch (error) {
    console.error('\n❌ Redis is not available:', error.message);
    console.log('\n🚀 To start Redis:');
    console.log('   Option 1 (Docker): docker run -d --name tigo-redis -p 6379:6379 redis:7-alpine');
    console.log('   Option 2 (Script):  ./scripts/start-redis.sh');
    console.log('   Option 3 (Local):   redis-server');
    process.exit(1);
  }
}

quickCheck();
