import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const activationToken = uuidv4();

    // Use specified role or default to Customer
    const roleName = createUserDto.role || 'Customer';
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Remove role from createUserDto before spreading to avoid conflicts
    const { role: _, ...userDataWithoutRole } = createUserDto;

    const user = this.userRepository.create({
      ...userDataWithoutRole,
      password_hash: hashedPassword,
      activation_token: activationToken,
      is_active: false,
      roles: [role],
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async activateAccount(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { activation_token: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid activation token');
    }

    user.is_active = true;
    user.activation_token = undefined;

    return this.userRepository.save(user);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    if (refreshToken) {
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
      await this.userRepository.update(userId, {
        refresh_token: hashedRefreshToken,
      });
    } else {
      // If null, remove the refresh token (logout)
      await this.userRepository.update(userId, {
        refresh_token: undefined,
      });
    }
  }

  async assignRole(userId: string, roleName: string): Promise<User> {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // Check if the user already has this role
    const hasRole = user.roles.some((r) => r.id === role.id);
    if (!hasRole) {
      user.roles.push(role);
      user.refresh_token = '';
      await this.userRepository.save(user);
    }

    return user;
  }

  async findAllAdmins(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.name = :roleName', { roleName: 'Admin' })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .getMany();
  }
}
