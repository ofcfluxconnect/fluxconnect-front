// Agendar Consulta: 4 passos (especialidade, profissional, data e hora, confirmacao).
// O agendamento e salvo por Paciente.agendarConsulta (compartilhado/paciente_dados.js)
// e aparece em Minhas Consultas e no Inicio.

var PAGINA_CONSULTAS = "../Consultas/index.html";
var TOTAL_PASSOS = 4;

var e = Paciente.escapar;
var icone = PacienteUI.icone;

var UBS = { local: "UBS Centro", endereco: "Rua Defala Attem, 812 — Floriano-PI" };
var HOSPITAL = { local: "Hospital Regional", endereco: "Av. Principal, 1200 — Floriano-PI" };

// desenho (svg) de cada especialidade
var especialidades = [
  { nome: "Clínica Geral", desenho: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>' },
  { nome: "Cardiologia", desenho: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
  { nome: "Pediatria", desenho: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>' },
  { nome: "Ginecologia", desenho: '<circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="18" x2="15" y2="18"/>' },
  { nome: "Dermatologia", desenho: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/>' },
  { nome: "Ortopedia", desenho: '<rect x="8" y="2" width="8" height="4" rx="1"/><rect x="7" y="8" width="10" height="4" rx="1"/><rect x="6" y="14" width="12" height="4" rx="1"/><rect x="8" y="20" width="8" height="2" rx="1"/>' },
  { nome: "Neurologia", desenho: '<path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"/><path d="M9 22h6"/>' },
  { nome: "Oftalmologia", desenho: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' }
];

var profissionais = {
  "Clínica Geral": [
    Object.assign({ id: "cg-1", nome: "Dr. Carlos Lima", crm: "CRM-PI 112233" }, { local: "Clínica FluxMed", endereco: "Rua Defala Attem, 1200 — Floriano-PI" }),
    Object.assign({ id: "cg-2", nome: "Dra. Patrícia Neves", crm: "CRM-PI 223344" }, UBS),
    Object.assign({ id: "cg-3", nome: "Dr. Eduardo Farias", crm: "CRM-PI 334455" }, HOSPITAL),
    Object.assign({ id: "cg-4", nome: "Dra. Camila Torres", crm: "CRM-PI 445566" }, UBS)
  ],
  "Cardiologia": [
    Object.assign({ id: "card-1", nome: "Dra. Ana Paula", crm: "CRM-PI 889900" }, UBS),
    Object.assign({ id: "card-2", nome: "Dr. Paulo Neto", crm: "CRM-PI 778899" }, HOSPITAL)
  ],
  "Pediatria": [
    Object.assign({ id: "ped-1", nome: "Dra. Helena Duarte", crm: "CRM-PI 661122" }, UBS),
    Object.assign({ id: "ped-2", nome: "Dr. Gustavo Prado", crm: "CRM-PI 662233" }, HOSPITAL)
  ],
  "Ginecologia": [
    Object.assign({ id: "gin-1", nome: "Dra. Mariana Costa", crm: "CRM-PI 553311" }, UBS)
  ],
  "Dermatologia": [
    Object.assign({ id: "derm-1", nome: "Dr. Carlos Mendes", crm: "CRM-PI 991122" }, UBS),
    Object.assign({ id: "derm-2", nome: "Dra. Fernanda Rocha", crm: "CRM-PI 992233" }, UBS)
  ],
  "Ortopedia": [
    Object.assign({ id: "ort-1", nome: "Dr. Fábio Almeida", crm: "CRM-PI 441122" }, UBS),
    Object.assign({ id: "ort-2", nome: "Dr. Ricardo Alves", crm: "CRM-PI 442233" }, HOSPITAL)
  ],
  "Neurologia": [
    Object.assign({ id: "neu-1", nome: "Dra. Renata Silva", crm: "CRM-PI 331122" }, UBS)
  ],
  "Oftalmologia": [
    Object.assign({ id: "oft-1", nome: "Dra. Beatriz Santos", crm: "CRM-PI 221133" }, UBS)
  ]
};

var cores = ["#1e5bb8", "#7c3aed", "#0f766e", "#b45309", "#be185d", "#047857"];

var estado = { passo: 1, especialidade: null, medico: null, data: null, hora: null, enviado: false };

function podeAvancar() {
  if (estado.enviado) return false;
  if (estado.passo === 1) return !!estado.especialidade;
  if (estado.passo === 2) return !!estado.medico;
  if (estado.passo === 3) return !!(estado.data && estado.hora);
  return true;
}

function atualizarRodape() {
  document.getElementById("btnProximo").disabled = !podeAvancar();
  document.getElementById("txtProximo").textContent = estado.passo === TOTAL_PASSOS ? "Confirmar agendamento" : "Próximo";
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

  if (numero === 2) desenharMedicos();
  if (numero === 3) desenharHorarios();
  if (numero === 4) desenharResumo();
  atualizarRodape();
  document.querySelector(".conteudo-principal").scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- passo 1: especialidade ----------
function desenharEspecialidades() {
  var termo = document.getElementById("buscaEspecialidade").value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  var visiveis = especialidades.filter(function (esp) {
    return esp.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").indexOf(termo) !== -1;
  });
  document.getElementById("listaEspecialidades").innerHTML = visiveis.map(function (esp) {
    var quantos = profissionais[esp.nome].length;
    var marcada = esp.nome === estado.especialidade;
    return '<button type="button" class="opcao-card' + (marcada ? " selecionada" : "") + '" role="option" aria-selected="' + marcada + '" data-especialidade="' + e(esp.nome) + '">' +
      '<span class="icone-opcao"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + esp.desenho + "</svg></span>" +
      '<span class="opcao-nome">' + e(esp.nome) + "</span>" +
      '<span class="opcao-sub">' + quantos + (quantos === 1 ? " profissional" : " profissionais") + "</span>" +
    "</button>";
  }).join("") || '<p class="lista-vazia">Nenhuma especialidade encontrada.</p>';
}

// ---------- passo 2: profissional ----------
function desenharMedicos() {
  document.getElementById("subProfissional").textContent = "Mostrando especialistas em " + estado.especialidade + ".";
  document.getElementById("listaMedicos").innerHTML = profissionais[estado.especialidade].map(function (m, i) {
    var marcado = estado.medico && estado.medico.id === m.id;
    return '<li><button type="button" class="opcao' + (marcado ? " selecionada" : "") + '" role="option" aria-selected="' + !!marcado + '" data-medico="' + m.id + '">' +
      '<span class="avatar-pessoa" style="background:' + cores[i % cores.length] + '">' + Paciente.iniciais(m.nome) + "</span>" +
      '<span class="opcao-texto"><span class="opcao-nome">' + e(m.nome) + "</span>" +
        '<span class="opcao-sub">' + e(m.crm) + " · " + e(m.local) + "</span></span>" +
      '<svg class="check-opcao" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16.5 9.5"/></svg>' +
    "</button></li>";
  }).join("");
}

// ---------- passo 3: data e hora ----------
function desenharHorarios() {
  var d = Paciente.lerISO(estado.data);
  document.getElementById("subDataHora").textContent = "Agenda de " + estado.medico.nome + " — " + estado.especialidade + ".";
  document.getElementById("tituloHorarios").textContent = "Horários para " + d.getDate() + " de " + Paciente.meses[d.getMonth()];

  var feriado = PacienteUI.feriadoDe(estado.data);
  var aviso = document.getElementById("avisoFeriado");
  aviso.hidden = !feriado;
  if (feriado) aviso.textContent = descreverFeriado(feriado) + ". Confirme o funcionamento da clínica antes de ir.";

  // o horario escolhido deixa de valer se ja passou ou se bate com outra consulta
  if (estado.hora && (PacienteUI.horariosLivres(estado.data).indexOf(estado.hora) === -1 || Paciente.conflito(estado.data, estado.hora))) estado.hora = null;

  PacienteUI.horarios(document.getElementById("gradeHorarios"), {
    data: estado.data,
    selecionado: estado.hora,
    aoEscolher: function (hora) {
      estado.hora = hora;
      desenharHorarios();
      atualizarRodape();
    }
  });
}

// ---------- passo 4: confirmacao ----------
function desenharResumo() {
  var m = estado.medico;
  document.getElementById("resumo").innerHTML =
    "<div><dt>Profissional</dt><dd>" + e(m.nome) + " — " + e(estado.especialidade) + "<small>" + e(m.crm) + "</small></dd></div>" +
    "<div><dt>Data</dt><dd>" + Paciente.dataExtenso(estado.data) + "</dd></div>" +
    "<div><dt>Horário</dt><dd>" + estado.hora + "<small>Duração estimada de 30 min</small></dd></div>" +
    "<div><dt>Local</dt><dd>" + e(m.local) + "<small>" + e(m.endereco) + "</small></dd></div>" +
    "<div><dt>Modalidade</dt><dd>Presencial</dd></div>";
}

function confirmar() {
  var m = estado.medico;
  if (Paciente.conflito(estado.data, estado.hora)) {
    RecepcaoUI.toast("Horário indisponível", "Você já tem uma consulta nesse dia e horário. Escolha outro.", "erro");
    mostrarPasso(3);
    return;
  }
  Paciente.agendarConsulta({ data: estado.data, hora: estado.hora, medico: m.nome, especialidade: estado.especialidade, local: m.local });
  estado.enviado = true;
  atualizarRodape();
  document.getElementById("btnVoltar").disabled = true;
  PacienteUI.sucesso("Agendamento confirmado!", "Consulta com " + m.nome + " em " + Paciente.formatarData(estado.data) + " às " + estado.hora + ".",
    function () { window.location.href = PAGINA_CONSULTAS; });
}

document.addEventListener("DOMContentLoaded", function () {
  estado.data = PacienteUI.primeiroDiaDisponivel();

  desenharEspecialidades();
  document.getElementById("buscaEspecialidade").addEventListener("input", desenharEspecialidades);

  // escolher a especialidade ja leva para os profissionais
  document.getElementById("listaEspecialidades").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-especialidade]");
    if (!botao) return;
    if (estado.especialidade !== botao.dataset.especialidade) estado.medico = null;
    estado.especialidade = botao.dataset.especialidade;
    desenharEspecialidades();
    mostrarPasso(2);
  });

  document.getElementById("listaMedicos").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-medico]");
    if (!botao) return;
    estado.medico = profissionais[estado.especialidade].find(function (m) { return m.id === botao.dataset.medico; });
    desenharMedicos();
    atualizarRodape();
  });

  PacienteUI.calendario(document.getElementById("calendario"), {
    selecionada: estado.data,
    aoEscolher: function (dataISO) {
      estado.data = dataISO;
      desenharHorarios();
      atualizarRodape();
    }
  });

  document.getElementById("btnVoltar").addEventListener("click", function () {
    if (estado.passo === 1) window.location.href = PAGINA_CONSULTAS;
    else mostrarPasso(estado.passo - 1);
  });
  document.getElementById("btnProximo").addEventListener("click", function () {
    if (!podeAvancar()) return;
    if (estado.passo === TOTAL_PASSOS) confirmar();
    else mostrarPasso(estado.passo + 1);
  });

  mostrarPasso(1);
});
