import { Controller, Post, Body, Param, Get, Response, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dtos/login-user.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UsersService } from '../users/users.service';
import * as express from 'express';
import { Roles } from 'src/guards/roles/roles.decorator';
import { Role } from 'src/guards/entities/role.enum';


@Controller('auth')
@ApiTags('Authentication APIs')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiResponse({ status: 201, description: 'Successfully created user' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/email/register')
  @Roles(Role.ADMIN)
  async createUser(@Body() user: CreateUserDto) {
    try {
      const response = await this.authService.create(user);
      const newUser = response.userResponse;
      await this.authService.createEmailToken(newUser.email);
      const state = await this.authService.sendEmailVerification(newUser.email);
      return {
        ...response,
        ...state,
      };
    } catch (err) {
      console.log(err);
    }
  }

  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Wrong credentials' })
  @Post('/email/login')
  @Roles(Role.ADMIN)
  async login(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.validateUserByPassword(loginUserDto);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully send verification code',
  })
  @ApiResponse({ status: 403, description: 'User not found' })
  @Get('email/resend-verification/:email')
  @Roles(Role.ADMIN)
  async sendEmailVerification(@Param('email') email: string) {
    await this.authService.createEmailToken(email);
    return await this.authService.sendEmailVerification(email);
  }

  @ApiResponse({ status: 403, description: 'User not found' })
  @Get('email/forget-password/:email')
  @Roles(Role.ADMIN)
  async sendPasswordResetEmail(@Param('email') email: string) {
    await this.authService.createEmailToken(email);
    return await this.authService.sendPasswordResetEmail(email);
  }

  @ApiResponse({ status: 200, description: 'Successfully verified email' })
  @ApiResponse({ status: 403, description: 'Invalid token' })
  @Get('email/verify/:token')
  @Roles(Role.ADMIN)
  async verifyEmail(
    @Param('token') token: string,
    @Response() response: express.Response,
  ) {
    const verified = await this.authService.verifyEmail(token);
    if (verified) {
      response.redirect('http://localhost:3001');
    }
  }
}
