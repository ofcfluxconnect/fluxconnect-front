// Minha Conta: dados do cadastro, preferencias de aparencia e saida da conta.
// Os dados vem de compartilhado/paciente_dados.js; tema e menu sao do recepcao_tema.js.

var PAGINA_LOGIN = "../tela_login/fluxconnect_login_enxuto/index.html";

function preencherDados() {
  var p = Paciente.perfil();
  var campos = {
    dadoNome: p.nome, dadoNascimento: p.nascimento, dadoSexo: p.sexo, dadoTelefone: p.telefone, dadoEmail: p.email,
    dadoConvenio: p.convenio, dadoRua: p.rua, dadoNumero: p.numero, dadoBairro: p.bairro, dadoCidade: p.cidade,
    dadoEstado: p.estado, dadoCep: p.cep
  };
  Object.keys(campos).forEach(function (id) {
    document.getElementById(id).textContent = campos[id];
  });
  document.getElementById("perfilDesde").textContent = "Paciente desde " + p.desde;
}

// o CPF comeca escondido (LGPD); o botao mostra e esconde
function configurarCpf() {
  var botao = document.getElementById("btnMostrarCpf");
  var campo = document.getElementById("dadoCpf");
  var cpf = Paciente.perfil().cpf;
  var visivel = false;

  function atualizar() {
    campo.textContent = visivel ? cpf : RecepcaoComp.mascararCpf(cpf);
    botao.textContent = visivel ? "Ocultar" : "Mostrar";
    botao.setAttribute("aria-pressed", visivel);
  }

  botao.addEventListener("click", function () {
    visivel = !visivel;
    atualizar();
  });
  atualizar();
}

// as chaves mostram a preferencia atual, inclusive quando ela muda pelo botao do topo
function configurarPreferencias() {
  var chaveTema = document.getElementById("chaveTema");
  var chaveMenu = document.getElementById("chaveMenu");
  var raiz = document.documentElement;

  function atualizar() {
    chaveTema.setAttribute("aria-checked", raiz.dataset.tema === "escuro");
    chaveMenu.setAttribute("aria-checked", raiz.dataset.menu === "recolhido");
  }

  chaveTema.addEventListener("click", RecepcaoTema.alternar);
  chaveMenu.addEventListener("click", RecepcaoTema.alternarMenu);
  new MutationObserver(atualizar).observe(raiz, { attributes: true, attributeFilter: ["data-tema", "data-menu"] });
  atualizar();
}

function configurarSair() {
  document.getElementById("btnSair").addEventListener("click", function () {
    var caixa = PacienteUI.modal({
      titulo: "Deseja sair da sua conta?",
      sub: "Você será levado para a tela de login.",
      icone: "fechar",
      cor: "vermelho",
      corpo: '<p class="texto-modal">Seus agendamentos continuam salvos. Para vê-los de novo, basta entrar na conta.</p>',
      rodape:
        '<button type="button" class="btn-secundario" data-fechar-modal data-foco>Cancelar</button>' +
        '<button type="button" class="btn-perigo btn-cheio" id="btnConfirmarSair">Sair</button>'
    });
    caixa.querySelector("#btnConfirmarSair").addEventListener("click", function () {
      ["perfil", "nomeUsuario", "emailUsuario"].forEach(function (k) { sessionStorage.removeItem(k); });
      window.location.href = PAGINA_LOGIN;
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  preencherDados();
  configurarCpf();
  configurarPreferencias();
  configurarSair();
});
