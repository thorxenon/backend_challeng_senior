import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  private buildEstimatedEnd(start: Date, estimatedEndAt?: string): Date {
    if (estimatedEndAt) return new Date(estimatedEndAt);
    return new Date(start.getTime() + 30 * 60 * 1000);
  }

  private validateDateRange(start: Date, end: Date) {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Data/hora inválida para agendamento');
    }

    if (end <= start) {
      throw new BadRequestException('A previsão de término deve ser maior que o horário inicial');
    }
  }

  private async validateDoctorConflict(
    doctorId: string,
    start: Date,
    end: Date,
    ignoreAppointmentIds?: string[],
  ) {
    const doctorConflictQuery = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.status != :canceledStatus', { canceledStatus: AppointmentStatus.CANCELED })
      .andWhere('appointment.scheduled_at < :newEnd', { newEnd: end })
      .andWhere('appointment.estimated_end_at > :newStart', { newStart: start });

    if (ignoreAppointmentIds?.length) {
      doctorConflictQuery.andWhere('appointment.id NOT IN (:...ignoreAppointmentIds)', { ignoreAppointmentIds });
    }

    const doctorConflict = await doctorConflictQuery.getOne();
    if (doctorConflict) {
      throw new HttpException('Médico já possui atendimento neste horário', 409);
    }
  }

  private async validatePatientConflict(
    patientId: string,
    start: Date,
    end: Date,
    ignoreAppointmentIds?: string[],
  ) {
    const patientConflictQuery = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.patient_id = :patientId', { patientId })
      .andWhere('appointment.status != :canceledStatus', { canceledStatus: AppointmentStatus.CANCELED })
      .andWhere('appointment.scheduled_at < :newEnd', { newEnd: end })
      .andWhere('appointment.estimated_end_at > :newStart', { newStart: start });

    if (ignoreAppointmentIds?.length) {
      patientConflictQuery.andWhere('appointment.id NOT IN (:...ignoreAppointmentIds)', { ignoreAppointmentIds });
    }

    const patientConflict = await patientConflictQuery.getOne();
    if (patientConflict) {
      throw new HttpException('Paciente já possui atendimento neste horário', 409);
    }
  }

  private async validateConflict(
    doctorId: string,
    patientId: string,
    start: Date,
    end: Date,
    ignoreAppointmentIds?: string[],
  ) {
    await this.validateDoctorConflict(doctorId, start, end, ignoreAppointmentIds);
    await this.validatePatientConflict(patientId, start, end, ignoreAppointmentIds);
  }

  private async shiftFollowingAppointments(currentAppointment: Appointment, previousEstimatedEndAt: Date) {
    const deltaMilliseconds = currentAppointment.estimated_end_at.getTime() - previousEstimatedEndAt.getTime();
    if (deltaMilliseconds === 0) return;

    const dayEnd = new Date(currentAppointment.scheduled_at);
    dayEnd.setHours(23, 59, 59, 999);

    const followingAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId: currentAppointment.doctor_id })
      .andWhere('appointment.patient_id = :patientId', { patientId: currentAppointment.patient_id })
      .andWhere('appointment.status != :canceledStatus', { canceledStatus: AppointmentStatus.CANCELED })
      .andWhere('appointment.id != :currentId', { currentId: currentAppointment.id })
      .andWhere('appointment.scheduled_at >= :previousEstimatedEndAt', { previousEstimatedEndAt })
      .andWhere('appointment.scheduled_at <= :dayEnd', { dayEnd })
      .orderBy('appointment.scheduled_at', 'ASC')
      .getMany();

    if (!followingAppointments.length) return;

    const shiftedIds = followingAppointments.map((appointment) => appointment.id);

    for (const appointment of followingAppointments) {
      const shiftedStart = new Date(appointment.scheduled_at.getTime() + deltaMilliseconds);
      const shiftedEnd = new Date(appointment.estimated_end_at.getTime() + deltaMilliseconds);
      this.validateDateRange(shiftedStart, shiftedEnd);

      await this.validatePatientConflict(appointment.patient_id, shiftedStart, shiftedEnd, [appointment.id, ...shiftedIds]);

      appointment.scheduled_at = shiftedStart;
      appointment.estimated_end_at = shiftedEnd;
    }

    await this.appointmentRepository.save(followingAppointments);
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const doctor = await this.doctorRepository.findOne({ where: { id: createAppointmentDto.doctor_id } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    const patient = await this.patientRepository.findOne({ where: { id: createAppointmentDto.patient_id } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    const scheduledAt = new Date(createAppointmentDto.scheduled_at);
    const estimatedEndAt = this.buildEstimatedEnd(scheduledAt, createAppointmentDto.estimated_end_at);
    this.validateDateRange(scheduledAt, estimatedEndAt);

    if (createAppointmentDto.status !== AppointmentStatus.CANCELED) {
      await this.validateConflict(createAppointmentDto.doctor_id, createAppointmentDto.patient_id, scheduledAt, estimatedEndAt);
    }

    const appointment = await this.appointmentRepository.save(
      this.appointmentRepository.create({
        doctor_id: createAppointmentDto.doctor_id,
        patient_id: createAppointmentDto.patient_id,
        scheduled_at: scheduledAt,
        estimated_end_at: estimatedEndAt,
        status: createAppointmentDto.status ?? AppointmentStatus.SCHEDULED,
        notes: createAppointmentDto.notes,
      }),
    );

    return await this.findOne(appointment.id);
  }

  async findAll(filters?: { year?: number; month?: number; day?: number }) {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser');

    if (filters?.year) {
      query.andWhere('EXTRACT(YEAR FROM appointment.scheduled_at) = :year', { year: filters.year });
    }

    if (filters?.month) {
      query.andWhere('EXTRACT(MONTH FROM appointment.scheduled_at) = :month', { month: filters.month });
    }

    if (filters?.day) {
      query.andWhere('EXTRACT(DAY FROM appointment.scheduled_at) = :day', { day: filters.day });
    }

    query.orderBy('appointment.scheduled_at', 'ASC');
    return await query.getMany();
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: {
        doctor: {
          user: true,
        },
        patient: {
          user: true,
        },
      },
    });

    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    const previousEstimatedEndAt = appointment.estimated_end_at;
    const previousDoctorId = appointment.doctor_id;
    const shouldAutoAdjustFollowingAppointments = updateAppointmentDto.estimated_end_at !== undefined;

    const doctorId = updateAppointmentDto.doctor_id ?? appointment.doctor_id;
    const patientId = updateAppointmentDto.patient_id ?? appointment.patient_id;
    const scheduledAt = updateAppointmentDto.scheduled_at
      ? new Date(updateAppointmentDto.scheduled_at)
      : appointment.scheduled_at;
    const estimatedEndAt = updateAppointmentDto.estimated_end_at
      ? new Date(updateAppointmentDto.estimated_end_at)
      : appointment.estimated_end_at;
    const status = updateAppointmentDto.status ?? appointment.status;

    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    this.validateDateRange(scheduledAt, estimatedEndAt);

    if (status !== AppointmentStatus.CANCELED) {
      await this.validatePatientConflict(patientId, scheduledAt, estimatedEndAt, [id]);

      const canSkipDoctorConflict =
        shouldAutoAdjustFollowingAppointments && previousDoctorId === doctorId;

      if (!canSkipDoctorConflict) {
        await this.validateDoctorConflict(doctorId, scheduledAt, estimatedEndAt, [id]);
      }
    }

    appointment.doctor_id = doctorId;
    appointment.patient_id = patientId;
    appointment.scheduled_at = scheduledAt;
    appointment.estimated_end_at = estimatedEndAt;
    appointment.status = status;
    appointment.notes = updateAppointmentDto.notes ?? appointment.notes;

    await this.appointmentRepository.save(appointment);

    if (
      status !== AppointmentStatus.CANCELED &&
      shouldAutoAdjustFollowingAppointments &&
      previousDoctorId === appointment.doctor_id
    ) {
      await this.shiftFollowingAppointments(appointment, previousEstimatedEndAt);
    }

    return await this.findOne(id);
  }

  async remove(id: string) {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    await this.appointmentRepository.remove(appointment);

    return {
      message: 'Agendamento removido com sucesso',
    };
  }
}
