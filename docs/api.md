# Referência da API (explicada de forma direta)

Idioma: **Português (Brasil)** | English: [api.en.md](./api.en.md)

Esse arquivo é a explicação da API do backend no jeito que eu apresento o projeto.  
Se você quiser especificação técnica para ferramentas, também tem o `swagger.yaml`.

## Visão rápida de permissões

- `admin`: acesso total.
- `editor`: gerencia conteúdo (sem privilégios máximos).
- `guest`: perfil padrão mais limitado.

As permissões são aplicadas no middleware `authorizeAction`.

## 1) Autenticação

Objetivo: controlar acesso ao painel e manter sessão segura.

- `POST /api/auth/register`
  - Registro público está desativado neste projeto.
  - Body: `{ name, email, password, headline?, bio? }`
  - Retorno esperado: `403` (somente admin configurado pode acessar painel).

- `POST /api/auth/login`
  - Faz login e devolve tokens.
  - Body: `{ email, password }`
  - Retornos: `200` (ok), `401` (credencial inválida).

- `POST /api/auth/refresh`
  - Renova sessão com refresh token (cookie/body).

- `GET /api/auth/me`
  - Retorna usuário autenticado atual.

- `POST /api/auth/logout`
  - Encerra sessão e limpa cookie/token.

- `POST /api/auth/forgot-password`
  - Dispara fluxo de recuperação de senha.
  - Body: `{ email }`

- `POST /api/auth/reset-password`
  - Reseta senha usando token recebido por email.
  - Body: `{ token, password }`

## 2) Projetos

Objetivo: alimentar seção principal do portfolio com paginação e filtros.

- `GET /api/projects`
  - Lista projetos com paginação/filtros.
  - Query: `page`, `limit`, `sortBy`, `sortOrder`, `featured`, `category`, `technology`.

- `GET /api/projects/featured`
  - Lista só projetos em destaque.

- `GET /api/projects/:id`
  - Busca projeto específico.

- `POST /api/projects` (`admin`)
  - Cria projeto.

- `PUT /api/projects/:id` (`admin`)
  - Atualiza projeto.

- `DELETE /api/projects/:id` (`admin`)
  - Remove projeto.

- `POST /api/projects/:slug/views`
  - Registra visualização única por IP.
  - Se o mesmo IP repetir, não incrementa novamente dentro da janela de deduplicação.
  - Resposta: `{ views, counted }` (`counted=true` quando realmente somou +1).

## 3) Certificados

Objetivo: mostrar credenciais e evolução técnica.

- `GET /api/certificates`
  - Lista com paginação e filtros.

- `GET /api/certificates/:id`
  - Detalhe de um certificado.

- CRUD administrativo segue o mesmo padrão de projetos (`admin`).

## 4) Blog

Objetivo: publicar conteúdo técnico e registrar interação.

- `GET /api/blog`
  - Lista posts com filtros (`tag`, `category`, `published` etc).

- `GET /api/blog/:id`
  - Retorna post específico.

- `POST /api/blog` (`admin`)
  - Cria post.

- `POST /api/blog/:postId/comments`
  - Cria comentário no post.

- `PATCH /api/blog/:postId/comments/:commentId` (`admin`)
  - Aprova/reprova comentário.

- `POST /api/blog/:slug/views`
  - Registra visualização única por IP.
  - Resposta: `{ views, counted }`.

## 5) Depoimentos

Objetivo: prova social do portfolio.

- `GET /api/testimonials`
  - Lista depoimentos com paginação.

- Criação pode ser pública.
- Moderação/edição/exclusão é administrativa.

## 6) Busca

Objetivo: facilitar navegação quando o conteúdo crescer.

- `GET /api/search`
  - Busca federada em projetos, certificados e blog.
  - Query: `q`, `limit`.
  - Resultado usa cache por termo.

## 7) Contato

Objetivo: transformar visitas em oportunidade real.

- `POST /api/contact`
  - Recebe mensagem pública.
  - Pode notificar email admin, se configurado.

- `PATCH /api/contact/:id/status` (`admin`)
  - Atualiza status do contato (`new`, `in-progress`, `resolved`).

## 8) Newsletter

Objetivo: manter relacionamento contínuo com visitantes.

- `POST /api/newsletter/subscribe`
  - Inscreve com confirmação (double opt-in).

- `POST /api/newsletter/unsubscribe`
  - Remove/descadastra inscrição.

- `GET /api/newsletter` (`admin`)
  - Lista inscritos com filtros.

- `POST /api/newsletter/send` (`admin`)
  - Dispara envio manual.

- `DELETE /api/newsletter/:id` (`admin`)
  - Remove inscrito.

## 9) Analytics e Admin

Objetivo: eu ter visão clara do que está acontecendo na plataforma.

- `POST /api/analytics`
  - Ingestão de eventos.

- `GET /api/analytics/summary` (`admin`)
  - Resumo agregado.

- `GET /api/analytics/timeline` (`admin`)
  - Evolução temporal.

- `GET /api/admin/metrics` (`admin`)
  - Métricas gerais e atividade recente.

- `GET /api/admin/export/subscribers` (`admin`)
  - Exporta newsletter em CSV.

- `GET /api/admin/export/contacts` (`admin`)
  - Exporta contatos em CSV.

## Endpoints de operação

- `GET /health`: saúde básica.
- `GET /ready`: prontidão para tráfego.
- `GET /metrics`: métricas Prometheus.

## Eventos em tempo real (Socket.IO)

Namespace: `/notifications`

- Evento emitido pelo backend: `views:update`
  - Payload: `{ contentType, contentKey, views, timestamp }`
  - Canais recomendados:
    - `public-metrics` (frontend público)
    - `admin-alerts` (painel admin)

Se novos módulos forem entrando (ex.: chat avançado, automações, jobs), eu mantenho esse documento atualizado no mesmo estilo: direto, objetivo e com contexto de negócio.
