import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { RoleHasPermission } from "./roleHasPermission.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ name: 'roles' })
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    name: string;

    @OneToMany(() => User, (user) => user.role)
    users: Relation<User[]>;

    @OneToMany(() => RoleHasPermission, (roleHasPermission) => roleHasPermission.role)
    roleHasPermissions: Relation<RoleHasPermission[]>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
