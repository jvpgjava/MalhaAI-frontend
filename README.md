# MalhaIA — Frontend

Interface Angular do planejador de grade curricular: grafo de pré-requisitos com animação, caminho crítico restante conforme progresso, busca até eletiva, REA, documentos (RAG), oferta da coordenação e gestão de contas (DEV).

Visual baseado no Figma: [MalhaAI](https://www.figma.com/design/UMB3ZL7zhBwvhqQYOxSTFT/MalhaAI).  
Planejamento das fases: [`README_FRONTEND.md`](README_FRONTEND.md).  
API: backend em [`MalhaAI-backend`](../MalhaAI-backend) — veja o `README.md` de lá.

---

## 1. O que instalar na máquina

| Ferramenta | Versão | Para quê |
|---|---|---|
| **Node.js** | **24.15+** (ou no mínimo 22.22.3) | Runtime do Angular CLI |
| **npm** | 11+ (vem com o Node) | Instalar dependências |
| **Git** | qualquer recente | Versionar o projeto |
| **Backend MalhaIA** | rodando local | Todas as telas autenticadas e a IA |

### Conferir (PowerShell)

```powershell
node -v
npm -v
```

Se o `node -v` mostrar algo abaixo de `v22.22.3`, o Angular 21 pode recusar. No Windows, se existir Node 24 em `C:\Program Files\nodejs`, priorize no PATH:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
node -v
```

### Backend (obrigatório)

O frontend **não** fala com Abacus/Gemini direto. Suba o backend antes:

1. Siga o `README.md` do `MalhaAI-backend` (JDK 25, Maven, PostgreSQL + pgvector).
2. Backend padrão: `http://localhost:8080`.
3. Health: `http://localhost:8080/actuator/health` deve retornar `UP`.

Para explicação IA, configure no backend (PowerShell **antes** do `mvn spring-boot:run`):

```powershell
$env:ABACUS_API_KEY = "sua_chave_abacus"          # ou ABACUSAI_API_KEY
$env:ABACUS_BASE_URL = "https://routellm.abacus.ai/v1"
$env:ABACUS_MODEL_NAME = "claude-sonnet-5"        # Claude Sonnet 5 na RouteLLM
$env:GOOGLE_API_KEY = "sua_chave_google"
$env:GEMINI_MODEL_NAME = "gemini-embedding-001"   # embeddings 768 dims
$env:FRONTEND_ORIGIN = "http://localhost:4200"
```

Sem essas chaves, login, grafo, progresso, eletiva, REA e coordenação continuam funcionando; as rotas de IA respondem 503.

---

## 2. Instalar o projeto

```powershell
cd C:\Users\joaog\MalhaAI-frontend
$env:Path = "C:\Program Files\nodejs;" + $env:Path

npm install
```

Isso baixa Angular 21, D3, Vitest e demais dependências em `node_modules/` (não versionar).

---

## 3. Subir o frontend

Com o **backend já no ar** na porta 8080:

```powershell
cd C:\Users\joaog\MalhaAI-frontend
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm start
```

Equivalente: `npx ng serve`.

Abra no navegador:

**http://localhost:4200**

### API (sem proxy)

O front chama o backend direto em `http://localhost:8080` (`environment.apiUrl`).  
Reinicie o backend com CORS liberando `http://localhost:4200` (já aceita `localhost` em qualquer porta).

Se o backend estiver em outra porta, edite `src/environments/environment.development.ts`.

---

## 4. Primeiro uso (fluxo recomendado)

1. Abra `http://localhost:4200` — deve redirecionar para `/login`.
2. Clique em **Criar conta** (`/cadastro`) — o cadastro público cria apenas **Estudante** (`ALUNO`).
3. Preencha e-mail e senha (nome completo é só visual na UI).
4. Após o login você cai em `/grafo`.
5. Papéis privilegiados (**Professor**, **Coordenação**, **Dev**) são criados pelo painel **Contas** (`/admin`), exclusivo de `DEV`.

### Papéis

| Papel | Acesso na UI |
|---|---|
| `ALUNO` (Estudante) | Grafo, Progresso, Eletiva, REA |
| `PROFESSOR` | Grafo, Documentos |
| `COORDENACAO` | Grafo, Documentos, Oferta |
| `DEV` | Tudo + Contas |

### Contas de teste (se já existirem no banco)

| E-mail | Senha | Papel |
|---|---|---|
| `aluno@teste.com` | `senha123` | DEV (ambiente local) |
| `estudante@malha.test` | `senha123` | ALUNO |
| `prof@malha.test` | `senha123` | PROFESSOR |
| `coord@teste.com` | `senha123` | COORDENACAO |

---

## 5. Rotas da aplicação

| Rota | Acesso | O que faz |
|---|---|---|
| `/login` | público | Login JWT |
| `/cadastro` | público | Cadastro de estudante (`ALUNO`) |
| `/grafo` | autenticado | Grafo + caminho restante + oferta do semestre |
| `/progresso` | `ALUNO` / `DEV` | Marcar disciplinas concluídas |
| `/eletiva` | `ALUNO` / `DEV` | Menor caminho até uma disciplina |
| `/rea` | `ALUNO` / `DEV` | Disciplinas elegíveis ao REA |
| `/documentos` | `PROFESSOR` / `COORDENACAO` / `DEV` | Indexar chunks seed (RAG) |
| `/coordenacao` | `COORDENACAO` / `DEV` | Oferta / vagas por semestre |
| `/admin` | `DEV` | Criar contas de qualquer papel |

- Usuário deslogado em rota protegida → `/login`.
- Papel sem permissão → redirecionado para a home do papel.
- A navbar só lista os links permitidos ao papel logado.

**Sessão:** JWT em memória (signals) e `sessionStorage` (`malhaia.auth`) — F5 mantém a sessão na aba.

---

## 6. Scripts úteis

```powershell
npm start                     # desenvolvimento (porta 4200 → API em :8080)
npm run build                 # build de produção → dist/
npm test -- --watch=false     # testes Vitest (uma vez)
npx ng version                # versões do Angular/CLI
```

---

## 7. Stack e pastas

- Angular 21 standalone, **zoneless**, Signals
- SCSS com tokens do Figma (`--color-primary`, `--color-accent`, …) — sem Tailwind
- D3.js no `GrafoMapaComponent` (layout por semestre + animação)
- Vitest

```
src/app/
  core/          AuthService, interceptor, guards, models da API
  ui/            botao, input, card, navbar, modal
  features/
    auth/        login, cadastro
    grafo/       página + mapa D3 + layout
    progresso/
    eletiva/
    rea/
    documentos/
    coordenacao/
    admin/       gestão de contas (DEV)
```

---

## 8. Problemas comuns

| Sintoma | O que checar |
|---|---|
| `ng` / CLI reclama da versão do Node | Use Node 24.15+ e ajuste o PATH |
| Tela branca / erros de API no console | Backend `UP`? Proxy apontando para a porta certa? |
| Sempre volta para `/login` | JWT só em memória — faça login de novo após refresh |
| `403` em Oferta / Documentos / Contas | Papel insuficiente (`COORDENACAO`/`PROFESSOR`/`DEV`) |
| Explicação IA com erro 503 | Chaves Abacus/Gemini no **backend**, não no front |
| Grafo não anima / não carrega | Confirme `GET /api/grafo` com token no Network do DevTools |
| CORS no browser | `FRONTEND_ORIGIN=http://localhost:4200` no backend |

---

## 9. Ordem completa (do zero)

```powershell
# A) Backend
cd C:\Users\joaog\MalhaAI-backend
psql -U postgres -h localhost -f scripts\setup-local-db.sql
# defina DB_*, JWT_*, ABACUS_*, GOOGLE_* se for usar IA
mvn spring-boot:run

# B) Frontend (outro terminal)
cd C:\Users\joaog\MalhaAI-frontend
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
npm start
```

Depois abra **http://localhost:4200**.
