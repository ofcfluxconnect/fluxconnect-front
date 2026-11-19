// Recuperacao de senha (simulacao, sem backend), em duas telas:
//   esqueci_senha.html -> confere se o e-mail existe em mock-usuarios.json
//   nova_senha.html    -> guarda a nova senha no navegador ("senhasAtualizadas"), que o login consulta
// Este arquivo serve as duas telas: cada bloco so roda se o formulario dele existir.

var PAGINA_LOGIN = "../tela_login/fluxconnect_login_enxuto/index.html";
var ARQUIVO_USUARIOS = "../tela_login/fluxconnect_login_enxuto/mock-usuarios.json";

// Mostra um aviso no elemento indicado. tipo: "erro", "sucesso" ou nada (informacao).
function avisar(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensagem" + (tipo ? " " + tipo : "");
  elemento.hidden = false;
}

// Marca em vermelho o campo com problema e leva o cursor ate ele.
function apontar(campo) {
  campo.closest(".entrada").classList.add("invalido");
  campo.setAttribute("aria-invalid", "true");
  campo.focus();
}

function limparMarcas() {
  document.querySelectorAll(".entrada.invalido").forEach(function (e) { e.classList.remove("invalido"); });
  document.querySelectorAll("[aria-invalid]").forEach(function (c) { c.removeAttribute("aria-invalid"); });
}

document.querySelectorAll(".entrada input").forEach(function (campo) {
  campo.addEventListener("input", limparMarcas);
});

// Mostrar e ocultar senha
document.querySelectorAll("[data-ver-senha]").forEach(function (botao) {
  botao.addEventListener("click", function () {
    var campo = botao.parentElement.querySelector("input");
    var mostrar = campo.type === "password";
    campo.type = mostrar ? "text" : "password";
    botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    botao.setAttribute("aria-pressed", String(mostrar));
  });
});


// ---------- 1. Esqueci minha senha: confere o e-mail ----------
var formularioEmail = document.querySelector("#recuperacao");

if (formularioEmail) {
  var campoEmail = document.querySelector("#email");
  var mensagem = document.querySelector("#mensagem");
  var botaoEnviar = document.querySelector("#btnEnviar");

  formularioEmail.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparMarcas();

    var valorEmail = campoEmail.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
      avisar(mensagem, "Digite um endereço de e-mail válido.", "erro");
      apontar(campoEmail);
      return;
    }

    avisar(mensagem, "Verificando e-mail...");
    botaoEnviar.disabled = true;
    try {
      var resposta = await fetch(ARQUIVO_USUARIOS);
      if (!resposta.ok) throw new Error("Não foi possível carregar o JSON.");
      var dados = await resposta.json();
      var usuario = dados.usuarios.find(function (item) {
        return item.email.toLowerCase() === valorEmail && item.ativo === true;
      });

      if (usuario) {
        sessionStorage.setItem("emailRecuperacao", usuario.email);
        avisar(mensagem, "E-mail encontrado! Redirecionando...", "sucesso");
        window.location.href = "nova_senha.html";
        return; // o botao continua desabilitado enquanto a proxima tela carrega
      }

      avisar(mensagem, "E-mail não encontrado ou conta inativa.", "erro");
      apontar(campoEmail);
    } catch (erro) {
      console.error("Erro ao verificar e-mail:", erro);
      avisar(mensagem, "Não foi possível verificar o e-mail. Verifique o servidor local.", "erro");
    }
    botaoEnviar.disabled = false;
  });
}


// ---------- 2. Nova senha: valida e guarda no navegador ----------
var formularioSenha = document.querySelector("#formNovaSenha");

if (formularioSenha) {
  var senhaNova = document.querySelector("#senhaNova");
  var confirmarSenha = document.querySelector("#confirmarNovaSenha");
  var mensagemSenha = document.querySelector("#mensagemSenha");
  var emailRecuperacao = sessionStorage.getItem("emailRecuperacao");

  if (emailRecuperacao) {
    document.querySelector("#textoConta").textContent = "Conta: " + emailRecuperacao + ". Escolha uma senha diferente das que você já usou.";
  }

  formularioSenha.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limparMarcas();

    // so vale se a recuperacao foi iniciada pela tela anterior
    emailRecuperacao = sessionStorage.getItem("emailRecuperacao");
    if (!emailRecuperacao) {
      avisar(mensagemSenha, "Inicie o processo pela tela de recuperação de senha.", "erro");
      return;
    }

    var novaSenha = senhaNova.value;
    var confirmacao = confirmarSenha.value;

    if (!novaSenha || !confirmacao) {
      avisar(mensagemSenha, "Preencha os dois campos de senha.", "erro");
      apontar(!novaSenha ? senhaNova : confirmarSenha);
      return;
    }
    if (novaSenha.length < 8) {
      avisar(mensagemSenha, "A senha deve ter pelo menos 8 caracteres.", "erro");
      apontar(senhaNova);
      return;
    }
    if (novaSenha !== confirmacao) {
      avisar(mensagemSenha, "As senhas não coincidem.", "erro");
      apontar(confirmarSenha);
      return;
    }

    var senhasAtualizadas = JSON.parse(localStorage.getItem("senhasAtualizadas") || "{}");
    senhasAtualizadas[emailRecuperacao.toLowerCase()] = novaSenha;
    localStorage.setItem("senhasAtualizadas", JSON.stringify(senhasAtualizadas));
    sessionStorage.removeItem("emailRecuperacao");

    formularioSenha.reset();
    document.querySelector("#btnSalvar").disabled = true;
    avisar(mensagemSenha, "Senha alterada com sucesso! Voltando para o login...", "sucesso");
    setTimeout(function () { window.location.href = PAGINA_LOGIN; }, 1800);
  });
}
