import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // TypeORM entities will be added here as we create them
    TypeOrmModule.forFeature([]),
  ],
  controllers: [
    // Controllers will be added here as we create them
  ],
  providers: [
    // Services will be added here as we create them
  ],
  exports: [
    // Exported services will be added here as needed
  ],
})
export class HotelModule {} 