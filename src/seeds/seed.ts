import { NestFactory } from '@nestjs/core';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from 'src/app.module';
import { Role } from 'src/auth/entities/role.entity';
import { Permission } from 'src/auth/entities/permissions.entity';
import { RoleHasPermission } from 'src/auth/entities/roleHasPermission.entity';
import { User } from 'src/users/entities/user.entity';
import { Doctor } from 'src/doctors/entities/doctor.entity';

const PERMISSIONS = [
  'user_create',
  'user_read',
  'user_update',
  'user_delete',
  'patient_create',
  'patient_read',
  'patient_update',
  'patient_delete',
  'appointment_create',
  'appointment_read',
  'appointment_update',
  'appointment_delete',
] as const;

type AccountSeed = {
  roleName: string;
  name: string;
  email: string;
  password: string;
};

async function findOrCreateRole(roleRepository: Repository<Role>, name: string): Promise<Role> {
  const existing = await roleRepository.findOne({ where: { name } });
  if (existing) return existing;

  return await roleRepository.save(
    roleRepository.create({
      name,
    }),
  );
}

async function findOrCreatePermission(permissionRepository: Repository<Permission>, name: string): Promise<Permission> {
  const existing = await permissionRepository.findOne({ where: { name } });
  if (existing) return existing;

  return await permissionRepository.save(
    permissionRepository.create({
      name,
    }),
  );
}

async function ensureRolePermissions(
  roleHasPermissionRepository: Repository<RoleHasPermission>,
  role: Role,
  permissions: Permission[],
): Promise<void> {
  for (const permission of permissions) {
    const existing = await roleHasPermissionRepository.findOne({
      where: {
        role: { id: role.id },
        permission: { id: permission.id },
      },
      relations: {
        role: true,
        permission: true,
      },
    });

    if (existing) continue;

    await roleHasPermissionRepository.save(
      roleHasPermissionRepository.create({
        roleId: role.id,
        role,
        permissionId: permission.id,
        permission,
      }),
    );
  }
}

async function findOrCreateUser(userRepository: Repository<User>, role: Role, account: AccountSeed): Promise<User> {
  const existing = await userRepository.findOne({ where: { email: account.email } });

  if (existing) {
    let hasChanges = false;

    if (existing.role_id !== role.id) {
      existing.role_id = role.id;
      hasChanges = true;
    }

    if (existing.name !== account.name) {
      existing.name = account.name;
      hasChanges = true;
    }

    if (hasChanges) {
      await userRepository.save(existing);
    }

    return existing;
  }

  return await userRepository.save(
    userRepository.create({
      name: account.name,
      email: account.email,
      password: account.password,
      role_id: role.id,
    }),
  );
}

async function ensureDoctorProfile(doctorRepository: Repository<Doctor>, user: User): Promise<void> {
  const existingDoctor = await doctorRepository.findOne({ where: { id: user.id } });

  if (existingDoctor) {
    let hasChanges = false;

    if (existingDoctor.specialty !== 'Clínico Geral') {
      existingDoctor.specialty = 'Clínico Geral';
      hasChanges = true;
    }

    if (existingDoctor.crm_number !== 'CRM-0001') {
      existingDoctor.crm_number = 'CRM-0001';
      hasChanges = true;
    }

    if (hasChanges) {
      await doctorRepository.save(existingDoctor);
    }

    return;
  }

  await doctorRepository.save(
    doctorRepository.create({
      id: user.id,
      specialty: 'Clínico Geral',
      crm_number: 'CRM-0001',
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);
    const roleHasPermissionRepository = dataSource.getRepository(RoleHasPermission);
    const userRepository = dataSource.getRepository(User);
    const doctorRepository = dataSource.getRepository(Doctor);

    const adminRole = await findOrCreateRole(roleRepository, 'admin');
    const doctorRole = await findOrCreateRole(roleRepository, 'doctor');
    const assistantRole = await findOrCreateRole(roleRepository, 'assistant');
    await findOrCreateRole(roleRepository, 'patient');

    const permissions: Permission[] = [];
    for (const permissionName of PERMISSIONS) {
      permissions.push(await findOrCreatePermission(permissionRepository, permissionName));
    }

    await ensureRolePermissions(roleHasPermissionRepository, adminRole, permissions);

    const doctorPermissions = permissions.filter((permission) =>
      ['appointment_read', 'appointment_update'].includes(permission.name),
    );
    await ensureRolePermissions(roleHasPermissionRepository, doctorRole, doctorPermissions);

    const assistantPermissions = permissions.filter((permission) =>
      ['appointment_create', 'appointment_read', 'appointment_update', 'appointment_delete', 'patient_read'].includes(
        permission.name,
      ),
    );
    await ensureRolePermissions(roleHasPermissionRepository, assistantRole, assistantPermissions);

    const adminAccount = await findOrCreateUser(userRepository, adminRole, {
      roleName: 'admin',
      name: 'Admin Sistema',
      email: 'admin@clinic.local',
      password: 'Admin@123',
    });

    const doctorAccount = await findOrCreateUser(userRepository, doctorRole, {
      roleName: 'doctor',
      name: 'Dr. Seed',
      email: 'doctor@clinic.local',
      password: 'Doctor@123',
    });

    await findOrCreateUser(userRepository, assistantRole, {
      roleName: 'assistant',
      name: 'Assistente Seed',
      email: 'assistant@clinic.local',
      password: 'Assistant@123',
    });

    await ensureDoctorProfile(doctorRepository, doctorAccount);

    console.log('Seed concluído com sucesso.');
    console.log(`Admin: ${adminAccount.email}`);
    console.log(`Doctor: ${doctorAccount.email}`);
    console.log('Assistant: assistant@clinic.local');
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
