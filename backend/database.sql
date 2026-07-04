CREATE DATABASE IF NOT EXISTS librarybox;

USE librarybox;

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'usuario',
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS feed_posts (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Solicitada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO books (title, author, category, status)
SELECT 'Casa de Vento', 'Marina Duarte', 'Literatura', 'Disponivel'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Casa de Vento');

INSERT INTO books (title, author, category, status)
SELECT 'Ciencia em Casa', 'Rafael Nunes', 'Estudo', 'Disponivel'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Ciencia em Casa');

INSERT INTO books (title, author, category, status)
SELECT 'O Jardim Secreto', 'Frances Hodgson Burnett', 'Infantil', 'Disponivel'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'O Jardim Secreto');

INSERT INTO users (name, email, password, role, status)
SELECT 'Administrador Library Box', 'admin@librarybox.com', 'admin123', 'admin', 'Ativo'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@librarybox.com');

INSERT INTO users (name, email, password, role, status)
SELECT 'Aluno Visitante', 'aluno@librarybox.com', 'aluno123', 'usuario', 'Ativo'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aluno@librarybox.com');

INSERT INTO feed_posts (title, message, type)
SELECT 'Roda de leitura', 'Encontro hoje as 15h para conversar sobre as leituras da semana.', 'Aviso'
WHERE NOT EXISTS (SELECT 1 FROM feed_posts WHERE title = 'Roda de leitura');
