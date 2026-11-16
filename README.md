# orcamento-pessoal
Uma simples plataforma para calcular meus orçamentos mensais e planos futuros.

A aplicação contém um backend Spring Boot e um frontend React/Vite para acompanhar renda e gastos mensais e cadastrar metas financeiras futuras.

## Requisitos

- Java 21
- PostgreSQL
- Node.js e pnpm

## Backend

Crie o banco `salario` no PostgreSQL. Configure `DB_PASSWORD`, `APP_PRIMARY_PASSWORD_HASH` e `APP_SECONDARY_PASSWORD_HASH` no ambiente do processo. Os dois últimos valores devem ser hashes BCrypt; não coloque senhas ou hashes em arquivos versionados.

No PowerShell, defina essas variáveis na sessão e execute:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

O backend usa a porta `8081`. A configuração local opcional fica em `backend/src/main/resources/application-local.properties`; esse arquivo é ignorado pelo Git.

## Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

O frontend acessa a API em `http://localhost:8081`.

## Contas e dados

O backend aceita os dois e-mails configurados em `SegurancaConfig`. Orçamentos e metas são filtrados pelo e-mail autenticado. Na primeira inicialização com o esquema atualizado, registros existentes sem proprietário são associados ao primeiro perfil. Configuração local e credenciais não fazem parte do repositório.
