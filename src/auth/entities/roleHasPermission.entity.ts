import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Permission } from "./permissions.entity";
import { Role } from "./role.entity";

@Entity({ name: 'roles_permissions' })
export class RoleHasPermission{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'role' })
    roleId: number;

    @JoinColumn({ name: 'role' })
    @ManyToOne(() => Role, (role) => role.roleHasPermissions, { nullable: false })
    role: Relation<Role>;

    @Column({ name: 'permission' })
    permissionId: number;

    @JoinColumn({ name: 'permission' })
    @ManyToOne(() => Permission, (permission) => permission.roleHasPermissions, { nullable: false})
    permission: Relation<Permission>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}