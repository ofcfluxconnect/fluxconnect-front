// Minhas Consultas: proximas, realizadas e canceladas, com busca, filtro e paginas.
// Os dados vem de compartilhado/paciente_dados.js.
// Abrir com ?aba=realizadas (ou canceladas) ja mostra aquela lista.

var POR_PAGINA = 4;

var abas = {
  proximas: { titulo: "próximas", listar: Paciente.proximas, vazio: "Você não tem consultas agendadas." },
  realizadas: { titulo: "realizadas", listar: Paciente.realizadas, vazio: "Nenhuma consulta realizada ainda." },
  canceladas: { titulo: "canceladas", listar: Paciente.canceladas, vazio: "Nenhuma consulta cancelada." }
};

var estado = { aba: "proximas", pagina: 1, busca: "", especialidade: "" };

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function filtrar(lista) {
  var termo = semAcento(estado.busca.trim());
  return lista.filter(function (c) {
    if (estado.especialidade && c.especialidade !== estado.especialidade) return false;
    return !termo || semAcento(c.medico + " " + c.especialidade + " " + c.local).indexOf(termo) !== -1;
  });
}

function preencherEspecialidades() {
  var select = document.getElementById("filtroEspecialidade");
  var nomes = Paciente.consultas().map(function (c) { return c.especialidade; })
    .filter(function (nome, i, todos) { return todos.indexOf(nome) === i; }).sort();
  nomes.forEach(function (nome) {
    var opcao = document.createElement("option");
    opcao.value = opcao.textContent = nome;
    select.appendChild(opcao);
  });
}

function renderizar() {
  var listas = { proximas: Paciente.proximas(), realizadas: Paciente.realizadas(), canceladas: Paciente.canceladas() };

  // cards e contadores
  document.getElementById("numProximas").textContent = document.getElementById("contProximas").textContent = listas.proximas.length;
  document.getElementById("numRealizadas").textContent = document.getElementById("contRealizadas").textContent = listas.realizadas.length;
  document.getElementById("numCanceladas").textContent = document.getElementById("contCanceladas").textContent = listas.canceladas.length;

  var unidade = ["consulta", "consultas"];
  var ultima = listas.proximas[listas.proximas.length - 1];
  var semanas = Paciente.serieSemanas(listas.proximas, Math.max(4, ultima ? Math.ceil((Paciente.diasAte(ultima.data) + 1) / 7) : 4));
  RecepcaoComp.grafico(document.getElementById("grafProximas"), semanas.valores, { tipo: "barras", rotulos: semanas.rotulos, unidade: unidade });
  var realizadasMes = Paciente.serieMeses(listas.realizadas, 12);
  RecepcaoComp.grafico(document.getElementById("grafRealizadas"), realizadasMes.valores, { rotulos: realizadasMes.rotulos, unidade: unidade });
  var canceladasMes = Paciente.serieMeses(listas.canceladas, 12);
  RecepcaoComp.grafico(document.getElementById("grafCanceladas"), canceladasMes.valores, { rotulos: canceladasMes.rotulos, unidade: unidade });

  document.querySelectorAll("[data-aba]").forEach(function (b) {
    var ativo = b.dataset.aba === estado.aba;
    b.classList.toggle("ativo", ativo && b.classList.contains("filtro"));
    b.setAttribute("aria-pressed", ativo);
  });

  // lista da aba atual
  var filtradas = filtrar(listas[estado.aba]);
  var totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;
  var inicio = (estado.pagina - 1) * POR_PAGINA;
  var daPagina = filtradas.slice(inicio, inicio + POR_PAGINA);

  var lista = document.getElementById("listaConsultas");
  if (daPagina.length) {
    lista.innerHTML = daPagina.map(function (c) { return PacienteUI.cartaoConsulta(c, "consultas"); }).join("");
  } else {
    var filtrando = estado.busca.trim() || estado.especialidade;
    lista.innerHTML = '<li class="estado-vazio"><strong>' + (filtrando ? "Nenhuma consulta encontrada" : abas[estado.aba].vazio) + "</strong>" +
      (filtrando ? "Tente outro nome ou limpe os filtros." : estado.aba === "proximas" ? '<div><a class="btn-primario" href="../agendar_consulta/index.html">Agendar consulta</a></div>' : "") + "</li>";
  }

  document.getElementById("chipRegistros").textContent = filtradas.length + (filtradas.length === 1 ? " consulta" : " consultas");
  document.getElementById("textoRodape").textContent = filtradas.length
    ? "Mostrando " + (inicio + 1) + "–" + (inicio + daPagina.length) + " de " + filtradas.length + " " + abas[estado.aba].titulo
    : "";
  RecepcaoComp.paginacao(document.getElementById("paginacao"), estado.pagina, totalPaginas);
}

function trocarAba(aba) {
  if (!abas[aba]) return;
  estado.aba = aba;
  estado.pagina = 1;
  renderizar();
}

document.addEventListener("DOMContentLoaded", function () {
  var pedida = new URLSearchParams(location.search).get("aba");
  if (abas[pedida]) estado.aba = pedida;

  preencherEspecialidades();
  renderizar();

  document.querySelectorAll("[data-aba]").forEach(function (b) {
    b.addEventListener("click", function () { trocarAba(b.dataset.aba); });
  });
  document.getElementById("busca").addEventListener("input", function (ev) {
    estado.busca = ev.target.value;
    estado.pagina = 1;
    renderizar();
  });
  document.getElementById("filtroEspecialidade").addEventListener("change", function (ev) {
    estado.especialidade = ev.target.value;
    estado.pagina = 1;
    renderizar();
  });
  document.getElementById("paginacao").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-pag]");
    if (!botao || botao.disabled) return;
    estado.pagina = +botao.dataset.pag;
    renderizar();
  });

  // botoes Cancelar e Ver detalhes dos cartoes
  PacienteUI.ligarAcoes(document.getElementById("listaConsultas"), renderizar);
});
