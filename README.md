# LitVerse

Rede social literária para descobrir livros, organizar leituras e compartilhar resenhas e fanarts. Desenvolvida com React, Express e MongoDB.

## Rodar o sistema

**Requisito:** Docker com Docker Compose (ou Docker Desktop). Não é necessário instalar Node.js ou MongoDB separadamente.

Na raiz do projeto, execute:

```bash
docker compose up --build -d --wait
```

Acesse **http://localhost:8080** e clique em **Criar conta**. O banco começa vazio; você pode cadastrar livros manualmente.

O modo de desenvolvimento atualiza a interface e reinicia o backend ao salvar alterações no código. Após mudar dependências ou Dockerfiles, execute novamente o comando acima.

## Importar livros (opcional)

Copie o arquivo de configuração, caso ainda não tenha um `.env`:

```bash
cp -n .env.example .env
```

No `.env` da raiz, preencha `GOOGLE_BOOKS_API_KEY` com uma chave da **Books API** do Google Cloud. Depois, aplique a configuração:

```bash
docker compose up -d --wait
```

O catálogo será alimentado automaticamente em segundo plano. Para importar um autor específico:

```bash
docker compose exec backend npm run catalog:sync -- "Stephen King"
```

Sem a chave, o sistema continua funcionando com os livros cadastrados localmente.

## Comandos úteis

```bash
# Acompanhar logs
docker compose logs -f

# Conferir os serviços
docker compose ps

# Parar sem apagar os dados
docker compose down
```

Os dados ficam em um volume Docker e são preservados entre execuções.
