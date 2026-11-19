// Inicio do paciente: resumo, proxima consulta, proximo exame e proximos compromissos.
// Os dados vem de compartilhado/paciente_dados.js; os lembretes ficam no sininho.

var e = Paciente.escapar;
var icone = PacienteUI.icone;

function montarTopo() {
  var h = new Date().getHours();
  var saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  document.getElementById("tituloPagina").textContent = saudacao + ", " + Paciente.perfil().nomeCurto;
  document.getElementById("subtituloPagina").textContent = Paciente.dataExtenso(Paciente.iso(Paciente.hoje())) + " · Acompanhe suas consultas e exames em um só lugar.";
}

// "Sexta-feira, 21 de novembro de 2026 (em 3 dias)"
function dataComPrazo(dataISO) {
  return Paciente.dataExtenso(dataISO) + " (" + Paciente.quando(dataISO) + ")";
}

function desenharConsulta(c) {
  var card = document.getElementById("cardConsulta");
  if (!c) {
    card.innerHTML =
      '<div class="destaque-topo"><span class="destaque-rotulo">Próxima consulta</span><span class="destaque-icone">' + icone("estetoscopio", 22) + "</span></div>" +
      '<div class="destaque-vazio"><strong>Nenhuma consulta agendada</strong>Agende uma consulta para vê-la aqui.</div>' +
      '<div class="destaque-acoes"><a class="btn-primario" href="../agendar_consulta/index.html">Agendar consulta</a></div>';
    return;
  }
  card.innerHTML =
    '<div class="destaque-topo"><span class="destaque-rotulo">Próxima consulta</span>' + PacienteUI.badge(c.status) +
      '<span class="destaque-icone">' + icone("estetoscopio", 22) + "</span></div>" +
    '<div><h2 class="destaque-titulo">' + e(c.medico) + '</h2><p class="destaque-sub">' + e(c.especialidade) + "</p></div>" +
    '<ul class="lista-info">' +
      "<li>" + icone("calendario") + dataComPrazo(c.data) + "</li>" +
      "<li>" + icone("relogio") + c.hora + " · Duração estimada de 30 min</li>" +
      "<li>" + icone(c.modalidade === "Teleconsulta" ? "video" : "local") + e(c.local) + " · " + e(c.modalidade) + "</li>" +
    "</ul>" +
    '<div class="destaque-acoes">' +
      '<a class="btn-secundario" href="' + PacienteUI.linkReagendar(c.id, "inicio") + '">' + icone("reagendar", 16) + "Reagendar</a>" +
      '<button type="button" class="btn-perigo" data-cancelar="' + e(c.id) + '">' + icone("fechar", 16) + "Cancelar consulta</button>" +
    "</div>";
}

function desenharExame(x) {
  var card = document.getElementById("cardExame");
  if (!x) {
    card.innerHTML =
      '<div class="destaque-topo"><span class="destaque-rotulo">Próximo exame</span><span class="destaque-icone verde">' + icone("exame", 22) + "</span></div>" +
      '<div class="destaque-vazio"><strong>Nenhum exame marcado</strong>Seus laudos continuam disponíveis em Meus exames.</div>' +
      '<div class="destaque-acoes"><a class="btn-secundario" href="tela_meus_exames/index.html">Ver meus exames</a></div>';
    return;
  }
  card.innerHTML =
    '<div class="destaque-topo"><span class="destaque-rotulo">Próximo exame</span>' + PacienteUI.badge(x.status) +
      '<span class="destaque-icone verde">' + icone("exame", 22) + "</span></div>" +
    '<div><h2 class="destaque-titulo">' + e(x.titulo) + '</h2><p class="destaque-sub">' + e(x.descricao || "") + "</p></div>" +
    '<ul class="lista-info">' +
      "<li>" + icone("calendario") + dataComPrazo(x.data) + "</li>" +
      "<li>" + icone("relogio") + x.hora + (x.preparo ? " · " + e(x.preparo.principal) : "") + "</li>" +
      "<li>" + icone("local") + e(x.local) + "</li>" +
    "</ul>" +
    '<div class="destaque-acoes">' +
      '<button type="button" class="btn-primario" id="btnPreparo">' + icone("info", 16) + "Ver preparo</button>" +
      '<a class="btn-secundario" href="tela_meus_exames/index.html?aba=pendentes">Ver exames marcados</a>' +
    "</div>";
  document.getElementById("btnPreparo").addEventListener("click", function () { PacienteUI.preparo(x); });
}

function renderizar() {
  var proximas = Paciente.proximas();
  var examesMarcados = Paciente.examesPendentes().filter(function (x) { return Paciente.diasAte(x.data) >= 0; });
  var ano = String(Paciente.hoje().getFullYear());
  var doAno = Paciente.realizadas().filter(function (c) { return c.data.slice(0, 4) === ano; });

  // consultas e exames que estao por vir, na ordem em que acontecem
  var compromissos = proximas.map(function (c) {
    return { tipo: "consulta", data: c.data, hora: c.hora, titulo: c.medico, texto: c.especialidade + " · " + c.local, status: c.status };
  }).concat(examesMarcados.map(function (x) {
    return { tipo: "exame", data: x.data, hora: x.hora, titulo: x.titulo, texto: x.local, status: x.status };
  })).sort(function (a, b) { return (a.data + a.hora).localeCompare(b.data + b.hora); });

  // cards de resumo
  document.getElementById("numProximas").textContent = proximas.length;
  document.getElementById("numAno").textContent = doAno.length;
  document.getElementById("subAno").textContent = "em " + ano;
  document.getElementById("numLaudos").textContent = Paciente.laudos().length;

  var primeiro = compromissos[0];
  document.getElementById("numProximo").textContent = primeiro ? (function (n) { return n === 0 ? "Hoje" : n === 1 ? "Amanhã" : n + " dias"; })(Paciente.diasAte(primeiro.data)) : "—";
  document.getElementById("subProximo").textContent = primeiro
    ? (primeiro.tipo === "consulta" ? "Consulta" : "Exame") + " · " + Paciente.formatarData(primeiro.data).slice(0, 5) + ", " + primeiro.hora
    : "nada agendado";

  // graficos: a soma dos pontos e o numero do card
  var semanas = Paciente.serieSemanas(proximas, Math.max(4, Math.ceil((Paciente.diasAte((proximas[proximas.length - 1] || { data: Paciente.iso(Paciente.hoje()) }).data) + 1) / 7)));
  RecepcaoComp.grafico(document.getElementById("grafProximas"), semanas.valores, { tipo: "barras", rotulos: semanas.rotulos, unidade: ["consulta", "consultas"] });
  var mesesDoAno = Paciente.serieMeses(doAno, Paciente.hoje().getMonth() + 1);
  RecepcaoComp.grafico(document.getElementById("grafAno"), mesesDoAno.valores, { rotulos: mesesDoAno.rotulos, unidade: ["consulta", "consultas"] });

  desenharConsulta(proximas[0]);
  desenharExame(examesMarcados[0]);

  var hojeISO = Paciente.iso(Paciente.hoje());
  var amanhaISO = Paciente.iso(Paciente.somarDias(Paciente.hoje(), 1));
  document.getElementById("listaProximos").innerHTML = compromissos.slice(0, 6).map(function (c) {
    var dia = c.data === hojeISO ? "Hoje" : c.data === amanhaISO ? "Amanhã" : Paciente.formatarData(c.data).slice(0, 5);
    return "<li>" +
      '<span class="prox-hora">' + c.hora + '<span class="prox-dia">' + dia + "</span></span>" +
      '<div><p class="prox-nome">' + icone(c.tipo === "consulta" ? "estetoscopio" : "exame", 16) + e(c.titulo) + '</p><p class="prox-medico">' + e(c.texto) + "</p></div>" +
      PacienteUI.badge(c.status) +
    "</li>";
  }).join("") || '<li class="lista-vazia">Nenhum compromisso futuro.</li>';
}

document.addEventListener("DOMContentLoaded", function () {
  montarTopo();
  renderizar();
  // botao "Cancelar consulta" do card: depois de cancelar, a tela e redesenhada
  PacienteUI.ligarAcoes(document.getElementById("cardConsulta"), renderizar);
});
