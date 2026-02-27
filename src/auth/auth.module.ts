import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHasPermission } from './entities/roleHasPermission.entity';
import { Permission } from './entities/permissions.entity';
import { Role } from './entities/role.entity';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [ AuthService, JwtStrategy ],
  imports:[
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    TypeOrmModule.forFeature([ Role, Permission, RoleHasPermission ]),
  ],
  exports:[
    AuthService,
    TypeOrmModule,
    PassportModule
  ]
})
export class AuthModule {}
