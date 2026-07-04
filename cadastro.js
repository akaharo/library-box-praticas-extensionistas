const form = document.querySelector("#cadastroForm");
const mensagem = document.querySelector("#cadastroMensagem");

document.body.classList.add("carregado");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const resposta = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        password: document.querySelector("#password").value
      })
    });
    const user = await resposta.json();
    if (!resposta.ok) throw new Error(user.message || "Erro ao cadastrar.");
    localStorage.setItem("libraryboxUser", JSON.stringify(user));
    mensagem.textContent = "Cadastro realizado. Redirecionando...";
    window.location.href = "/";
  } catch (error) {
    mensagem.textContent = error.message;
  }
});
