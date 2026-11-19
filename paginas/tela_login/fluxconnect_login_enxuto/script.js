// Tela de login: valida os campos, confere as credenciais no arquivo de usuarios de teste
// (mock-usuarios.json) e leva cada perfil para a sua tela inicial.

var PAGINA_CRIAR_CONTA = "../../tela_criacao_conta/maur/index.html";

var formulario = document.querySelector("#formLogin");
var email = document.querySelector("#email");
var senha = document.querySelector("#senha");
var mensagem = document.querySelector("#mensagem");
var botaoEntrar = document.querySelector("#btnEntrar");

// Mostra um aviso abaixo dos campos. tipo: "erro", "sucesso" ou nada (informacao).
function avisar(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem" + (tipo ? " " + tipo : "");
  mensagem.hidden = false;
}

// Marca em vermelho o campo com problema e leva o cursor ate ele.
function apontar(campo) {
  campo.closest(".entrada").classList.add("invalido");
  campo.setAttribute("aria-invalid", "true");
  campo.focus();
}

function limparMarcas() {
  [email, senha].forEach(function (campo) {
    campo.closest(".entrada").classList.remove("invalido");
    campo.removeAttribute("aria-invalid");
  });
}

[email, senha].forEach(function (campo) {
  campo.addEventListener("input", limparMarcas);
});

// Mostra ou oculta a senha.
document.querySelector("#verSenha").addEventListener("click", function () {
  var mostrar = senha.type === "password";
  senha.type = mostrar ? "text" : "password";
  this.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
  this.setAttribute("aria-pressed", mostrar);
});

// Valida os campos e verifica as credenciais.
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparMarcas();

  var valorEmail = email.value.trim();
  var valorSenha = senha.value;

  // 1. Campos preenchidos
  if (!valorEmail || !valorSenha.trim()) {
    avisar("Preencha o e-mail e a senha para continuar.", "erro");
    apontar(!valorEmail ? email : senha);
    return;
  }

  // 2. Formato do e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
    avisar("Digite um endereço de e-mail válido.", "erro");
    apontar(email);
    return;
  }

  // 3. Tamanho minimo da senha
  if (valorSenha.length < 8) {
    avisar("A senha deve ter pelo menos 8 caracteres.", "erro");
    apontar(senha);
    return;
  }

  botaoEntrar.disabled = true;
  try {
    // 4. Usuarios de teste
    var resposta = await fetch("mock-usuarios.json");
    if (!resposta.ok) throw new Error("Não foi possível carregar o arquivo JSON.");
    var dados = await resposta.json();

    // senhas trocadas durante a simulacao (esqueci minha senha / meu perfil)
    var senhasAtualizadas = JSON.parse(localStorage.getItem("senhasAtualizadas") || "{}");

    // 5. Conta ativa com os dados informados
    var usuario = dados.usuarios.find(function (item) {
      var senhaCorreta = senhasAtualizadas[item.email.toLowerCase()] ?? item.senha;
      return item.email.toLowerCase() === valorEmail.toLowerCase() && senhaCorreta === valorSenha && item.ativo === true;
    });

    // 6. Encontrou: guarda quem entrou e vai para a tela inicial do perfil
    if (usuario) {
      avisar("Login realizado! Redirecionando...", "sucesso");
      sessionStorage.setItem("perfil", usuario.perfil);
      sessionStorage.setItem("nomeUsuario", usuario.nome);
      sessionStorage.setItem("emailUsuario", usuario.email);
      window.location.href = usuario.paginaInicial;
      return; // o botao continua desabilitado enquanto a proxima tela carrega
    }

    avisar("E-mail ou senha incorretos.", "erro");
    apontar(senha);
  } catch (erro) {
    console.error("Erro ao validar login:", erro);
    avisar("Não foi possível validar o login. Verifique o servidor local.", "erro");
  }
  botaoEntrar.disabled = false;
});

// "Esqueceu a senha?" e um link comum para ../../tela_esqueci_minha_senha/esqueci_senha.html

// Botao para criar conta.
document.querySelector("#criarConta").addEventListener("click", function () {
  window.location.href = PAGINA_CRIAR_CONTA;
});

// Link da politica de privacidade.
document.querySelector("#privacidade").addEventListener("click", function (evento) {
  evento.preventDefault();
  avisar("A página de Política de Privacidade será adicionada futuramente.");
});
