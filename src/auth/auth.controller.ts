import {
  Controller,
  Post,
  Body,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
@UseGuards(AuthGuard())
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ){}

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }
}
