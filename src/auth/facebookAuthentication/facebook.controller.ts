import { Controller, Get, UseGuards, HttpStatus, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from 'src/guards/entities/role.enum';
import { Roles } from 'src/guards/roles/roles.decorator';

import { FacebookService } from './facebook.service';

@Controller()
@ApiTags('Facebook Auth APIs')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get()
  @Roles(Role.ADMIN)
  getHello(): string {
    return this.facebookService.getHello();
  }

  @ApiResponse({ status: 200, description: 'Authentication Successfull' })
  @ApiResponse({ status: 403, description: 'Authentication Failed' })
  @Get('/facebook')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @ApiResponse({ status: 200, description: 'Authentication Successfull' })
  @ApiResponse({ status: 403, description: 'Authentication Failed' })
  @Get('/facebook/redirect')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req: Request): Promise<any> {
    return {
      statusCode: HttpStatus.OK,
      payload: req.user,
    };
  }
}