import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { EmailService } from '../../../common/services/email.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    private configService;
    private emailService;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            phone_number: string;
            roles: string[];
            is_active: true;
        };
    }>;
    validateUser(email: string, password: string): Promise<import("../entities/user.entity").User>;
    activateAccount(token: string): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
