const user = JSON.parse(localStorage.getItem("libraryboxUser") || "null");
const livroSelect = document.querySelector("#livro");
const lista = document.querySelector("#comentariosLista");
const mensagem = document.querySelector("#comentarioMensagem");
const loginLink = document.querySelector("#loginLink");
const livroCategoria = document.querySelector("#livroCategoria");
const livroTitulo = document.querySelector("#livroTitulo");
const livroAutor = document.querySelector("#livroAutor");
const livroEstrelas = document.querySelector("#livroEstrelas");
const livroMetricas = document.querySelector("#livroMetricas");
const comentariosTotal = document.querySelector("#comentariosTotal");

let livros = [];

document.body.classList.add("carregado");

if (user) {
  loginLink.textContent = user.role === "admin" ? "Painel admin" : user.name;
  loginLink.href = user.role === "admin" ? "/login?painel=admin" : "#";
}

function exigirLogin() {
  if (user) return true;
  window.location.href = "/login";
  return false;
}

async function api(url, options = {}) {
  const resposta = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const corpo = resposta.status === 204 ? null : await resposta.json();
  if (!resposta.ok) throw new Error(corpo?.message || "Erro na requisicao.");
  return corpo;
}

function livroAtual() {
  return livros.find((livro) => String(livro.id) === String(livroSelect.value));
}

function estrelas(valor) {
  const nota = Math.round(Number(valor || 0));
  return "★★★★★".slice(0, nota) + "☆☆☆☆☆".slice(0, 5 - nota);
}

function renderLivro() {
  const livro = livroAtual();
  if (!livro) {
    livroCategoria.textContent = "Acervo";
    livroTitulo.textContent = "Nenhum livro encontrado";
    livroAutor.textContent = "Cadastre livros no painel para avaliar.";
    livroEstrelas.textContent = "☆☆☆☆☆";
    livroMetricas.textContent = "0 likes · 0 favoritos · 0 comentarios";
    return;
  }

  livroCategoria.textContent = livro.category;
  livroTitulo.textContent = livro.title;
  livroAutor.textContent = livro.author;
  livroEstrelas.textContent = estrelas(livro.ratingAverage);
  livroMetricas.textContent = `${livro.likes || 0} likes · ${livro.favorites || 0} favoritos · ${livro.commentsCount || 0} comentarios`;
  document.querySelector("#rating").value = livro.userRating || "";
}

async function carregarLivros(manterSelecionado = false) {
  const selecionado = manterSelecionado ? livroSelect.value : "";
  livros = await api(`/api/books${user ? `?userId=${user.id}` : ""}`);

  livroSelect.innerHTML = "";
  livros.forEach((livro) => {
    const opt = document.createElement("option");
    opt.value = livro.id;
    opt.textContent = `${livro.title} - ${livro.ratingAverage || 0} estrelas`;
    livroSelect.appendChild(opt);
  });

  if (selecionado && livros.some((livro) => String(livro.id) === String(selecionado))) {
    livroSelect.value = selecionado;
  }

  renderLivro();
  await carregarComentarios();
}

async function carregarComentarios() {
  const livro = livroAtual();
  if (!livro) {
    lista.innerHTML = "<article><strong>Nenhum livro selecionado.</strong><span>Escolha uma obra para ver os comentarios.</span></article>";
    comentariosTotal.textContent = "0 registros";
    return;
  }

  try {
    const comments = await api(`/api/comments?bookId=${livro.id}`);
    comentariosTotal.textContent = `${comments.length} registros`;
    lista.innerHTML = comments.length ? "" : "<article><strong>Nenhum comentario ainda.</strong><span>Seja o primeiro a avaliar este livro.</span></article>";

    comments.forEach((comment) => {
      const article = document.createElement("article");
      article.innerHTML = `
        <div class="comentario-estrelas">${estrelas(comment.rating)}</div>
        <strong>${comment.message}</strong>
        <span>${comment.userName} · ${comment.createdAt}</span>
      `;
      lista.appendChild(article);
    });
  } catch (error) {
    lista.innerHTML = `<article><strong>Nao foi possivel carregar os comentarios.</strong><span>${error.message}</span></article>`;
    comentariosTotal.textContent = "0 registros";
  }
}

document.querySelector("#comentarioForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!exigirLogin()) return;

  const livro = livroAtual();
  if (!livro) return;

  try {
    const rating = document.querySelector("#rating").value;
    const message = document.querySelector("#message").value.trim();

    if (rating) {
      await api(`/api/books/${livro.id}/rating`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, rating: Number(rating) })
      });
    }

    if (message) {
      await api("/api/comments", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, bookId: Number(livro.id), message })
      });
    }

    document.querySelector("#message").value = "";
    mensagem.textContent = "Avaliacao salva com sucesso.";
    await carregarLivros(true);
  } catch (error) {
    mensagem.textContent = error.message;
  }
});

document.querySelector("#likeBtn").addEventListener("click", async () => {
  if (!exigirLogin()) return;
  const livro = livroAtual();
  if (!livro) return;
  await api(`/api/books/${livro.id}/like`, { method: "POST", body: JSON.stringify({ userId: user.id }) });
  mensagem.textContent = "Like atualizado.";
  await carregarLivros(true);
});

document.querySelector("#favBtn").addEventListener("click", async () => {
  if (!exigirLogin()) return;
  const livro = livroAtual();
  if (!livro) return;
  await api(`/api/books/${livro.id}/favorite`, { method: "POST", body: JSON.stringify({ userId: user.id }) });
  mensagem.textContent = "Favorito atualizado.";
  await carregarLivros(true);
});

livroSelect.addEventListener("change", async () => {
  renderLivro();
  await carregarComentarios();
});

carregarLivros().catch((error) => {
  mensagem.textContent = error.message;
  lista.innerHTML = `<article><strong>Nao foi possivel carregar.</strong><span>${error.message}</span></article>`;
});
