// Meu Perfil (enfermeiro): dados do cadastro, preferencias de aparencia, senha e saida da conta.
// Mesmo padrao da "Minha Conta" do paciente e do "Meu Perfil" do medico. Os dados vem de
// compartilhado/perfil_enfermeiro.js (o campo "crm" guarda o COREN),
// e "Editar perfil" / "Alterar senha" abrem a janela de edicao desse mesmo arquivo.

var PAGINA_LOGIN = "../tela_login/fluxconnect_login_enxuto/index.html";

var cpfVisivel = false;

// "1990-05-21" -> "21/05/1990"
function formatarNascimento(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function mostrarCpf() {
  var cpf = PerfilEnfermeiro.obter().cpf;
  var botao = document.getElementById("btnMostrarCpf");
  document.getElementById("dadoCpf").textContent = cpfVisivel ? cpf : RecepcaoComp.mascararCpf(cpf);
  botao.textContent = cpfVisivel ? "Ocultar" : "Mostrar";
  botao.setAttribute("aria-pressed", cpfVisivel);
}

// roda ao abrir a tela e de novo sempre que o perfil e salvo
function preencher(perfil) {
  var campos = {
    dadoNome: perfil.nome,
    dadoNascimento: formatarNascimento(perfil.nascimento),
    dadoTelefone: perfil.telefone,
    dadoEspecialidade: perfil.especialidade,
    dadoCrm: perfil.crm,
    dadoEmail: perfil.email
  };
  Object.keys(campos).forEach(function (id) {
    var el = document.getElementById(id);
    el.textContent = campos[id] || "Não informado";
    el.classList.toggle("vazio", !campos[id]);
  });
  document.getElementById("perfilEmail").textContent = perfil.email;
  document.getElementById("perfilCrm").textContent = perfil.crm;
  mostrarCpf();
}

// quantas triagens este enfermeiro registrou hoje
function mostrarAtendimentos() {
  var nome = PerfilEnfermeiro.obter().nome;
  var total = 0;
  PacientesProfissional.todos().forEach(function (p) {
    total += p.triagens.filter(function (t) { return Enfermagem.ehHoje(t.data) && t.autor === nome; }).length;
  });
  document.getElementById("dadoAtendimentos").textContent = total + (total === 1 ? " triagem registrada" : " triagens registradas");
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
  var modal = document.getElementById("modalSair");
  var quemAbriu = null;

  function fechar() {
    modal.classList.remove("visivel");
    if (quemAbriu) quemAbriu.focus();
  }

  document.getElementById("btnSair").addEventListener("click", function () {
    quemAbriu = this;
    modal.classList.add("visivel");
    modal.querySelector("[data-fechar-modal].btn-secundario").focus();
  });
  modal.addEventListener("click", function (ev) {
    if (ev.target === modal || ev.target.closest("[data-fechar-modal]")) fechar();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal.classList.contains("visivel")) fechar();
  });
  document.getElementById("btnConfirmarSair").addEventListener("click", function () {
    ["perfil", "nomeUsuario", "emailUsuario"].forEach(function (k) { sessionStorage.removeItem(k); });
    window.location.href = PAGINA_LOGIN;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  PerfilEnfermeiro.aoAtualizar(preencher);
  mostrarAtendimentos();
  configurarPreferencias();
  configurarSair();

  document.getElementById("btnMostrarCpf").addEventListener("click", function () {
    cpfVisivel = !cpfVisivel;
    mostrarCpf();
  });
  document.getElementById("btnEditarPerfil").addEventListener("click", function () { PerfilEnfermeiro.abrir(); });
  document.getElementById("btnAlterarSenha").addEventListener("click", function () { PerfilEnfermeiro.abrir("seguranca"); });
});
