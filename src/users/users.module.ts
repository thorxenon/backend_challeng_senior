import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/auth/entities/role.entity';
import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';

@Module({
  controllers: [UsersController],
  imports:[
    TypeOrmModule.forFeature([ User, Role, Doctor, Patient ]),
    forwardRef(() => AuthModule)
  ],
  providers: [UsersService],
  exports: [ UsersService, TypeOrmModule ]
})
export class UsersModule {}
