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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const role_entity_1 = require("../entities/role.entity");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
let UserService = class UserService {
    userRepository;
    roleRepository;
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email }
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
        const activationToken = (0, uuid_1.v4)();
        const roleName = createUserDto.role || 'Customer';
        const role = await this.roleRepository.findOne({
            where: { name: roleName }
        });
        if (!role) {
            throw new Error(`Role '${roleName}' not found`);
        }
        const { role: _, ...userDataWithoutRole } = createUserDto;
        const user = this.userRepository.create({
            ...userDataWithoutRole,
            password_hash: hashedPassword,
            activation_token: activationToken,
            is_active: true,
            roles: [role]
        });
        return this.userRepository.save(user);
    }
    async findAll() {
        return this.userRepository.find({
            relations: ['roles', 'roles.permissions'],
        });
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['roles', 'roles.permissions'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({
            where: { email },
            relations: ['roles', 'roles.permissions'],
        });
    }
    async update(id, updateUserDto) {
        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('User not found');
        }
    }
    async activateAccount(token) {
        const user = await this.userRepository.findOne({
            where: { activation_token: token }
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid activation token');
        }
        user.is_active = true;
        user.activation_token = undefined;
        return this.userRepository.save(user);
    }
    async updateRefreshToken(userId, refreshToken) {
        if (refreshToken) {
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
            await this.userRepository.update(userId, {
                refresh_token: hashedRefreshToken,
            });
        }
        else {
            await this.userRepository.update(userId, {
                refresh_token: undefined,
            });
        }
    }
    async assignRole(userId, roleName) {
        const user = await this.findOne(userId);
        const role = await this.roleRepository.findOne({ where: { name: roleName } });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${roleName} not found`);
        }
        const hasRole = user.roles.some(r => r.id === role.id);
        if (!hasRole) {
            user.roles.push(role);
            user.refresh_token = "";
            await this.userRepository.save(user);
        }
        return user;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map