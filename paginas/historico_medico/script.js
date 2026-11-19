// Historico Medico: linha do tempo com as consultas realizadas e os exames com resultado.
// Os dados vem de compartilhado/paciente_dados.js.

var e = Paciente.escapar;
var icone = PacienteUI.icone;

var estado = { busca: "", ano: "", tipo: "" };

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// consultas realizadas + laudos, do mais recente para o mais antigo
function registros() {
  var consultas = Paciente.realizadas().map(function (c) {
    return { tipo: "consulta", id: c.id, data: c.data, hora: c.hora, titulo: c.medico, linha1: c.especialidade, linha2: c.local + " · " + c.modalidade };
  });
  var exames = Paciente.laudos().map(function (x) {
    return { tipo: "exame", id: x.id, data: x.data, titulo: x.titulo, linha1: "Solicitado por " + x.solicitante, linha2: x.local };
  });
  return consultas.concat(exames).sort(function (a, b) { return b.data.localeCompare(a.data); });
}

function itemHtml(r) {
  var consulta = r.tipo === "consulta";
  return '<li class="item-tempo tipo-' + r.tipo + '">' +
    '<span class="ponto-tempo" aria-hidden="true">' + icone(consulta ? "estetoscopio" : "exame", 20) + "</span>" +
    '<div class="cartao-tempo">' +
      "<div>" +
        '<p class="data-tempo">' + Paciente.dataLonga(r.data) + (r.hora ? " · " + r.hora : "") + "</p>" +
        '<p class="cartao-titulo">' + e(r.titulo) + "</p>" +
        '<p class="cartao-linha">' + icone(consulta ? "estetoscopio" : "pessoa", 16) + e(r.linha1) + "</p>" +
        '<p class="cartao-linha">' + icone("local", 16) + e(r.linha2) + "</p>" +
      "</div>" +
      '<div class="lado-tempo">' + PacienteUI.badge(consulta ? "realizada" : "disponivel") +
        (consulta
          ? '<button type="button" class="btn-secundario" data-detalhes="' + e(r.id) + '">' + icone("documento", 16) + "Ver detalhes</button>"
          : '<a class="btn-secundario" href="../tela_principal_paciente/tela_meus_exames/index.html">' + icone("baixar", 16) + "Ver laudo</a>") +
      "</div>" +
    "</div>" +
  "</li>";
}

function renderizar() {
  var todos = registros();
  var termo = semAcento(estado.busca.trim());

  // busca e ano valem para os contadores; o tipo escolhe o que aparece
  var base = todos.filter(function (r) {
    if (estado.ano && r.data.slice(0, 4) !== estado.ano) return false;
    return !termo || semAcento(r.titulo + " " + r.linha1 + " " + r.linha2).indexOf(termo) !== -1;
  });
  var visiveis = base.filter(function (r) { return !estado.tipo || r.tipo === estado.tipo; });

  document.getElementById("contTudo").textContent = base.length;
  document.getElementById("contConsultas").textContent = base.filter(function (r) { return r.tipo === "consulta"; }).length;
  document.getElementById("contExames").textContent = base.filter(function (r) { return r.tipo === "exame"; }).length;
  document.querySelectorAll("[data-tipo]").forEach(function (b) {
    var ativo = b.dataset.tipo === estado.tipo;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo);
  });
  document.getElementById("chipRegistros").textContent = visiveis.length + (visiveis.length === 1 ? " registro" : " registros");

  // um bloco por ano
  var html = "";
  var anoAtual = "";
  visiveis.forEach(function (r) {
    var ano = r.data.slice(0, 4);
    if (ano !== anoAtual) {
      html += (anoAtual ? "</ol>" : "") + '<h3 class="ano-tempo">' + ano + '</h3><ol class="itens-tempo">';
      anoAtual = ano;
    }
    html += itemHtml(r);
  });
  document.getElementById("linhaTempo").innerHTML = html
    ? html + "</ol>"
    : '<p class="estado-vazio"><strong>Nenhum registro encontrado</strong>Tente outro nome ou limpe os filtros.</p>';
}

function montarResumo() {
  var realizadas = Paciente.realizadas();
  var especialidades = realizadas.map(function (c) { return c.especialidade; })
    .filter(function (nome, i, todas) { return todas.indexOf(nome) === i; });

  document.getElementById("numAtendimentos").textContent = realizadas.length;
  document.getElementById("numEspecialidades").textContent = especialidades.length;
  var ultimo = realizadas[0];
  document.getElementById("numUltimo").textContent = ultimo ? Paciente.formatarData(ultimo.data) : "—";
  document.getElementById("subUltimo").textContent = ultimo ? ultimo.medico + " · " + ultimo.especialidade : "nenhum atendimento";

  var porMes = Paciente.serieMeses(realizadas, 12);
  RecepcaoComp.grafico(document.getElementById("grafAtendimentos"), porMes.valores, { rotulos: porMes.rotulos, unidade: ["consulta", "consultas"] });

  // anos que existem no historico
  var select = document.getElementById("filtroAno");
  registros().map(function (r) { return r.data.slice(0, 4); })
    .filter(function (ano, i, todos) { return todos.indexOf(ano) === i; })
    .forEach(function (ano) {
      var opcao = document.createElement("option");
      opcao.value = opcao.textContent = ano;
      select.appendChild(opcao);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  montarResumo();
  renderizar();

  document.getElementById("busca").addEventListener("input", function (ev) { estado.busca = ev.target.value; renderizar(); });
  document.getElementById("filtroAno").addEventListener("change", function (ev) { estado.ano = ev.target.value; renderizar(); });
  document.querySelectorAll("[data-tipo]").forEach(function (b) {
    b.addEventListener("click", function () { estado.tipo = b.dataset.tipo; renderizar(); });
  });

  // botao "Ver detalhes" das consultas
  PacienteUI.ligarAcoes(document.getElementById("linhaTempo"));
});
