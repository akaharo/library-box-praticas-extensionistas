require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT) || 3000;
const painelPath = path.join(__dirname, "public");
const frontendPath = path.join(__dirname, "..");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "librarybox",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath, { index: false }));
app.use("/painel", express.static(painelPath));

[
  "/cadastro.html",
  "/reservas.html",
  "/comentarios.html",
  "/relatorios.html",
  "/contato.html",
  "/cadastro.js",
  "/reservas.js",
  "/comentarios.js",
  "/relatorios.js",
  "/contato.js"
].forEach((route) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(frontendPath, route.slice(1)));
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(painelPath, "index.html"));
});

async function iniciarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100) NOT NULL,
      author VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      status VARCHAR(30) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      password VARCHAR(60) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'usuario',
      status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100) NOT NULL,
      message VARCHAR(255) NOT NULL,
      type VARCHAR(40) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Solicitada',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS book_interactions (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      liked TINYINT NOT NULL DEFAULT 0,
      favorite TINYINT NOT NULL DEFAULT 0,
      rating INTEGER NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_book (user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      message VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      message VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await inserirSeNaoExistir("books", "title", "Casa de Vento", `
    INSERT INTO books (title, author, category, status)
    VALUES ('Casa de Vento', 'Marina Duarte', 'Literatura', 'Disponivel')
  `);
  await inserirSeNaoExistir("books", "title", "Ciencia em Casa", `
    INSERT INTO books (title, author, category, status)
    VALUES ('Ciencia em Casa', 'Rafael Nunes', 'Estudo', 'Disponivel')
  `);
  await inserirSeNaoExistir("books", "title", "O Jardim Secreto", `
    INSERT INTO books (title, author, category, status)
    VALUES ('O Jardim Secreto', 'Frances Hodgson Burnett', 'Infantil', 'Disponivel')
  `);
  const livrosExtras = [
    ["Mapa do Rio", "Theo Martins", "Aventuras", "Disponivel"],
    ["Noite de Leitura", "Clara Bento", "Literatura", "Disponivel"],
    ["Pequeno Manual do Ceu", "Helena Prado", "Estudo", "Disponivel"],
    ["A Ilha das Cartas", "Jonas Ribeiro", "Aventuras", "Disponivel"],
    ["Poemas de Bolso", "Lia Amaral", "Literatura", "Disponivel"],
    ["Matematica Sem Medo", "Caio Ferraz", "Estudo", "Disponivel"],
    ["O Trem das Onze Histórias", "Nina Campos", "Infantil", "Disponivel"],
    ["Diario de Uma Biblioteca", "Sofia Lemos", "Literatura", "Disponivel"],
    ["Planeta Curioso", "Rafael Nunes", "Estudo", "Disponivel"]
  ];

  for (const livro of livrosExtras) {
    await inserirSeNaoExistir("books", "title", livro[0], `
      INSERT INTO books (title, author, category, status)
      VALUES (${pool.escape(livro[0])}, ${pool.escape(livro[1])}, ${pool.escape(livro[2])}, ${pool.escape(livro[3])})
    `);
  }
  await inserirSeNaoExistir("users", "email", "admin@librarybox.com", `
    INSERT INTO users (name, email, password, role, status)
    VALUES ('Administrador Library Box', 'admin@librarybox.com', 'admin123', 'admin', 'Ativo')
  `);
  await inserirSeNaoExistir("users", "email", "aluno@librarybox.com", `
    INSERT INTO users (name, email, password, role, status)
    VALUES ('Aluno Visitante', 'aluno@librarybox.com', 'aluno123', 'usuario', 'Ativo')
  `);
  await inserirSeNaoExistir("feed_posts", "title", "Roda de leitura", `
    INSERT INTO feed_posts (title, message, type)
    VALUES ('Roda de leitura', 'Encontro hoje as 15h para conversar sobre as leituras da semana.', 'Aviso')
  `);
}

async function inserirSeNaoExistir(tabela, coluna, valor, sql) {
  const [linhas] = await pool.query(`SELECT id FROM ${tabela} WHERE ${coluna} = ? LIMIT 1`, [valor]);

  if (linhas.length === 0) {
    await pool.query(sql);
  }
}

function validarLivro(dados) {
  const title = String(dados.title || "").trim();
  const author = String(dados.author || "").trim();
  const category = String(dados.category || "").trim();
  const status = String(dados.status || "").trim();
  const statusPermitidos = ["Disponivel", "Reservado", "Emprestado"];

  if (!title || title.length > 100) return { erro: "Informe um titulo com ate 100 caracteres." };
  if (!author || author.length > 100) return { erro: "Informe um autor com ate 100 caracteres." };
  if (!category || category.length > 50) return { erro: "Informe uma categoria com ate 50 caracteres." };
  if (!statusPermitidos.includes(status)) return { erro: "Situacao do livro invalida." };

  return { livro: { title, author, category, status } };
}

function validarStatusLivro(status) {
  const valor = String(status || "").trim();
  return ["Disponivel", "Reservado", "Emprestado"].includes(valor) ? valor : null;
}

function validarUsuario(dados) {
  const name = String(dados.name || "").trim();
  const email = String(dados.email || "").trim().toLowerCase();
  const password = String(dados.password || "").trim();
  const role = String(dados.role || "usuario").trim();
  const status = String(dados.status || "Ativo").trim();

  if (!name || name.length > 100) return { erro: "Informe um nome com ate 100 caracteres." };
  if (!email || email.length > 120 || !email.includes("@")) return { erro: "Informe um e-mail valido." };
  if (!password || password.length > 60) return { erro: "Informe uma senha com ate 60 caracteres." };
  if (!["admin", "usuario"].includes(role)) return { erro: "Perfil invalido." };
  if (!["Ativo", "Bloqueado"].includes(status)) return { erro: "Status invalido." };

  return { usuario: { name, email, password, role, status } };
}

function validarPost(dados) {
  const title = String(dados.title || "").trim();
  const message = String(dados.message || "").trim();
  const type = String(dados.type || "").trim();

  if (!title || title.length > 100) return { erro: "Informe um titulo com ate 100 caracteres." };
  if (!message || message.length > 255) return { erro: "Informe uma mensagem com ate 255 caracteres." };
  if (!type || type.length > 40) return { erro: "Informe um tipo com ate 40 caracteres." };

  return { post: { title, message, type } };
}

function validarContato(dados) {
  const name = String(dados.name || "").trim();
  const email = String(dados.email || "").trim().toLowerCase();
  const subject = String(dados.subject || "").trim();
  const message = String(dados.message || "").trim();

  if (!name || name.length > 100) return { erro: "Informe um nome com ate 100 caracteres." };
  if (!email || email.length > 120 || !email.includes("@")) return { erro: "Informe um e-mail valido." };
  if (!subject || subject.length > 100) return { erro: "Informe um assunto com ate 100 caracteres." };
  if (!message || message.length > 500) return { erro: "Informe uma mensagem com ate 500 caracteres." };

  return { contato: { name, email, subject, message } };
}

app.get("/api/status", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: process.env.DB_NAME || "librarybox" });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Nao foi possivel conectar ao MySQL.", detail: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE email = ? AND password = ? LIMIT 1",
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    }

    if (users[0].status !== "Ativo") {
      return res.status(403).json({ message: "Usuario bloqueado pelo administrador." });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login.", detail: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  const validacao = validarUsuario({ ...req.body, role: "usuario", status: "Ativo" });
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { name, email, password, role, status } = validacao.usuario;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, role, status]
    );
    res.status(201).json({ id: resultado.insertId, name, email, role, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao cadastrar usuario.", detail: error.message });
  }
});

app.get("/api/books", async (req, res) => {
  const userId = Number(req.query.userId) || 0;

  try {
    const [books] = await pool.query(
      `
      SELECT b.id, b.title, b.author, b.category, b.status,
             COALESCE(SUM(bi.liked), 0) AS likes,
             COALESCE(SUM(bi.favorite), 0) AS favorites,
             ROUND(AVG(bi.rating), 1) AS ratingAverage,
             COUNT(DISTINCT c.id) AS commentsCount,
             MAX(CASE WHEN bi.user_id = ? THEN bi.liked ELSE 0 END) AS userLiked,
             MAX(CASE WHEN bi.user_id = ? THEN bi.favorite ELSE 0 END) AS userFavorite,
             MAX(CASE WHEN bi.user_id = ? THEN bi.rating ELSE NULL END) AS userRating
      FROM books b
      LEFT JOIN book_interactions bi ON bi.book_id = b.id
      LEFT JOIN comments c ON c.book_id = b.id
      GROUP BY b.id, b.title, b.author, b.category, b.status
      ORDER BY b.id DESC
      `,
      [userId, userId, userId]
    );
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar livros.", detail: error.message });
  }
});

app.post("/api/books", async (req, res) => {
  const validacao = validarLivro(req.body);
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { title, author, category, status } = validacao.livro;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO books (title, author, category, status) VALUES (?, ?, ?, ?)",
      [title, author, category, status]
    );
    res.status(201).json({ id: resultado.insertId, title, author, category, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao inserir livro.", detail: error.message });
  }
});

app.put("/api/books/:id", async (req, res) => {
  const id = Number(req.params.id);
  const validacao = validarLivro(req.body);

  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { title, author, category, status } = validacao.livro;

  try {
    const [resultado] = await pool.query(
      "UPDATE books SET title = ?, author = ?, category = ?, status = ? WHERE id = ?",
      [title, author, category, status, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Livro nao encontrado." });
    res.json({ id, title, author, category, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar livro.", detail: error.message });
  }
});

app.patch("/api/books/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const status = validarStatusLivro(req.body.status);

  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });
  if (!status) return res.status(400).json({ message: "Situacao do livro invalida." });

  try {
    const [resultado] = await pool.query("UPDATE books SET status = ? WHERE id = ?", [status, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Livro nao encontrado." });
    res.json({ id, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar situacao do livro.", detail: error.message });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });

  try {
    const [resultado] = await pool.query("DELETE FROM books WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Livro nao encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar livro.", detail: error.message });
  }
});

app.post("/api/books/:id/like", async (req, res) => {
  await alternarInteracao(req, res, "liked");
});

app.post("/api/books/:id/favorite", async (req, res) => {
  await alternarInteracao(req, res, "favorite");
});

app.post("/api/books/:id/rating", async (req, res) => {
  const bookId = Number(req.params.id);
  const userId = Number(req.body.userId);
  const rating = Number(req.body.rating);

  if (!Number.isInteger(bookId) || !Number.isInteger(userId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Avaliacao invalida." });
  }

  try {
    await pool.query(
      `
      INSERT INTO book_interactions (user_id, book_id, rating)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating)
      `,
      [userId, bookId, rating]
    );
    res.json({ ok: true, rating });
  } catch (error) {
    res.status(500).json({ message: "Erro ao avaliar livro.", detail: error.message });
  }
});

async function alternarInteracao(req, res, campo) {
  const bookId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!Number.isInteger(bookId) || !Number.isInteger(userId)) {
    return res.status(400).json({ message: "Usuario ou livro invalido." });
  }

  try {
    await pool.query(
      `
      INSERT INTO book_interactions (user_id, book_id, ${campo})
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE ${campo} = IF(${campo} = 1, 0, 1)
      `,
      [userId, bookId]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Erro ao registrar interacao.", detail: error.message });
  }
}

app.get("/api/users", async (_req, res) => {
  try {
    const [users] = await pool.query("SELECT id, name, email, role, status FROM users ORDER BY id DESC");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar usuarios.", detail: error.message });
  }
});

app.get("/api/rankings/users", async (_req, res) => {
  try {
    const [ranking] = await pool.query(`
      SELECT u.id, u.name, u.email, COUNT(r.id) AS reservations
      FROM users u
      LEFT JOIN reservations r ON r.user_id = u.id
      WHERE u.role = 'usuario'
      GROUP BY u.id, u.name, u.email
      ORDER BY reservations DESC, u.name ASC
      LIMIT 8
    `);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar ranking de usuarios.", detail: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  const validacao = validarUsuario(req.body);
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { name, email, password, role, status } = validacao.usuario;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, role, status]
    );
    res.status(201).json({ id: resultado.insertId, name, email, role, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao inserir usuario.", detail: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const validacao = validarUsuario(req.body);

  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { name, email, password, role, status } = validacao.usuario;

  try {
    const [resultado] = await pool.query(
      "UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?",
      [name, email, password, role, status, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Usuario nao encontrado." });
    res.json({ id, name, email, role, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar usuario.", detail: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });

  try {
    const [resultado] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Usuario nao encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar usuario.", detail: error.message });
  }
});

app.get("/api/feed", async (_req, res) => {
  try {
    const [posts] = await pool.query(
      "SELECT id, title, message, type, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS createdAt FROM feed_posts ORDER BY id DESC"
    );
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar feed.", detail: error.message });
  }
});

app.get("/api/comments", async (req, res) => {
  const bookIdParam = Array.isArray(req.query.bookId) ? req.query.bookId[0] : req.query.bookId;
  const filtrarPorLivro = typeof bookIdParam === "string" && bookIdParam.trim().length > 0;
  const bookId = Number(bookIdParam);

  if (filtrarPorLivro && (!Number.isInteger(bookId) || bookId <= 0)) {
    return res.status(400).json({ message: "Livro invalido." });
  }

  try {
    const [comments] = await pool.query(
      `
      SELECT c.id, c.book_id AS bookId, c.message,
             DATE_FORMAT(c.created_at, '%d/%m/%Y %H:%i') AS createdAt,
             u.id AS userId, u.name AS userName,
             b.title AS bookTitle,
             bi.rating AS rating
      FROM comments c
      JOIN users u ON u.id = c.user_id
      JOIN books b ON b.id = c.book_id
      LEFT JOIN book_interactions bi ON bi.user_id = c.user_id AND bi.book_id = c.book_id
      ${filtrarPorLivro ? "WHERE c.book_id = ?" : ""}
      ORDER BY c.id DESC
      `,
      filtrarPorLivro ? [bookId] : []
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar comentarios.", detail: error.message });
  }
});

app.post("/api/comments", async (req, res) => {
  const userId = Number(req.body.userId);
  const bookId = Number(req.body.bookId);
  const message = String(req.body.message || "").trim();

  if (!Number.isInteger(userId) || !Number.isInteger(bookId) || !message || message.length > 255) {
    return res.status(400).json({ message: "Comentario invalido." });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO comments (user_id, book_id, message) VALUES (?, ?, ?)",
      [userId, bookId, message]
    );
    res.status(201).json({ id: resultado.insertId, userId, bookId, message });
  } catch (error) {
    res.status(500).json({ message: "Erro ao comentar.", detail: error.message });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.query.userId);
  const role = String(req.query.role || "");

  if (!Number.isInteger(id) || !Number.isInteger(userId)) {
    return res.status(400).json({ message: "Comentario invalido." });
  }

  try {
    const [resultado] = await pool.query(
      role === "admin" ? "DELETE FROM comments WHERE id = ?" : "DELETE FROM comments WHERE id = ? AND user_id = ?",
      role === "admin" ? [id] : [id, userId]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Comentario nao encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar comentario.", detail: error.message });
  }
});

app.post("/api/feed", async (req, res) => {
  const validacao = validarPost(req.body);
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { title, message, type } = validacao.post;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO feed_posts (title, message, type) VALUES (?, ?, ?)",
      [title, message, type]
    );
    res.status(201).json({ id: resultado.insertId, title, message, type });
  } catch (error) {
    res.status(500).json({ message: "Erro ao inserir aviso.", detail: error.message });
  }
});

app.put("/api/feed/:id", async (req, res) => {
  const id = Number(req.params.id);
  const validacao = validarPost(req.body);

  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { title, message, type } = validacao.post;

  try {
    const [resultado] = await pool.query(
      "UPDATE feed_posts SET title = ?, message = ?, type = ? WHERE id = ?",
      [title, message, type, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Aviso nao encontrado." });
    res.json({ id, title, message, type });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar aviso.", detail: error.message });
  }
});

app.delete("/api/feed/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });

  try {
    const [resultado] = await pool.query("DELETE FROM feed_posts WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Aviso nao encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar aviso.", detail: error.message });
  }
});

app.get("/api/reservations", async (_req, res) => {
  try {
    const [reservas] = await pool.query(`
      SELECT r.id, r.status, DATE_FORMAT(r.created_at, '%d/%m/%Y %H:%i') AS createdAt,
             u.name AS userName, b.title AS bookTitle
      FROM reservations r
      JOIN users u ON u.id = r.user_id
      JOIN books b ON b.id = r.book_id
      ORDER BY r.id DESC
    `);
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar reservas.", detail: error.message });
  }
});

app.post("/api/reservations", async (req, res) => {
  const userId = Number(req.body.userId);
  const bookId = Number(req.body.bookId);

  if (!Number.isInteger(userId) || !Number.isInteger(bookId)) {
    return res.status(400).json({ message: "Usuario ou livro invalido." });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO reservations (user_id, book_id, status) VALUES (?, ?, 'Solicitada')",
      [userId, bookId]
    );
    await pool.query("UPDATE books SET status = 'Reservado' WHERE id = ?", [bookId]);
    res.status(201).json({ id: resultado.insertId, userId, bookId, status: "Solicitada" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao solicitar reserva.", detail: error.message });
  }
});

app.put("/api/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || "").trim();
  const statusPermitidos = ["Solicitada", "Concluida", "Cancelada"];

  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });
  if (!statusPermitidos.includes(status)) return res.status(400).json({ message: "Status de reserva invalido." });

  try {
    const [reservas] = await pool.query("SELECT book_id AS bookId FROM reservations WHERE id = ? LIMIT 1", [id]);
    if (reservas.length === 0) return res.status(404).json({ message: "Reserva nao encontrada." });

    const [resultado] = await pool.query("UPDATE reservations SET status = ? WHERE id = ?", [status, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Reserva nao encontrada." });

    const novoStatusLivro = status === "Solicitada" ? "Reservado" : "Disponivel";
    await pool.query("UPDATE books SET status = ? WHERE id = ?", [novoStatusLivro, reservas[0].bookId]);

    res.json({ id, status });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar reserva.", detail: error.message });
  }
});

app.delete("/api/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID invalido." });

  try {
    const [reservas] = await pool.query("SELECT book_id AS bookId FROM reservations WHERE id = ? LIMIT 1", [id]);
    if (reservas.length === 0) return res.status(404).json({ message: "Reserva nao encontrada." });

    const [resultado] = await pool.query("DELETE FROM reservations WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Reserva nao encontrada." });
    await pool.query("UPDATE books SET status = 'Disponivel' WHERE id = ?", [reservas[0].bookId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar reserva.", detail: error.message });
  }
});

app.get("/api/contact", async (_req, res) => {
  try {
    const [messages] = await pool.query(
      "SELECT id, name, email, subject, message, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS createdAt FROM contact_messages ORDER BY id DESC"
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar contatos.", detail: error.message });
  }
});

app.post("/api/contact", async (req, res) => {
  const validacao = validarContato(req.body);
  if (validacao.erro) return res.status(400).json({ message: validacao.erro });

  const { name, email, subject, message } = validacao.contato;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name, email, subject, message]
    );
    res.status(201).json({ id: resultado.insertId, name, email, subject, message });
  } catch (error) {
    res.status(500).json({ message: "Erro ao enviar contato.", detail: error.message });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

iniciarBanco()
  .then(() => {
    app.listen(port, () => {
      console.log(`Library Box rodando em http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao preparar banco de dados:", error.message);
  });
