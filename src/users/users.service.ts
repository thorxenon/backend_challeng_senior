import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/auth/entities/role.entity';
import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ){}

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
      if (existingUser) throw new HttpException('E-mail já cadastrado', 409);

      const role = await this.roleRepository.findOne({ where: { id: createUserDto.role_id } });
      if (!role) throw new NotFoundException('Role não encontrada');

      const roleName = role.name.toLowerCase();
      if (roleName === 'doctor' && !createUserDto.doctor) {
        throw new BadRequestException('Perfil de médico é obrigatório para role doctor');
      }

      if (roleName === 'patient' && !createUserDto.patient) {
        throw new BadRequestException('Perfil de paciente é obrigatório para role patient');
      }

      if (createUserDto.doctor?.crm_number) {
        const crmInUse = await this.doctorRepository.findOne({ where: { crm_number: createUserDto.doctor.crm_number } });
        if (crmInUse) throw new HttpException('CRM já cadastrado', 409);
      }

      const createdUser = await this.userRepository.save(
        this.userRepository.create({
          name: createUserDto.name,
          email: createUserDto.email,
          password: createUserDto.password,
          role_id: createUserDto.role_id,
        }),
      );

      if (createUserDto.doctor) {
        await this.doctorRepository.save(
          this.doctorRepository.create({
            id: createdUser.id,
            specialty: createUserDto.doctor.specialty,
            crm_number: createUserDto.doctor.crm_number,
          }),
        );
      }

      if (createUserDto.patient) {
        await this.patientRepository.save(
          this.patientRepository.create({
            id: createdUser.id,
            phone: createUserDto.patient.phone,
            birth_date: createUserDto.patient.birth_date ? new Date(createUserDto.patient.birth_date) : undefined,
          }),
        );
      }

      const user = await this.findOne(createdUser.id);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.userRepository.find({
      relations: {
        role: true,
        doctor: true,
        patient: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: true,
        doctor: true,
        patient: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        doctor: true,
        patient: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailInUse = await this.userRepository.findOne({ where: { email: updateUserDto.email } });
      if (emailInUse) throw new HttpException('E-mail já cadastrado', 409);
    }

    if (updateUserDto.role_id) {
      const role = await this.roleRepository.findOne({ where: { id: updateUserDto.role_id } });
      if (!role) throw new NotFoundException('Role não encontrada');
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    if (updateUserDto.name !== undefined) user.name = updateUserDto.name;
    if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
    if (updateUserDto.role_id !== undefined) user.role_id = updateUserDto.role_id;

    await this.userRepository.save(user);

    if (updateUserDto.doctor) {
      const currentDoctor = await this.doctorRepository.findOne({ where: { id } });

      if (updateUserDto.doctor.crm_number) {
        const crmInUse = await this.doctorRepository.findOne({ where: { crm_number: updateUserDto.doctor.crm_number } });
        if (crmInUse && crmInUse.id !== id) throw new HttpException('CRM já cadastrado', 409);
      }

      if (currentDoctor) {
        currentDoctor.specialty = updateUserDto.doctor.specialty ?? currentDoctor.specialty;
        currentDoctor.crm_number = updateUserDto.doctor.crm_number ?? currentDoctor.crm_number;
        await this.doctorRepository.save(currentDoctor);
      } else {
        if (!updateUserDto.doctor.specialty || !updateUserDto.doctor.crm_number) {
          throw new BadRequestException('Para criar perfil de médico, informe specialty e crm_number');
        }

        await this.doctorRepository.save(
          this.doctorRepository.create({
            id,
            specialty: updateUserDto.doctor.specialty,
            crm_number: updateUserDto.doctor.crm_number,
          }),
        );
      }
    }

    if (updateUserDto.patient) {
      const currentPatient = await this.patientRepository.findOne({ where: { id } });

      if (currentPatient) {
        if (updateUserDto.patient.phone !== undefined) currentPatient.phone = updateUserDto.patient.phone;
        if (updateUserDto.patient.birth_date !== undefined) currentPatient.birth_date = new Date(updateUserDto.patient.birth_date);
        await this.patientRepository.save(currentPatient);
      } else {
        await this.patientRepository.save(
          this.patientRepository.create({
            id,
            phone: updateUserDto.patient.phone,
            birth_date: updateUserDto.patient.birth_date ? new Date(updateUserDto.patient.birth_date) : undefined,
          }),
        );
      }
    }

    return await this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.userRepository.remove(user);

    return {
      message: 'Usuário removido com sucesso',
    };
  }

  async findUserByEmail(email: string): Promise<User | null | undefined>{
    try{
      const user = await this.userRepository.findOne({ where: { email } });
      if(!user) return null;
      return user;
    }catch(error){
      throw error;
    }
  }
}
