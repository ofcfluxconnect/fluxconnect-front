# Deploy na Vercel (CI/CD)

O FluxConnect é um site estático (HTML, CSS e JS, sem etapa de build). A publicação é feita pelo GitHub Actions, no arquivo `.github/workflows/ci-cd.yml`.

## O que acontece em cada situação

| Situação | O que roda |
| --- | --- |
| Pull Request para `main` | Verificações + publicação de um **preview** (endereço de teste) |
| Push na `main` (merge do PR) | Verificações + publicação em **produção** |
| Botão "Run workflow" na aba Actions | Verificações; publica em produção se a branch escolhida for a `main` |

Se as verificações falharem, nada é publicado.

## Configuração (uma vez só)

### 1. Criar o projeto na Vercel

No computador, dentro da pasta do projeto:

```bash
npm install --global vercel
vercel login
vercel link
```

O `vercel link` pergunta a conta e o nome do projeto e cria a pasta `.vercel/` (ela não vai para o Git). Dentro dela, o arquivo `project.json` traz dois valores usados no passo 3:

```json
{ "orgId": "team_xxxxxxxx", "projectId": "prj_xxxxxxxx" }
```

### 2. Criar o token

Em <https://vercel.com/account/tokens>, crie um token (por exemplo, "github-actions") e copie o valor. Ele só aparece uma vez.

### 3. Cadastrar os segredos no GitHub

No repositório: **Settings > Secrets and variables > Actions > New repository secret**.

| Nome | Valor |
| --- | --- |
| `VERCEL_TOKEN` | o token do passo 2 |
| `VERCEL_ORG_ID` | o `orgId` do `project.json` |
| `VERCEL_PROJECT_ID` | o `projectId` do `project.json` |

### 4. Ambientes (opcional)

O workflow usa os ambientes `preview` e `production` do GitHub, criados automaticamente na primeira execução. Em **Settings > Environments > production** dá para exigir a aprovação de alguém antes de cada publicação em produção.

## Arquivos envolvidos

| Arquivo | Para que serve |
| --- | --- |
| `.github/workflows/ci-cd.yml` | O pipeline (verificar, preview e produção) |
| `scripts/verificar.js` | As verificações |
| `vercel.json` | Configuração do site na Vercel |
| `.vercelignore` | O que **não** é enviado (docs, scripts, arquivos `.md`) |

Pontos do `vercel.json`:

- A raiz do site (`/`) redireciona para a tela de login.
- `git.deploymentEnabled: false` desliga a publicação automática da própria Vercel. Assim, mesmo que o repositório seja conectado no painel da Vercel, só o GitHub Actions publica e nada sai sem passar pelas verificações.

## As verificações

`scripts/verificar.js` confere:

1. a sintaxe de todos os arquivos `.js`;
2. se os arquivos `.json` são válidos;
3. se todo link local (`href`, `src` e `url()` do CSS) aponta para um arquivo que existe, **com as mesmas maiúsculas e minúsculas**.

O terceiro item importa porque o Windows abre `consultas/index.html` mesmo que a pasta se chame `Consultas`, mas a Vercel roda em Linux e responde 404.

Para rodar no seu computador antes de abrir o PR:

```bash
node scripts/verificar.js
```

## Limitação conhecida

Os dados (agendamentos, tema, notificações lidas) ficam no `localStorage` do navegador. Cada endereço de preview tem o seu próprio armazenamento, então o que é agendado num preview não aparece em outro nem em produção.
