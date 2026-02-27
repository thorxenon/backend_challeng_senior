import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Role } from './entities/role.entity';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ){}

  async login(loginDto: LoginDto) {
    try{
      const user = await this.userRepository.findOne({ where:{ email: loginDto.email }, select:{ id: true, email: true, password: true, role_id: true } })
      if(!user) throw new HttpException('E-mail/Senha inválidos', 404);
      const isPasswordValid = await user.verifyPassword(loginDto.password);
      if(!isPasswordValid) throw new HttpException('E-mail/Senha inválidos', 404);
      const payload = { email: user.email, id: user.id, role: user.role_id };
      return {
        access_token: this.jwtService.sign(payload),
      }
    }catch(error){
      throw error;
    }
  }

  
  async signup(signupDto: SignUpDto) {
    try{
      const existingUser = await this.userService.findUserByEmail(signupDto.email);
      if(existingUser) throw new HttpException('E-mail já cadastrado', 409);
      const user = this.userRepository.create({
        ...signupDto,
      });

      const newUser = await this.userRepository.save(user);
      return await this.userService.findOne(newUser.id);
    }catch(error){
      throw error;
    }
  }
}
