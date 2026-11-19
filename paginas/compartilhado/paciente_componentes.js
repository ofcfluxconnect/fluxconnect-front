// Pecas usadas pelas telas do paciente (precisa de paciente_dados.js e recepcao_layout.js):
// - PacienteUI.icone("calendario", 18)        -> <svg> de um icone
// - PacienteUI.badge("confirmada")            -> etiqueta colorida do status
// - PacienteUI.cartaoConsulta(consulta)       -> cartao de uma consulta, com os botoes de acao
// - PacienteUI.ligarAcoes(elemento, aoMudar)  -> faz funcionar os botoes dos cartoes dentro do elemento
// - PacienteUI.cancelar(id, aoConcluir)       -> janela de cancelamento (pede o motivo)
// - PacienteUI.sucesso(titulo, texto, aoFechar) -> confirmacao no meio da tela, que some sozinha
// - PacienteUI.detalhes(id)                  -> janela com os detalhes de uma consulta
// - PacienteUI.preparo(exame)                 -> janela com o preparo de um exame
// - PacienteUI.linkReagendar(id, volta)       -> endereco da tela de reagendamento

(function () {
  var e = Paciente.escapar;

  var desenhos = {
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
    local: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    estetoscopio: '<path d="M4.8 2.6A2 2 0 1 0 3 6h3a2 2 0 1 0-1.8-3.4"/><path d="M4.5 6v5a5.5 5.5 0 0 0 11 0V6"/><path d="M19.5 13a2.5 2.5 0 1 0 0 5"/><path d="M22 15.5v2A4.5 4.5 0 0 1 17.5 22h-1A4.5 4.5 0 0 1 12 17.5"/>',
    pessoa: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    exame: '<path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>',
    reagendar: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    fechar: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    check: '<circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16.5 9.5"/>',
    documento: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    seta: '<polyline points="9 18 15 12 9 6"/>'
  };

  function icone(nome, tamanho) {
    var t = tamanho || 18;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (desenhos[nome] || "") + "</svg>";
  }

  var rotulos = {
    confirmada: "Confirmada", pendente: "Pendente", realizada: "Realizada", cancelada: "Cancelada",
    disponivel: "Resultado disponível", agendado: "Agendado", aguardando: "Aguardando confirmação"
  };

  function badge(status) {
    return '<span class="badge badge-' + status + '"><span class="badge-ponto"></span>' + (rotulos[status] || status) + "</span>";
  }

  function linkReagendar(id, volta) {
    return Paciente.url("tela_principal_paciente/reagendar_consulta/index.html") + "?id=" + encodeURIComponent(id) + (volta ? "&volta=" + encodeURIComponent(volta) : "");
  }

  // ---------- cartao de consulta ----------
  function cartaoConsulta(c, volta) {
    var d = Paciente.lerISO(c.data);
    var acoes = "";
    if (c.status === "confirmada" || c.status === "pendente") {
      acoes =
        '<a class="btn-secundario" href="' + linkReagendar(c.id, volta) + '">' + icone("reagendar", 16) + "Reagendar</a>" +
        '<button type="button" class="btn-perigo" data-cancelar="' + e(c.id) + '">' + icone("fechar", 16) + "Cancelar</button>";
    } else if (c.status === "realizada") {
      acoes = '<button type="button" class="btn-secundario" data-detalhes="' + e(c.id) + '">' + icone("documento", 16) + "Ver detalhes</button>";
    } else {
      acoes = '<a class="btn-secundario" href="' + linkReagendar(c.id, volta) + '">' + icone("reagendar", 16) + "Remarcar</a>";
    }

    return '<li class="cartao-item cartao-' + c.status + '">' +
      '<div class="bloco-data"><span class="bloco-dia">' + String(d.getDate()).padStart(2, "0") + '</span><span class="bloco-mes">' + Paciente.mesesCurtos[d.getMonth()] + " " + d.getFullYear() + '</span><span class="bloco-hora">' + icone("relogio", 14) + c.hora + "</span></div>" +
      '<div class="cartao-info">' +
        '<p class="cartao-titulo">' + e(c.medico) + "</p>" +
        '<p class="cartao-linha">' + icone("estetoscopio", 16) + e(c.especialidade) + "</p>" +
        '<p class="cartao-linha">' + icone(c.modalidade === "Teleconsulta" ? "video" : "local", 16) + e(c.local) + " · " + e(c.modalidade) + "</p>" +
        (c.motivo ? '<p class="cartao-motivo"><strong>Motivo:</strong> ' + e(c.motivo) + "</p>" : "") +
      "</div>" +
      '<div class="cartao-lado">' + badge(c.status) + '<div class="cartao-acoes">' + acoes + "</div></div>" +
    "</li>";
  }

  // botoes [data-cancelar] e [data-detalhes] dentro do elemento
  function ligarAcoes(elemento, aoMudar) {
    elemento.addEventListener("click", function (ev) {
      var cancela = ev.target.closest("[data-cancelar]");
      if (cancela) return cancelar(cancela.dataset.cancelar, aoMudar);
      var det = ev.target.closest("[data-detalhes]");
      if (det) detalhes(det.dataset.detalhes);
    });
  }

  // ---------- janela (modal) ----------
  var overlay = null;
  var quemAbriu = null;

  function fecharModal() {
    if (!overlay) return;
    overlay.classList.remove("visivel");
    if (quemAbriu && quemAbriu.focus) quemAbriu.focus();
    quemAbriu = null;
  }

  // opcoes: { titulo, sub, icone, cor ("azul" | "vermelho" | "laranja" | "verde"), corpo, rodape, largo }
  function abrirModal(opcoes) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="pacModalTitulo"></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay || ev.target.closest("[data-fechar-modal]")) fecharModal();
      });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") fecharModal();
      });
    }
    quemAbriu = document.activeElement;
    var caixa = overlay.querySelector(".modal-caixa");
    caixa.classList.toggle("modal-largo", !!opcoes.largo);
    caixa.innerHTML =
      '<div class="modal-topo">' +
        (opcoes.icone ? '<span class="modal-icone modal-icone-' + (opcoes.cor || "azul") + '">' + icone(opcoes.icone, 22) + "</span>" : "") +
        '<div><h2 class="modal-titulo" id="pacModalTitulo">' + e(opcoes.titulo) + "</h2>" + (opcoes.sub ? '<p class="modal-sub">' + e(opcoes.sub) + "</p>" : "") + "</div>" +
        '<button type="button" class="modal-x" data-fechar-modal aria-label="Fechar">' + icone("fechar", 16) + "</button>" +
      "</div>" +
      '<div class="modal-corpo">' + opcoes.corpo + "</div>" +
      (opcoes.rodape ? '<div class="modal-rodape">' + opcoes.rodape + "</div>" : "");
    overlay.classList.add("visivel");
    var foco = caixa.querySelector("[data-foco]") || caixa.querySelector(".modal-x");
    if (foco) foco.focus();
    return caixa;
  }

  // ---------- confirmacao de sucesso ----------
  // Janela no meio da tela com o icone verde de confirmacao; some sozinha depois de
  // alguns segundos (ou ao clicar). "aoFechar" roda quando ela some.
  var TEMPO_SUCESSO = 2400;
  var sucessoEl = null;
  var sucessoTimer = null;
  var sucessoAoFechar = null;

  function fecharSucesso() {
    if (!sucessoEl || !sucessoEl.classList.contains("visivel")) return;
    clearTimeout(sucessoTimer);
    sucessoEl.classList.remove("visivel");
    var depois = sucessoAoFechar;
    sucessoAoFechar = null;
    if (depois) depois();
  }

  function sucesso(titulo, texto, aoFechar) {
    if (!sucessoEl) {
      sucessoEl = document.createElement("div");
      sucessoEl.className = "modal-overlay overlay-sucesso";
      sucessoEl.innerHTML =
        '<div class="modal-caixa modal-sucesso" role="alertdialog" aria-modal="true" aria-labelledby="pacSucessoTitulo" aria-describedby="pacSucessoTexto">' +
          '<div class="modal-check-sucesso" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7.5"/></svg></div>' +
          '<h2 class="modal-titulo" id="pacSucessoTitulo"></h2>' +
          '<p class="modal-sub" id="pacSucessoTexto"></p>' +
        "</div>";
      document.body.appendChild(sucessoEl);
      sucessoEl.addEventListener("click", fecharSucesso);
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" || ev.key === "Enter") fecharSucesso();
      });
    }
    clearTimeout(sucessoTimer);
    sucessoEl.querySelector(".modal-titulo").textContent = titulo;
    sucessoEl.querySelector(".modal-sub").textContent = texto || "";
    sucessoAoFechar = aoFechar || null;
    // tira e recoloca a classe para a animacao tocar de novo
    sucessoEl.classList.remove("visivel");
    void sucessoEl.offsetWidth;
    sucessoEl.classList.add("visivel");
    sucessoTimer = setTimeout(fecharSucesso, TEMPO_SUCESSO);
  }

  function resumoConsulta(c) {
    return '<dl class="resumo-modal">' +
      "<div>" + icone("pessoa", 18) + "<div><dt>Profissional</dt><dd>" + e(c.medico) + " — " + e(c.especialidade) + "</dd></div></div>" +
      "<div>" + icone("calendario", 18) + "<div><dt>Data e hora</dt><dd>" + Paciente.dataExtenso(c.data) + " às " + c.hora + "</dd></div></div>" +
      "<div>" + icone("local", 18) + "<div><dt>Local</dt><dd>" + e(c.local) + " · " + e(c.modalidade) + "</dd></div></div>" +
    "</dl>";
  }

  // ---------- cancelar consulta ----------
  function cancelar(id, aoConcluir) {
    var c = Paciente.obterConsulta(id);
    if (!c) return;

    var caixa = abrirModal({
      titulo: "Cancelar esta consulta?",
      sub: "O horário será liberado para outro paciente.",
      icone: "calendario",
      cor: "vermelho",
      corpo:
        resumoConsulta(c) +
        '<p class="aviso-modal">' + icone("info", 18) + "<span>Sempre que possível, cancele com pelo menos <strong>24 horas de antecedência</strong>.</span></p>" +
        '<label class="campo-form"><span>Por que você está cancelando? <b class="obrigatorio">*</b></span>' +
          '<select id="pacMotivo" data-foco><option value="">Selecione um motivo</option><option>Imprevisto pessoal</option><option>Problema de transporte</option><option>Conflito de horário</option><option>Emergência familiar</option><option>Outro</option></select></label>' +
        '<label class="campo-form"><span>Justificativa (opcional)</span>' +
          '<textarea id="pacJustificativa" rows="3" maxlength="300" placeholder="Descreva brevemente o motivo..."></textarea>' +
          '<small class="contador-modal"><span id="pacContador">0</span>/300 caracteres</small></label>',
      rodape:
        '<button type="button" class="btn-secundario" data-fechar-modal>Manter consulta</button>' +
        '<button type="button" class="btn-perigo btn-cheio" id="pacConfirmarCancelamento" disabled>Sim, cancelar consulta</button>'
    });

    var motivo = caixa.querySelector("#pacMotivo");
    var texto = caixa.querySelector("#pacJustificativa");
    var confirmar = caixa.querySelector("#pacConfirmarCancelamento");

    motivo.addEventListener("change", function () { confirmar.disabled = !motivo.value; });
    texto.addEventListener("input", function () { caixa.querySelector("#pacContador").textContent = texto.value.length; });
    confirmar.addEventListener("click", function () {
      if (!motivo.value) return;
      var completo = motivo.value + (texto.value.trim() ? ": " + texto.value.trim() : "");
      Paciente.cancelarConsulta(id, completo);
      fecharModal();
      if (aoConcluir) aoConcluir();
      sucesso("Consulta cancelada com sucesso", "O horário com " + c.medico + " foi liberado. Você pode reagendar quando precisar.");
    });
  }

  // ---------- detalhes da consulta ----------
  function detalhes(id) {
    var c = Paciente.obterConsulta(id);
    if (!c) return;
    abrirModal({
      titulo: "Detalhes da consulta",
      sub: rotulos[c.status] + " · " + Paciente.formatarData(c.data) + " às " + c.hora,
      icone: "documento",
      corpo:
        resumoConsulta(c) +
        (c.resumo ? '<h3 class="subtitulo-modal">Resumo do atendimento</h3><p class="texto-modal">' + e(c.resumo) + "</p>" : "") +
        (c.receita ? '<h3 class="subtitulo-modal">Receita</h3><p class="texto-modal">' + e(c.receita) + "</p>" : "") +
        (c.motivo ? '<h3 class="subtitulo-modal">Motivo do cancelamento</h3><p class="texto-modal">' + e(c.motivo) + "</p>" : ""),
      rodape: '<button type="button" class="btn-primario" data-fechar-modal data-foco>Fechar</button>'
    });
  }

  // ---------- preparo do exame ----------
  function preparo(exame) {
    if (!exame || !exame.preparo) return;
    abrirModal({
      titulo: "Preparo para o exame",
      sub: exame.titulo + " · " + Paciente.formatarData(exame.data) + " às " + exame.hora,
      icone: "exame",
      corpo:
        '<p class="aviso-modal aviso-laranja">' + icone("alerta", 18) + "<span><strong>Requisito principal:</strong> " + e(exame.preparo.principal) + "</span></p>" +
        '<h3 class="subtitulo-modal">Instruções</h3>' +
        '<ol class="lista-preparo">' + exame.preparo.instrucoes.map(function (t) { return "<li>" + e(t) + "</li>"; }).join("") + "</ol>" +
        '<p class="cartao-linha">' + icone("local", 16) + e(exame.local) + "</p>" +
        (exame.preparo.observacao ? '<p class="texto-modal texto-suave-modal">' + e(exame.preparo.observacao) + "</p>" : ""),
      rodape: '<button type="button" class="btn-primario" data-fechar-modal data-foco>' + icone("check", 18) + "Entendi</button>"
    });
  }

  // ---------- calendario e horarios (agendar e reagendar) ----------
  // horarios de um dia que ainda nao passaram
  function horariosLivres(dataISO) {
    var todos = Paciente.horarios();
    if (Paciente.diasAte(dataISO) !== 0) return todos;
    var agora = new Date();
    var minutos = agora.getHours() * 60 + agora.getMinutes();
    return todos.filter(function (h) { return +h.slice(0, 2) * 60 + +h.slice(3) > minutos; });
  }

  // a clinica nao atende aos domingos nem em datas passadas
  function diaDisponivel(dataISO) {
    return Paciente.diasAte(dataISO) >= 0 && Paciente.lerISO(dataISO).getDay() !== 0 && horariosLivres(dataISO).length > 0;
  }

  function feriadoDe(dataISO) {
    return typeof obterFeriado === "function" ? obterFeriado(Paciente.lerISO(dataISO)) : null;
  }

  function primeiroDiaDisponivel() {
    var d = Paciente.hoje();
    while (!diaDisponivel(Paciente.iso(d))) d = Paciente.somarDias(d, 1);
    return Paciente.iso(d);
  }

  // Liga um calendario ja escrito no HTML (.calendario com .calendario-mes, .calendario-dias
  // e dois botoes [data-mes="-1"] e [data-mes="1"]).
  //   opcoes.selecionada: data ISO que comeca marcada
  //   opcoes.atual: data ISO da consulta atual (aparece contornada, no reagendamento)
  //   opcoes.aoEscolher(dataISO): chamado quando o paciente clica num dia
  function calendario(raiz, opcoes) {
    var selecionada = opcoes.selecionada || null;
    // opcoes.mes: data ISO de um dia do mes que aparece primeiro (padrao: mes atual)
    var base = Paciente.lerISO(selecionada || opcoes.mes || Paciente.iso(Paciente.hoje()));
    var mes = new Date(base.getFullYear(), base.getMonth(), 1);
    var grade = raiz.querySelector(".calendario-dias");

    function desenhar() {
      var hoje = Paciente.hoje();
      var ano = mes.getFullYear(), m = mes.getMonth();
      var nomeMes = Paciente.meses[m];
      raiz.querySelector(".calendario-mes").textContent = nomeMes[0].toUpperCase() + nomeMes.slice(1) + " " + ano;
      raiz.querySelector('[data-mes="-1"]').disabled = ano === hoje.getFullYear() && m === hoje.getMonth();

      var html = "";
      for (var v = 0; v < new Date(ano, m, 1).getDay(); v++) html += "<span></span>";
      var total = new Date(ano, m + 1, 0).getDate();
      for (var dia = 1; dia <= total; dia++) {
        var dataISO = Paciente.iso(new Date(ano, m, dia));
        var livre = diaDisponivel(dataISO);
        var feriado = feriadoDe(dataISO);
        var classes = "dia" + (livre ? "" : " indisponivel") + (feriado ? " feriado" : "") +
          (Paciente.diasAte(dataISO) === 0 ? " hoje" : "") + (dataISO === opcoes.atual ? " atual" : "") + (dataISO === selecionada ? " selecionado" : "");
        var dica = [dataISO === opcoes.atual ? "Sua data atual" : "", Paciente.diasAte(dataISO) === 0 ? "Hoje" : "", feriado ? descreverFeriado(feriado) : ""].filter(Boolean).join(" · ");
        html += '<button type="button" class="' + classes + '" data-dia="' + dataISO + '"' + (livre ? "" : " disabled") +
          (dica ? ' title="' + e(dica) + '"' : "") + ' aria-label="' + Paciente.dataLonga(dataISO) + (dica ? " (" + e(dica) + ")" : "") + '"' +
          (dataISO === selecionada ? ' aria-pressed="true"' : "") + ">" + dia + "</button>";
      }
      grade.innerHTML = html;
    }

    raiz.querySelectorAll("[data-mes]").forEach(function (b) {
      b.addEventListener("click", function () {
        mes = new Date(mes.getFullYear(), mes.getMonth() + +b.dataset.mes, 1);
        desenhar();
      });
    });
    grade.addEventListener("click", function (ev) {
      var botao = ev.target.closest("[data-dia]");
      if (!botao || botao.disabled) return;
      selecionada = botao.dataset.dia;
      desenhar();
      opcoes.aoEscolher(selecionada);
    });

    desenhar();
  }

  // Desenha os horarios de um dia dentro de "caixa" (.grade-horarios).
  //   opcoes.data, opcoes.selecionado, opcoes.ignorarId (consulta que esta sendo remarcada),
  //   opcoes.atual (horario atual da consulta, se a data for a mesma), opcoes.aoEscolher(hora)
  function horarios(caixa, opcoes) {
    var livres = horariosLivres(opcoes.data);
    caixa.innerHTML = Paciente.horarios().map(function (h) {
      var ocupada = Paciente.conflito(opcoes.data, h, opcoes.ignorarId);
      var passou = livres.indexOf(h) === -1;
      var ehAtual = opcoes.atual === h;
      var dica = ehAtual ? "Seu horário atual" : ocupada ? "Você já tem consulta neste horário" : passou ? "Horário já passou" : "";
      return '<button type="button" class="pill' + (h === opcoes.selecionado ? " selecionado" : "") + (ehAtual ? " atual" : "") + '" data-hora="' + h + '"' +
        (ocupada || passou || ehAtual ? " disabled" : "") + (dica ? ' title="' + dica + '"' : "") +
        (h === opcoes.selecionado ? ' aria-pressed="true"' : "") + ">" + h + "</button>";
    }).join("");
    caixa.onclick = function (ev) {
      var botao = ev.target.closest("[data-hora]");
      if (botao && !botao.disabled) opcoes.aoEscolher(botao.dataset.hora);
    };
  }

  window.PacienteUI = {
    calendario: calendario,
    horarios: horarios,
    horariosLivres: horariosLivres,
    primeiroDiaDisponivel: primeiroDiaDisponivel,
    feriadoDe: feriadoDe,
    icone: icone,
    badge: badge,
    rotulos: rotulos,
    cartaoConsulta: cartaoConsulta,
    ligarAcoes: ligarAcoes,
    linkReagendar: linkReagendar,
    modal: abrirModal,
    fecharModal: fecharModal,
    sucesso: sucesso,
    cancelar: cancelar,
    detalhes: detalhes,
    preparo: preparo
  };
})();
