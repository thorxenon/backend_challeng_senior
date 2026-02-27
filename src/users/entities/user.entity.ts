import { Role } from "../../auth/entities/role.entity";
import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Doctor } from "src/doctors/entities/doctor.entity";
import { Patient } from "src/patients/entities/patient.entity";
import { v7 as uuidv7 } from 'uuid';

@Entity({ name: 'users' })
export class User {
    @PrimaryColumn({ type: 'varchar', length: 255, unique: true, nullable: false })
    id: string;

    @Column({ unique: true, type: 'varchar', length: 255, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 255, select: false })
    password: string;

    @ManyToOne(() => Role, (role) => role.id)
    @JoinColumn({ name: 'role' })
    role: Relation<Role>;

    @Column({ name: 'role', nullable: false })
    role_id: number;

    @OneToOne(() => Doctor, (doctor) => doctor.user)
    doctor: Relation<Doctor>;

    @OneToOne(() => Patient, (patient) => patient.user)
    patient: Relation<Patient>;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @BeforeInsert()
    private async generateHash(){
        this.password = await bcrypt.hash(this.password, 12);
    }

    @BeforeInsert()
    private async generateId(){
        this.id = uuidv7();
    }

    async verifyPassword(password: string): Promise<boolean>{
        return await bcrypt.compare(password, this.password);
    }
}