import { Role } from './role.entity';
export declare class User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
    phone_number: string;
    refresh_token: string;
    is_active: boolean;
    activation_token: string | undefined;
    roles: Role[];
    created_at: Date;
    updated_at: Date;
}
