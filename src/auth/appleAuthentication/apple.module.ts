import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppleService } from './apple.service';
import { AppleController } from './apple.controller';

@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [AppleService],
  controllers: [AppleController],
  exports: [AppleService]
})
export class AppleModule {}