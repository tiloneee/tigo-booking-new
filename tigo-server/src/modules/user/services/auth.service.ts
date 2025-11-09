import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { EmailService } from '../../../common/services/email.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { TransactionService } from '../../transaction/services/transaction.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    @Inject(forwardRef(() => TransactionService))
    private transactionService: TransactionService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);

    // Send activation email
    await this.emailService.sendActivationEmail(
      user.email,
      user.activation_token as string,
      `${user.first_name} ${user.last_name}`,
    );

    return {
      message:
        'Registration successful. Please check your email to activate your account.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Please activate your account first');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles?.map((role) => role.name) || [],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.userService.updateRefreshToken(user.id, refreshToken);
    
    // Cache user balance on login for immediate availability
    try {
      await this.transactionService.getCachedBalance(user.id);
      this.logger.log(`Cached balance for user ${user.id} on login`);
    } catch (error) {
      this.logger.error(`Failed to cache balance for user ${user.id}:`, error);
      // Don't fail login if balance caching fails
    }

    Logger.log({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        roles: user.roles?.map((role) => role.name) || [],
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        roles: user.roles?.map((role) => role.name) || [],
        is_active: user.is_active,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async activateAccount(token: string) {
    const user = await this.userService.activateAccount(token);
    return {
      message: 'Account activated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.userService.findOne(payload.sub);
      if (!user.refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token matches stored one
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refresh_token,
      );
      Logger.log(`isRefreshTokenValid: ${isRefreshTokenValid}`);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        email: user.email,
        sub: user.id,
        roles: user.roles?.map((role) => role.name) || [],
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      Logger.log(`User ${user.id} refreshed token!`);
      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async refreshTokenFromCookie(userId: string, refreshToken: string) {
    try {
      const user = await this.userService.findOne(userId);
      
      if (!user.refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token matches stored one
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refresh_token,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = {
        email: user.email,
        sub: user.id,
        roles: user.roles?.map((role) => role.name) || [],
      };

      const newAccessToken = this.jwtService.sign(payload);

      // Cache user balance on token refresh to ensure it's available
      try {
        await this.transactionService.getCachedBalance(user.id);
        this.logger.log(`Cached balance for user ${user.id} on token refresh`);
      } catch (error) {
        this.logger.error(`Failed to cache balance for user ${user.id}:`, error);
        // Don't fail token refresh if balance caching fails
      }

      Logger.log(`User ${user.id} refreshed token from cookie!`);
      
      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }
}
