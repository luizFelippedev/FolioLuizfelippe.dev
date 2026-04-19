# Backend do meu portfolio

Idioma: **Português (Brasil)** | English: [README.en.md](./README.en.md)

Esse projeto é o backend do meu portfolio pessoal.  
Eu criei ele para ter controle total da minha plataforma: conteúdo, autenticação, métricas, uploads, newsletter e integrações de infraestrutura.

A ideia aqui não foi só "ter uma API". Foi montar uma base profissional, escalável e fácil de manter, para eu evoluir sem quebrar produção.

## O que eu quis resolver com esse backend

- Centralizar tudo que alimenta o frontend.
- Ter uma área administrativa segura para eu gerenciar conteúdo.
- Deixar pronto para crescimento, com cache, observabilidade e filas.
- Conseguir fazer upgrade de versão quando eu quiser, sem publicação automática.

## Stack que escolhi e por quê

- `Node.js + Express + TypeScript`: produtividade com tipagem forte.
- `MongoDB`: flexível para modelar projetos, blog, certificados, depoimentos e newsletter.
- `Redis`: cache e performance nas rotas mais consultadas.
- `Socket.IO`: canal em tempo real para notificações e analytics.
- `Groq`: inferência hospedada e de baixa latência para o assistente inteligente do portfólio.
- `Nginx`: reverse proxy estável para expor o backend.
- `Prometheus + Grafana`: métricas e dashboards para operação.
- `RabbitMQ/Kafka/PostgreSQL` (opcionais por profile): prontos para cenários avançados.

## Como o projeto está organizado

- `src/config`: variáveis de ambiente, conexões e configs de serviços externos.
- `src/controllers`: camada HTTP (entrada e saída da API).
- `src/services`: regras de negócio.
- `src/models`: modelos Mongoose.
- `src/middleware`: autenticação, validação, tratamento de erro, métricas.
- `src/routes`: organização das rotas.
- `src/utils`: helpers compartilhados (cache, logger, paginação, CSV, etc).

## Como rodar localmente

```bash
npm ci
npm run dev
```

Backend padrão em `http://localhost:4000`.

### Chatbot com Groq

O backend agora expõe:

- `GET /api/chat/status`: status do provedor Groq e do modelo configurado.
- `POST /api/chat/stream`: streaming SSE para o chatbot do portfólio.

Fluxo local recomendado:

```bash
npm run dev
```

Depois ajuste as variáveis `GROQ_*` no `.env.development` com sua chave da Groq.

Fluxos locais suportados:

- Backend no host:
  - `npm run dev`
- Backend no Docker:
  - `docker compose up -d --build backend`

Contrato local padrão:

- frontend em `http://localhost:5173`
- backend em `http://localhost:4000`
- frontend usando `VITE_API_URL=http://localhost:4000/api`
- Groq em `https://api.groq.com/openai/v1`

Se quiser subir stack completa com Docker:

```bash
docker compose --profile queues --profile streaming --profile sql up -d
```

Serviços principais:
- API: `http://localhost`
- Health: `http://localhost/health`
- Ready: `http://localhost/ready`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Ambientes (desenvolvimento vs produção)

Eu deixei separado para evitar erro comum: mexer em desenvolvimento e impactar o que está no ar.

- Desenvolvimento: `.env.development`
- Produção: `.env.production`
- Docker local: `.env`

Templates disponíveis:
- `.env.development.example`
- `.env.production.example`
- `.env.docker.example`

As variáveis são validadas no startup (`src/config/env.config.ts`).  
Se faltar algo importante, a aplicação falha cedo, em vez de quebrar no meio da execução.

## Deploy controlado (upgrade só quando eu decidir)

Esse ponto foi uma prioridade: nada de atualizar sozinho em produção.

- No Render: `autoDeploy: false` no `render.yaml`.
- Local/self-hosted: scripts de release manual.

Fluxo que eu uso:
1. Gerar nova imagem.
2. Validar com `npm run release:check`.
3. Ativar quando eu quiser: `npm run release:activate -- <image:tag>`.
4. Se precisar voltar: `npm run release:rollback`.
5. Ver estado atual: `npm run release:status`.

## Segurança e governança

- JWT access + refresh token.
- Rate limit.
- Helmet e hardening HTTP.
- CORS configurável.
- Logs estruturados com correlação por request.
- Perfis de permissão (`admin`, `editor`, `guest`).

## Visualizações em tempo real (anti-duplicação por IP)

- Endpoint blog: `POST /api/blog/:slug/views`
- Endpoint projetos: `POST /api/projects/:slug/views`
- Regra: mesmo IP não incrementa novamente dentro da janela configurada (`VIEW_UNIQUE_TTL_SECONDS`).
- Tempo real: quando conta nova visualização, o backend emite evento Socket.IO `views:update` no namespace `/notifications` (canais `public-metrics` e `admin-alerts`).

## Qualidade e testes

- Lint: `npm run lint`
- Build: `npm run build`
- Testes de integração: `npm test -- --run`

Os testes usam Mongo em memória e já estão ajustados para ambiente de CI com timeout estável.

## Seed de dados

Para popular o banco com dados iniciais:

```bash
npm run seed -- --reset
```

Você pode rodar também com `--collections` e `--dry-run`.

## API e documentação

- Referência humana da API (PT-BR): `docs/api.md`
- Referência humana da API (EN): `docs/api.en.md`
- Swagger/OpenAPI: `docs/swagger.yaml`
- Swagger UI local: `http://localhost:4000/docs`

## Render (backend)

O deploy está preparado para subir via `render.yaml`.

Passo a passo:
1. Criar `Web Service` na Render apontando para o repo `Backend`.
2. Confirmar que `autoDeploy` está desligado para deploy manual.
3. Preencher variáveis no dashboard (não no git):
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL=https://luizfelippedev.vercel.app`
   - `CORS_ORIGINS=https://luizfelippedev.vercel.app`
   - `ASSET_BASE_URL=https://<seu-app>.onrender.com`
   - `NEWSLETTER_CONFIRMATION_URL`
   - `PASSWORD_RESET_URL`
4. Habilitar WebSockets no serviço.
5. Fazer deploy manual quando quiser publicar upgrade.

## Vercel (frontend)

Frontend fica na Vercel, consumindo esse backend da Render.

Variáveis esperadas no frontend:
- `VITE_API_URL=https://<seu-app>.onrender.com/api`
- `VITE_WS_URL=wss://<seu-app>.onrender.com`

## Frontend e backend em pastas separadas

Esse projeto funciona normalmente com pastas independentes, por exemplo:

- `D:\Github\Backend`
- `D:\Github\Frontend`

O acoplamento entre eles acontece por URL, não por estrutura de diretório:

- backend em `http://localhost:4000`
- frontend apontando `VITE_API_URL=http://localhost:4000/api`
- widget do chatbot consumindo `POST /api/chat/stream`

## Comandos mais usados no dia a dia

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm test -- --run`
- `npm run seed -- --reset`
- `npm run stack:up`
- `npm run stack:up:full`
- `npm run release:check`
- `npm run release:activate -- <image:tag>`
- `npm run release:rollback`
- `npm run release:status`

Esse backend foi pensado para ser uma base real de produção, mas com controle total meu sobre quando e como evoluir.
