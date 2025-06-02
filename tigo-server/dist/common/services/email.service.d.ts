import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendActivationEmail(email: string, token: string, name: string): Promise<void>;
}
