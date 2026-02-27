import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ){}

  async create(createPatientDto: CreatePatientDto) {
    try {
      const { user_id } = createPatientDto;
      let patientUser: User | null = null;

      if (user_id) {
        patientUser = await this.userRepository.findOne({
          where: { id: user_id },
          relations: {
            patient: true,
          },
        });

        if (!patientUser) throw new NotFoundException('Usuário não encontrado');
        if (patientUser.patient) throw new HttpException('Usuário já possui perfil de paciente', 409);
      } else {
        if (!createPatientDto.name || !createPatientDto.email || !createPatientDto.password) {
          throw new BadRequestException('Para novo cadastro, informe name, email e password');
        }

        const emailInUse = await this.userRepository.findOne({ where: { email: createPatientDto.email } });
        if (emailInUse) throw new HttpException('E-mail já cadastrado', 409);

        const patientRole = await this.roleRepository.findOne({ where: { name: 'patient' } });
        if (!patientRole) throw new NotFoundException('Role patient não encontrada');

        patientUser = await this.userRepository.save(
          this.userRepository.create({
            name: createPatientDto.name,
            email: createPatientDto.email,
            password: createPatientDto.password,
            role_id: patientRole.id,
          }),
        );
      }

      const patient = await this.patientRepository.save(
        this.patientRepository.create({
          id: patientUser.id,
          phone: createPatientDto.phone,
          birth_date: createPatientDto.birth_date ? new Date(createPatientDto.birth_date) : undefined,
        }),
      );

      return await this.findOne(patient.id);
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.patientRepository.find({
      relations: {
        user: {
          role: true,
        },
        appointments: true,
      },
      order: {
        user: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: {
        user: {
          role: true,
        },
        appointments: {
          doctor: true,
        },
      },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    if (updatePatientDto.email && updatePatientDto.email !== patient.user.email) {
      const emailInUse = await this.userRepository.findOne({ where: { email: updatePatientDto.email } });
      if (emailInUse) throw new HttpException('E-mail já cadastrado', 409);
      patient.user.email = updatePatientDto.email;
    }

    if (updatePatientDto.name !== undefined) {
      patient.user.name = updatePatientDto.name;
    }

    if (updatePatientDto.password) {
      patient.user.password = await bcrypt.hash(updatePatientDto.password, 12);
    }

    await this.userRepository.save(patient.user);

    if (updatePatientDto.phone !== undefined) patient.phone = updatePatientDto.phone;
    if (updatePatientDto.birth_date !== undefined) patient.birth_date = new Date(updatePatientDto.birth_date);

    await this.patientRepository.save(patient);

    return await this.findOne(id);
  }

  async remove(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    await this.userRepository.remove(patient.user);

    return {
      message: 'Paciente removido com sucesso',
    };
  }
}
