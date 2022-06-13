import {
    Controller,
    Get,
    Post,
    Body,
    ForbiddenException,
  } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/guards/entities/role.enum';
import { Roles } from 'src/guards/roles/roles.decorator';
  import { AppleService } from './apple.service';
  
  @Controller()
  @ApiTags('Apple Auth API')
  export class AppleController {
    constructor(private readonly appleService: AppleService) {}

    @ApiResponse({ status: 200, description: 'Successfully Logged In' })
    @ApiResponse({ status: 401, description: 'Invalid Credentials' })
    @Post('/apple')
    @Roles(Role.ADMIN)
    public async appleLogin(@Body() payload: any): Promise<any> {
      console.log('Received', payload);
      if (!payload.code) {
        throw new ForbiddenException();
      }
  
      return this.appleService.verifyUser(payload);
    }
  }