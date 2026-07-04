# Backend Library Box

API em Node.js e Express para o sistema Library Box.

## Banco de dados

O arquivo `database.sql` cria o banco `librarybox` e as tabelas usadas pelo sistema:

- `books`
- `users`
- `feed_posts`
- `reservations`
- `book_interactions`
- `comments`
- `contact_messages`

## Configuracao

Crie um arquivo `.env` com base em `.env.example`.

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=librarybox
DB_PORT=3306
PORT=3000
```

## Comandos

```bash
npm install
npm start
```

Servidor local:

```text
http://localhost:3000
```
