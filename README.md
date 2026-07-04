# Library Box

Sistema web para apoio ao gerenciamento de uma biblioteca escolar.

## Integrantes

- Bernardo Haro Massignani
- Marcelo Schuermann

## Tecnologias

- HTML
- CSS
- JavaScript
- Node.js
- Express
- MySQL
- XAMPP/phpMyAdmin

## Estrutura

```text
.
- index.html
- styles.css
- script.js
- cadastro.html
- reservas.html
- comentarios.html
- relatorios.html
- contato.html
- docs/
  - diagrama-biblioteca-escolar.pdf
  - diagramas-atualizados.md
- backend/
  - server.js
  - database.sql
  - package.json
  - public/
```

## Como rodar

1. Ligue o MySQL no XAMPP.
2. Execute o script `backend/database.sql` no phpMyAdmin.
3. Entre na pasta `backend`.
4. Instale as dependencias com `npm install`.
5. Crie o arquivo `.env` com base em `.env.example`.
6. Inicie o servidor com `npm start`.
7. Acesse `http://localhost:3000`.

## Acessos de teste

Administrador:

```text
admin@librarybox.com
admin123
```

Usuario:

```text
aluno@librarybox.com
aluno123
```

## Funcionalidades

- Consulta publica do acervo.
- Login e cadastro de leitores.
- CRUD de livros, usuarios e avisos.
- Controle de reservas.
- Comentarios e avaliacoes de livros.
- Rankings de livros e leitores.
- Formulario de contato.

## Diagramas

Os diagramas atualizados do projeto estao em `docs/diagramas-atualizados.md`.
