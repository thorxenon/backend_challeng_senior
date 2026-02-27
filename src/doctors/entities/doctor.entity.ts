import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Appointment } from "src/appointments/entities/appointment.entity";

@Entity({ name: 'doctors' })
export class Doctor {
    @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 255, unique: true, nullable: false })
    id: string;

    @OneToOne(() => User, (user) => user.doctor, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;

    @Column({ type: 'varchar', length: 255 })
    specialty: string;

    @OneToMany(() => Appointment, (appointment) => appointment.doctor)
    appointments: Relation<Appointment[]>;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    crm_number: string;
}
