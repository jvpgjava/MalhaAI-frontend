# MalhaIA — Frontend

Interface Angular que visualiza a grade curricular como um grafo, destaca a
cadeia crítica até a formatura, permite simular reprovações, buscar o
caminho até uma disciplina eletiva, e conversar com a camada de IA para
explicações e dúvidas sobre normas institucionais (REA, PPC).

Este documento pressupõe que o backend (ver `README_BACKEND.md`) já expõe
os endpoints citados em cada fase. Se um endpoint ainda não existir,
implemente a tela contra um mock e deixe isso explícito no código, não
espere — mas não avance pra fase seguinte sem a integração real
funcionando.

## Stack

- Angular 21, standalone components, **zoneless por padrão** (sem Zone.js) — é o padrão novo da versão, não precisa configurar nada extra pra ligar
- Signals como forma principal de estado dos componentes, em vez do padrão antigo de propriedade solta + detecção de mudança manual
- `httpResource()` para buscar dado da API combinando com signal, no lugar do padrão antigo `HttpClient` + `.subscribe()` espalhado pelo componente — confirme a estabilidade exata da API na versão do Angular instalada no momento da implementação, porque ela vem amadurecendo rápido a cada release
- Vitest para os testes, no lugar de Karma/Jasmine (removidos como padrão a partir da v21)
- TypeScript
- D3.js para o desenho do grafo — recomendado em vez de uma lib pronta tipo
  ngx-graph porque o layout aqui é por camada de semestre (colunas fixas),
  não um layout de força genérico, e D3 dá controle total sobre isso
- Angular Material ou Tailwind para os componentes de UI (decidir na Fase 1
  e manter consistente daí em diante)
- RxJS para consumo da API

## Estrutura de páginas

- `/login` e `/cadastro` — autenticação (públicas; cadastro só `ALUNO`)
- `/grafo` — visualização principal do grafo curricular com a cadeia
  crítica destacada
- `/progresso` — disciplinas concluídas (`ALUNO` / `DEV`)
- `/eletiva` — busca do menor caminho até uma disciplina eletiva
- `/rea` — painel com as disciplinas elegíveis ao regime de Estudo Especial
- `/documentos` — indexação RAG (`PROFESSOR` / `COORDENACAO` / `DEV`)
- `/coordenacao` — oferta e vagas por semestre (`COORDENACAO` / `DEV`)
- `/admin` — criação de contas de qualquer papel (`DEV`)
- `/duvidas` — chat de perguntas sobre normas institucionais (camada RAG)

## Arquitetura de pastas (por feature)

```
src/app/
  core/          servicos singleton (AuthService, interceptor de token),
                 guards de rota, configuracao de ambiente
  ui/            componentes de design system puros — Botao, Card,
                 LegendaDoMapa — sem chamada de API nem logica de negocio,
                 so apresentacao e input/output
  features/
    auth/        login, cadastro, perfil
    grafo/       visualizacao do grafo, painel de disciplina
    progresso/   meu progresso
    eletiva/     busca de eletiva
    rea/         painel REA
    documentos/  indexação RAG
    coordenacao/ oferta semestral
    admin/       gestão de contas (DEV)
    duvidas/     chat RAG
```

Cada `feature` é uma área roteada com seus próprios componentes e serviço
de acesso a dado; uma feature não importa componente interno de outra.
O que precisa ser compartilhado vira `ui/` (se for só apresentação) ou
`core/` (se for serviço/estado transversal, como autenticação).

## Fonte de verdade visual

O layout de cada tela vem do arquivo real no Figma, não só da descrição
em texto deste documento:
https://www.figma.com/design/UMB3ZL7zhBwvhqQYOxSTFT/MalhaAI?node-id=0-1&t=uIGlpLAwgGrDon3N-1

Se o servidor Figma Dev Mode MCP estiver conectado (`/mcp` mostrando
`figma-desktop`), abra esse arquivo no Figma Desktop, selecione o frame
da tela que for implementar — um frame por vez, nunca o arquivo inteiro
de uma chamada só — e use `get_code`, `get_variable_defs` e `get_image`
sobre esse frame antes de escrever o componente. Isso dá a estrutura e os
tokens reais em vez de aproximar a partir de descrição em texto. Se o MCP
não estiver disponível na sessão, implemente a partir da descrição de
cada tela nas fases abaixo mesmo assim, mas deixe registrado que foi sem
acesso ao arquivo real.

## Boas práticas de código

- Componente pequeno, um responsável por tela ou seção — extraia um
  sub-componente quando o template passar de uns 150 linhas ou quando
  duas telas passarem a repetir o mesmo bloco de template.
- Toda transformação de dado fora do template: use `computed()` ou uma
  função pura num serviço, nunca lógica condicional complexa dentro de um
  `@if`/`@for` do template.
- Um serviço de acesso a dado por feature (`GrafoService`,
  `CoordenacaoService`) — componente não chama `HttpClient`/
  `httpResource()` direto, sempre passa pelo serviço da própria feature.
- Interface TypeScript tipada pra toda resposta de API — nunca `any`, e
  nunca campo opcional só porque "às vezes vem, às vezes não" sem
  entender por quê.
- Nomeie pelo que o componente mostra, não por onde ele mora
  (`PainelReaComponent`, não `ReaPageComponent2`).

## Signals — padrões esperados

- Estado local mutável: `signal()`. Valor derivado de outro estado:
  `computed()` — nunca replique um `computed()` na mão com um segundo
  `signal()` atualizado por `effect()`.
- Entrada e saída de componente: `input()` e `output()` baseados em
  signal (padrão do Angular moderno), não os decorators antigos
  `@Input()`/`@Output()`.
- Campo simples com two-way binding (ex.: campo de busca da Fase 6): use
  `model()`. O formulário de oferta semestral (Fase 7) continua em
  Reactive Forms tradicional, como já decidido — não Signal Forms.
- Dado assíncrono da API: `httpResource()` (ver Fase 1) — nunca
  `.subscribe()` manual guardando resultado num campo de classe solto.
- `effect()` só pra sincronizar com algo fora do mundo Angular, como o
  D3 redesenhando um SVG (ver seção de D3 abaixo) — nunca use `effect()`
  pra derivar estado, isso é trabalho do `computed()`.
- O app é zoneless: não existe detecção de mudança automática por
  zone.js. Mutar um array ou objeto "no lugar" não atualiza a tela —
  sempre crie um valor novo via `.set()`/`.update()` de forma imutável.

## Testes unitários (Vitest)

- Todo serviço de cálculo ou transformação de dado (a função que prepara
  a lista de nós do grafo pro D3 desenhar, por exemplo) tem teste
  isolado, sem precisar montar componente nem DOM.
- Componente de tela testado pelo que aparece e pelo que dispara ao
  interagir (comportamento), não pelo detalhe de implementação interna.
- Cobertura mínima inegociável até novembro: os serviços de `core/` e a
  função que decide a posição de cada nó no grafo por semestre — o resto
  do app pode ter cobertura mais fina se o tempo apertar.

## Integração com D3.js dentro do Angular

D3 manipula o DOM diretamente, o que conflita com o modelo declarativo do
Angular se não for isolado direito. Padrão a seguir:

- Um componente dedicado só ao grafo (`GrafoMapaComponent`), sem nenhuma
  outra responsabilidade — não misture lógica de rota ou de painel
  lateral dentro dele.
- D3 desenha dentro de um `<svg>` referenciado via `viewChild()`
  (baseado em signal), nunca manipulando elemento fora desse container.
- Um único `effect()` observa os signals de entrada (lista de nós, cadeia
  crítica, rota destacada) e redesenha o SVG quando qualquer um deles
  muda — não usar `ngOnChanges` nem lifecycle hook antigo pra isso.
- A posição de cada nó (coordenada x/y por disciplina e semestre) é
  calculada numa função pura, fora do código do D3 em si — D3 só aplica
  a posição já calculada, não decide layout sozinho. Isso separa "onde
  cada disciplina fica" (testável sem DOM, ver seção de testes acima) de
  "como desenhar isso" (D3).
- Limpeza: remover listener e transição pendente do D3 no cleanup do
  `effect()` (ou via `DestroyRef`), pra não vazar handler quando o
  componente for destruído — comum de esquecer com D3 especificamente
  porque ele guarda estado próprio fora do Angular.

## Segurança

- Nenhum segredo (chave de API de LLM, credencial de qualquer serviço)
  fica no código do cliente. O frontend só fala com a API do próprio
  MalhaIA; qualquer chamada a um provedor externo passa pelo backend (ver
  `README_BACKEND.md`).
- Angular sanitiza binding de template por padrão — não use
  `bypassSecurityTrustHtml` (ou similar) pra renderizar a resposta da IA
  nas Fases 9 e 10 sem necessidade real. Se for preciso exibir markdown da
  resposta, use uma biblioteca de markdown que já sanitiza a saída, nunca
  HTML cru vindo da IA.
- Validação de formulário no cliente é conveniência de UX, não segurança —
  o backend valida de novo tudo que chega, não confie só no que o Angular
  barrou antes de enviar.
- HTTPS obrigatório em qualquer ambiente que não seja localhost.
- O JWT retornado no login fica guardado em memória (um signal do serviço
  de autenticação), não em `localStorage`/`sessionStorage` — evita que um
  XSS consiga ler o token direto do storage. O efeito colateral é que dar
  refresh na página derruba a sessão; aceitável para o escopo deste
  projeto, documente isso se o grupo decidir mudar depois.

## Fases de desenvolvimento

### Fase 1 — Setup do projeto

- Criar o projeto Angular (`ng new` já vem zoneless e sem Zone.js por
  padrão na v21 — não desfaça isso), configurar roteamento entre as
  páginas listadas acima (podem começar vazias), layout base com
  cabeçalho e navegação.
- Serviço central de acesso à API do backend usando `httpResource()`,
  com a URL base configurável por ambiente. Evite criar um serviço com
  método + `.subscribe()` manual para cada chamada — a ideia é que cada
  componente exponha o dado da API como um signal direto.

**Critério de aceite:** navegação entre as páginas funcionando, e uma
chamada de teste ao endpoint `GET /api/grafo` exibindo o JSON bruto no
console do navegador.

### Fase 2 — Autenticação e papéis

- Páginas `/login` e `/cadastro`, consumindo `POST /api/auth/login` e
  `POST /api/auth/cadastro` do backend. Guardar o JWT retornado num signal
  do serviço de autenticação (ver nota de segurança acima), e o papel
  (`ALUNO` ou `COORDENACAO`) junto, já que a navegação muda conforme ele.
- Route guard que exige login em todas as páginas exceto `/login` e
  `/cadastro`, e guard adicional em `/coordenacao` exigindo papel
  `COORDENACAO` especificamente.
- Interceptor HTTP que anexa `Authorization: Bearer <token>` em toda
  chamada à API do backend automaticamente, sem repetir isso em cada
  serviço.

**Critério de aceite:** usuário `ALUNO` tentando acessar `/coordenacao`
direto pela URL é redirecionado; usuário deslogado tentando acessar
qualquer página protegida vai para `/login`.

### Fase 3 — Visualização estática do grafo

- Componente que desenha o grafo em colunas por semestre — nós são
  disciplinas, arestas são pré-requisitos. Reaproveite a lógica de layout
  já validada no diagrama de referência do grupo: cada semestre é uma
  coluna, os nós daquele semestre ficam alinhados verticalmente nela.
- Sem interatividade ainda nesta fase, só renderização a partir do JSON
  retornado pelo backend.

**Critério de aceite:** o grafo real (ou o de teste do backend) aparece
corretamente posicionado por semestre, sem sobreposição de nós.

### Fase 4 — Cadeia crítica destacada

- Consumir `GET /api/grafo/caminho-critico` e destacar visualmente os nós e
  arestas que compõem a cadeia crítica — vermelho para os nós/arestas da
  cadeia crítica, azul (ou neutro) para o restante, igual ao diagrama de
  referência do grupo.
- Exibir em destaque na tela o número total de semestres calculado até a
  formatura.

**Critério de aceite:** ao trocar os dados de teste do backend, a cadeia
crítica destacada na tela muda de acordo, sem precisar recarregar a
lógica de layout manualmente.

### Fase 5 — Simulação de reprovação

- Permitir clicar em um nó do grafo e marcá-lo como "reprovado", disparando
  nova chamada ao backend (ou recálculo local a partir dos dados já
  carregados — decidir na implementação conforme o que o backend expuser)
  e reanimando o grafo com o novo caminho crítico.
- Uma reprovação fora da cadeia crítica não deve mudar o total de
  semestres exibido; uma reprovação dentro da cadeia crítica deve.

**Critério de aceite:** reprovar uma disciplina da cadeia crítica aumenta
visivelmente o total de semestres exibido; reprovar uma disciplina fora
dela não muda esse número.

### Fase 6 — Busca até uma eletiva

- Página `/eletiva`: campo para selecionar a disciplina de destino
  (eletiva de interesse); a origem é automaticamente "tudo que o aluno
  logado já concluiu" (o backend já resolve isso pelo token, ver Fase 5
  do `README_BACKEND.md`). Consome `GET /api/grafo/caminho` e destaca a
  rota retornada sobre o mesmo componente de grafo da Fase 3.

**Critério de aceite:** a rota exibida na tela bate exatamente com o
resultado do endpoint testado isoladamente (mesma sequência de nós).

### Fase 7 — Formulário da coordenação

- Página `/coordenacao` (atrás do guard de papel `COORDENACAO` da Fase 2):
  lista as disciplinas do semestre corrente com um campo numérico de
  vagas e um checkbox "será ofertada nesse semestre". Use Reactive Forms
  tipado tradicional aqui, não Signal Forms — a API de Signal Forms ainda
  é experimental na v21, e este formulário não é complexo o bastante pra
  justificar o risco de uma API que pode mudar.
- Ao salvar, chama `POST /api/oferta` do backend.

**Critério de aceite:** marcar uma disciplina como não ofertada aqui
reflete no recálculo do grafo nas páginas `/grafo` e `/eletiva` na próxima
consulta; um usuário `ALUNO` não vê o link para `/coordenacao` na
navegação.

### Fase 8 — Painel de REA

- Página `/rea`: lista as disciplinas elegíveis ao regime de Estudo
  Especial do aluno logado, consumindo `GET /api/aluno/rea` (sem precisar
  passar id — o backend identifica pelo token), mostrando o motivo
  específico retornado (não ofertada ou conflito de horário).

**Critério de aceite:** a lista muda corretamente quando os dados de
oferta (Fase 7) ou de conflito de horário mudam no backend.

### Fase 9 — Painel de explicação em linguagem natural

- Ao clicar em uma disciplina no grafo, abrir um painel lateral (ou modal)
  com a explicação gerada pelo backend via `GET /api/explicacao/{id}`.
- Mostrar um estado de carregamento enquanto a IA responde — essa chamada
  não é instantânea como o resto da aplicação.

**Critério de aceite:** a explicação exibida corresponde sempre à
disciplina clicada, mesmo se o usuário clicar em outra antes da resposta
anterior terminar de carregar (cancelar ou ignorar a resposta antiga).

### Fase 10 — Chat de dúvidas institucionais (RAG)

- Página `/duvidas`: campo de pergunta em linguagem natural, exibição da
  resposta com o trecho-fonte citado, consumindo `POST /api/perguntas`.

**Critério de aceite:** perguntas de teste sobre o conteúdo carregado no
backend retornam resposta com a fonte citada visível na tela, não só a
resposta em si.

### Fase 11 — Polimento

- Responsividade básica (a tela de grafo pelo menos utilizável em tablet).
- Estados de erro tratados: backend fora do ar, disciplina não encontrada,
  IA indisponível (a navegação e o grafo devem continuar funcionando mesmo
  se as camadas de IA falharem).
- Acessibilidade mínima: contraste adequado, navegação por teclado nos
  formulários.
- Uma tela ou modo de apresentação com dados de exemplo pré-carregados,
  útil para gravar o vídeo de demonstração da mostra.

## Decisões em aberto

Resolver com o grupo antes de começar, porque mudam a Fase 1 e se propagam
para o resto:

1. **Biblioteca de desenho do grafo** — D3.js é a recomendação deste
   documento, mas confirmar com quem for implementar o front, já que muda
   a curva de aprendizado da Fase 3.
2. **Framework de UI** — Angular Material ou Tailwind.

Autenticação já está decidida (login com dois papéis, ALUNO e
COORDENACAO — ver Fase 2 aqui e Fase 4 do `README_BACKEND.md`), não
precisa reabrir essa discussão.
