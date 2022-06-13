import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GoogleService } from './google.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/guards/roles/roles.decorator';
import { Role } from 'src/guards/entities/role.enum';

@Controller('google')
@ApiTags('Goole Auth APIs')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @ApiResponse({ status: 200, description: 'Authentication Successfull' })
  @ApiResponse({ status: 403, description: 'Authentication Failed' })
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @ApiResponse({ status: 200, description: 'Authentication Successfull' })
  @ApiResponse({ status: 403, description: 'Authentication Failed' })
  @Get('redirect')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.googleService.googleLogin(req)
  }
}