# Relatório Técnico de Decisões — backend_challeng_senior

## 1. Contexto e objetivos

objetivo: Desenvolver uma API simples para gerenciamento de agenda médica. 

Este projeto foi estruturado como uma API backend para gestão clínica, com foco em:

- Gestão de usuários e perfis de domínio (médico/paciente);
- Controle de acesso por papéis/permissões (RBAC);
- Gestão de agenda de atendimentos com regras de conflito;
- Base inicial de dados via seed para acelerar testes e operação.

A stack principal adotada foi **NestJS + TypeORM + PostgreSQL**, com validação via `class-validator` e autenticação JWT.

---

## 2. Decisões de arquitetura

### 2.1 Separação entre identidade e perfil de domínio

**Decisão:** centralizar identidade em `users` e manter `doctors`/`patients` como perfis 1:1 com `users`.

- `users`: `id`, `name`, `email`, `password`, `role_id`, timestamps.
- `doctors`: dados profissionais (`specialty`, `crm_number`) com chave ligada ao usuário.
- `patients`: dados de paciente (`phone`, `birth_date`) com chave ligada ao usuário.

**Motivo:** evitar duplicidade de dados sensíveis (nome/email/senha) em múltiplos resources e manter coesão de autenticação.

**Impacto:**
- Menos inconsistência entre tabelas;
- Fluxo de criação mais claro (`user` primeiro, perfil depois);
- Evolução futura mais simples para novos perfis.

---

### 2.2 RBAC (Role-Based Access Control)

**Decisão:** usar modelagem de autorização com `roles`, `permissions` e `roles_permissions`.

- `User` referencia uma role (`role_id`);
- `RoleHasPermission` faz o vínculo N:N entre role e permissão;
- `PermissionGuard` lê a permissão requerida por endpoint (`@RequiredPermission`).

**Motivo:** granularidade de autorização por operação sem hardcode de regras por controller.

**Impacto:**
- Controle fino por endpoint (`user_create`, `appointment_read`, etc.);
- Facilidade para ampliar permissões sem alterar lógica de domínio.

---

### 2.3 Segurança de autenticação

**Decisão:** autenticação por JWT com Passport (`AuthGuard`) + estratégia JWT.

**Pontos relevantes implementados:**
- `POST /auth/login` público;
- `POST /auth/signup` protegido (permite apenas usuários autorizados criarem contas);
- Demais endpoints críticos protegidos por token e permissão;
- Senha armazenada com hash (`bcrypt` em hook `@BeforeInsert`).

**Motivo:** manter login acessível e evitar bootstrap inseguro de contas via signup aberto.

---

## 3. Decisões de modelagem de dados

### 3.1 Chaves e relacionamentos

**Decisão:** IDs de negócio em formato string/UUID para entidades principais (`users`, `doctors`, `patients`, `appointments`).

- `Doctor.id` e `Patient.id` mapeiam para `user_id`;
- Relações 1:1 entre `User` ↔ `Doctor` e `User` ↔ `Patient`.

**Motivo:** consistência de identidade e simplificação de joins por usuário dono do perfil.

---

### 3.2 Agenda como entidade própria

**Decisão:** representar agenda por `appointments` com:

- `doctor_id`, `patient_id`;
- `scheduled_at` (início);
- `estimated_end_at` (previsão de término);
- `status` (`scheduled`, `completed`, `canceled`);
- `notes`.

**Motivo:** permitir regras de conflito por intervalo e evolução de features operacionais (encaixes, reagendamentos, histórico).

---

## 4. Decisões de regra de negócio

### 4.1 Usuários

**Implementado:**
- CRUD real para `users`;
- validação de e-mail único;
- validação de role existente;
- criação/atualização opcional de perfis vinculados (`doctor`/`patient`);
- validação de CRM único no contexto médico.

**Racional:** concentrar regras transversais de identidade em um único resource.

---

### 4.2 Pacientes

**Decisão evolutiva:** remover duplicação de identidade no resource `patients`.

**Implementado:**
- `POST /patients` recebe `user_id` + campos de perfil;
- valida se usuário existe, não possui perfil de paciente e tem role adequada (`patient`);
- update/remove atuam apenas no perfil (não na conta base).

**Racional:** manter `users` responsável por identidade e `patients` por dados clínico-cadastrais.

---

### 4.3 Médicos

**Implementado:**
- CRUD real de perfil médico;
- criação exige `user_id`, `specialty`, `crm_number`;
- validações: usuário existe, sem perfil prévio, role `doctor`, CRM único.

**Ajuste técnico aplicado:**
- persistência reforçada na criação com validação pós-save para evitar falso positivo de retorno sem gravação efetiva.

---

### 4.4 Agenda (Appointments)

**Regras implementadas:**
- Não permite novo agendamento em intervalo já ocupado pelo mesmo médico;
- Não permite paciente com dois atendimentos simultâneos;
- `estimated_end_at` opcional (default de 30min quando ausente);
- validação de intervalo (`estimated_end_at > scheduled_at`).

**Listagem (`findAll`) com filtros combináveis:**
- `year`, `month`, `day`;
- `doctor_id`.

**Ajuste operacional adicional:**
- ao alterar `estimated_end_at`, existe replanejamento automático dos próximos horários no contexto definido, mantendo regras de conflito.

---

## 5. Decisões de API e validação de entrada

**Decisão:** DTOs explícitos com `class-validator` para distinguir campos obrigatórios/opcionais.

**Benefícios:**
- Contrato de API previsível;
- Erros de input padronizados em 400;
- Menos validações manuais espalhadas pelos services.

---

## 6. Decisões de inicialização de ambiente (Seed)

**Implementado:** seeder idempotente com script `npm run seed`.

**Cria/garante:**
- Roles: `admin`, `doctor`, `assistant`, `patient`;
- Permissions de `users`, `patients` e `appointments`;
- vínculo de permissões por role (admin com acesso total);
- contas iniciais:
  - `admin@clinic.local`
  - `doctor@clinic.local` (com perfil médico)
  - `assistant@clinic.local`

**Motivo:** acelerar onboarding, QA e testes de autorização.

---

## 7. Decisões de documentação

**Implementado:** `API_DOCUMENTATION.md` com:

- todos os endpoints disponíveis;
- autenticação/permissão por rota;
- parâmetros obrigatórios/opcionais;
- exemplos de body para inserção (POST).

**Motivo:** reduzir ambiguidade de integração e facilitar uso em Postman/Insomnia.

---

## 8. Trade-offs e pontos de atenção

1. **Controller de doctors sem guard no estado atual**
   - Hoje os endpoints de `doctors` estão públicos no controller.
   - Se o objetivo for consistência com demais recursos, recomenda-se proteger com `AuthGuard` + `PermissionGuard`.

2. **Role única por usuário (`role_id`)**
   - A modelagem atual usa uma role por usuário.
   - Para cenários de múltiplos papéis simultâneos por conta, seria necessário migrar para relação N:N `users_roles`.

3. **Autoajuste de agenda**
   - Reagendamento automático após mudança de `estimated_end_at` traz ganho operacional, mas exige regra funcional clara (escopo de quais consultas mover).

4. **Sem migrations versionadas no fluxo atual**
   - Com `synchronize: true`, mudanças são práticas em desenvolvimento, porém não ideais para produção.
   - Recomendado migrar para strategy com migrations controladas.

---

## 9. Recomendações de próximos passos

1. Proteger `doctors` com autorização por permissão.
2. Consolidar política de retorno seguro (nunca expor `password` em respostas de criação/atualização).
3. Introduzir migrations TypeORM para versionamento de schema.
4. Cobrir regras críticas com testes automatizados (conflito de agenda, permissões, criação de perfis).
5. Publicar coleção Postman alinhada à documentação.

---

## 10. Conclusão

As decisões tomadas priorizaram **consistência de domínio**, **segurança de acesso** e **operação da agenda com regras reais de conflito**. A base atual está preparada para evoluir de MVP para produção com melhorias incrementais em governança de schema, testes e endurecimento de segurança em endpoints remanescentes.
