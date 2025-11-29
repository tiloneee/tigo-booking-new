import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRoles?: string[];
}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();
      
      // Check if user is already authenticated (from connection)
      if (client.userId) {
        return true;
      }

      // Extract token
      const token = this.extractToken(client);
      if (!token) {
        throw new WsException('No token provided');
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRoles = payload.roles || [];

      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try to get token from query params as fallback
    const tokenFromQuery = client.handshake.query.token as string;
    return tokenFromQuery || null;
  }
}
