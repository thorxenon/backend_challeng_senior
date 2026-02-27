import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Appointment } from "src/appointments/entities/appointment.entity";

@Entity({ name: 'patients' })
export class Patient {
    @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 255, unique: true, nullable: false })
    id: string;

    @OneToOne(() => User, (user) => user.patient, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone?: string;

    @Column({ type: 'date', nullable: true })
    birth_date?: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.patient)
    appointments: Relation<Appointment[]>;
}
