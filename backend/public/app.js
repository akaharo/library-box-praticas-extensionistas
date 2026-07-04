const state = {
  user: JSON.parse(localStorage.getItem("libraryboxUser") || "null"),
  books: [],
  users: [],
  posts: [],
  reservations: [],
  comments: []
};

const $ = (selector) => document.querySelector(selector);

const els = {
  loginView: $("#loginView"),
  dashboardView: $("#dashboardView"),
  loginForm: $("#loginForm"),
  loginEmail: $("#loginEmail"),
  loginPassword: $("#loginPassword"),
  loginMensagem: $("#loginMensagem"),
  logoutBtn: $("#logoutBtn"),
  statusBanco: $("#statusBanco"),
  perfilRotulo: $("#perfilRotulo"),
  dashboardTitulo: $("#dashboardTitulo"),
  dashboardDescricao: $("#dashboardDescricao"),
  usuarioNome: $("#usuarioNome"),
  usuarioEmail: $("#usuarioEmail"),
  adminTabs: $("#adminTabs"),
  adminPanel: $("#adminPanel"),
  readerPanel: $("#readerPanel"),
  readerFeed: $("#readerFeed"),
  readerBooks: $("#readerBooks"),
  bookForm: $("#bookForm"),
  bookId: $("#bookId"),
  title: $("#title"),
  author: $("#author"),
  category: $("#category"),
  bookStatus: $("#bookStatus"),
  bookFormTitulo: $("#bookFormTitulo"),
  salvarBookBtn: $("#salvarBookBtn"),
  limparBookBtn: $("#limparBookBtn"),
  bookMensagem: $("#bookMensagem"),
  booksTabela: $("#booksTabela"),
  booksContador: $("#booksContador"),
  atualizarBooksBtn: $("#atualizarBooksBtn"),
  userForm: $("#userForm"),
  userId: $("#userId"),
  userName: $("#userName"),
  userEmail: $("#userEmail"),
  userPassword: $("#userPassword"),
  userRole: $("#userRole"),
  userStatus: $("#userStatus"),
  userFormTitulo: $("#userFormTitulo"),
  salvarUserBtn: $("#salvarUserBtn"),
  limparUserBtn: $("#limparUserBtn"),
  userMensagem: $("#userMensagem"),
  usersTabela: $("#usersTabela"),
  usersContador: $("#usersContador"),
  feedForm: $("#feedForm"),
  postId: $("#postId"),
  postTitle: $("#postTitle"),
  postType: $("#postType"),
  postMessage: $("#postMessage"),
  feedFormTitulo: $("#feedFormTitulo"),
  salvarFeedBtn: $("#salvarFeedBtn"),
  limparFeedBtn: $("#limparFeedBtn"),
  feedMensagem: $("#feedMensagem"),
  feedLista: $("#feedLista"),
  feedContador: $("#feedContador"),
  atualizarReservasBtn: $("#atualizarReservasBtn"),
  reservasTabela: $("#reservasTabela"),
  atualizarComentariosBtn: $("#atualizarComentariosBtn"),
  comentariosTabela: $("#comentariosTabela"),
  atualizarContatosBtn: $("#atualizarContatosBtn"),
  contatosLista: $("#contatosLista")
};

async function api(url, options = {}) {
  const resposta = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const corpo = resposta.status === 204 ? null : await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo?.message || "Erro na requisicao.");
  }

  return corpo;
}

function mensagem(elemento, texto, tipo = "info") {
  elemento.textContent = texto;
  elemento.dataset.tipo = tipo;
}

function tagStatus(valor) {
  return `tag status-${String(valor).toLowerCase().replaceAll(" ", "-")}`;
}

function limparTabela(tbody, colunas, texto) {
  tbody.innerHTML = `<tr><td colspan="${colunas}" class="estado">${texto}</td></tr>`;
}

function criarBotao(texto, classe, onClick) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener("click", onClick);
  return botao;
}

function estrelas(valor) {
  const nota = Math.max(0, Math.min(5, Math.round(Number(valor) || 0)));
  return `${"★".repeat(nota)}${"☆".repeat(5 - nota)}`;
}

async function verificarStatus() {
  try {
    const status = await api("/api/status");
    els.statusBanco.textContent = `MySQL conectado: ${status.database}`;
  } catch (error) {
    els.statusBanco.textContent = `MySQL desconectado: ${error.message}`;
  }
}

async function login(event) {
  event.preventDefault();

  try {
    const user = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: els.loginEmail.value,
        password: els.loginPassword.value
      })
    });
    state.user = user;
    localStorage.setItem("libraryboxUser", JSON.stringify(user));
    mensagem(els.loginMensagem, "Login realizado com sucesso.", "sucesso");
    window.location.href = user.role === "admin" ? "/login?painel=admin" : "/";
  } catch (error) {
    mensagem(els.loginMensagem, error.message, "erro");
  }
}

function logout() {
  state.user = null;
  els.dashboardView.classList.add("escondido");
  els.loginView.classList.remove("escondido");
  els.logoutBtn.classList.add("escondido");
}

async function abrirDashboard() {
  els.loginView.classList.add("escondido");
  els.dashboardView.classList.remove("escondido");
  els.logoutBtn.classList.remove("escondido");
  els.usuarioNome.textContent = state.user.name;
  els.usuarioEmail.textContent = state.user.email;

  if (state.user.role === "admin") {
    els.perfilRotulo.textContent = "Painel administrativo";
    els.dashboardTitulo.textContent = "Gestao da Library Box";
    els.dashboardDescricao.textContent = "Controle livros, usuarios, mural e solicitacoes da biblioteca.";
    els.adminTabs.classList.remove("escondido");
    els.adminPanel.classList.remove("escondido");
    els.readerPanel.classList.add("escondido");
    await carregarTudoAdmin();
  } else {
    els.perfilRotulo.textContent = "Area do leitor";
    els.dashboardTitulo.textContent = "Minha biblioteca";
    els.dashboardDescricao.textContent = "Acompanhe avisos, veja o acervo e solicite reservas.";
    els.adminTabs.classList.add("escondido");
    els.adminPanel.classList.add("escondido");
    els.readerPanel.classList.remove("escondido");
    await carregarAreaLeitor();
  }
}

function trocarAba(event) {
  const botao = event.target.closest("[data-tab]");
  if (!botao) return;

  document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("ativo"));
  document.querySelectorAll(".tab-panel").forEach((item) => item.classList.add("escondido"));
  botao.classList.add("ativo");
  $(`#${botao.dataset.tab}`).classList.remove("escondido");
}

async function carregarTudoAdmin() {
  await Promise.all([
    carregarLivros(),
    carregarUsuarios(),
    carregarFeed(),
    carregarReservas(),
    carregarComentariosAdmin(),
    carregarContatos()
  ]);
}

async function carregarAreaLeitor() {
  await Promise.all([carregarLivros(), carregarFeed()]);
  renderReaderBooks();
  renderReaderFeed();
}

async function carregarLivros() {
  state.books = await api("/api/books");
  renderBooksTable();
}

function renderBooksTable() {
  els.booksTabela.innerHTML = "";
  els.booksContador.textContent = `${state.books.length} registros`;

  if (state.books.length === 0) {
    limparTabela(els.booksTabela, 6, "Nenhum livro cadastrado.");
    return;
  }

  state.books.forEach((book) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td><span class="tag">${book.category}</span></td>
      <td><span class="${tagStatus(book.status)}">${book.status}</span></td>
      <td><div class="acoes"></div></td>
    `;
    const acoes = tr.querySelector(".acoes");
    acoes.append(
      criarBotao("Editar", "acao editar", () => editarLivro(book)),
      criarBotao("Disponivel", "acao editar", () => alterarStatusLivro(book.id, "Disponivel")),
      criarBotao("Reservado", "acao editar", () => alterarStatusLivro(book.id, "Reservado")),
      criarBotao("Emprestado", "acao editar", () => alterarStatusLivro(book.id, "Emprestado")),
      criarBotao("Excluir", "acao excluir", () => deletarLivro(book.id))
    );
    els.booksTabela.appendChild(tr);
  });
}

function renderReaderBooks() {
  els.readerBooks.innerHTML = "";

  state.books.forEach((book, index) => {
    const card = document.createElement("article");
    const capa = ["capa-terracota", "capa-verde", "capa-amarela", "capa-azul"][index % 4];
    card.className = "card-livro";
    card.innerHTML = `
      <div class="capa ${capa}">
        <span>${book.category}</span>
        <strong>${book.title}</strong>
      </div>
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <span class="${tagStatus(book.status)}">${book.status}</span>
    `;
    const botao = criarBotao("Reservar", "botao mini", () => solicitarReserva(book.id));
    botao.disabled = book.status !== "Disponivel";
    card.appendChild(botao);
    els.readerBooks.appendChild(card);
  });
}

function editarLivro(book) {
  els.bookId.value = book.id;
  els.title.value = book.title;
  els.author.value = book.author;
  els.category.value = book.category;
  els.bookStatus.value = book.status;
  els.bookFormTitulo.textContent = `Alterar livro #${book.id}`;
  els.salvarBookBtn.textContent = "Salvar alteracao";
  mensagem(els.bookMensagem, "Edite o livro e salve.", "info");
}

function limparLivro() {
  els.bookForm.reset();
  els.bookId.value = "";
  els.bookFormTitulo.textContent = "Cadastrar livro";
  els.salvarBookBtn.textContent = "Salvar livro";
  mensagem(els.bookMensagem, "Pronto para cadastrar um novo livro.", "info");
}

async function salvarLivro(event) {
  event.preventDefault();
  const id = els.bookId.value;
  const payload = {
    title: els.title.value,
    author: els.author.value,
    category: els.category.value,
    status: els.bookStatus.value
  };

  try {
    await api(id ? `/api/books/${id}` : "/api/books", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    mensagem(els.bookMensagem, id ? "Livro alterado com sucesso." : "Livro cadastrado com sucesso.", "sucesso");
    limparLivro();
    await carregarLivros();
  } catch (error) {
    mensagem(els.bookMensagem, error.message, "erro");
  }
}

async function deletarLivro(id) {
  if (!window.confirm(`Deseja excluir o livro #${id}?`)) return;
  await api(`/api/books/${id}`, { method: "DELETE" });
  await carregarLivros();
}

async function alterarStatusLivro(id, status) {
  await api(`/api/books/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  await carregarLivros();
}

async function carregarUsuarios() {
  state.users = await api("/api/users");
  renderUsersTable();
}

function renderUsersTable() {
  els.usersTabela.innerHTML = "";
  els.usersContador.textContent = `${state.users.length} registros`;

  if (state.users.length === 0) {
    limparTabela(els.usersTabela, 6, "Nenhum usuario cadastrado.");
    return;
  }

  state.users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="tag">${user.role}</span></td>
      <td><span class="${tagStatus(user.status)}">${user.status}</span></td>
      <td><div class="acoes"></div></td>
    `;
    tr.querySelector(".acoes").append(
      criarBotao("Editar", "acao editar", () => editarUsuario(user)),
      criarBotao("Excluir", "acao excluir", () => deletarUsuario(user.id))
    );
    els.usersTabela.appendChild(tr);
  });
}

function editarUsuario(user) {
  els.userId.value = user.id;
  els.userName.value = user.name;
  els.userEmail.value = user.email;
  els.userPassword.value = "123456";
  els.userRole.value = user.role;
  els.userStatus.value = user.status;
  els.userFormTitulo.textContent = `Alterar usuario #${user.id}`;
  els.salvarUserBtn.textContent = "Salvar alteracao";
  mensagem(els.userMensagem, "Informe a senha desejada e salve.", "info");
}

function limparUsuario() {
  els.userForm.reset();
  els.userId.value = "";
  els.userFormTitulo.textContent = "Cadastrar usuario";
  els.salvarUserBtn.textContent = "Salvar usuario";
  mensagem(els.userMensagem, "Pronto para cadastrar um usuario.", "info");
}

async function salvarUsuario(event) {
  event.preventDefault();
  const id = els.userId.value;
  const payload = {
    name: els.userName.value,
    email: els.userEmail.value,
    password: els.userPassword.value,
    role: els.userRole.value,
    status: els.userStatus.value
  };

  try {
    await api(id ? `/api/users/${id}` : "/api/users", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    mensagem(els.userMensagem, id ? "Usuario alterado com sucesso." : "Usuario cadastrado com sucesso.", "sucesso");
    limparUsuario();
    await carregarUsuarios();
  } catch (error) {
    mensagem(els.userMensagem, error.message, "erro");
  }
}

async function deletarUsuario(id) {
  if (state.user?.id === id) {
    mensagem(els.userMensagem, "Voce nao pode excluir o usuario logado.", "erro");
    return;
  }

  if (!window.confirm(`Deseja excluir o usuario #${id}?`)) return;
  await api(`/api/users/${id}`, { method: "DELETE" });
  await carregarUsuarios();
}

async function carregarFeed() {
  state.posts = await api("/api/feed");
  renderFeedAdmin();
}

function renderFeedAdmin() {
  els.feedLista.innerHTML = "";
  els.feedContador.textContent = `${state.posts.length} registros`;

  if (state.posts.length === 0) {
    els.feedLista.innerHTML = `<p class="estado">Nenhum aviso publicado.</p>`;
    return;
  }

  state.posts.forEach((post) => {
    const article = document.createElement("article");
    article.className = "feed-item";
    article.innerHTML = `
      <span>${post.type}</span>
      <h3>${post.title}</h3>
      <p>${post.message}</p>
      <small>${post.createdAt || ""}</small>
      <div class="acoes"></div>
    `;
    article.querySelector(".acoes").append(
      criarBotao("Editar", "acao editar", () => editarPost(post)),
      criarBotao("Excluir", "acao excluir", () => deletarPost(post.id))
    );
    els.feedLista.appendChild(article);
  });
}

function renderReaderFeed() {
  els.readerFeed.innerHTML = "";

  if (state.posts.length === 0) {
    els.readerFeed.innerHTML = `<article class="nota"><span>Mural</span><p>Nenhum recado publicado ainda.</p></article>`;
    return;
  }

  state.posts.slice(0, 3).forEach((post) => {
    const nota = document.createElement("article");
    nota.className = "nota";
    nota.innerHTML = `<span>${post.type}</span><p>${post.message}</p>`;
    els.readerFeed.appendChild(nota);
  });
}

function editarPost(post) {
  els.postId.value = post.id;
  els.postTitle.value = post.title;
  els.postType.value = post.type;
  els.postMessage.value = post.message;
  els.feedFormTitulo.textContent = `Alterar aviso #${post.id}`;
  els.salvarFeedBtn.textContent = "Salvar alteracao";
  mensagem(els.feedMensagem, "Edite o aviso e salve.", "info");
}

function limparPost() {
  els.feedForm.reset();
  els.postId.value = "";
  els.feedFormTitulo.textContent = "Publicar aviso";
  els.salvarFeedBtn.textContent = "Salvar aviso";
  mensagem(els.feedMensagem, "Pronto para publicar no feed.", "info");
}

async function salvarPost(event) {
  event.preventDefault();
  const id = els.postId.value;
  const payload = {
    title: els.postTitle.value,
    type: els.postType.value,
    message: els.postMessage.value
  };

  try {
    await api(id ? `/api/feed/${id}` : "/api/feed", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    mensagem(els.feedMensagem, id ? "Aviso alterado com sucesso." : "Aviso publicado com sucesso.", "sucesso");
    limparPost();
    await carregarFeed();
  } catch (error) {
    mensagem(els.feedMensagem, error.message, "erro");
  }
}

async function deletarPost(id) {
  if (!window.confirm(`Deseja excluir o aviso #${id}?`)) return;
  await api(`/api/feed/${id}`, { method: "DELETE" });
  await carregarFeed();
}

async function carregarReservas() {
  state.reservations = await api("/api/reservations");
  els.reservasTabela.innerHTML = "";

  if (state.reservations.length === 0) {
    limparTabela(els.reservasTabela, 6, "Nenhuma reserva solicitada.");
    return;
  }

  state.reservations.forEach((reserva) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${reserva.id}</td>
      <td>${reserva.userName}</td>
      <td>${reserva.bookTitle}</td>
      <td><span class="${tagStatus(reserva.status)}">${reserva.status}</span></td>
      <td>${reserva.createdAt}</td>
      <td><div class="acoes"></div></td>
    `;
    const acoes = tr.querySelector(".acoes");
    acoes.append(
      criarBotao("Concluir", "acao editar", () => alterarReserva(reserva.id, "Concluida")),
      criarBotao("Liberar", "acao editar", () => alterarReserva(reserva.id, "Cancelada")),
      criarBotao("Excluir", "acao excluir", () => deletarReserva(reserva.id))
    );
    els.reservasTabela.appendChild(tr);
  });
}

async function carregarComentariosAdmin() {
  state.comments = await api("/api/comments");
  renderComentariosAdmin();
}

function renderComentariosAdmin() {
  els.comentariosTabela.innerHTML = "";

  if (state.comments.length === 0) {
    limparTabela(els.comentariosTabela, 7, "Nenhum comentario publicado.");
    return;
  }

  state.comments.forEach((comentario) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${comentario.id}</td>
      <td>${comentario.bookTitle || `Livro #${comentario.bookId}`}</td>
      <td>${comentario.userName}</td>
      <td><span class="avaliacao-admin">${estrelas(comentario.rating)}</span></td>
      <td>${comentario.message}</td>
      <td>${comentario.createdAt || ""}</td>
      <td><div class="acoes"></div></td>
    `;
    tr.querySelector(".acoes").append(
      criarBotao("Excluir", "acao excluir", () => deletarComentarioAdmin(comentario.id))
    );
    els.comentariosTabela.appendChild(tr);
  });
}

async function carregarContatos() {
  const contatos = await api("/api/contact");
  els.contatosLista.innerHTML = "";

  if (contatos.length === 0) {
    els.contatosLista.innerHTML = `<p class="estado">Nenhuma mensagem recebida.</p>`;
    return;
  }

  contatos.forEach((contato) => {
    const article = document.createElement("article");
    article.className = "feed-item";
    article.innerHTML = `
      <span>${contato.subject}</span>
      <h3>${contato.name}</h3>
      <p>${contato.message}</p>
      <small>${contato.email} · ${contato.createdAt || ""}</small>
    `;
    els.contatosLista.appendChild(article);
  });
}

async function solicitarReserva(bookId) {
  try {
    await api("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ userId: state.user.id, bookId })
    });
    await carregarAreaLeitor();
  } catch (error) {
    window.alert(error.message);
  }
}

async function alterarReserva(id, status) {
  await api(`/api/reservations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  await Promise.all([carregarReservas(), carregarLivros()]);
}

async function deletarReserva(id) {
  if (!window.confirm(`Deseja excluir a reserva #${id}?`)) return;
  await api(`/api/reservations/${id}`, { method: "DELETE" });
  await Promise.all([carregarReservas(), carregarLivros()]);
}

async function deletarComentarioAdmin(id) {
  if (!window.confirm(`Deseja excluir o comentario #${id}?`)) return;
  await api(`/api/comments/${id}?userId=${state.user.id}&role=${state.user.role}`, { method: "DELETE" });
  await carregarComentariosAdmin();
}

els.loginForm.addEventListener("submit", login);
els.logoutBtn.addEventListener("click", logout);
els.adminTabs.addEventListener("click", trocarAba);
els.bookForm.addEventListener("submit", salvarLivro);
els.limparBookBtn.addEventListener("click", limparLivro);
els.atualizarBooksBtn.addEventListener("click", carregarLivros);
els.userForm.addEventListener("submit", salvarUsuario);
els.limparUserBtn.addEventListener("click", limparUsuario);
els.feedForm.addEventListener("submit", salvarPost);
els.limparFeedBtn.addEventListener("click", limparPost);
els.atualizarReservasBtn.addEventListener("click", carregarReservas);
els.atualizarComentariosBtn.addEventListener("click", carregarComentariosAdmin);
els.atualizarContatosBtn.addEventListener("click", carregarContatos);

verificarStatus();

if (state.user && new URLSearchParams(window.location.search).get("painel") === "admin") {
  abrirDashboard();
}
