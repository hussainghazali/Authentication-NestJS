import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { User } from './user.interface';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/user.dto';
import { Roles } from 'src/guards/roles/roles.decorator';
import { Role } from 'src/guards/entities/role.enum';


@Controller('users')
@ApiTags('User CRUD APIs')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, description: 'Fetched all users' })
  @Get()
  @Roles(Role.ADMIN)
  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiResponse({ status: 200, description: 'Fetched specific user' })
  @Get('email/:email')
  @Roles(Role.ADMIN)
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findOneByEmail(email);
  }

  @ApiResponse({ status: 200, description: 'Deleted all users' })
  @Delete()
  @Roles(Role.ADMIN)
  async deleteAllUsers() {
    return this.usersService.deleteAll();
  }

  @ApiResponse({ status: 200, description: 'Deleted specific user' })
  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteUserById(@Param('id') id: number) {
    return this.usersService.deleteUserById(id);
  }

  @ApiResponse({ status: 200, description: 'Fetched all users' })
  @ApiResponse({ status: 400, description: 'User not found' })
  @Put(':id')
  @Roles(Role.ADMIN)
  async updateUser(@Param('id') id: number, @Body() user: UpdateUserDto) {
    return this.usersService.update(id, user);
  }

}
