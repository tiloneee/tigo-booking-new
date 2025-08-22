# Redis Setup and Monitoring Guide

## Redis Installation and Setup

### Option 1: Docker (Recommended)

#### Basic Redis Container
```bash
# Start Redis server
docker run -d \
  --name tigo-redis \
  -p 6379:6379 \
  redis:7-alpine

# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs tigo-redis

# Connect to Redis CLI
docker exec -it tigo-redis redis-cli
```

#### Redis with Persistence (Production-ready)
```bash
# Create data directory
mkdir -p ./redis-data

# Start Redis with persistence
docker run -d \
  --name tigo-redis \
  -p 6379:6379 \
  -v $(pwd)/redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

#### Docker Compose Setup
Create `docker-compose.redis.yml`:
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: tigo-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis-data:
```

Start with Docker Compose:
```bash
docker-compose -f docker-compose.redis.yml up -d
```

### Option 2: Local Installation

#### Windows (using Chocolatey)
```bash
# Install Redis
choco install redis-64

# Start Redis service
redis-server

# Or start as Windows service
net start redis
```

#### macOS (using Homebrew)
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Or run in foreground
redis-server
```

#### Linux (Ubuntu/Debian)
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

## Redis Configuration

### Environment Variables
Add to your `.env` file:
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Optional: Redis Cluster Configuration
REDIS_CLUSTER_NODES=localhost:7000,localhost:7001,localhost:7002
```

### Production Configuration
For production, create `redis.conf`:
```conf
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Security
requirepass your-strong-password

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

## Monitoring Redis

### 1. Redis CLI Commands

#### Check Redis Status
```bash
# Connect to Redis
redis-cli

# Basic info
INFO

# Check if Redis is responding
PING
# Expected response: PONG

# Check memory usage
INFO memory

# Check connected clients
INFO clients

# Check keyspace
INFO keyspace

# Monitor commands in real-time
MONITOR
```

#### Key Management
```bash
# List all keys
KEYS *

# List chat-related keys
KEYS chat:*
KEYS user:*:online
KEYS room:*:users

# Check key type
TYPE user:123:online

# Check key TTL
TTL user:123:online

# Get key value
GET user:123:online

# Check set members
SMEMBERS room:abc123:users
```

### 2. Application-Level Monitoring

#### Health Check Endpoint
```bash
# Test chat health endpoint
curl http://localhost:3000/chat/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Custom Redis Health Check
Add to your `ChatController`:

```typescript
@Get('redis/health')
@ApiOperation({ summary: 'Check Redis connection health' })
async checkRedisHealth(): Promise<{ redis: string; timestamp: string; details: any }> {
  try {
    // Test basic Redis operations
    const testKey = `health:check:${Date.now()}`;
    await this.redisService.set(testKey, 'test', 5);
    const value = await this.redisService.get(testKey);
    await this.redisService.del(testKey);

    // Test pub/sub
    const testChannel = 'health:test';
    let pubsubWorking = false;
    
    await this.redisService.subscribe(testChannel, () => {
      pubsubWorking = true;
    });
    
    await this.redisService.publishMessage(testChannel, { test: true });
    await this.redisService.unsubscribe(testChannel);

    return {
      redis: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        basic_operations: value === 'test' ? 'ok' : 'failed',
        pubsub: pubsubWorking ? 'ok' : 'failed',
      }
    };
  } catch (error) {
    return {
      redis: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        error: error.message,
      }
    };
  }
}
```

### 3. Monitoring Scripts

#### Redis Status Script
Create `scripts/check-redis.js`:
```javascript
const redis = require('redis');

async function checkRedis() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
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

    await client.quit();
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    process.exit(1);
  }
}

checkRedis();
```

Run the script:
```bash
node scripts/check-redis.js
```

#### Chat System Monitoring Script
Create `scripts/monitor-chat.js`:
```javascript
const redis = require('redis');

async function monitorChat() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('🔍 Chat System Monitor Started');
    console.log('================================');

    // Monitor online users
    const onlineUserKeys = await client.keys('user:*:online');
    console.log(`👤 Online users: ${onlineUserKeys.length}`);

    // Monitor active rooms
    const roomKeys = await client.keys('room:*:users');
    console.log(`🏠 Active rooms: ${roomKeys.length}`);

    // Show room details
    for (const roomKey of roomKeys.slice(0, 5)) { // Show first 5 rooms
      const users = await client.sMembers(roomKey);
      const roomId = roomKey.split(':')[1];
      console.log(`  Room ${roomId}: ${users.length} users`);
    }

    // Monitor chat events (subscribe to pub/sub)
    const subscriber = client.duplicate();
    await subscriber.connect();
    
    console.log('\n📡 Listening for chat events...');
    await subscriber.subscribe('chat:events', (message) => {
      const event = JSON.parse(message);
      console.log(`🔔 Event: ${event.event} in room ${event.roomId}`);
    });

    // Keep monitoring
    process.on('SIGINT', async () => {
      console.log('\n👋 Stopping monitor...');
      await subscriber.quit();
      await client.quit();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Monitor error:', error.message);
    process.exit(1);
  }
}

monitorChat();
```

### 4. Production Monitoring Tools

#### Redis Insight (GUI Tool)
```bash
# Install Redis Insight (Docker)
docker run -d \
  --name redis-insight \
  -p 8001:8001 \
  redislabs/redisinsight:latest

# Access at: http://localhost:8001
```

#### Redis Commander (Web UI)
```bash
# Install globally
npm install -g redis-commander

# Start web interface
redis-commander --redis-host localhost --redis-port 6379

# Access at: http://localhost:8081
```

### 5. System Integration Monitoring

#### Add Redis Metrics to Your App
Create `src/modules/chat/services/redis-metrics.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisMetricsService {
  constructor(private readonly redisService: RedisService) {}

  async getMetrics(): Promise<any> {
    try {
      // Get Redis info
      const client = (this.redisService as any).client;
      const info = await client.info();
      
      // Parse info into useful metrics
      const metrics = this.parseRedisInfo(info);
      
      // Add chat-specific metrics
      const chatMetrics = await this.getChatMetrics();
      
      return {
        redis: metrics,
        chat: chatMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async getChatMetrics(): Promise<any> {
    try {
      const onlineUsers = await this.redisService.client.keys('user:*:online');
      const activeRooms = await this.redisService.client.keys('room:*:users');
      
      return {
        online_users: onlineUsers.length,
        active_rooms: activeRooms.length,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const metrics = {};
    
    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        metrics[key] = value;
      }
    }
    
    return {
      memory: {
        used: metrics.used_memory_human,
        peak: metrics.used_memory_peak_human,
      },
      clients: {
        connected: parseInt(metrics.connected_clients),
        blocked: parseInt(metrics.blocked_clients),
      },
      stats: {
        total_connections: parseInt(metrics.total_connections_received),
        total_commands: parseInt(metrics.total_commands_processed),
      },
    };
  }
}
```

#### Monitoring Endpoint
Add to `ChatController`:
```typescript
@Get('metrics')
@ApiOperation({ summary: 'Get Redis and chat metrics' })
async getMetrics(): Promise<any> {
  return this.redisMetricsService.getMetrics();
}
```

### 6. Troubleshooting Commands

#### Check if Redis is Running
```bash
# Test connection
redis-cli ping

# If using Docker
docker exec tigo-redis redis-cli ping

# Check process (Linux/Mac)
ps aux | grep redis

# Check process (Windows)
tasklist | findstr redis
```

#### Common Redis Issues

1. **Connection Refused**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Start Redis
   redis-server
   # or
   docker start tigo-redis
   ```

2. **Authentication Failed**
   ```bash
   # Connect with password
   redis-cli -a your-password
   
   # Or set password in environment
   export REDIS_PASSWORD=your-password
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   redis-cli info memory
   
   # Clear all data (BE CAREFUL!)
   redis-cli flushall
   
   # Clear specific pattern
   redis-cli --scan --pattern "chat:*" | xargs redis-cli del
   ```

### 7. Performance Monitoring

#### Redis Slow Log
```bash
# Check slow queries
redis-cli slowlog get 10

# Set slow log threshold (microseconds)
redis-cli config set slowlog-log-slower-than 10000
```

#### Monitor Commands
```bash
# Monitor all commands in real-time
redis-cli monitor

# Monitor specific patterns
redis-cli monitor | grep "chat:"
```

#### Connection Monitoring
```bash
# List connected clients
redis-cli client list

# Kill specific client
redis-cli client kill id 123

# Set client timeout
redis-cli config set timeout 300
```

### 8. Chat-Specific Monitoring

#### Monitor Chat Activity
```bash
# Check online users
redis-cli keys "user:*:online" | wc -l

# Check active rooms
redis-cli keys "room:*:users"

# Monitor chat events
redis-cli subscribe chat:events
```

#### Chat Debugging Commands
```bash
# Check specific user's online status
redis-cli exists user:USER_ID:online

# Check users in a room
redis-cli smembers room:ROOM_ID:users

# Manually publish test message
redis-cli publish chat:events '{"event":"test","roomId":"123","data":{"message":"test"}}'
```

### 9. Automated Monitoring Script

Create `scripts/redis-monitor.sh`:
```bash
#!/bin/bash

echo "🔍 Redis Health Check"
echo "===================="

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not responding"
    exit 1
fi

# Get basic info
echo ""
echo "📊 Redis Info:"
redis-cli info server | grep "redis_version\|uptime_in_seconds\|role"

echo ""
echo "💾 Memory Usage:"
redis-cli info memory | grep "used_memory_human\|used_memory_peak_human"

echo ""
echo "👥 Client Connections:"
redis-cli info clients | grep "connected_clients\|blocked_clients"

echo ""
echo "🏠 Chat System Status:"
ONLINE_USERS=$(redis-cli keys "user:*:online" | wc -l)
ACTIVE_ROOMS=$(redis-cli keys "room:*:users" | wc -l)
echo "Online users: $ONLINE_USERS"
echo "Active rooms: $ACTIVE_ROOMS"

echo ""
echo "🔥 Recent Activity:"
redis-cli info stats | grep "total_commands_processed\|instantaneous_ops_per_sec"
```

Make it executable and run:
```bash
chmod +x scripts/redis-monitor.sh
./scripts/redis-monitor.sh
```

### 10. Integration with Your NestJS App

#### Enhanced Redis Health Check
Add this to your `ChatController`:

```typescript
@Get('redis/status')
@ApiOperation({ summary: 'Detailed Redis status check' })
async getRedisStatus(): Promise<any> {
  try {
    // Test basic operations
    const testKey = `health:${Date.now()}`;
    const testValue = 'health-check';
    
    await this.redisService.set(testKey, testValue, 10);
    const retrievedValue = await this.redisService.get(testKey);
    await this.redisService.del(testKey);
    
    // Get online users count
    const onlineUsersKeys = await this.getOnlineUsersKeys();
    const activeRoomsKeys = await this.getActiveRoomsKeys();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tests: {
        basic_operations: retrievedValue === testValue ? 'passed' : 'failed',
        key_expiration: 'tested',
      },
      metrics: {
        online_users: onlineUsersKeys.length,
        active_rooms: activeRoomsKeys.length,
      },
      connection: 'established'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      connection: 'failed'
    };
  }
}

private async getOnlineUsersKeys(): Promise<string[]> {
  // This would need to be implemented in RedisService
  // For now, return empty array
  return [];
}

private async getActiveRoomsKeys(): Promise<string[]> {
  // This would need to be implemented in RedisService
  // For now, return empty array
  return [];
}
```

### 11. Monitoring Dashboard Setup

#### Grafana + Prometheus
1. **Install Redis Exporter**:
   ```bash
   docker run -d \
     --name redis-exporter \
     -p 9121:9121 \
     oliver006/redis_exporter \
     --redis.addr=redis://localhost:6379
   ```

2. **Prometheus Configuration** (`prometheus.yml`):
   ```yaml
   scrape_configs:
     - job_name: 'redis'
       static_configs:
         - targets: ['localhost:9121']
   ```

3. **Grafana Dashboard**: Import Redis dashboard (ID: 763)

### 12. Production Deployment Checklist

#### Redis Security
- [ ] Set strong password (`requirepass`)
- [ ] Bind to specific interface (`bind 127.0.0.1`)
- [ ] Enable protected mode
- [ ] Configure firewall rules
- [ ] Use TLS encryption for external connections

#### Performance
- [ ] Set appropriate `maxmemory` limit
- [ ] Configure eviction policy (`maxmemory-policy`)
- [ ] Enable persistence (`appendonly yes`)
- [ ] Monitor slow queries
- [ ] Set up monitoring and alerting

#### High Availability
- [ ] Set up Redis Sentinel for failover
- [ ] Configure Redis Cluster for scaling
- [ ] Set up backup strategy
- [ ] Monitor replication lag

### 13. Quick Start Commands

```bash
# Start Redis with Docker
docker run -d --name tigo-redis -p 6379:6379 redis:7-alpine

# Test Redis connection
redis-cli ping

# Start your NestJS app
npm run start:dev

# Test chat health
curl http://localhost:3000/chat/health

# Monitor Redis in real-time
redis-cli monitor

# Check chat-related keys
redis-cli keys "*chat*"
redis-cli keys "user:*:online"
```

This comprehensive guide should help you set up, run, and monitor Redis for your chat system effectively!
