// Dados da area do profissional (demonstracao) que sao usados por mais de uma tela:
// a agenda do dia e os resultados de exames. Os pacientes ficam em pacientes_profissional.js.
//
//   Profissional.agenda()                   -> horarios de hoje, ja com o status salvo
//   Profissional.definirStatus(id, status)  -> "aguardando" | "triado" | "em-atendimento" | "finalizado" | "cancelado"
//   Profissional.definirRisco(id, risco)    -> classificacao feita na triagem ("vermelho" ... "azul")
//   Profissional.riscos / riscoTag(risco)   -> as cinco cores de risco e a etiqueta de cada uma
//   Profissional.resultados()               -> laudos recebidos (novo: true enquanto nao foi aberto)
//   Profissional.marcarLido(id)
//   Profissional.badge(status)              -> etiqueta colorida do status da agenda
//   Profissional.url("resultados_profissional/index.html")
// Os status valem ate o fim do dia; no dia seguinte a agenda volta ao inicio.

(function () {
  var CHAVE_AGENDA = "fluxconnect_agenda_profissional";
  var CHAVE_LIDOS = "fluxconnect_resultados_lidos";
  var RAIZ = new URL("../", document.currentScript.src).href;

  var agendaBase = [
    { id: "00124", hora: "08:00", tipo: "Consulta geral", duracao: 30, status: "aguardando", sala: "Sala 3", primeira: true },
    { id: "00089", hora: "08:30", tipo: "Retorno", duracao: 20, status: "em-atendimento", sala: "Sala 3", primeira: false },
    { id: "00201", hora: "09:00", tipo: "Avaliação", duracao: 30, status: "aguardando", sala: "Sala 2", primeira: false },
    { id: "00155", hora: "09:30", tipo: "Consulta geral", duracao: 30, status: "cancelado", sala: "Sala 3", primeira: true },
    { id: "00402", hora: "10:00", tipo: "Retorno", duracao: 20, status: "finalizado", sala: "Sala 3", primeira: false },
    { id: "vago-1030", hora: "10:30", vago: true },
    { id: "00088", hora: "11:00", tipo: "Consulta geral", duracao: 30, status: "aguardando", sala: "Sala 3", primeira: false },
    { id: "00317", hora: "11:30", tipo: "Avaliação", duracao: 40, status: "aguardando", sala: "Sala 2", primeira: true },
    { id: "00451", hora: "14:00", tipo: "Retorno", duracao: 20, status: "aguardando", sala: "Sala 3", primeira: false }
  ];

  var rotulosStatus = {
    "aguardando": "Aguardando",
    "triado": "Triado",
    "em-atendimento": "Em atendimento",
    "finalizado": "Finalizado",
    "cancelado": "Cancelado"
  };

  // classe de cor da etiqueta (as mesmas das telas da recepcao)
  var classesStatus = {
    "aguardando": "badge-aguardando",
    "triado": "badge-agendado",
    "em-atendimento": "badge-em-atendimento",
    "finalizado": "badge-realizada",
    "cancelado": "badge-cancelada"
  };

  // Classificacao de risco da triagem, da mais urgente para a menos urgente.
  var riscos = [
    { id: "vermelho", nome: "Emergência", texto: "Atendimento imediato" },
    { id: "laranja", nome: "Muito urgente", texto: "Passa à frente dos demais" },
    { id: "amarelo", nome: "Urgente", texto: "Passa à frente de verde e azul" },
    { id: "verde", nome: "Pouco urgente", texto: "Segue o horário marcado" },
    { id: "azul", nome: "Não urgente", texto: "Segue o horário marcado" }
  ];

  // "dias" = ha quantos dias o laudo foi liberado. O ultimo item de cada parametro
  // (true) marca valor fora da referencia.
  var resultadosBase = [
    { id: "r1", dias: 0, hora: "14:32", pacienteId: "00512", exame: "Hemograma Completo", categoria: "Hematologia", lab: "Lab FluxLab", novo: false,
      parametros: [["Hemoglobina", "13,8 g/dL", "12,0 – 16,0"], ["Leucócitos", "6.900 /mm³", "4.000 – 11.000"], ["Plaquetas", "245.000 /mm³", "150.000 – 450.000"]],
      conclusao: "Hemograma dentro dos valores de referência." },
    { id: "r2", dias: 0, hora: "11:15", pacienteId: "00478", exame: "Eletrocardiograma", categoria: "Cardiologia", lab: "Centro de Imagem FluxScan", novo: true,
      parametros: [["Ritmo", "Sinusal", "Sinusal"], ["Frequência cardíaca", "92 bpm", "60 – 100"], ["Intervalo PR", "0,16 s", "0,12 – 0,20"]],
      conclusao: "ECG com ritmo sinusal. Discreta alteração de repolarização ventricular; correlacionar com a clínica." },
    { id: "r3", dias: 1, hora: "16:48", pacienteId: "00390", exame: "TSH / T4 Livre", categoria: "Endocrinologia", lab: "FluxDiagnósticos", novo: true,
      parametros: [["TSH", "6,2 µUI/mL", "0,4 – 4,0", true], ["T4 livre", "0,9 ng/dL", "0,8 – 1,8"]],
      conclusao: "TSH acima do valor de referência com T4 livre normal. Sugere hipotireoidismo subclínico." },
    { id: "r4", dias: 1, hora: "09:20", pacienteId: "00367", exame: "Raio-X de Tórax", categoria: "Radiologia", lab: "Centro de Imagem FluxScan", novo: false,
      parametros: [["Campos pulmonares", "Sem alterações", "—"], ["Área cardíaca", "Normal", "—"]],
      conclusao: "Exame radiológico do tórax sem alterações significativas." },
    { id: "r5", dias: 2, hora: "15:00", pacienteId: "00344", exame: "Colesterol Total e Frações", categoria: "Bioquímica", lab: "Lab FluxLab", novo: false,
      parametros: [["Colesterol total", "212 mg/dL", "< 190", true], ["HDL", "52 mg/dL", "> 40"], ["LDL", "138 mg/dL", "< 130", true], ["Triglicerídeos", "110 mg/dL", "< 150"]],
      conclusao: "Colesterol total e LDL levemente elevados." },
    { id: "r6", dias: 2, hora: "10:30", pacienteId: "00321", exame: "Urina Tipo 1 + Urocultura", categoria: "Microbiologia", lab: "FluxDiagnósticos", novo: false,
      parametros: [["Leucócitos", "3 /campo", "até 5"], ["Nitrito", "Negativo", "Negativo"], ["Urocultura", "Sem crescimento", "Negativa"]],
      conclusao: "Exame de urina sem alterações. Urocultura negativa." },
    { id: "r7", dias: 3, hora: "13:45", pacienteId: "00298", exame: "Glicemia em Jejum + HbA1c", categoria: "Endocrinologia", lab: "Lab FluxLab", novo: false,
      parametros: [["Glicemia em jejum", "104 mg/dL", "70 – 99", true], ["HbA1c", "5,9 %", "< 5,7", true]],
      conclusao: "Valores compatíveis com pré-diabetes." },
    { id: "r8", dias: 4, hora: "08:55", pacienteId: "00276", exame: "Creatinina e Ureia", categoria: "Nefrologia", lab: "FluxDiagnósticos", novo: false,
      parametros: [["Creatinina", "1,0 mg/dL", "0,7 – 1,3"], ["Ureia", "34 mg/dL", "15 – 45"]],
      conclusao: "Função renal preservada." }
  ];

  function chaveHoje() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function escapar(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function url(caminho) {
    return RAIZ + caminho;
  }

  // ---------- agenda ----------
  // o que mudou hoje: status e risco de cada paciente (vale ate o fim do dia)
  function lerDia() {
    try {
      var salvo = JSON.parse(localStorage.getItem(CHAVE_AGENDA) || "null");
      if (salvo && salvo.dia === chaveHoje()) return { status: salvo.status || {}, risco: salvo.risco || {} };
    } catch (e) {}
    return { status: {}, risco: {} };
  }

  function gravarDia(dia) {
    try { localStorage.setItem(CHAVE_AGENDA, JSON.stringify({ dia: chaveHoje(), status: dia.status, risco: dia.risco })); } catch (e) {}
  }

  function agenda() {
    var dia = lerDia();
    return agendaBase.map(function (item) {
      return item.vago ? Object.assign({}, item)
        : Object.assign({}, item, { status: dia.status[item.id] || item.status, risco: dia.risco[item.id] || "" });
    });
  }

  function definirStatus(id, status) {
    var dia = lerDia();
    dia.status[id] = status;
    gravarDia(dia);
  }

  function definirRisco(id, risco) {
    var dia = lerDia();
    dia.risco[id] = risco;
    gravarDia(dia);
  }

  // posicao na ordem de urgencia (0 = vermelho); sem risco vai para o fim
  function prioridade(risco) {
    var i = riscos.findIndex(function (r) { return r.id === risco; });
    return i === -1 ? riscos.length : i;
  }

  // etiqueta colorida do risco; curta = so a bolinha com o nome na dica
  function riscoTag(risco, curta) {
    var r = riscos.find(function (x) { return x.id === risco; });
    if (!r) return "";
    return '<span class="tag-risco risco-' + r.id + (curta ? " tag-risco-curta" : "") + '" title="Risco: ' + r.nome + '"><i></i>' +
      (curta ? '<span class="sr-only">Risco: ' + r.nome + "</span>" : r.nome) + "</span>";
  }

  function badge(status) {
    return '<span class="badge ' + classesStatus[status] + '"><span class="badge-ponto"></span>' + rotulosStatus[status] + "</span>";
  }

  // ---------- resultados ----------
  function lidos() {
    try { return JSON.parse(localStorage.getItem(CHAVE_LIDOS) || "[]"); } catch (e) { return []; }
  }

  function resultados() {
    var jaLidos = lidos();
    return resultadosBase.map(function (r) {
      var p = PacientesProfissional.obter(r.pacienteId) || { nome: "Paciente", cpf: "", cor: "#64748b" };
      var data = new Date();
      data.setHours(0, 0, 0, 0);
      data.setDate(data.getDate() - r.dias);
      return Object.assign({}, r, {
        data: data,
        dataTexto: PacientesProfissional.formatarData(data),
        paciente: p.nome,
        cpf: p.cpf,
        cor: p.cor,
        novo: r.novo && jaLidos.indexOf(r.id) === -1
      });
    });
  }

  function marcarLido(id) {
    var lista = lidos();
    if (lista.indexOf(id) !== -1) return;
    lista.push(id);
    try { localStorage.setItem(CHAVE_LIDOS, JSON.stringify(lista)); } catch (e) {}
  }

  // ---------- notificacoes do sininho (compartilhado/notificacoes.js) ----------
  window.FluxNotificacoesDinamicas = window.FluxNotificacoesDinamicas || {};
  window.FluxNotificacoesDinamicas.profissional = function () {
    var lista = [];
    var horarios = agenda().filter(function (a) { return !a.vago; });
    var nome = function (id) { return (PacientesProfissional.obter(id) || {}).nome || "paciente"; };

    var emAtendimento = horarios.find(function (a) { return a.status === "em-atendimento"; });
    if (emAtendimento) {
      lista.push({ id: "prof-andamento-" + chaveHoje() + "-" + emAtendimento.id, tipo: "alerta", titulo: "Atendimento em andamento",
        texto: "A consulta de " + nome(emAtendimento.id) + " (" + emAtendimento.hora + ") ainda não foi finalizada.", minutos: 8,
        link: url("atendimento_profissional/index.html") + "?id=" + emAtendimento.id, acao: "Continuar atendimento" });
    }

    var aguardando = horarios.filter(function (a) { return a.status === "aguardando" || a.status === "triado"; })
      .sort(function (a, b) { return prioridade(a.risco) - prioridade(b.risco); });
    if (aguardando.length) {
      lista.push({ id: "prof-fila-" + chaveHoje() + "-" + aguardando.length, tipo: "checkin", titulo: "Pacientes aguardando",
        texto: aguardando.length + (aguardando.length === 1 ? " paciente aguarda" : " pacientes aguardam") + " atendimento hoje. Próximo: " + nome(aguardando[0].id) + ", às " + aguardando[0].hora + ".",
        minutos: 15, link: url("tela_principal_profissional/index.html"), acao: "Ver agenda" });
    }

    resultados().filter(function (r) { return r.novo; }).forEach(function (r, i) {
      lista.push({ id: "prof-laudo-" + r.id, tipo: "laudo", titulo: "Novo resultado de exame",
        texto: r.exame + " de " + r.paciente + " foi liberado pelo laboratório.", minutos: 40 + i * 180,
        link: url("resultados_profissional/index.html") + "?laudo=" + r.id, acao: "Ver laudo" });
    });

    lista.push({ id: "prof-agenda-amanha", tipo: "agendamento", titulo: "Agenda de amanhã confirmada",
      texto: "A recepção confirmou os atendimentos de amanhã.", minutos: 1300, lida: true });
    return lista;
  };

  window.Profissional = {
    agenda: agenda,
    definirStatus: definirStatus,
    definirRisco: definirRisco,
    riscos: riscos,
    riscoTag: riscoTag,
    prioridade: prioridade,
    rotulosStatus: rotulosStatus,
    badge: badge,
    resultados: resultados,
    marcarLido: marcarLido,
    escapar: escapar,
    url: url
  };
})();
