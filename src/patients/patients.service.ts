import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}

  async create(createPatientDto: CreatePatientDto) {
    try {
      const patientUser = await this.userRepository.findOne({
        where: { id: createPatientDto.user_id },
        relations: {
          patient: true,
          role: true,
        },
      });

      if (!patientUser) throw new NotFoundException('Usuário não encontrado');
      if (patientUser.patient) throw new HttpException('Usuário já possui perfil de paciente', 409);
      if (patientUser.role?.name !== 'patient') {
        throw new HttpException('Usuário deve possuir role patient para criar perfil de paciente', 409);
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
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    if (updatePatientDto.phone !== undefined) patient.phone = updatePatientDto.phone;
    if (updatePatientDto.birth_date !== undefined) patient.birth_date = new Date(updatePatientDto.birth_date);

    await this.patientRepository.save(patient);

    return await this.findOne(id);
  }

  async remove(id: string) {
    const patient = await this.patientRepository.findOne({ where: { id } });

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    await this.patientRepository.remove(patient);

    return {
      message: 'Perfil do paciente removido com sucesso',
    };
  }
}
