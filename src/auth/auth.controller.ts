import {
  Controller,
  Post,
  Body,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SignUpDto } from './dto/signup.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequiredPermission } from 'src/decorators/permission.decorator';

@Controller('auth')
@UseGuards(AuthGuard(), PermissionGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ){}

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  @RequiredPermission('user_create')
  signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }
}
