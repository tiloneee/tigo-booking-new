import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    logout(req: any): Promise<{
        message: string;
    }>;
}
