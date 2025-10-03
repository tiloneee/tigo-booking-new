"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_service_1 = require("./user.service");
const email_service_1 = require("../../../common/services/email.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    userService;
    jwtService;
    configService;
    emailService;
    constructor(userService, jwtService, configService, emailService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(registerDto) {
        const user = await this.userService.create(registerDto);
        await this.emailService.sendActivationEmail(user.email, user.activation_token, `${user.first_name} ${user.last_name}`);
        return {
            message: 'Registration successful. Please check your email to activate your account.',
            userId: user.id,
        };
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.is_active) {
            throw new common_1.UnauthorizedException('Please activate your account first');
        }
        const payload = {
            email: user.email,
            sub: user.id,
            roles: user.roles?.map((role) => role.name) || [],
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        await this.userService.updateRefreshToken(user.id, refreshToken);
        common_1.Logger.log({
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                roles: user.roles?.map((role) => role.name) || [],
                accessToken: accessToken,
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
                roles: user.roles?.map((role) => role.name) || [],
            },
        };
    }
    async validateUser(email, password) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    async activateAccount(token) {
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
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            console.log('refreshToken: ', refreshToken);
            console.log('payload: ', payload);
            const user = await this.userService.findOne(payload.sub);
            console.log('user: ', user);
            console.log('user.refresh_token: ', user.refresh_token);
            if (!user.refresh_token) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refresh_token);
            console.log('isRefreshTokenValid: ', isRefreshTokenValid);
            if (!isRefreshTokenValid) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const newPayload = {
                email: user.email,
                sub: user.id,
                roles: user.roles?.map((role) => role.name) || [],
            };
            const newAccessToken = this.jwtService.sign(newPayload);
            console.log('newAccessToken: ', newAccessToken);
            return {
                access_token: newAccessToken,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId) {
        await this.userService.updateRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map