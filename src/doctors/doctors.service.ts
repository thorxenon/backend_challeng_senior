import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto) {
    const user = await this.userRepository.findOne({
      where: { id: createDoctorDto.user_id },
      relations: {
        doctor: true,
        role: true,
      },
    });


    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.doctor) throw new HttpException('Usuário já possui perfil de médico', 409);
    if (user.role?.name !== 'doctor') {
      throw new HttpException('Usuário deve possuir role doctor para criar perfil de médico', 409);
    }

    const crmInUse = await this.doctorRepository.findOne({ where: { crm_number: createDoctorDto.crm_number } });
    if (crmInUse) throw new HttpException('CRM já cadastrado', 409);

      const doctor = this.doctorRepository.create({
        id: user.id,
        user,
        specialty: createDoctorDto.specialty,
        crm_number: createDoctorDto.crm_number,
      });

    await this.doctorRepository.save(doctor);
    

    const createdDoctor = await this.doctorRepository.findOne({ where: { id: doctor.id } });
    if (!createdDoctor) {
      throw new HttpException('Não foi possível persistir o perfil de médico', 500);
    }

    return await this.findOne(createdDoctor.id);
  }

  async findAll() {
    return await this.doctorRepository.find({
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
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: {
        user: {
          role: true,
        },
        appointments: {
          patient: true,
        },
      },
    });

    if (!doctor) throw new NotFoundException('Médico não encontrado');
    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    if (updateDoctorDto.crm_number && updateDoctorDto.crm_number !== doctor.crm_number) {
      const crmInUse = await this.doctorRepository.findOne({ where: { crm_number: updateDoctorDto.crm_number } });
      if (crmInUse) throw new HttpException('CRM já cadastrado', 409);
      doctor.crm_number = updateDoctorDto.crm_number;
    }

    if (updateDoctorDto.specialty !== undefined) {
      doctor.specialty = updateDoctorDto.specialty;
    }

    await this.doctorRepository.save(doctor);
    return await this.findOne(id);
  }

  async remove(id: string) {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    await this.doctorRepository.remove(doctor);

    return {
      message: 'Perfil do médico removido com sucesso',
    };
  }
}
