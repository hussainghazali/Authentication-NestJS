import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/db-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './auth/emailAuthentication/email.module';
import { GoogleModule } from './auth/googleAuthentication/google.module';
import { FacebookModule } from './auth/facebookAuthentication/facebook.module';
import { AppleModule } from './auth/appleAuthentication/apple.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';


// code hidden for display purpose
@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    AppleModule, 
    EmailModule, 
    FacebookModule, 
    GoogleModule, 
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass:RolesGuard,
    }],
})
export class AppModule {}
