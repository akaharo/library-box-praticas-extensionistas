const loginLink = document.querySelector("#loginLink");
const rankingReservas = document.querySelector("#rankingReservas");
const rankingAvaliacoes = document.querySelector("#rankingAvaliacoes");
const rankingUsuarios = document.querySelector("#rankingUsuarios");

const user = JSON.parse(localStorage.getItem("libraryboxUser") || "null");

if (user) {
  loginLink.textContent = user.role === "admin" ? "Painel admin" : user.name;
  loginLink.href = user.role === "admin" ? "/login?painel=admin" : "/";
}

document.body.classList.add("carregado");

async function api(url) {
  const resposta = await fetch(url);
  const corpo = await resposta.json();
  if (!resposta.ok) throw new Error(corpo?.message || "Erro na requisição.");
  return corpo;
}

function numero(valor) {
  return Number(valor || 0);
}

function itemLivro(livro, index, detalhe) {
  const article = document.createElement("article");
  const valor = Math.max(20, 96 - index * 12);
  article.innerHTML = `
    <span>${String(index + 1).padStart(2, "0")}</span>
    <div>
      <h3>${livro.title}</h3>
      <p>${detalhe}</p>
    </div>
    <b style="--valor: ${valor}%"></b>
  `;
  return article;
}

function itemUsuario(usuario, index) {
  const article = document.createElement("article");
  const valor = Math.max(20, 96 - index * 12);
  article.innerHTML = `
    <span>${String(index + 1).padStart(2, "0")}</span>
    <div>
      <h3>${usuario.name}</h3>
      <p>${numero(usuario.reservations)} reservas feitas</p>
    </div>
    <b style="--valor: ${valor}%"></b>
  `;
  return article;
}

function vazio(container, texto) {
  container.innerHTML = `<article><strong>${texto}</strong><span>Sem dados ainda</span></article>`;
}

async function carregarRankings() {
  const [livros, reservas, usuarios] = await Promise.all([
    api("/api/books"),
    api("/api/reservations"),
    api("/api/rankings/users")
  ]);

  const livrosComReservas = livros
    .map((livro) => ({
      ...livro,
      reservations: reservas.filter((reserva) => reserva.bookTitle === livro.title).length
    }))
    .sort((a, b) => numero(b.reservations) - numero(a.reservations));

  const livrosComAvaliacao = [...livros]
    .sort((a, b) => numero(b.ratingAverage) - numero(a.ratingAverage) || numero(b.likes) - numero(a.likes));

  rankingReservas.innerHTML = "";
  livrosComReservas.slice(0, 8).forEach((livro, index) => {
    rankingReservas.appendChild(itemLivro(livro, index, `${numero(livro.reservations)} reservas`));
  });

  rankingAvaliacoes.innerHTML = "";
  livrosComAvaliacao.slice(0, 8).forEach((livro, index) => {
    rankingAvaliacoes.appendChild(itemLivro(livro, index, `${livro.ratingAverage || "0"} estrelas e ${numero(livro.likes)} likes`));
  });

  rankingUsuarios.innerHTML = "";
  usuarios.slice(0, 8).forEach((usuario, index) => {
    rankingUsuarios.appendChild(itemUsuario(usuario, index));
  });

  if (!rankingReservas.children.length) vazio(rankingReservas, "Nenhuma reserva registrada");
  if (!rankingAvaliacoes.children.length) vazio(rankingAvaliacoes, "Nenhuma avaliação registrada");
  if (!rankingUsuarios.children.length) vazio(rankingUsuarios, "Nenhum leitor encontrado");
}

carregarRankings().catch((error) => {
  rankingReservas.innerHTML = `<article><strong>Não foi possível carregar</strong><span>${error.message}</span></article>`;
  vazio(rankingAvaliacoes, "Tente atualizar a página");
  vazio(rankingUsuarios, "Tente atualizar a página");
});
