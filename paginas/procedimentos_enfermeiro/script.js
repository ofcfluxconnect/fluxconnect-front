// Medicacao e procedimentos (enfermeiro): o que deve ser aplicado ou feito na unidade.
// Entram os medicamentos que o medico marcou como "aplicar na unidade" na receita e os
// procedimentos do dia. Medicacao que bate com uma alergia do paciente aparece com alerta e
// so pode ser registrada depois de marcar que a prescricao foi confirmada com o medico.

var e = Profissional.escapar;
var estado = { filtro: "pendente", busca: "" };
var itens = [];
var emRegistro = null; // item aberto na janela de registro

var icones = {
  pessoa: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  estetoscopio: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.8 2.6A2 2 0 1 0 3 6h3a2 2 0 1 0-1.8-3.4"/><path d="M4.5 6v5a5.5 5.5 0 0 0 11 0V6"/><path d="M19.5 13a2.5 2.5 0 1 0 0 5"/><path d="M22 15.5v2A4.5 4.5 0 0 1 17.5 22h-1A4.5 4.5 0 0 1 12 17.5"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  alerta: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7.5"/></svg>'
};

var nomes = {
  medicacao: { rotulo: "Medicação", verbo: "Registrar aplicação", feito: "Aplicado", sucesso: "Aplicação registrada com sucesso" },
  procedimento: { rotulo: "Procedimento", verbo: "Registrar procedimento", feito: "Realizado", sucesso: "Procedimento registrado com sucesso" }
};

function semAcento(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function badge(p) {
  return p.status === "realizado"
    ? '<span class="badge badge-confirmada"><span class="badge-ponto"></span>' + nomes[p.tipo].feito + "</span>"
    : '<span class="badge badge-pendente"><span class="badge-ponto"></span>Pendente</span>';
}

function cartao(p, indice) {
  var pendenteComAlerta = p.alergia && p.status === "pendente";
  var feito = p.registro
    ? '<p class="cartao-linha cartao-registro">' + icones.check + nomes[p.tipo].feito + " às " + Enfermagem.hora(p.registro.data) + " por " + e(p.registro.autor) +
      (p.registro.observacao ? " — " + e(p.registro.observacao) : "") + "</p>"
    : "";
  return '<li class="cartao-item cartao-' + p.status + (pendenteComAlerta ? " cartao-com-alerta" : "") + '">' +
    '<div class="bloco-data"><span class="bloco-dia bloco-horario">' + Enfermagem.hora(p.data) + '</span><span class="bloco-mes">' + nomes[p.tipo].rotulo.toUpperCase() + "</span></div>" +
    '<div class="cartao-info">' +
      '<p class="cartao-titulo">' + e(p.titulo) + "</p>" +
      '<p class="cartao-linha">' + icones.info + e(p.detalhe) + "</p>" +
      '<p class="cartao-linha">' + icones.pessoa + e(p.paciente.nome) + " · #" + e(p.paciente.id) + "</p>" +
      '<p class="cartao-linha">' + icones.estetoscopio + "Prescrito por " + e(p.medico) + "</p>" +
      (p.alergia ? '<p class="cartao-linha cartao-alerta">' + icones.alerta + "Paciente com alergia registrada a " + e(p.alergia) + "</p>" : "") + feito +
    "</div>" +
    '<div class="cartao-lado">' + badge(p) + '<div class="cartao-acoes">' +
      (p.status === "pendente" ? '<button type="button" class="' + (pendenteComAlerta ? "btn-secundario" : "btn-primario") + '" data-registrar="' + indice + '">' + icones.check + nomes[p.tipo].verbo + "</button>" : "") +
    "</div></div>" +
  "</li>";
}

function renderizar() {
  itens = Enfermagem.procedimentos();
  var pendentes = itens.filter(function (p) { return p.status === "pendente"; }).length;

  document.getElementById("numPendentes").textContent = document.getElementById("contPendentes").textContent = pendentes;
  document.getElementById("numRealizados").textContent = document.getElementById("contRealizados").textContent = itens.length - pendentes;
  document.getElementById("numAlertas").textContent = itens.filter(function (p) { return p.alergia && p.status === "pendente"; }).length;
  document.getElementById("contTodos").textContent = itens.length;

  // graficos dos cards: um ponto por horario prescrito (a soma dos pontos e o numero do card)
  var horas = itens.map(function (p) { return Enfermagem.hora(p.data); }).filter(function (h, i, todas) { return todas.indexOf(h) === i; }).sort();
  function porHora(filtro) {
    return horas.map(function (h) { return itens.filter(function (p) { return Enfermagem.hora(p.data) === h && filtro(p); }).length; });
  }
  var opcoes = { rotulos: horas, unidade: ["item", "itens"] };
  RecepcaoComp.grafico(document.getElementById("grafPendentes"), porHora(function (p) { return p.status === "pendente"; }), opcoes);
  RecepcaoComp.grafico(document.getElementById("grafRealizados"), porHora(function (p) { return p.status === "realizado"; }), opcoes);
  RecepcaoComp.grafico(document.getElementById("grafAlertas"), porHora(function (p) { return p.alergia && p.status === "pendente"; }),
    { rotulos: horas, unidade: ["alerta", "alertas"] });

  var termo = semAcento(estado.busca.trim());
  var html = "";
  var visiveis = 0;
  itens.forEach(function (p, i) {
    if (estado.filtro !== "todos" && p.status !== estado.filtro) return;
    if (termo && semAcento(p.paciente.nome + " " + p.titulo).indexOf(termo) === -1) return;
    html += cartao(p, i);
    visiveis++;
  });

  document.getElementById("listaProcedimentos").innerHTML = html ||
    '<li class="estado-vazio"><strong>' + (termo ? "Nada encontrado" : estado.filtro === "pendente" ? "Nenhuma pendência" : "Nada por aqui") + "</strong>" +
    (termo ? "Tente outro nome." : estado.filtro === "pendente" ? "Tudo o que foi prescrito para a unidade já foi registrado." : "") + "</li>";
  document.getElementById("chipRegistros").textContent = visiveis + (visiveis === 1 ? " item" : " itens");

  document.querySelectorAll("#filtros .filtro").forEach(function (b) {
    var ativo = b.dataset.filtro === estado.filtro;
    b.classList.toggle("ativo", ativo);
    b.setAttribute("aria-pressed", ativo);
  });
}

// ---------- janela de registro ----------
function atualizarBotaoRegistro() {
  var bloqueado = emRegistro && emRegistro.alergia && !document.getElementById("regConfirmaAlergia").checked;
  document.getElementById("btnConfirmarRegistro").disabled = !!bloqueado;
}

function abrirRegistro(p) {
  emRegistro = p;
  document.getElementById("regTitulo").textContent = nomes[p.tipo].verbo;
  document.getElementById("regSub").textContent = p.titulo;
  document.getElementById("regResumo").innerHTML =
    "<div>" + icones.pessoa + "<div><dt>Paciente</dt><dd>" + e(p.paciente.nome) + " · #" + e(p.paciente.id) + "</dd></div></div>" +
    "<div>" + icones.info + "<div><dt>Como fazer</dt><dd>" + e(p.detalhe) + "</dd></div></div>" +
    "<div>" + icones.estetoscopio + "<div><dt>Prescrito por</dt><dd>" + e(p.medico) + "</dd></div></div>";

  document.getElementById("regAlerta").hidden = !p.alergia;
  document.getElementById("regConfirmaAlergia").checked = false;
  if (p.alergia) {
    document.getElementById("regAlertaTexto").innerHTML = "<strong>Atenção:</strong> " + e(p.paciente.nome) + " tem alergia registrada a <strong>" + e(p.alergia) +
      "</strong>. Não aplique sem confirmar com o médico.";
  }
  document.getElementById("regObs").value = "";
  atualizarBotaoRegistro();
  document.getElementById("modalRegistro").classList.add("visivel");
  (p.alergia ? document.getElementById("regConfirmaAlergia") : document.getElementById("regObs")).focus();
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
  document.getElementById("listaProcedimentos").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-registrar]");
    if (botao) abrirRegistro(itens[+botao.dataset.registrar]);
  });

  var modal = document.getElementById("modalRegistro");
  modal.addEventListener("click", function (ev) {
    if (ev.target === modal || ev.target.closest("[data-fechar-modal]")) fecharRegistro();
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fecharRegistro(); });
  document.getElementById("regConfirmaAlergia").addEventListener("change", atualizarBotaoRegistro);

  document.getElementById("btnConfirmarRegistro").addEventListener("click", function () {
    if (!emRegistro || this.disabled) return;
    var p = emRegistro;
    var obs = document.getElementById("regObs").value.trim();
    // fica registrado que a prescricao foi confirmada apesar da alergia
    if (p.alergia) obs = "Prescrição confirmada com o médico (alergia a " + p.alergia + ")" + (obs ? ". " + obs : "");
    Enfermagem.registrarProcedimento(p.chave, obs);
    fecharRegistro();
    renderizar();
    FluxConfirmacao.sucesso(nomes[p.tipo].sucesso, p.titulo + " — " + p.paciente.nome + ".");
  });
});
