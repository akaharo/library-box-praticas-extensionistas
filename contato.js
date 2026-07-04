const form = document.querySelector("#contatoForm");
const mensagem = document.querySelector("#contatoMensagem");
const loginLink = document.querySelector("#loginLink");
const user = JSON.parse(localStorage.getItem("libraryboxUser") || "null");

document.body.classList.add("carregado");

if (user) {
  loginLink.textContent = user.role === "admin" ? "Painel admin" : user.name;
  loginLink.href = user.role === "admin" ? "/login?painel=admin" : "/";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const resposta = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        subject: document.querySelector("#subject").value,
        message: document.querySelector("#message").value
      })
    });
    const corpo = await resposta.json();
    if (!resposta.ok) throw new Error(corpo.message || "Erro ao enviar mensagem.");
    form.reset();
    mensagem.textContent = "Mensagem enviada com sucesso.";
  } catch (error) {
    mensagem.textContent = error.message;
  }
});
