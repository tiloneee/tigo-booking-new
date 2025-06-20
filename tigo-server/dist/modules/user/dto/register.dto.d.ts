import { CreateUserDto } from './create-user.dto';
declare const RegisterDto_base: import("@nestjs/mapped-types").MappedType<Omit<CreateUserDto, "role">>;
export declare class RegisterDto extends RegisterDto_base {
}
export {};
