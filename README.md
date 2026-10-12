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

## Catálogo com Google Books

A página inicial apresenta um único catálogo: livros cadastrados manualmente e encontrados no Google Books usam os mesmos cards e o mesmo botão **Ver livro**. Apenas os livros provenientes do Google mostram a indicação de origem. A busca por título, autor ou ISBN retorna exclusivamente edições em português, em páginas de até 12 resultados, e remove duplicações por ID ou ISBN. Mesmo com o banco vazio, as sugestões iniciais buscam clássicos e títulos conhecidos, como Dom Casmurro, O Pequeno Príncipe, O Hobbit e O Alquimista. Não há seletor para outros idiomas. A busca exige todos os termos no título ou autor e reconhece ISBN com hífens. A paginação usa o cursor real do Google, examinando lotes de até 40 itens até preencher a página, esgotar os resultados ou atingir o limite de tempo de 45 segundos para descartar idiomas incorretos, resultados irrelevantes e duplicações. Livros locais aparecem na primeira página da consulta; respostas de pesquisas anteriores são descartadas. Se a próxima página falhar, os livros da página atual permanecem visíveis para tentar novamente.

Clique em **Ver livro** para abrir a edição. Se ainda não estiver salva, o servidor a importa automaticamente para o LitVerse com título, autores, gênero, sinopse, capa, editora, idioma, ISBN, páginas e ano disponíveis. A importação consulta os dados no servidor e mantém uma única edição por ID do Google, inclusive em requisições simultâneas. Livros já importados abrem diretamente, preservando suas avaliações e interações. Avaliações, comentários e leituras continuam sendo dados da comunidade; as notas do Google não são importadas. O cadastro manual continua disponível.

### Ativar as consultas

1. No [Google Cloud Console](https://console.cloud.google.com/apis/library/books.googleapis.com), selecione ou crie seu projeto e ative a **Books API**.
2. Crie uma chave em **APIs e serviços → Credenciais** e restrinja seu uso à **Books API**.
3. Para Docker, copie `.env.example` para `.env` na **raiz do projeto**, se ainda não existir, e preencha `GOOGLE_BOOKS_API_KEY` com sua chave. Para execução sem Docker, preencha essa variável em `backend/.env`.
4. No Docker, execute `docker compose up --build -d --wait`; na execução local, reinicie o backend.

Não coloque a chave em `VITE_*`, no frontend ou em arquivos versionados. O `.env` continua ignorado pelo Git e pelos builds Docker, e a chave é enviada ao Google somente pelo backend. O auditor de publicação também detecta o formato usual de chaves Google.

A integração depende de conexão externa, chave válida e cota disponível no projeto Google. Sem configuração ou durante uma falha externa, os livros já salvos e o cadastro manual continuam funcionando. As sugestões iniciais usam uma seleção de títulos conhecidos; o servidor mantém apenas resultados em português com títulos correspondentes, descartando guias e materiais sobre essas obras. A busca tem timeout, até duas novas tentativas em falhas temporárias do Google, cache em memória de cinco minutos (até 100 consultas) e limite de 60 solicitações por minuto por usuário e por processo. Cotas do Google são compartilhadas pelo projeto; confira os limites no Console.

Os metadados podem estar incompletos e diferentes edições têm IDs diferentes. O idioma é validado tanto nas respostas externas quanto na importação e na listagem local; edições existentes em outras línguas ou sem idioma confirmado não aparecem no catálogo, mas seus registros não são apagados. Novos cadastros manuais são registrados em português. Capas ausentes recebem uma apresentação local. As páginas exibem atribuição e links para o Google Books. Não é necessário usar login Google: a integração consulta apenas o catálogo público e não envia posts, comentários ou avaliações do LitVerse ao serviço. Consulte a [documentação da API](https://developers.google.com/books/docs/v1/using) e suas [diretrizes de atribuição](https://developers.google.com/books/branding).

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

Os testes usam MongoDB temporário isolado e verificam senhas, sessão, cadastro, bloqueio de visitantes, tentativa de falsificar identidade, logout, expiração e limite de tentativas. A integração Google Books é testada com respostas externas simuladas: normalização, paginação, cache, timeout, falhas, proteção da chave e importação simultânea sem duplicar edições. Os testes não consomem sua cota Google nem exigem chave real.

## Estrutura e dados

- `backend/src/auth`: senhas, sessões e rotas de autenticação.
- `backend/src/models`, `controllers`, `routes`: API e modelos MongoDB.
- `frontend/src`: interface React e contexto de autenticação.
- `compose.yaml`: frontend, backend, MongoDB, redes e volume persistente.
- `scripts/check-publication.py`: auditoria antes da publicação.

Collections: `usuarios`, `livros`, `leituras`, `publicacoes`, `comentarios`, `curtidas` e `sessions`. Usuários e livros são referenciados nos relacionamentos, permitindo que posts, comentários e leituras cresçam independentemente. Avaliações médias e contadores de interação são desnormalizados para simplificar consultas. Índices únicos protegem e-mail, usuário, leitura por usuário/livro e curtida por usuário/publicação; outros índices atendem feed, catálogo e filtros.
