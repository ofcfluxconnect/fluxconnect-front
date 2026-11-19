// Prontuarios (profissional): lista de pacientes da clinica, com busca, filtros, ordem e paginas.
// Os dados vem de compartilhado/pacientes_profissional.js; "Abrir" usa a janela de historico
// (compartilhado/prontuario_modal.js).

var PAGINA_ATENDIMENTO = "../atendimento_profissional/index.html";
var PAGINA_RESULTADOS = "../resultados_profissional/index.html";
var POR_PAGINA = 8;

var e = Profissional.escapar;
var pacientes = [];
var estado = { filtro: "todos", ordem: "visita", busca: "", pagina: 1 };
var pacienteDoMenu = null;

var iconeAlerta = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
var iconePasta = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>';

function diasDesdeVisita(p) {
  return p.ultimaVisita ? PacientesProfissional.diasDesde(p.ultimaVisita) : Infinity;
}

// "recente" = atendido hoje ou ontem
function ehRecente(p) {
  return diasDesdeVisita(p) <= 1;
}

function renderizarContadores() {
  var comAlertas = pacientes.filter(function (p) { return p.temAlertas; }).length;
  document.getElementById("numTotal").textContent = document.getElementById("contTodos").textContent = pacientes.length;
  document.getElementById("numAlertas").textContent = document.getElementById("contAlertas").textContent = comAlertas;
  document.getElementById("numHoje").textContent = pacientes.filter(function (p) { return diasDesdeVisita(p) === 0; }).length;
  document.getElementById("contRecentes").textContent = pacientes.filter(ehRecente).length;

  // grafico: quantos pacientes tiveram a ultima visita em cada um dos ultimos 7 dias
  var valores = [], rotulos = [];
  for (var dias = 6; dias >= 0; dias--) {
    var dia = new Date();
    dia.setDate(dia.getDate() - dias);
    valores.push(pacientes.filter(function (p) { return diasDesdeVisita(p) === dias; }).length);
    rotulos.push(dias === 0 ? "Hoje" : PacientesProfissional.formatarData(dia).slice(0, 5));
  }
  RecepcaoComp.grafico(document.getElementById("grafTotal"), valores, { tipo: "barras", rotulos: rotulos, unidade: ["paciente atendido", "pacientes atendidos"] });
}

function listaFiltrada() {
  var termo = estado.busca;
  var numeros = termo.replace(/\D/g, "");

  var lista = pacientes.filter(function (p) {
    var bateFiltro = estado.filtro === "todos" || (estado.filtro === "recentes" && ehRecente(p)) || (estado.filtro === "alertas" && p.temAlertas);
    var bateBusca = !termo || p.nome.toLowerCase().includes(termo) ||
      (numeros && (p.cpf.replace(/\D/g, "").includes(numeros) || p.id.includes(numeros)));
    return bateFiltro && bateBusca;
  });

  return lista.sort(function (a, b) {
    if (estado.ordem === "nome") return a.nome.localeCompare(b.nome);
    if (estado.ordem === "alertas") {
      return (b.alergias.length + b.condicoes.length) - (a.alergias.length + a.condicoes.length) || a.nome.localeCompare(b.nome);
    }
    return diasDesdeVisita(a) - diasDesdeVisita(b) || a.nome.localeCompare(b.nome);
  });
}

function linha(p) {
  var visita = p.ultimaVisita
    ? '<p class="texto-forte">' + PacientesProfissional.formatarData(p.ultimaVisita) + '</p><p class="texto-suave">' + PacientesProfissional.textoRelativo(diasDesdeVisita(p)) + "</p>"
    : '<p class="texto-suave">Sem visitas</p>';

  var cid = p.ultimaCid
    ? '<p class="cid">' + e(p.ultimaCid) + '</p><p class="texto-suave">' + e(p.ultimaEspecialidade) + "</p>"
    : '<p class="texto-suave">—</p>';

  var tags = p.alergias.map(function (a) {
    return '<span class="tag tag-alergia">' + iconeAlerta + e(a) + "</span>";
  }).concat(p.condicoes.map(function (c) {
    return '<span class="tag">' + e(c) + "</span>";
  })).join("") || '<span class="sem-tags">Nenhuma registrada</span>';

  return "<tr>" +
    '<td><div class="celula-pessoa"><span class="avatar-pessoa" style="background:' + p.cor + '">' + PacientesProfissional.iniciais(p.nome) + "</span>" +
      '<div><p class="pessoa-nome">' + e(p.nome) + '</p><p class="pessoa-sub">' + RecepcaoComp.mascararCpf(p.cpf) + " · #" + e(p.id) + "</p></div></div></td>" +
    "<td>" + visita + "</td>" +
    "<td>" + cid + "</td>" +
    '<td><div class="tags">' + tags + "</div></td>" +
    '<td class="col-acoes"><div class="acoes">' +
      '<button type="button" class="btn-secundario btn-compacto" data-abrir="' + e(p.id) + '">' + iconePasta + "Abrir</button>" +
      '<button type="button" class="btn-mais" data-mais="' + e(p.id) + '" title="Mais ações" aria-label="Mais ações de ' + e(p.nome) + '" aria-haspopup="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>' +
    "</div></td>" +
  "</tr>";
}

function renderizarTabela() {
  var lista = listaFiltrada();
  var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;
  var inicio = (estado.pagina - 1) * POR_PAGINA;
  var daPagina = lista.slice(inicio, inicio + POR_PAGINA);

  document.getElementById("corpoTabela").innerHTML = daPagina.map(linha).join("") ||
    '<tr><td colspan="5" class="tabela-vazia">Nenhum prontuário encontrado.</td></tr>';
  document.getElementById("chipRegistros").textContent = lista.length + (lista.length === 1 ? " prontuário" : " prontuários");
  document.getElementById("textoRodape").textContent = lista.length
    ? "Mostrando " + (inicio + 1) + "–" + (inicio + daPagina.length) + " de " + lista.length
    : "";
  RecepcaoComp.paginacao(document.getElementById("paginacao"), estado.pagina, totalPaginas);

  document.querySelectorAll("#filtros .filtro").forEach(function (b) {
    var ativo = b.dataset.filtro === estado.filtro;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo);
  });
}

// ---------- menu dos tres pontinhos ----------
function fecharMenu() {
  document.getElementById("menuAcoes").classList.remove("aberto");
}

function abrirMenu(botao, id) {
  var menu = document.getElementById("menuAcoes");
  var r = botao.getBoundingClientRect();
  pacienteDoMenu = id;
  menu.classList.add("aberto");
  // abre para cima se nao couber embaixo
  var cabeEmbaixo = r.bottom + 6 + menu.offsetHeight <= window.innerHeight - 8;
  menu.style.top = (cabeEmbaixo ? r.bottom + 6 : r.top - menu.offsetHeight - 6) + "px";
  menu.style.left = Math.max(8, r.right - menu.offsetWidth) + "px";
}

function mudar(campo, valor) {
  estado[campo] = valor;
  estado.pagina = 1;
  renderizarTabela();
}

document.addEventListener("DOMContentLoaded", function () {
  pacientes = PacientesProfissional.todos();
  renderizarContadores();
  renderizarTabela();

  document.getElementById("filtros").addEventListener("click", function (ev) {
    var botao = ev.target.closest(".filtro");
    if (botao) mudar("filtro", botao.dataset.filtro);
  });
  document.getElementById("inputBusca").addEventListener("input", function (ev) { mudar("busca", ev.target.value.toLowerCase().trim()); });
  document.getElementById("ordenar").addEventListener("change", function (ev) { mudar("ordem", ev.target.value); });
  document.getElementById("paginacao").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-pag]");
    if (!botao || botao.disabled) return;
    estado.pagina = +botao.dataset.pag;
    renderizarTabela();
  });

  document.getElementById("corpoTabela").addEventListener("click", function (ev) {
    var abrir = ev.target.closest("[data-abrir]");
    if (abrir) return ProntuarioModal.abrir(abrir.dataset.abrir);

    var mais = ev.target.closest("[data-mais]");
    if (mais) {
      ev.stopPropagation();
      var jaAberto = document.getElementById("menuAcoes").classList.contains("aberto") && pacienteDoMenu === mais.dataset.mais;
      fecharMenu();
      if (!jaAberto) abrirMenu(mais, mais.dataset.mais);
    }
  });

  document.getElementById("menuAcoes").addEventListener("click", function (ev) {
    var acao = ev.target.closest("[data-acao]");
    if (!acao || !pacienteDoMenu) return;
    var p = PacientesProfissional.obter(pacienteDoMenu);
    window.location.href = acao.dataset.acao === "atender"
      ? PAGINA_ATENDIMENTO + "?id=" + encodeURIComponent(p.id)
      : PAGINA_RESULTADOS + "?busca=" + encodeURIComponent(p.nome);
  });

  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".menu-acoes")) fecharMenu();
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fecharMenu(); });
  window.addEventListener("resize", fecharMenu);
});
