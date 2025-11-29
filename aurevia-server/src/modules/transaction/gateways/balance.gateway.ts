import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../../common/services/redis.service';
import { BalanceUpdateEvent, BalanceEventType } from '../events/balance-update.event';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/balance',
})
export class BalanceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BalanceGateway.name);
  private readonly BALANCE_CHANNEL = 'balance:updates';
  private readonly USER_BALANCE_PREFIX = 'balance:user:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    // Subscribe to Redis balance update events
    await this.subscribeToBalanceEvents();
    this.logger.log('BalanceGateway initialized and subscribed to Redis balance events');
  }

  afterInit(server: Server) {
    this.logger.log('BalanceGateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from handshake
      const token = this.extractTokenFromHandshake(client);
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;

      // Join user-specific room
      const userRoom = `user:${client.userId}`;
      await client.join(userRoom);

      // Send current balance on connection
      if (client.userId) {
        const currentBalance = await this.getCurrentBalance(client.userId);
        client.emit('balance_initial', { balance: currentBalance });
      }

      this.logger.log(`Client ${client.id} (User: ${client.userId}) connected to balance updates`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`Client ${client.id} (User: ${client.userId}) disconnected from balance updates`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('subscribe_balance')
  handleSubscribeBalance(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const userRoom = `user:${client.userId}`;
    client.join(userRoom);
    
    this.logger.log(`Client ${client.id} subscribed to balance updates`);
    client.emit('balance_subscribed', { success: true });
  }

  @SubscribeMessage('get_current_balance')
  async handleGetCurrentBalance(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const balance = await this.getCurrentBalance(client.userId);
      client.emit('balance_current', { balance });
    } catch (error) {
      this.logger.error(`Error getting balance for user ${client.userId}:`, error);
      client.emit('error', { message: 'Failed to get balance' });
    }
  }

  /**
   * Subscribe to Redis balance update events
   */
  private async subscribeToBalanceEvents() {
    try {
      await this.redisService.subscribe(this.BALANCE_CHANNEL, (message: string) => {
        const event: BalanceUpdateEvent = JSON.parse(message);
        this.handleBalanceUpdateEvent(event);
      });
      this.logger.log('Successfully subscribed to Redis balance update events');
    } catch (error) {
      this.logger.error('Failed to subscribe to Redis balance events:', error);
    }
  }

  /**
   * Handle balance update event from Redis
   */
  private handleBalanceUpdateEvent(event: BalanceUpdateEvent) {
    try {
      const userRoom = `user:${event.userId}`;
      
      this.logger.debug(`Broadcasting balance update to user ${event.userId}: ${event.newBalance}`);

      // Emit to specific user's room
      this.server.to(userRoom).emit('balance_updated', {
        newBalance: event.newBalance,
        previousBalance: event.previousBalance,
        transactionId: event.transactionId,
        transactionType: event.transactionType,
        amount: event.amount,
        timestamp: event.timestamp,
      });

      // Also emit transaction-specific events
      if (event.event === BalanceEventType.TRANSACTION_COMPLETED) {
        this.server.to(userRoom).emit('transaction_completed', {
          transactionId: event.transactionId,
          transactionType: event.transactionType,
          amount: event.amount,
          newBalance: event.newBalance,
          timestamp: event.timestamp,
        });
      } else if (event.event === BalanceEventType.TRANSACTION_FAILED) {
        this.server.to(userRoom).emit('transaction_failed', {
          transactionId: event.transactionId,
          transactionType: event.transactionType,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      this.logger.error('Error handling balance update event:', error);
    }
  }

  /**
   * Get current balance from Redis cache or return null
   */
  private async getCurrentBalance(userId: string): Promise<number | null> {
    try {
      const cacheKey = `${this.USER_BALANCE_PREFIX}${userId}`;
      const balance = await this.redisService.get(cacheKey);
      return balance !== null ? parseFloat(balance) : null;
    } catch (error) {
      this.logger.error(`Error getting balance from Redis for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Check authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (token && typeof token === 'string') {
      return token;
    }

    return null;
  }

  /**
   * Public method to emit balance update (can be called from services)
   */
  async emitBalanceUpdate(userId: string, balance: number, transactionDetails?: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('balance_updated', {
      newBalance: balance,
      ...transactionDetails,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit insufficient balance warning
   */
  async emitInsufficientBalance(userId: string, requiredAmount: number, currentBalance: number) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('balance_insufficient', {
      requiredAmount,
      currentBalance,
      shortfall: requiredAmount - currentBalance,
      timestamp: new Date().toISOString(),
    });
  }
}
