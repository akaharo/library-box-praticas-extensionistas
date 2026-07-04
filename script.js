const menuBotao = document.querySelector(".menu-botao");
const menu = document.querySelector(".menu");
const gradeLivros = document.querySelector("#gradeLivros");
const notasMural = document.querySelector("#notasMural");
const totalLivrosInfo = document.querySelector("#totalLivrosInfo");
const totalUsuariosInfo = document.querySelector("#totalUsuariosInfo");
const loginLink = document.querySelector("#loginLink");
const logoutBtn = document.querySelector("#logoutBtn");

const state = {
  user: JSON.parse(localStorage.getItem("libraryboxUser") || "null"),
  livros: [],
  usuarios: [],
  reservas: []
};

document.body.classList.add("carregado");

async function api(url) {
  const resposta = await fetch(url);
  const corpo = await resposta.json();
  if (!resposta.ok) throw new Error(corpo?.message || "Erro na requisicao.");
  return corpo;
}

function atualizarSessao() {
  if (state.user) {
    loginLink.textContent = state.user.role === "admin" ? "Painel admin" : state.user.name;
    loginLink.href = state.user.role === "admin" ? "/login?painel=admin" : "#inicio";
    logoutBtn.classList.remove("escondido");
  } else {
    loginLink.textContent = "Entrar";
    loginLink.href = "/login";
    logoutBtn.classList.add("escondido");
  }
}

function normalizarCategoria(categoria) {
  return String(categoria || "geral")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classeStatus(status) {
  const valor = normalizarCategoria(status);
  if (valor.includes("fila")) return "fila";
  if (valor.includes("reserv") || valor.includes("emprest")) return "reservado";
  return "disponivel";
}

function classeCapa(index) {
  return ["capa-terracota", "capa-verde", "capa-amarela", "capa-azul"][index % 4];
}

function atualizarContador() {
  const contador = document.querySelector("#contador");
  if (contador) {
    contador.textContent = document.querySelectorAll(".card-livro:not(.escondido)").length;
  }
}

function conectarFiltros() {
  document.querySelectorAll("[data-filtro]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const filtro = botao.dataset.filtro;
      document.querySelectorAll("[data-filtro]").forEach((item) => item.classList.remove("ativo"));
      botao.classList.add("ativo");

      document.querySelectorAll(".card-livro").forEach((livro) => {
        livro.classList.toggle("escondido", !(filtro === "todos" || livro.dataset.categoria === filtro));
      });

      atualizarContador();
    });
  });
}

function renderLivros() {
  if (state.livros.length === 0) return;

  gradeLivros.innerHTML = "";

  state.livros.forEach((livro, index) => {
    const card = document.createElement("article");
    card.className = "card-livro revelar visivel";
    card.dataset.categoria = normalizarCategoria(livro.category);
    card.dataset.titulo = livro.title;
    card.innerHTML = `
      <div class="capa ${classeCapa(index)}">
        <span>${livro.category}</span>
        <strong>${livro.title}</strong>
      </div>
      <h3>${livro.title}</h3>
      <p>${livro.author}</p>
      <span class="status ${classeStatus(livro.status)}">${livro.status}</span>
      <div class="metricas-livro">
        <span>${livro.likes || 0} likes</span>
        <span>${livro.favorites || 0} favoritos</span>
        <span>${livro.ratingAverage || "0"} estrelas</span>
      </div>
    `;
    gradeLivros.appendChild(card);
  });

  const destaque = state.livros[0];
  document.querySelector(".livro-grande h2").textContent = destaque.title;
  document.querySelector(".livro-grande .capa strong").textContent = destaque.title;
  document.querySelector(".livro-grande .capa span").textContent = destaque.category;
  document.querySelector(".livro-grande p:not(.rotulo)").textContent = `${destaque.author} · ${destaque.status}`;
  totalLivrosInfo.textContent = `${state.livros.length} livros cadastrados no acervo da Library Box.`;
  atualizarContador();
}

function renderFeed(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return;
  notasMural.innerHTML = "";
  posts.slice(0, 3).forEach((post) => {
    const nota = document.createElement("article");
    nota.className = "nota revelar visivel";
    nota.innerHTML = `<span>${post.type}</span><p>${post.message}</p>`;
    notasMural.appendChild(nota);
  });
}

async function carregarDadosMysql() {
  const [livros, feed, users, reservas] = await Promise.all([
    api("/api/books"),
    api("/api/feed"),
    api("/api/users"),
    api("/api/reservations")
  ]);

  state.livros = livros.map((livro) => ({
    ...livro,
    reservations: reservas.filter((reserva) => reserva.bookTitle === livro.title).length
  }));
  state.usuarios = users;
  state.reservas = reservas;

  renderLivros();
  renderFeed(feed);
  totalUsuariosInfo.textContent = `${users.length} usuários cadastrados para acesso ao sistema.`;
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("libraryboxUser");
  state.user = null;
  atualizarSessao();
});

menuBotao.addEventListener("click", () => {
  const aberto = menu.classList.toggle("aberto");
  menuBotao.setAttribute("aria-expanded", String(aberto));
});

document.querySelectorAll(".menu a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("aberto");
    menuBotao.setAttribute("aria-expanded", "false");
  });
});

const barraLeitura = document.querySelector(".barra-leitura");

function atualizarBarra() {
  const altura = document.documentElement.scrollHeight - window.innerHeight;
  const progresso = altura > 0 ? (window.scrollY / altura) * 100 : 0;
  barraLeitura.style.width = `${progresso}%`;
}

window.addEventListener("scroll", atualizarBarra);
atualizarBarra();

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) entrada.target.classList.add("visivel");
  });
}, { threshold: 0.18 });

document.querySelectorAll(".revelar").forEach((elemento) => observador.observe(elemento));

conectarFiltros();
atualizarSessao();
carregarDadosMysql().catch(() => atualizarContador());
