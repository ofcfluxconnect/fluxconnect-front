// Resultados e Laudos (profissional): exames que o profissional solicitou.
// Os dados vem de compartilhado/profissional_dados.js. Abrir um laudo marca o resultado como lido.
// Abrir com ?busca=<nome> ja filtra a tabela; com ?laudo=<id> ja abre o laudo (usado pelo sininho).

var POR_PAGINA = 6;
var e = Profissional.escapar;

var resultados = [];
var estado = { filtro: "todos", busca: "", pagina: 1 };
var laudoAberto = null;

var icones = {
  relogio: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  olho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
};

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function renderizarContadores() {
  var novos = resultados.filter(function (r) { return r.novo; }).length;
  var total = resultados.length;
  document.getElementById("numNovos").textContent = document.getElementById("contNaoLidos").textContent = novos;
  document.getElementById("numLidos").textContent = document.getElementById("contLidos").textContent = total - novos;
  document.getElementById("numTotal").textContent = document.getElementById("contTodos").textContent = total;

  // grafico: laudos liberados em cada um dos ultimos 5 dias
  var valores = [], rotulos = [];
  for (var dias = 4; dias >= 0; dias--) {
    var doDia = resultados.filter(function (r) { return r.dias === dias; });
    valores.push(doDia.length);
    rotulos.push(dias === 0 ? "Hoje" : doDia.length ? doDia[0].dataTexto.slice(0, 5) : "Há " + dias + " dias");
  }
  RecepcaoComp.grafico(document.getElementById("grafTotal"), valores, { tipo: "barras", rotulos: rotulos, unidade: ["laudo", "laudos"] });
}

function renderizarTabela() {
  var termo = semAcento(estado.busca.trim());
  var lista = resultados.filter(function (r) {
    var bateFiltro = estado.filtro === "todos" || (estado.filtro === "nao-lidos" ? r.novo : !r.novo);
    return bateFiltro && (!termo || semAcento(r.paciente + " " + r.exame + " " + r.categoria).indexOf(termo) !== -1);
  });

  var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;
  var inicio = (estado.pagina - 1) * POR_PAGINA;
  var daPagina = lista.slice(inicio, inicio + POR_PAGINA);

  document.getElementById("corpoTabela").innerHTML = daPagina.map(function (r) {
    return '<tr class="' + (r.novo ? "linha-nova" : "") + '">' +
      '<td><p class="texto-forte">' + (r.novo ? '<i class="ponto-novo" title="Novo resultado"></i>' : "") + r.dataTexto + '</p><p class="texto-suave hora-lib">' + icones.relogio + r.hora + "</p></td>" +
      '<td><div class="celula-pessoa"><span class="avatar-pessoa" style="background:' + r.cor + '">' + PacientesProfissional.iniciais(r.paciente) + "</span>" +
        '<div><p class="pessoa-nome">' + e(r.paciente) + '</p><p class="pessoa-sub">' + RecepcaoComp.mascararCpf(r.cpf) + "</p></div></div></td>" +
      '<td class="texto-forte">' + e(r.exame) + "</td>" +
      '<td><span class="tag tag-neutra">' + e(r.categoria) + "</span></td>" +
      '<td class="col-acoes"><div class="acoes"><button type="button" class="' + (r.novo ? "btn-primario" : "btn-secundario") + ' btn-compacto" data-laudo="' + r.id + '">' +
        icones.olho + (r.novo ? "Ver laudo" : "Visualizar") + "</button></div></td>" +
    "</tr>";
  }).join("") || '<tr><td colspan="5" class="tabela-vazia">Nenhum resultado encontrado.</td></tr>';

  document.getElementById("chipRegistros").textContent = lista.length + (lista.length === 1 ? " resultado" : " resultados");
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

function renderizar() {
  resultados = Profissional.resultados();
  renderizarContadores();
  renderizarTabela();
}

function abrirLaudo(id) {
  var r = resultados.find(function (x) { return x.id === id; });
  if (!r) return;
  laudoAberto = r;

  document.getElementById("laudoExame").textContent = r.exame;
  document.getElementById("laudoPaciente").textContent = r.paciente + " · CPF " + RecepcaoComp.mascararCpf(r.cpf);
  document.getElementById("laudoData").textContent = r.dataTexto + " às " + r.hora;
  document.getElementById("laudoCategoria").textContent = r.categoria;
  document.getElementById("laudoLab").textContent = r.lab;
  document.getElementById("laudoConclusao").textContent = r.conclusao;
  document.getElementById("laudoParametros").innerHTML = r.parametros.map(function (p) {
    // p[3] = true quando o valor esta fora da referencia
    return '<tr class="' + (p[3] ? "fora-referencia" : "") + '"><td>' + e(p[0]) + "</td><td>" + e(p[1]) + (p[3] ? " ▲" : "") + "</td><td>" + e(p[2]) + "</td></tr>";
  }).join("");

  Profissional.marcarLido(r.id);
  renderizar();
  document.getElementById("modalLaudo").classList.add("visivel");
  document.querySelector("#modalLaudo .modal-x").focus();
}

function fecharLaudo() {
  document.getElementById("modalLaudo").classList.remove("visivel");
}

function mudar(campo, valor) {
  estado[campo] = valor;
  estado.pagina = 1;
  renderizarTabela();
}

document.addEventListener("DOMContentLoaded", function () {
  var parametros = new URLSearchParams(window.location.search);
  // vindo do prontuario: ?busca=<nome do paciente> ja filtra a tabela
  if (parametros.get("busca")) {
    estado.busca = parametros.get("busca");
    document.getElementById("inputBusca").value = estado.busca;
  }

  renderizar();
  if (parametros.get("laudo")) abrirLaudo(parametros.get("laudo"));

  document.getElementById("filtros").addEventListener("click", function (ev) {
    var botao = ev.target.closest(".filtro");
    if (botao) mudar("filtro", botao.dataset.filtro);
  });
  document.getElementById("inputBusca").addEventListener("input", function (ev) { mudar("busca", ev.target.value); });
  document.getElementById("paginacao").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-pag]");
    if (!botao || botao.disabled) return;
    estado.pagina = +botao.dataset.pag;
    renderizarTabela();
  });
  document.getElementById("corpoTabela").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-laudo]");
    if (botao) abrirLaudo(botao.dataset.laudo);
  });

  var modal = document.getElementById("modalLaudo");
  modal.addEventListener("click", function (ev) {
    if (ev.target === modal || ev.target.closest("[data-fechar-modal]")) fecharLaudo();
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fecharLaudo(); });

  document.getElementById("btnProntuarioLaudo").addEventListener("click", function () {
    if (!laudoAberto) return;
    fecharLaudo();
    ProntuarioModal.abrir(laudoAberto.pacienteId);
  });

  // imprime so o laudo (regras em style.css, bloco "@media print")
  document.getElementById("btnImprimir").addEventListener("click", function () {
    document.body.classList.add("imprimindo-laudo");
    window.print();
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imprimindo-laudo"); });
});
