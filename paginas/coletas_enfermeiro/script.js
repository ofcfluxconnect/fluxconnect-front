// Coleta de exames (enfermeiro): exames pedidos pelos medicos, um item por exame.
// "Registrar coleta" guarda quem coletou, quando e a observacao (Enfermagem.registrarColeta).

var e = Profissional.escapar;
var estado = { filtro: "solicitado", busca: "" };
var coletas = [];
var emRegistro = null; // exame aberto na janela de registro

var icones = {
  pessoa: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  estetoscopio: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.8 2.6A2 2 0 1 0 3 6h3a2 2 0 1 0-1.8-3.4"/><path d="M4.5 6v5a5.5 5.5 0 0 0 11 0V6"/><path d="M19.5 13a2.5 2.5 0 1 0 0 5"/><path d="M22 15.5v2A4.5 4.5 0 0 1 17.5 22h-1A4.5 4.5 0 0 1 12 17.5"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7.5"/></svg>',
  relogio: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>'
};

var mesesCurtos = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function badge(status) {
  return status === "coletado"
    ? '<span class="badge badge-confirmada"><span class="badge-ponto"></span>Coletado</span>'
    : '<span class="badge badge-pendente"><span class="badge-ponto"></span>Solicitado</span>';
}

function cartao(c, indice) {
  var feito = c.coleta
    ? '<p class="cartao-linha cartao-registro">' + icones.check + "Coletado em " + PacientesProfissional.formatarData(c.coleta.data) + " às " + Enfermagem.hora(c.coleta.data) +
      " por " + e(c.coleta.autor) + (c.coleta.observacao ? " — " + e(c.coleta.observacao) : "") + "</p>"
    : "";
  return '<li class="cartao-item cartao-' + c.status + '">' +
    '<div class="bloco-data"><span class="bloco-dia">' + String(c.data.getDate()).padStart(2, "0") + '</span><span class="bloco-mes">' + mesesCurtos[c.data.getMonth()] + " " + c.data.getFullYear() +
      '</span><span class="bloco-hora">' + icones.relogio + Enfermagem.hora(c.data) + "</span></div>" +
    '<div class="cartao-info">' +
      '<p class="cartao-titulo">' + e(c.exame) + "</p>" +
      '<p class="cartao-linha">' + icones.pessoa + e(c.paciente.nome) + " · #" + e(c.paciente.id) + "</p>" +
      '<p class="cartao-linha">' + icones.estetoscopio + "Solicitado por " + e(c.medico) + "</p>" +
      '<p class="cartao-linha">' + icones.info + e(c.indicacao) + "</p>" + feito +
    "</div>" +
    '<div class="cartao-lado">' + badge(c.status) + '<div class="cartao-acoes">' +
      (c.status === "solicitado" ? '<button type="button" class="btn-primario" data-registrar="' + indice + '">' + icones.check + "Registrar coleta</button>" : "") +
    "</div></div>" +
  "</li>";
}

// Graficos dos cards (a soma dos pontos e o numero do card):
// pendentes e total por dia do pedido; coletas de hoje por hora.
function desenharGraficos() {
  var dias = [];
  coletas.forEach(function (c) {
    var chave = c.data.toDateString();
    if (!dias.some(function (d) { return d.chave === chave; })) dias.push({ chave: chave, data: c.data });
  });
  dias.sort(function (a, b) { return a.data - b.data; });
  var rotulosDias = dias.map(function (d) { return Enfermagem.ehHoje(d.data) ? "Hoje" : PacientesProfissional.formatarData(d.data).slice(0, 5); });
  function porDia(filtro) {
    return dias.map(function (d) { return coletas.filter(function (c) { return c.data.toDateString() === d.chave && filtro(c); }).length; });
  }
  var unidade = ["exame", "exames"];
  RecepcaoComp.grafico(document.getElementById("grafPendentes"), porDia(function (c) { return c.status === "solicitado"; }), { rotulos: rotulosDias, unidade: unidade });
  RecepcaoComp.grafico(document.getElementById("grafTotal"), porDia(function () { return true; }), { rotulos: rotulosDias, unidade: unidade });

  // coletas feitas hoje, das 7h as 18h
  var horas = [];
  for (var h = 7; h <= 18; h++) horas.push(h);
  var deHoje = coletas.filter(function (c) { return c.coleta && Enfermagem.ehHoje(c.coleta.data); });
  RecepcaoComp.grafico(document.getElementById("grafHoje"),
    horas.map(function (h) { return deHoje.filter(function (c) { return new Date(c.coleta.data).getHours() === h; }).length; }),
    { rotulos: horas.map(function (h) { return String(h).padStart(2, "0") + "h"; }), unidade: ["coleta", "coletas"] });
}

function renderizar() {
  coletas = Enfermagem.coletas();
  var pendentes = coletas.filter(function (c) { return c.status === "solicitado"; }).length;
  var coletados = coletas.length - pendentes;

  document.getElementById("numPendentes").textContent = document.getElementById("contPendentes").textContent = pendentes;
  document.getElementById("contColetados").textContent = coletados;
  document.getElementById("numHoje").textContent = coletas.filter(function (c) { return c.coleta && Enfermagem.ehHoje(c.coleta.data); }).length;
  document.getElementById("numTotal").textContent = document.getElementById("contTodos").textContent = coletas.length;

  desenharGraficos();

  var termo = semAcento(estado.busca.trim());
  var html = "";
  var visiveis = 0;
  coletas.forEach(function (c, i) {
    if (estado.filtro !== "todos" && c.status !== estado.filtro) return;
    if (termo && semAcento(c.paciente.nome + " " + c.exame).indexOf(termo) === -1) return;
    html += cartao(c, i);
    visiveis++;
  });

  document.getElementById("listaColetas").innerHTML = html ||
    '<li class="estado-vazio"><strong>' + (termo ? "Nenhum exame encontrado" : estado.filtro === "solicitado" ? "Nenhuma coleta pendente" : "Nada por aqui") + "</strong>" +
    (termo ? "Tente outro nome." : estado.filtro === "solicitado" ? "Os pedidos de exame feitos pelos médicos aparecem aqui." : "") + "</li>";
  document.getElementById("chipRegistros").textContent = visiveis + (visiveis === 1 ? " exame" : " exames");

  document.querySelectorAll("#filtros .filtro").forEach(function (b) {
    var ativo = b.dataset.filtro === estado.filtro;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo);
  });
}

// ---------- janela de registro ----------
function abrirRegistro(c) {
  emRegistro = c;
  document.getElementById("regSub").textContent = c.exame;
  document.getElementById("regResumo").innerHTML =
    "<div>" + icones.pessoa + "<div><dt>Paciente</dt><dd>" + e(c.paciente.nome) + " · #" + e(c.paciente.id) + "</dd></div></div>" +
    "<div>" + icones.estetoscopio + "<div><dt>Solicitado por</dt><dd>" + e(c.medico) + "</dd></div></div>" +
    "<div>" + icones.info + "<div><dt>Indicação clínica</dt><dd>" + e(c.indicacao) + "</dd></div></div>";
  document.getElementById("regObs").value = "";
  document.getElementById("modalRegistro").classList.add("visivel");
  document.getElementById("regObs").focus();
}

function fecharRegistro() {
  document.getElementById("modalRegistro").classList.remove("visivel");
  emRegistro = null;
}

document.addEventListener("DOMContentLoaded", function () {
  renderizar();

  document.getElementById("filtros").addEventListener("click", function (ev) {
    var botao = ev.target.closest(".filtro");
    if (!botao) return;
    estado.filtro = botao.dataset.filtro;
    renderizar();
  });
  document.getElementById("inputBusca").addEventListener("input", function (ev) {
    estado.busca = ev.target.value;
    renderizar();
  });
  document.getElementById("listaColetas").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-registrar]");
    if (botao) abrirRegistro(coletas[+botao.dataset.registrar]);
  });

  var modal = document.getElementById("modalRegistro");
  modal.addEventListener("click", function (ev) {
    if (ev.target === modal || ev.target.closest("[data-fechar-modal]")) fecharRegistro();
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fecharRegistro(); });

  document.getElementById("btnConfirmarRegistro").addEventListener("click", function () {
    if (!emRegistro) return;
    var c = emRegistro;
    Enfermagem.registrarColeta(c.chave, document.getElementById("regObs").value.trim());
    fecharRegistro();
    renderizar();
    FluxConfirmacao.sucesso("Coleta registrada com sucesso", c.exame + " de " + c.paciente.nome + ".");
  });
});
