// Meus Exames: laudos disponiveis e exames marcados, com busca, filtro, ordem e paginas.
// Os dados vem de compartilhado/paciente_dados.js.
// Abrir com ?aba=pendentes ja mostra os exames marcados.

var POR_PAGINA = 4;
var e = Paciente.escapar;
var icone = PacienteUI.icone;

var tipos = { laboratorial: "Laboratorial", imagem: "Imagem", cardiologico: "Cardiológico" };

var estado = { aba: "disponiveis", pagina: 1, busca: "", tipo: "", ordem: "recente" };

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function filtrarEOrdenar(lista) {
  var termo = semAcento(estado.busca.trim());
  var filtrados = lista.filter(function (x) {
    if (estado.tipo && x.categoria !== estado.tipo) return false;
    return !termo || semAcento(x.titulo + " " + x.local + " " + (x.solicitante || "")).indexOf(termo) !== -1;
  });
  return filtrados.sort(function (a, b) {
    if (estado.ordem === "az") return a.titulo.localeCompare(b.titulo);
    if (estado.ordem === "za") return b.titulo.localeCompare(a.titulo);
    var ordem = (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || ""));
    return estado.ordem === "antigo" ? ordem : -ordem;
  });
}

function cartaoExame(x) {
  var d = Paciente.lerISO(x.data);
  var acao = x.status === "disponivel"
    ? '<button type="button" class="btn-primario" data-laudo="' + x.id + '">' + icone("baixar", 16) + "Baixar laudo</button>"
    : '<button type="button" class="btn-secundario" data-preparo="' + x.id + '">' + icone("info", 16) + "Ver preparo</button>";

  return '<li class="cartao-item cartao-' + x.status + '">' +
    '<div class="bloco-data"><span class="bloco-dia">' + String(d.getDate()).padStart(2, "0") + '</span><span class="bloco-mes">' + Paciente.mesesCurtos[d.getMonth()] + " " + d.getFullYear() + "</span>" +
      (x.hora ? '<span class="bloco-hora">' + icone("relogio", 14) + x.hora + "</span>" : "") + "</div>" +
    '<div class="cartao-info">' +
      '<p class="cartao-titulo">' + e(x.titulo) + '<span class="chip-tipo">' + tipos[x.categoria] + "</span></p>" +
      (x.solicitante ? '<p class="cartao-linha">' + icone("pessoa", 16) + "Solicitado por " + e(x.solicitante) + "</p>" : "") +
      '<p class="cartao-linha">' + icone(x.status === "disponivel" ? "exame" : "local", 16) + e(x.local) + "</p>" +
      (x.preparo ? '<p class="cartao-linha">' + icone("alerta", 16) + e(x.preparo.principal) + "</p>" : "") +
    "</div>" +
    '<div class="cartao-lado">' + PacienteUI.badge(x.status) + '<div class="cartao-acoes">' + acao + "</div></div>" +
  "</li>";
}

// Demonstracao: gera um arquivo de texto com os dados do exame.
function baixarLaudo(x) {
  var p = Paciente.perfil();
  var texto = [
    "FluxConnect — Laudo de exame (demonstração)",
    "",
    "Paciente: " + p.nome,
    "Exame: " + x.titulo,
    "Data: " + Paciente.dataLonga(x.data),
    "Local: " + x.local,
    "Solicitante: " + (x.solicitante || "—"),
    "",
    "Este arquivo é apenas um exemplo. O laudo verdadeiro é emitido pelo laboratório."
  ].join("\r\n");
  var link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
  link.download = "laudo-" + semAcento(x.titulo).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  PacienteUI.sucesso("Laudo baixado com sucesso", x.titulo + " foi salvo na pasta de downloads.");
}

function renderizar() {
  var listas = { disponiveis: Paciente.laudos(), pendentes: Paciente.examesPendentes() };

  document.getElementById("numLaudos").textContent = document.getElementById("contDisponiveis").textContent = listas.disponiveis.length;
  document.getElementById("numPendentes").textContent = document.getElementById("contPendentes").textContent = listas.pendentes.length;
  document.getElementById("numTotal").textContent = listas.disponiveis.length + listas.pendentes.length;

  var laudosMes = Paciente.serieMeses(listas.disponiveis, 6);
  RecepcaoComp.grafico(document.getElementById("grafLaudos"), laudosMes.valores, { rotulos: laudosMes.rotulos, unidade: ["laudo", "laudos"] });
  var semanas = Paciente.serieSemanas(listas.pendentes, 4);
  RecepcaoComp.grafico(document.getElementById("grafPendentes"), semanas.valores, { tipo: "barras", rotulos: semanas.rotulos, unidade: ["exame", "exames"] });

  document.querySelectorAll("[data-aba]").forEach(function (b) {
    var ativo = b.dataset.aba === estado.aba;
    b.classList.toggle("ativo", ativo && b.classList.contains("filtro"));
    b.setAttribute("aria-pressed", ativo);
  });

  var filtrados = filtrarEOrdenar(listas[estado.aba]);
  var totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;
  var inicio = (estado.pagina - 1) * POR_PAGINA;
  var daPagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  document.getElementById("listaExames").innerHTML = daPagina.map(cartaoExame).join("") ||
    '<li class="estado-vazio"><strong>Nenhum exame encontrado</strong>' +
    (estado.busca.trim() || estado.tipo ? "Tente outro nome ou limpe os filtros." : "Não há exames nesta lista.") + "</li>";

  document.getElementById("chipRegistros").textContent = filtrados.length + (filtrados.length === 1 ? " exame" : " exames");
  document.getElementById("textoRodape").textContent = filtrados.length
    ? "Mostrando " + (inicio + 1) + "–" + (inicio + daPagina.length) + " de " + filtrados.length
    : "";
  RecepcaoComp.paginacao(document.getElementById("paginacao"), estado.pagina, totalPaginas);
}

function mudar(campo, valor) {
  estado[campo] = valor;
  estado.pagina = 1;
  renderizar();
}

document.addEventListener("DOMContentLoaded", function () {
  if (new URLSearchParams(location.search).get("aba") === "pendentes") estado.aba = "pendentes";
  renderizar();

  document.querySelectorAll("[data-aba]").forEach(function (b) {
    b.addEventListener("click", function () { mudar("aba", b.dataset.aba); });
  });
  document.getElementById("busca").addEventListener("input", function (ev) { mudar("busca", ev.target.value); });
  document.getElementById("filtroTipo").addEventListener("change", function (ev) { mudar("tipo", ev.target.value); });
  document.getElementById("ordenar").addEventListener("change", function (ev) { mudar("ordem", ev.target.value); });
  document.getElementById("paginacao").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-pag]");
    if (!botao || botao.disabled) return;
    estado.pagina = +botao.dataset.pag;
    renderizar();
  });

  document.getElementById("listaExames").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-laudo], [data-preparo]");
    if (!botao) return;
    var id = botao.dataset.laudo || botao.dataset.preparo;
    var exame = Paciente.exames().find(function (x) { return x.id === id; });
    if (!exame) return;
    if (botao.dataset.laudo) baixarLaudo(exame);
    else PacienteUI.preparo(exame);
  });
});
