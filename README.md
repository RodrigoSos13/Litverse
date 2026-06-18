# LitVerse

LitVerse is a didactic full-stack web system that combines a literary social network with MongoDB-focused data modeling.

## 1. Project structure

```text
litverse/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- app.js
|   |   |-- seed.js
|   |   `-- server.js
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   `-- package.json
`-- README.md
```

## 2. Backend

### Principais collections

- `usuarios`: dados de perfil, contadores e informacoes publicas.
- `livros`: catalogo, metadados e resumo desnormalizado de avaliacoes.
- `leituras`: relacao entre usuario e livro com status e nota.
- `publicacoes`: feed social e contadores de curtidas/comentarios.
- `comentarios`: comentarios das publicacoes.
- `curtidas`: curtidas das publicacoes, uma por usuario e publicacao.

### Run backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

## 3. Frontend

### Pages

- `/`: home with search, featured books, feed and sidebar.
- `/users/:id`: profile page with readings grouped by status and user posts.
- `/books/:id`: book details with average rating and related posts.
- `/create-post`: form for creating a new post.

### Demo interactions

- Simple user signup card in the home sidebar.
- Like and comment actions connected to `likes` and `comments` endpoints.

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend consumes the backend through `axios` using `http://localhost:5000/api`.

## 4. Data modeling explanation

### Referencing decisions

- `publicacoes.usuario`, `publicacoes.livro`, `comentarios.usuario`, `comentarios.publicacao`, `curtidas.usuario`, `curtidas.publicacao`, `leituras.usuario` e `leituras.livro` use references because these relations grow independently and are queried in many combinations.
- `leituras` stays in its own collection instead of being embedded in `usuarios`, because a user can accumulate many books and filtering by status/book would become harder and heavier.
- `comentarios` and `curtidas` stay separated from `publicacoes` because they can grow without bounds. This avoids large post documents and keeps updates isolated.

### Small denormalization for performance

- `livros.mediaAvaliacoes` and `livros.totalAvaliacoes` are stored directly in the `livros` collection to avoid recalculating ratings for every book page request.
- `publicacoes.totalCurtidas` and `publicacoes.totalComentarios` are stored in the post document to keep the feed lightweight.
- `usuarios.totalSeguidores` and `usuarios.totalSeguindo` are counters prepared for fast profile rendering.

### Indexes

- `usuarios.usuario` and `usuarios.email` are indexed and unique.
- `livros` has a text index on `titulo` and `autor` for search.
- `leituras` has a unique compound index on `usuario + livro`.
- `publicacoes` is indexed by `createdAt`, `usuario + createdAt`, and `livro + createdAt`.
- `comentarios` is indexed by `publicacao + createdAt`.
- `curtidas` has a unique compound index on `publicacao + usuario`.
