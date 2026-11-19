// Fila de triagem (enfermeiro): pacientes de hoje, com busca e filtro por situacao.
// A fila e a mesma agenda do medico (compartilhado/enfermagem_dados.js -> Enfermagem.fila).

var PAGINA_TRIAGEM = "../triagem_enfermeiro/index.html";

var e = Profissional.escapar;
var diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

var estado = { filtro: "aguardando", busca: "" };

var icones = {
  estetoscopio: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.8 2.6A2 2 0 1 0 3 6h3a2 2 0 1 0-1.8-3.4"/><path d="M4.5 6v5a5.5 5.5 0 0 0 11 0V6"/><path d="M19.5 13a2.5 2.5 0 1 0 0 5"/><path d="M22 15.5v2A4.5 4.5 0 0 1 17.5 22h-1A4.5 4.5 0 0 1 12 17.5"/></svg>',
  pessoa: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  alerta: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  triagem: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  relogio: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>'
};

function montarTopo(perfil) {
  var h = new Date().getHours();
  var d = new Date();
  document.getElementById("tituloPagina").textContent = (h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite") + ", " + perfil.nome;
  document.getElementById("subtituloPagina").textContent = diasSemana[d.getDay()] + ", " + d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear();
}

function cartao(a) {
  var p = a.paciente;
  var acoes = "";
  if (a.status === "aguardando") {
    acoes = '<a class="btn-primario" href="' + PAGINA_TRIAGEM + "?id=" + encodeURIComponent(a.id) + '">' + icones.triagem + "Iniciar triagem</a>";
  } else if (a.status === "triado") {
    acoes = '<a class="btn-secundario" href="' + PAGINA_TRIAGEM + "?id=" + encodeURIComponent(a.id) + '">' + icones.triagem + "Refazer triagem</a>";
  }
  acoes += '<button type="button" class="btn-secundario" data-historico="' + e(a.id) + '">' + icones.relogio + "Histórico</button>";

  return '<li class="cartao-item cartao-' + a.status + '">' +
    '<div class="bloco-data"><span class="bloco-dia bloco-horario">' + a.hora + '</span><span class="bloco-mes">' + e(a.sala) + "</span></div>" +
    '<div class="cartao-info">' +
      '<p class="cartao-titulo">' + e(p.nome) + "</p>" +
      '<p class="cartao-linha">' + icones.estetoscopio + e(a.tipo) + " · " + a.duracao + " min · " + (a.primeira ? "1ª consulta" : "Retorno") + "</p>" +
      '<p class="cartao-linha">' + icones.pessoa + p.idade + " anos · " + e(p.convenio) + " · #" + e(p.id) + "</p>" +
      (p.alergias.length ? '<p class="cartao-linha cartao-alerta">' + icones.alerta + "Alergia: " + e(p.alergias.join(", ")) + "</p>" : "") +
    "</div>" +
    '<div class="cartao-lado"><div class="tags">' + Profissional.riscoTag(a.risco) + Profissional.badge(a.status) + "</div>" +
      '<div class="cartao-acoes">' + acoes + "</div></div>" +
  "</li>";
}

function renderizar() {
  var fila = Enfermagem.fila();
  function contar(status) {
    return fila.filter(function (a) { return a.status === status; }).length;
  }

  document.getElementById("numAguardando").textContent = document.getElementById("contAguardando").textContent = contar("aguardando");
  document.getElementById("numTriados").textContent = document.getElementById("contTriados").textContent = contar("triado");
  document.getElementById("numAtendimento").textContent = contar("em-atendimento");
  document.getElementById("numFinalizados").textContent = contar("finalizado");
  document.getElementById("contTodos").textContent = fila.length;

  // graficos dos cards: um ponto por horario da agenda (a soma dos pontos e o numero do card)
  var horas = fila.map(function (a) { return a.hora; }).filter(function (h, i, todas) { return todas.indexOf(h) === i; }).sort();
  function porHora(status) {
    return horas.map(function (h) { return fila.filter(function (a) { return a.hora === h && a.status === status; }).length; });
  }
  var opcoes = { rotulos: horas, unidade: ["paciente", "pacientes"] };
  RecepcaoComp.grafico(document.getElementById("grafAguardando"), porHora("aguardando"), opcoes);
  RecepcaoComp.grafico(document.getElementById("grafTriados"), porHora("triado"), opcoes);
  RecepcaoComp.grafico(document.getElementById("grafAtendimento"), porHora("em-atendimento"), opcoes);
  RecepcaoComp.grafico(document.getElementById("grafFinalizados"), porHora("finalizado"), opcoes);

  var termo = estado.busca;
  var numeros = termo.replace(/\D/g, "");
  var lista = fila.filter(function (a) {
    if (estado.filtro !== "todos" && a.status !== estado.filtro) return false;
    return !termo || a.paciente.nome.toLowerCase().includes(termo) || (numeros && a.paciente.cpf.replace(/\D/g, "").includes(numeros));
  });
  // triados: do risco mais alto para o mais baixo; os demais, pelo horario
  if (estado.filtro === "triado") {
    lista.sort(function (a, b) { return Profissional.prioridade(a.risco) - Profissional.prioridade(b.risco) || a.hora.localeCompare(b.hora); });
  }

  var vazio = {
    aguardando: ["Ninguém aguardando triagem", "Quando a recepção fizer o check-in, o paciente aparece aqui."],
    triado: ["Nenhum paciente triado ainda", "As triagens concluídas hoje aparecem aqui."],
    todos: ["Nenhum paciente na agenda de hoje", ""]
  }[estado.filtro];

  document.getElementById("listaFila").innerHTML = lista.map(cartao).join("") ||
    '<li class="estado-vazio"><strong>' + (termo ? "Nenhum paciente encontrado" : vazio[0]) + "</strong>" + (termo ? "Tente outro nome ou CPF." : vazio[1]) + "</li>";
  document.getElementById("chipRegistros").textContent = lista.length + (lista.length === 1 ? " paciente" : " pacientes");

  document.querySelectorAll("#filtros .filtro").forEach(function (b) {
    var ativo = b.dataset.filtro === estado.filtro;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  PerfilEnfermeiro.aoAtualizar(montarTopo);
  renderizar();

  document.getElementById("filtros").addEventListener("click", function (ev) {
    var botao = ev.target.closest(".filtro");
    if (!botao) return;
    estado.filtro = botao.dataset.filtro;
    renderizar();
  });
  document.getElementById("inputBusca").addEventListener("input", function (ev) {
    estado.busca = ev.target.value.toLowerCase().trim();
    renderizar();
  });
  document.getElementById("listaFila").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-historico]");
    if (botao) ProntuarioModal.abrir(botao.dataset.historico, "enfermagem");
  });
});
