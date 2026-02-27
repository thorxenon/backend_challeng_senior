import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { RoleHasPermission } from "./roleHasPermission.entity";

@Entity({ name: 'permissions' })
export class Permission{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', unique: true, length: 255, nullable: false })
    name: string;

    @OneToMany(() => RoleHasPermission, (roleHasPermission) => roleHasPermission.permission)
    roleHasPermissions: Relation<RoleHasPermission[]>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}