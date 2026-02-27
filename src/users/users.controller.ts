import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequiredPermission } from 'src/decorators/permission.decorator';

@Controller('users')
@UseGuards(AuthGuard(), PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequiredPermission('user_create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequiredPermission('user_read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequiredPermission('user_read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('user_update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequiredPermission('user_delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
