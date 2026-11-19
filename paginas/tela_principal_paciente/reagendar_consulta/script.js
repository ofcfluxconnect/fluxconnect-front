// Reagendar Consulta: escolhe a nova data e hora e confirma a troca.
// Abre com ?id=<consulta> (e ?volta=inicio para voltar ao Inicio em vez de Minhas Consultas).
// Sem id, usa a proxima consulta do paciente. Uma consulta cancelada tambem pode ser remarcada.

var TOTAL_PASSOS = 2;
var e = Paciente.escapar;
var icone = PacienteUI.icone;

var parametros = new URLSearchParams(location.search);
var PAGINA_VOLTA = parametros.get("volta") === "inicio"
  ? Paciente.url("tela_principal_paciente/index.html")
  : Paciente.url("Consultas/index.html");

var consulta = parametros.get("id") ? Paciente.obterConsulta(parametros.get("id")) : Paciente.proximas()[0];
if (consulta && consulta.status === "realizada") consulta = null;

// consulta cancelada nao tem "data atual" para destacar
var cancelada = consulta && consulta.status === "cancelada";
var estado = { passo: 1, data: null, hora: null, enviado: false };

function podeAvancar() {
  if (estado.enviado) return false;
  return estado.passo === 1 ? !!(estado.data && estado.hora) : true;
}

function atualizarRodape() {
  document.getElementById("btnProximo").disabled = !podeAvancar();
  document.getElementById("txtProximo").textContent = estado.passo === TOTAL_PASSOS ? "Confirmar reagendamento" : "Próximo";
  document.getElementById("txtPasso").textContent = "Passo " + estado.passo + " de " + TOTAL_PASSOS;
}

function mostrarPasso(numero) {
  estado.passo = numero;
  document.querySelectorAll("#stepper li").forEach(function (li) {
    var n = +li.dataset.passo;
    li.classList.toggle("ativo", n === numero);
    li.classList.toggle("concluido", n < numero);
    if (n === numero) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    li.querySelector(".circulo").innerHTML = n < numero
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : n;
  });
  document.querySelectorAll(".passo").forEach(function (p) {
    p.classList.toggle("ativo", +p.dataset.passo === numero);
  });
  if (numero === 2) desenharComparacao();
  atualizarRodape();
}

function desenharHorarios() {
  var titulo = document.getElementById("tituloHorarios");
  var grade = document.getElementById("gradeHorarios");
  var aviso = document.getElementById("avisoFeriado");
  if (!estado.data) {
    titulo.textContent = "Horários";
    grade.innerHTML = '<p class="sem-horario">Escolha um dia no calendário para ver os horários.</p>';
    aviso.hidden = true;
    return;
  }

  var d = Paciente.lerISO(estado.data);
  titulo.textContent = "Horários para " + d.getDate() + " de " + Paciente.meses[d.getMonth()];
  var feriado = PacienteUI.feriadoDe(estado.data);
  aviso.hidden = !feriado;
  if (feriado) aviso.textContent = descreverFeriado(feriado) + ". Confirme o funcionamento da clínica antes de ir.";

  PacienteUI.horarios(grade, {
    data: estado.data,
    selecionado: estado.hora,
    ignorarId: consulta.id,
    atual: !cancelada && estado.data === consulta.data ? consulta.hora : null,
    aoEscolher: function (hora) {
      estado.hora = hora;
      desenharHorarios();
      atualizarRodape();
    }
  });
}

function desenharComparacao() {
  var medico = e(consulta.medico) + " · " + e(consulta.especialidade);
  document.getElementById("comparacao").innerHTML =
    '<div class="bloco-comparacao antigo"><p class="comp-rotulo">' + (cancelada ? "Consulta cancelada" : "Consulta atual") + "</p>" +
      '<p class="comp-data">' + Paciente.dataLonga(consulta.data) + " · " + consulta.hora + '</p><p class="comp-texto">' + medico + "</p></div>" +
    '<span class="comp-seta" aria-hidden="true">' + icone("seta", 16) + "</span>" +
    '<div class="bloco-comparacao novo"><p class="comp-rotulo">Nova consulta</p>' +
      '<p class="comp-data">' + Paciente.dataLonga(estado.data) + " · " + estado.hora + '</p><p class="comp-texto">' + medico + "</p></div>";
}

function confirmar() {
  Paciente.reagendarConsulta(consulta.id, estado.data, estado.hora);
  estado.enviado = true;
  atualizarRodape();
  document.getElementById("btnVoltar").disabled = true;
  PacienteUI.sucesso("Consulta reagendada com sucesso", "Nova data: " + Paciente.dataExtenso(estado.data) + " às " + estado.hora + ".",
    function () { window.location.href = PAGINA_VOLTA; });
}

document.addEventListener("DOMContentLoaded", function () {
  if (!consulta) {
    document.getElementById("cardWizard").hidden = true;
    document.getElementById("semConsulta").hidden = false;
    return;
  }

  document.getElementById("avisoReagendar").innerHTML = icone("reagendar", 16) +
    "<span>" + (cancelada ? "Remarcando" : "Reagendando") + " consulta com <strong>" + e(consulta.medico) + " — " + e(consulta.especialidade) + "</strong>" +
    (cancelada ? "." : ", marcada para " + Paciente.formatarData(consulta.data) + " às " + consulta.hora + ".") + "</span>";

  PacienteUI.calendario(document.getElementById("calendario"), {
    mes: !cancelada && Paciente.diasAte(consulta.data) >= 0 ? consulta.data : null,
    atual: cancelada ? null : consulta.data,
    aoEscolher: function (dataISO) {
      estado.data = dataISO;
      estado.hora = null; // trocar o dia pede um novo horario
      desenharHorarios();
      atualizarRodape();
    }
  });
  desenharHorarios();

  document.getElementById("btnVoltar").addEventListener("click", function () {
    if (estado.passo === 1) window.location.href = PAGINA_VOLTA;
    else mostrarPasso(estado.passo - 1);
  });
  document.getElementById("btnProximo").addEventListener("click", function () {
    if (!podeAvancar()) return;
    if (estado.passo === TOTAL_PASSOS) confirmar();
    else mostrarPasso(estado.passo + 1);
  });

  mostrarPasso(1);
});
