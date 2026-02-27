import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Doctor } from "src/doctors/entities/doctor.entity";
import { Patient } from "src/patients/entities/patient.entity";

export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELED = 'canceled',
}

@Entity({ name: 'appointments' })
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'doctor_id', type: 'varchar', length: 255, nullable: false })
    doctor_id: string;

    @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'doctor_id', referencedColumnName: 'id' })
    doctor: Relation<Doctor>;

    @Column({ name: 'patient_id', type: 'varchar', length: 255, nullable: false })
    patient_id: string;

    @ManyToOne(() => Patient, (patient) => patient.appointments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
    patient: Relation<Patient>;

    @Column({ name: 'scheduled_at', type: 'timestamp', nullable: false })
    scheduled_at: Date;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.SCHEDULED,
    })
    status: AppointmentStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
