const user = JSON.parse(localStorage.getItem("libraryboxUser") || "null");
const disponiveisGrade = document.querySelector("#livrosDisponiveis");
const reservadosGrade = document.querySelector("#livrosReservados");
const resumo = document.querySelector("#reservaResumo");
const mensagem = document.querySelector("#reservaMensagem");
const confirmarBtn = document.querySelector("#confirmarReservaBtn");
const loginLink = document.querySelector("#loginLink");

let livroSelecionado = null;

document.body.classList.add("carregado");

if (user) {
  loginLink.textContent = user.name;
  loginLink.href = "#";
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

function capa(index) {
  return ["capa-terracota", "capa-verde", "capa-amarela", "capa-azul"][index % 4];
}

function estaDisponivel(livro) {
  return String(livro.status || "").toLowerCase() === "disponivel";
}

function limparSelecao() {
  livroSelecionado = null;
  resumo.textContent = "Nenhum livro selecionado.";
  mensagem.textContent = "Escolha um livro disponivel para continuar.";
  confirmarBtn.disabled = true;
  document.querySelectorAll(".card-livro.selecionado").forEach((card) => card.classList.remove("selecionado"));
}

function selecionarLivro(livro, card) {
  if (!exigirLogin()) return;

  livroSelecionado = livro;
  resumo.innerHTML = `<strong>${livro.title}</strong><span>${livro.author} · ${livro.category}</span>`;
  mensagem.textContent = "Confira o livro escolhido e confirme a reserva.";
  confirmarBtn.disabled = false;

  document.querySelectorAll(".card-livro.selecionado").forEach((item) => item.classList.remove("selecionado"));
  card.classList.add("selecionado");
}

function criarCard(livro, index, podeReservar) {
  const card = document.createElement("article");
  card.className = `card-livro revelar visivel${podeReservar ? "" : " indisponivel"}`;
  card.innerHTML = `
    <div class="capa ${capa(index)}"><span>${livro.category}</span><strong>${livro.title}</strong></div>
    <h3>${livro.title}</h3>
    <p>${livro.author}</p>
    <span class="status ${podeReservar ? "disponivel" : "reservado"}">${livro.status}</span>
  `;

  if (podeReservar) {
    const botao = document.createElement("button");
    botao.className = "botao primario reservar-card";
    botao.type = "button";
    botao.textContent = "Selecionar livro";
    botao.addEventListener("click", () => selecionarLivro(livro, card));
    card.appendChild(botao);
  } else {
    const aviso = document.createElement("p");
    aviso.className = "reserva-indisponivel";
    aviso.textContent = "Indisponivel para nova reserva.";
    card.appendChild(aviso);
  }

  return card;
}

function estadoVazio(container, texto) {
  container.innerHTML = `<article class="estado-vazio">${texto}</article>`;
}

async function carregar() {
  const livros = await api(`/api/books${user ? `?userId=${user.id}` : ""}`);
  const disponiveis = livros.filter(estaDisponivel);
  const reservados = livros.filter((livro) => !estaDisponivel(livro));

  disponiveisGrade.innerHTML = "";
  reservadosGrade.innerHTML = "";
  limparSelecao();

  disponiveis.forEach((livro, index) => {
    disponiveisGrade.appendChild(criarCard(livro, index, true));
  });

  reservados.forEach((livro, index) => {
    reservadosGrade.appendChild(criarCard(livro, index, false));
  });

  if (disponiveis.length === 0) estadoVazio(disponiveisGrade, "Nenhum livro disponivel no momento.");
  if (reservados.length === 0) estadoVazio(reservadosGrade, "Nenhum livro reservado no momento.");
}

confirmarBtn.addEventListener("click", async () => {
  if (!exigirLogin() || !livroSelecionado) return;

  confirmarBtn.disabled = true;
  mensagem.textContent = "Salvando reserva...";

  try {
    await api("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, bookId: livroSelecionado.id })
    });
    mensagem.textContent = "Reserva confirmada com sucesso.";
    await carregar();
  } catch (error) {
    mensagem.textContent = error.message;
    confirmarBtn.disabled = false;
  }
});

carregar().catch((error) => {
  mensagem.textContent = error.message;
});
