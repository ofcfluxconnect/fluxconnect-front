// Minha Agenda (profissional): horarios de hoje e o paciente em destaque.
// Os horarios vem de compartilhado/profissional_dados.js e os pacientes de
// compartilhado/pacientes_profissional.js. A tela de atendimento muda o status na mesma agenda.

var PAGINA_ATENDIMENTO = "../atendimento_profissional/index.html";

var e = Profissional.escapar;
var diasSemana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

var agenda = [];
var selecionadoId = null;
var selecaoManual = false; // true quando o medico clicou num cartao
var termoBusca = "";

// junta o horario da agenda com os dados do paciente
function paciente(item) {
  return Object.assign({}, PacientesProfissional.obter(item.id), item);
}

function horarios() {
  return agenda.filter(function (item) { return !item.vago; });
}

function buscarItem(id) {
  return agenda.find(function (item) { return item.id === id; });
}

// sem clique: o painel mostra o proximo da fila. Quem ja passou pela triagem vem primeiro,
// do risco mais alto para o mais baixo; depois quem esta em atendimento; por fim quem ainda
// aguarda a triagem da enfermagem (o medico so atende depois dela).
function itemInicial() {
  var triados = horarios().filter(function (x) { return x.status === "triado"; })
    .sort(function (a, b) { return Profissional.prioridade(a.risco) - Profissional.prioridade(b.risco); });
  var item = triados[0] ||
    horarios().find(function (x) { return x.status === "em-atendimento"; }) ||
    horarios().find(function (x) { return x.status === "aguardando"; });
  return item ? item.id : null;
}

function montarTopo(perfil) {
  var h = new Date().getHours();
  var saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  var d = new Date();
  var dia = diasSemana[d.getDay()];
  document.getElementById("tituloPagina").textContent = saudacao + ", " + perfil.nome;
  // so a data: "Quinta-feira, 19 de novembro de 2026"
  document.getElementById("subtituloPagina").textContent = dia[0].toUpperCase() + dia.slice(1) + ", " + d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear();
}

// ========== AGENDA ==========
function renderizarAgenda() {
  var termo = termoBusca;
  var numeros = termo.replace(/\D/g, "");
  var html = "";

  agenda.forEach(function (item) {
    if (item.vago) {
      if (termo) return;
      html += '<li class="linha-agenda"><span class="hora-agenda">' + item.hora + '</span><div class="card-agenda card-vago">Horário disponível</div></li>';
      return;
    }

    var p = paciente(item);
    var bate = !termo || p.nome.toLowerCase().includes(termo) || (numeros && p.cpf.replace(/\D/g, "").includes(numeros));
    if (!bate) return;

    // destaque so quando o medico clicou no cartao (clicar de novo desmarca)
    var marcado = selecaoManual && p.id === selecionadoId;
    html += '<li class="linha-agenda"><span class="hora-agenda">' + p.hora + "</span>" +
      '<button type="button" class="card-agenda status-' + p.status + (marcado ? " selecionado" : "") + '" data-id="' + p.id + '" aria-pressed="' + marcado + '">' +
        '<span class="avatar-pessoa" style="background:' + (p.status === "cancelado" ? "#94a3b8" : p.cor) + '">' + PacientesProfissional.iniciais(p.nome) + "</span>" +
        '<span class="info-paciente"><span class="nome-paciente">' + e(p.nome) + "</span>" +
          '<span class="detalhe-paciente">' + e(p.tipo) + " · " + p.duracao + " min · " + e(p.sala) + "</span></span>" +
        Profissional.riscoTag(p.risco, true) + Profissional.badge(p.status) +
        '<svg class="seta-card" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      "</button></li>";
  });

  document.getElementById("listaAgenda").innerHTML = html || '<li class="estado-vazio"><strong>Nenhum paciente encontrado</strong>Tente outro nome ou CPF.</li>';
}

// ========== PAINEL DO PACIENTE ==========
function renderizarPainel() {
  var painel = document.getElementById("painelPaciente");
  var item = buscarItem(selecionadoId);
  document.getElementById("txtRotuloPaciente").textContent = selecaoManual ? "Paciente selecionado" : "Próximo paciente";

  if (!item) {
    painel.innerHTML = '<p class="painel-vazio">Nenhum paciente aguardando. Bom trabalho!</p>';
    return;
  }

  var p = paciente(item);
  var botao = {
    // a triagem e feita pela enfermagem: sem ela o atendimento nao comeca
    "aguardando": '<button type="button" class="btn-primario" id="btnSemTriagem" disabled title="A enfermagem ainda não fez a triagem deste paciente">Aguardando triagem</button>',
    "triado": '<button type="button" class="btn-primario" id="btnAtendimento">Iniciar atendimento</button>',
    "em-atendimento": '<button type="button" class="btn-primario" id="btnAtendimento">Continuar atendimento</button>',
    "finalizado": '<button type="button" class="btn-primario" disabled>Atendimento finalizado</button>',
    "cancelado": '<button type="button" class="btn-primario" disabled>Consulta cancelada</button>'
  }[p.status];

  painel.innerHTML =
    '<div class="paciente-destaque">' +
      '<span class="avatar-grande" style="background:' + p.cor + '">' + PacientesProfissional.iniciais(p.nome) + "</span>" +
      '<div class="paciente-textos"><p class="paciente-nome">' + e(p.nome) + "</p>" +
      '<p class="paciente-info">' + e(p.tipo) + " · " + p.hora + " · " + e(p.sala) + "</p>" +
      '<div class="paciente-tags">' + Profissional.badge(p.status) + Profissional.riscoTag(p.risco) + '<span class="tag tag-neutra">' + (p.primeira ? "1ª consulta" : "Retorno") + "</span></div></div>" +
    "</div>" +
    '<dl class="grade-dados">' +
      '<div class="dado"><dt>Idade</dt><dd>' + p.idade + " anos</dd></div>" +
      '<div class="dado"><dt>Convênio</dt><dd>' + e(p.convenio) + "</dd></div>" +
      '<div class="dado"><dt>Última consulta</dt><dd>' + (p.ultimaVisita ? PacientesProfissional.formatarData(p.ultimaVisita) : "—") + "</dd></div>" +
      '<div class="dado"><dt>Prontuário</dt><dd>#' + e(p.id) + "</dd></div>" +
      '<div class="dado"><dt>Alergias</dt><dd class="' + (p.alergias.length ? "texto-alerta" : "") + '" title="' + e(p.alergias.join(", ")) + '">' + e(p.alergias.join(", ") || "Nenhuma") + "</dd></div>" +
      '<div class="dado"><dt>Condições</dt><dd title="' + e(p.condicoes.join(", ")) + '">' + e(p.condicoes.join(", ") || "Nenhuma") + "</dd></div>" +
      '<div class="dado dado-largo"><dt>CPF</dt><dd class="cpf-mascarado">' + RecepcaoComp.mascararCpf(p.cpf) + "</dd></div>" +
    "</dl>" +
    '<div class="painel-botoes">' + botao + '<button type="button" class="btn-secundario" id="btnHistorico">Visualizar histórico</button></div>';

  var btnAtendimento = document.getElementById("btnAtendimento");
  if (btnAtendimento) btnAtendimento.addEventListener("click", function () { iniciarAtendimento(item); });
  document.getElementById("btnHistorico").addEventListener("click", function () { ProntuarioModal.abrir(p.id); });
}

function renderizarResumo() {
  var lista = horarios();
  function contar(status) {
    return lista.filter(function (item) { return item.status === status; }).length;
  }
  document.getElementById("resTotal").textContent = lista.length;
  // quem ja foi triado continua na fila do medico
  document.getElementById("resAguardando").textContent = contar("aguardando") + contar("triado");
  document.getElementById("resFinalizados").textContent = contar("finalizado");
  document.getElementById("resCancelados").textContent = contar("cancelado");
}

function renderizarTudo() {
  renderizarAgenda();
  renderizarPainel();
  renderizarResumo();
}

// Troca so o destaque do cartao clicado. A lista nao e redesenhada, entao nada pisca
// nem muda de lugar ao selecionar um paciente.
function marcarSelecao() {
  document.querySelectorAll("#listaAgenda .card-agenda[data-id]").forEach(function (card) {
    var marcado = selecaoManual && card.dataset.id === selecionadoId;
    card.classList.toggle("selecionado", marcado);
    card.setAttribute("aria-pressed", marcado);
  });
}

function selecionar(id, manual) {
  selecionadoId = id;
  selecaoManual = manual;
  marcarSelecao();
  renderizarPainel();
}

// so um paciente pode estar em atendimento por vez
function iniciarAtendimento(item) {
  if (item.status === "aguardando") {
    RecepcaoUI.toast("Aguardando triagem", "A enfermagem ainda não fez a triagem deste paciente.", "erro");
    return;
  }
  if (item.status === "triado") {
    var emAndamento = horarios().find(function (x) { return x.status === "em-atendimento"; });
    if (emAndamento) {
      RecepcaoUI.toast("Há um atendimento em andamento", "Finalize o atendimento de " + PacientesProfissional.obter(emAndamento.id).nome + " antes de iniciar outro.", "erro");
      selecionar(emAndamento.id, true);
      return;
    }
    Profissional.definirStatus(item.id, "em-atendimento");
  }
  window.location.href = PAGINA_ATENDIMENTO + "?id=" + encodeURIComponent(item.id);
}

document.addEventListener("DOMContentLoaded", function () {
  agenda = Profissional.agenda();
  selecionadoId = itemInicial();

  // o nome no topo acompanha o "Meu perfil"
  PerfilProfissional.aoAtualizar(montarTopo);
  renderizarTudo();

  document.getElementById("listaAgenda").addEventListener("click", function (ev) {
    var card = ev.target.closest(".card-agenda[data-id]");
    if (!card) return;
    if (selecaoManual && card.dataset.id === selecionadoId) selecionar(itemInicial(), false);
    else selecionar(card.dataset.id, true);
  });

  // Esc desmarca o paciente (se nao houver janela aberta por cima)
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape" || !selecaoManual) return;
    if (document.querySelector(".visivel, .aberto")) return;
    selecionar(itemInicial(), false);
  });

  document.getElementById("inputBusca").addEventListener("input", function (ev) {
    termoBusca = ev.target.value.toLowerCase().trim();
    renderizarAgenda();
  });
});
