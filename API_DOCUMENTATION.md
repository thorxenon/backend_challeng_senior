# API Documentation

Base URL (local): `http://localhost:3000`

## Autenticação e autorização

- Endpoints protegidos usam JWT Bearer Token no header:
  - `Authorization: Bearer <token>`
- Guardas/permissões no estado atual da aplicação:
  - `GET /` público
  - `POST /auth/login` público
  - `POST /auth/signup` protegido (`user_create`)
  - `users`, `patients`, `appointments` protegidos por permissão
  - `doctors` atualmente sem guard no controller (público no código atual)

## Convenções

- IDs (`id`, `user_id`, `doctor_id`, `patient_id`) são `string` (UUID).
- Datas nos DTOs devem ser ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- Campos opcionais podem ser omitidos do payload.

---

## 1) Health

### GET /
Retorna mensagem padrão da aplicação.

- Auth: não
- Body: não
- Query params: não

---

## 2) Auth

### POST /auth/login
Autentica usuário e retorna token JWT.

- Auth: não
- Body:
  - `email` (obrigatório, email)
  - `password` (obrigatório, string, min 8)

Exemplo:

```json
{
  "email": "admin@clinic.local",
  "password": "Admin@123"
}
```

### POST /auth/signup
Cria conta de usuário.

- Auth: sim
- Permissão: `user_create`
- Body:
  - `name` (obrigatório, string, min 3)
  - `email` (obrigatório, email)
  - `role_id` (obrigatório, number)
  - `password` (obrigatório, string, min 8)

Exemplo:

```json
{
  "name": "Maria Silva",
  "email": "maria@clinic.local",
  "role_id": 2,
  "password": "Senha@123"
}
```

---

## 3) Users

### POST /users
Cria usuário base (identidade) e opcionalmente perfil doctor/patient.

- Auth: sim
- Permissão: `user_create`
- Body:
  - `name` (obrigatório, string, min 3)
  - `email` (obrigatório, email)
  - `password` (obrigatório, string, min 8)
  - `role_id` (obrigatório, number)
  - `doctor` (opcional, objeto)
    - `specialty` (obrigatório dentro de `doctor`)
    - `crm_number` (obrigatório dentro de `doctor`)
  - `patient` (opcional, objeto)
    - `phone` (opcional)
    - `birth_date` (opcional, date string)

Exemplo (usuário com perfil médico):

```json
{
  "name": "Dr. João",
  "email": "dr.joao@clinic.local",
  "password": "Doctor@123",
  "role_id": 2,
  "doctor": {
    "specialty": "Cardiologia",
    "crm_number": "CRM-10001"
  }
}
```

Exemplo (usuário com perfil paciente):

```json
{
  "name": "Ana Souza",
  "email": "ana@clinic.local",
  "password": "Paciente@123",
  "role_id": 4,
  "patient": {
    "phone": "+55 11 99999-0000",
    "birth_date": "1990-10-15"
  }
}
```

### GET /users
Lista usuários.

- Auth: sim
- Permissão: `user_read`
- Query params: não

### GET /users/:id
Busca usuário por ID.

- Auth: sim
- Permissão: `user_read`
- Path params:
  - `id` (obrigatório)

### PATCH /users/:id
Atualiza usuário e/ou perfis.

- Auth: sim
- Permissão: `user_update`
- Path params:
  - `id` (obrigatório)
- Body (todos opcionais):
  - `name`, `email`, `password`, `role_id`
  - `doctor` (objeto opcional com `specialty` e/ou `crm_number`)
  - `patient` (objeto opcional com `phone` e/ou `birth_date`)

### DELETE /users/:id
Remove usuário.

- Auth: sim
- Permissão: `user_delete`
- Path params:
  - `id` (obrigatório)

---

## 4) Patients

### POST /patients
Cria perfil de paciente para um usuário já existente.

- Auth: sim
- Permissão: `patient_create`
- Body:
  - `user_id` (obrigatório, string)
  - `phone` (opcional, string)
  - `birth_date` (opcional, date string)

Exemplo:

```json
{
  "user_id": "0195f2e4-bc2d-76d8-ae37-0b4d9abf9012",
  "phone": "+55 11 98888-7777",
  "birth_date": "1987-04-21"
}
```

### GET /patients
Lista perfis de pacientes.

- Auth: sim
- Permissão: `patient_read`

### GET /patients/:id
Busca perfil do paciente por ID (mesmo ID do usuário).

- Auth: sim
- Permissão: `patient_read`
- Path params:
  - `id` (obrigatório)

### PATCH /patients/:id
Atualiza apenas dados de perfil do paciente.

- Auth: sim
- Permissão: `patient_update`
- Path params:
  - `id` (obrigatório)
- Body (todos opcionais):
  - `phone` (opcional)
  - `birth_date` (opcional)

### DELETE /patients/:id
Remove perfil do paciente (não necessariamente remove a conta base de usuário).

- Auth: sim
- Permissão: `patient_delete`
- Path params:
  - `id` (obrigatório)

---

## 5) Doctors

### POST /doctors
Cria perfil de médico para um usuário já existente.

- Auth: não (controller atual não aplica guard)
- Body:
  - `user_id` (obrigatório, string)
  - `specialty` (obrigatório, string)
  - `crm_number` (obrigatório, string)

Exemplo:

```json
{
  "user_id": "0195f2dd-8af1-7d7a-8ec7-5c7f2a2f5a11",
  "specialty": "Ortopedia",
  "crm_number": "CRM-20002"
}
```

### GET /doctors
Lista perfis de médicos.

- Auth: não (controller atual não aplica guard)

### GET /doctors/:id
Busca médico por ID (mesmo ID do usuário).

- Auth: não (controller atual não aplica guard)
- Path params:
  - `id` (obrigatório)

### PATCH /doctors/:id
Atualiza dados do perfil médico.

- Auth: não (controller atual não aplica guard)
- Path params:
  - `id` (obrigatório)
- Body (todos opcionais):
  - `specialty`
  - `crm_number`

### DELETE /doctors/:id
Remove perfil médico.

- Auth: não (controller atual não aplica guard)
- Path params:
  - `id` (obrigatório)

---

## 6) Appointments

### POST /appointments
Cria agendamento.

- Auth: sim
- Permissão: `appointment_create`
- Body:
  - `doctor_id` (obrigatório, string)
  - `patient_id` (obrigatório, string)
  - `scheduled_at` (obrigatório, datetime string)
  - `estimated_end_at` (opcional, datetime string)
  - `status` (opcional, enum: `scheduled | completed | canceled`)
  - `notes` (opcional, string)

Exemplo:

```json
{
  "doctor_id": "0195f2dd-8af1-7d7a-8ec7-5c7f2a2f5a11",
  "patient_id": "0195f2e4-bc2d-76d8-ae37-0b4d9abf9012",
  "scheduled_at": "2026-02-27T14:00:00.000Z",
  "estimated_end_at": "2026-02-27T14:45:00.000Z",
  "status": "scheduled",
  "notes": "Retorno"
}
```

### GET /appointments
Lista agendamentos, com filtros opcionais.

- Auth: sim
- Permissão: `appointment_read`
- Query params:
  - `year` (opcional, number, >= 1900)
  - `month` (opcional, number, 1..12)
  - `day` (opcional, number, 1..31)
  - `doctor_id` (opcional, string)

Exemplos:

- `/appointments?year=2026&month=2&day=27`
- `/appointments?doctor_id=0195f2dd-8af1-7d7a-8ec7-5c7f2a2f5a11`
- `/appointments?year=2026&month=2&doctor_id=0195f2dd-8af1-7d7a-8ec7-5c7f2a2f5a11`

### GET /appointments/:id
Busca agendamento por ID.

- Auth: sim
- Permissão: `appointment_read`
- Path params:
  - `id` (obrigatório)

### PATCH /appointments/:id
Atualiza agendamento.

- Auth: sim
- Permissão: `appointment_update`
- Path params:
  - `id` (obrigatório)
- Body (todos opcionais):
  - `doctor_id`
  - `patient_id`
  - `scheduled_at`
  - `estimated_end_at`
  - `status` (`scheduled | completed | canceled`)
  - `notes`

Exemplo:

```json
{
  "estimated_end_at": "2026-02-27T15:00:00.000Z",
  "notes": "Paciente demandou mais tempo"
}
```

### DELETE /appointments/:id
Remove agendamento.

- Auth: sim
- Permissão: `appointment_delete`
- Path params:
  - `id` (obrigatório)

---

## Erros comuns (resumo)

- `400 Bad Request`: payload inválido (validação de DTO / query params fora do formato)
- `401 Unauthorized`: token ausente/inválido em endpoint protegido
- `403 Forbidden`: sem permissão exigida
- `404 Not Found`: entidade não encontrada
- `409 Conflict`: e-mail/CRM/perfil já existente ou conflito de agenda
