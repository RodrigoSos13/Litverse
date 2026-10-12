# LitVerse

Rede social literária com React, Express e MongoDB. Organize suas leituras, publique resenhas, opiniões e fanarts, curta publicações e converse sobre livros.

## Rodar com Docker

Instale Docker com o plugin Compose (ou Docker Desktop). Não é necessário instalar Node.js ou MongoDB no computador.

Na raiz do projeto:

```bash
docker compose up --build -d --wait
```

Abra **http://localhost:8080** e clique em **Criar conta**. O banco começa vazio: o cadastro e a criação de livros funcionam imediatamente. Login aceita e-mail ou nome de usuário.

O frontend é compilado e servido pelo Nginx, que encaminha `/api` para o backend. A API e o MongoDB não publicam portas no computador. O Compose aguarda os healthchecks do banco e da API antes de iniciar seus dependentes, conforme a [documentação do Docker](https://docs.docker.com/compose/how-tos/startup-order/).

Comandos úteis:

```bash
# Ver o estado dos serviços
docker compose ps

# Acompanhar logs
docker compose logs -f

# Parar os serviços; os dados continuam preservados
docker compose down

# Atualizar containers depois de mudar o código
docker compose up --build -d --wait
```

Os dados ficam no volume `litverse_mongo-data`, separado do repositório e do MongoDB instalado no computador. `docker compose down -v` apaga esse volume e todos os dados da instalação Docker.

### Configuração opcional

O comando de inicialização funciona sem `.env`. Se a porta 8080 estiver ocupada, copie `.env.example` para `.env` na raiz e ajuste os dois valores juntos:

```dotenv
APP_PORT=8081
APP_ORIGIN=http://localhost:8081
```

Reexecute `docker compose up --build -d --wait` e abra a nova URL. Use a origem exata indicada em `APP_ORIGIN`; `localhost` e `127.0.0.1` são origens diferentes. O arquivo `.env` é local e não deve ser enviado ao GitHub.

### Dados de demonstração (opcional)

Para experimentar com livros, posts e duas contas de exemplo, crie o `.env` na raiz a partir de `.env.example` e adicione `SEED_PASSWORD` com uma senha escolhida por você, de 8 a 128 caracteres. Depois:

```bash
docker compose up -d --wait
docker compose exec backend npm run seed
```

**O seed apaga o banco Docker antes de popular os exemplos.** Execute apenas em uma instalação de teste. As contas `alice@litverse.com` e `leo@litverse.com` usam a senha que você definiu em `SEED_PASSWORD`. Não há senha padrão publicada no código.

### Contas antigas

Para definir a senha de uma conta existente sem apagar seus dados:

```bash
docker compose exec backend npm run user:set-password
```

O comando pede e-mail e nova senha no terminal administrativo e encerra as sessões anteriores da conta. A instalação Docker não importa automaticamente o banco local antigo.

## Preparar para publicar no GitHub

O `.gitignore` exclui ambientes reais, dependências, `dist`, dados locais do MongoDB, dumps, backups, logs, credenciais e arquivos pessoais de ferramentas. Os arquivos `.env.example` contêm somente exemplos de configuração e podem ser publicados. Os `package-lock.json` devem ser publicados para reproduzir a instalação.

Os `.dockerignore` usam uma lista explícita dos arquivos necessários ao build e excluem ambientes e credenciais também em subpastas. O Docker não copia seu `.env`, suas dependências locais ou seu banco para as imagens.

Antes do commit, execute na raiz (requer Python 3):

```bash
python3 scripts/check-publication.py
git status --short
git diff
git diff --cached
```

A verificação inspeciona o índice, os arquivos atuais publicáveis e todos os commits alcançáveis pelos refs locais. Procura arquivos sensíveis, chaves privadas, tokens conhecidos e URLs MongoDB com credenciais. Ela informa o caminho e o tipo do problema, sem imprimir o valor encontrado. É uma verificação heurística, não uma garantia de ausência de segredos.

Se uma credencial tiver sido commitada, apenas adicionar ao `.gitignore` ou apagar o arquivo não a retira do histórico. Revogue a credencial e remova-a do histórico antes de publicar. Os arquivos gerados de `frontend/dist` foram retirados do índice; versões antigas continuam no histórico, sem indícios de segredos nos padrões auditados.

## Desenvolvimento sem Docker

Requisitos: Node.js compatível com o projeto, npm e MongoDB.

```bash
cd backend
npm ci
cp .env.example .env
npm run db:start
```

Em outro terminal:

```bash
cd backend
npm run dev
```

E para o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Acesse http://localhost:5173. Por padrão, o frontend usa a API em `http://localhost:5000/api` e o backend conecta em `mongodb://127.0.0.1:27017/litverse`. Configure `MONGODB_URI` e `FRONTEND_ORIGIN` em `backend/.env` se necessário. `VITE_API_URL` pode ser definido em `frontend/.env.local`; qualquer variável `VITE_*` é incorporada ao JavaScript público, portanto não coloque segredos nela.

Para usar o seed localmente, defina `SEED_PASSWORD` em `backend/.env`; `npm run seed` também apaga o banco local configurado. Para contas antigas locais, use `npm run user:set-password` dentro de `backend/`.

## Autenticação

Todas as páginas de dados e suas APIs exigem login. Senhas são armazenadas com scrypt e salt aleatório. A sessão fica em cookie HttpOnly e SameSite=Lax, válido por sete dias; o MongoDB persiste apenas o hash do token. Logout revoga a sessão no servidor. A identidade das ações vem da sessão, inclusive ao visitar perfis de outras pessoas, e a edição de perfil aceita apenas campos permitidos da própria conta.

O Compose fornecido é para testes locais via HTTP, com o frontend publicado apenas em `127.0.0.1`. Para uma implantação pública, configure HTTPS, `NODE_ENV=production`, a origem pública e frontend/API no mesmo site. O cookie torna-se Secure em produção. O limite de tentativas de autenticação é por IP e por processo; o Nginx sobrescreve o cabeçalho de IP e o backend confia somente no proxy imediatamente anterior. Não exponha diretamente a API com `TRUST_PROXY=1`. Em múltiplas instâncias, adote um limitador compartilhado no gateway e autenticação apropriada para o banco.

## Validação

```bash
# Testes de autenticação e autorização; exigem mongod no computador
cd backend
npm test

# Compilação do frontend
cd ../frontend
npm run build
```

Os testes usam MongoDB temporário isolado e verificam senhas, sessão, cadastro, bloqueio de visitantes, tentativa de falsificar identidade, logout, expiração e limite de tentativas.

## Estrutura e dados

- `backend/src/auth`: senhas, sessões e rotas de autenticação.
- `backend/src/models`, `controllers`, `routes`: API e modelos MongoDB.
- `frontend/src`: interface React e contexto de autenticação.
- `compose.yaml`: frontend, backend, MongoDB, redes e volume persistente.
- `scripts/check-publication.py`: auditoria antes da publicação.

Collections: `usuarios`, `livros`, `leituras`, `publicacoes`, `comentarios`, `curtidas` e `sessions`. Usuários e livros são referenciados nos relacionamentos, permitindo que posts, comentários e leituras cresçam independentemente. Avaliações médias e contadores de interação são desnormalizados para simplificar consultas. Índices únicos protegem e-mail, usuário, leitura por usuário/livro e curtida por usuário/publicação; outros índices atendem feed, catálogo e filtros.
