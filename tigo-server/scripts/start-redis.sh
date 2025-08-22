#!/bin/bash

echo "🚀 Starting Redis for Tigo Chat System"
echo "======================================"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Docker found, starting Redis container..."
    
    # Stop existing container if running
    docker stop tigo-redis 2>/dev/null || true
    docker rm tigo-redis 2>/dev/null || true
    
    # Start new Redis container
    docker run -d \
        --name tigo-redis \
        -p 6379:6379 \
        --restart unless-stopped \
        redis:7-alpine \
        redis-server --appendonly yes
    
    if [ $? -eq 0 ]; then
        echo "✅ Redis container started successfully"
        echo "📍 Redis is available at: localhost:6379"
        
        # Wait for Redis to be ready
        echo "⏳ Waiting for Redis to be ready..."
        sleep 3
        
        # Test connection
        if docker exec tigo-redis redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis is responding to ping"
        else
            echo "⚠️  Redis container started but not responding yet"
        fi
        
        echo ""
        echo "🔍 To monitor Redis:"
        echo "   docker logs -f tigo-redis"
        echo "   docker exec -it tigo-redis redis-cli"
        echo "   node scripts/check-redis.js"
        
    else
        echo "❌ Failed to start Redis container"
        exit 1
    fi
    
elif command -v redis-server &> /dev/null; then
    echo "📦 Local Redis found, starting server..."
    redis-server --daemonize yes --appendonly yes
    
    if [ $? -eq 0 ]; then
        echo "✅ Redis server started successfully"
        echo "📍 Redis is available at: localhost:6379"
    else
        echo "❌ Failed to start Redis server"
        exit 1
    fi
    
else
    echo "❌ Neither Docker nor Redis server found"
    echo ""
    echo "💡 Install options:"
    echo "   Docker: https://docs.docker.com/get-docker/"
    echo "   Redis:  https://redis.io/download"
    echo ""
    echo "🐳 Quick Docker install:"
    echo "   Windows: winget install Docker.DockerDesktop"
    echo "   macOS:   brew install --cask docker"
    echo "   Linux:   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Start your NestJS app: npm run start:dev"
echo "   2. Test chat health: curl http://localhost:3000/chat/health"
echo "   3. Monitor Redis: node scripts/check-redis.js"
