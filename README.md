# MalhaIA — Frontend

Interface Angular do planejador de grade curricular: grafo de pré-requisitos com animação, caminho crítico restante conforme progresso, busca até eletiva, REA e oferta da coordenação.

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
2. Clique em **Criar conta** (`/cadastro`).
3. Preencha e-mail, senha e escolha **Sou Aluno** ou **Coordenação**.
   - O campo “Nome completo” é só visual; o backend recebe `email`, `senha` e `papel`.
4. Após o cadastro/login você cai em `/grafo`.
5. O grafo anima o caminho restante (progresso) e destaca ofertadas do semestre.

### Contas de teste (se já existirem no banco)

| E-mail | Senha | Papel |
|---|---|---|
| `aluno@ia.test` | `senha123` | ALUNO |
| `coord@ia.test` | `senha123` | COORDENACAO |

(Criadas durante os testes locais; se não existirem, cadastre pela UI.)

---

## 5. Rotas da aplicação

| Rota | Acesso | O que faz |
|---|---|---|
| `/login` | público | Login JWT |
| `/cadastro` | público | Cadastro ALUNO / COORDENACAO |
| `/grafo` | autenticado | Grafo + caminho restante + oferta do semestre |
| `/progresso` | autenticado | Marcar disciplinas concluídas |
| `/eletiva` | autenticado | Menor caminho até uma disciplina |
| `/rea` | autenticado | Disciplinas elegíveis ao REA |
| `/coordenacao` | só `COORDENACAO` | Oferta / vagas por semestre |

- Usuário deslogado em rota protegida → `/login`.
- `ALUNO` tentando `/coordenacao` → redirecionado.
- Link **Coordenação** só aparece na navbar se o papel for `COORDENACAO`.

**Sessão:** o JWT fica **só em memória** (signal do `AuthService`). Dar F5 na página exige login de novo.

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
  ui/            botao, input, card, navbar
  features/
    auth/        login, cadastro
    grafo/       página + mapa D3 + layout
    progresso/
    eletiva/
    rea/
    coordenacao/
```

---

## 8. Problemas comuns

| Sintoma | O que checar |
|---|---|
| `ng` / CLI reclama da versão do Node | Use Node 24.15+ e ajuste o PATH |
| Tela branca / erros de API no console | Backend `UP`? Proxy apontando para a porta certa? |
| Sempre volta para `/login` | JWT só em memória — faça login de novo após refresh |
| `403` em Coordenação | Conta precisa ser `COORDENACAO` |
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
