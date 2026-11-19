// Dados da visao do enfermeiro (demonstracao). Precisa de pacientes_profissional.js,
// profissional_dados.js e perfil_enfermeiro.js.
//
//   Enfermagem.fila()                          -> pacientes do dia (agenda do medico) com os dados de cada um
//   Enfermagem.salvarTriagem(id, dados)        -> grava a triagem no prontuario e marca "Triado" na agenda
//   Enfermagem.triagemDeHoje(id)               -> triagem feita hoje para o paciente (ou null)
//   Enfermagem.coletas()                       -> exames pedidos pelos medicos, um item por exame
//   Enfermagem.registrarColeta(chave, obs)
//   Enfermagem.procedimentos()                 -> medicacoes para aplicar na unidade e procedimentos do dia
//   Enfermagem.registrarProcedimento(chave, obs)
//   Enfermagem.alergiaDe(paciente, texto)      -> alergia do paciente que bate com um medicamento (ou null)
//
// A fila usa a mesma agenda do medico (Profissional.agenda): o que o enfermeiro tria aparece
// como "Triado" na tela do medico. Coletas e procedimentos feitos ficam salvos no navegador.

(function () {
  var CHAVE = "fluxconnect_enfermagem";

  // pedidos de exame de exemplo (alem dos que os medicos geram na tela de consulta)
  var pedidosBase = [
    { pacienteId: "00512", dias: 0, hora: "09:10", medico: "Dr. Carlos Lima", exames: ["Hemograma Completo"], indicacao: "Infecção de vias aéreas superiores; avaliar leucograma." },
    { pacienteId: "00402", dias: 0, hora: "10:20", medico: "Dr. Carlos Lima", exames: ["Hemoglobina Glicada (HbA1c)", "Glicemia em Jejum"], indicacao: "Controle de diabetes tipo 2." },
    { pacienteId: "00367", dias: 1, hora: "16:30", medico: "Dr. Carlos Lima", exames: ["Creatinina", "Ureia"], indicacao: "Acompanhamento da função renal." }
  ];

  // medicacoes e procedimentos de exemplo para hoje
  var procedimentosBase = [
    { id: "pb-1", pacienteId: "00089", hora: "08:45", tipo: "medicacao", titulo: "Captopril 25 mg", detalhe: "Sublingual · dose única · reavaliar a pressão em 30 minutos", medico: "Dr. Carlos Lima" },
    { id: "pb-2", pacienteId: "00124", hora: "09:20", tipo: "medicacao", titulo: "Benzilpenicilina benzatina 1.200.000 UI", detalhe: "Intramuscular · dose única", medico: "Dr. Carlos Lima" },
    { id: "pb-3", pacienteId: "00344", hora: "10:00", tipo: "procedimento", titulo: "Nebulização com salbutamol", detalhe: "10 gotas em 3 mL de soro fisiológico", medico: "Dr. Carlos Lima" },
    { id: "pb-4", pacienteId: "00402", hora: "10:40", tipo: "procedimento", titulo: "Curativo em membro inferior direito", detalhe: "Limpeza com soro fisiológico e cobertura com gaze", medico: "Dr. Carlos Lima" }
  ];

  // nomes alternativos para o aviso de alergia (os mesmos da tela de receita do medico)
  var relacoesAlergia = {
    "penicilina": ["penicilina", "amoxicilina", "ampicilina", "benzetacil"],
    "aas": ["aas", "ácido acetilsalicílico", "acido acetilsalicilico", "aspirina"],
    "dipirona": ["dipirona", "metamizol", "novalgina"],
    "sulfa": ["sulfa", "sulfametoxazol", "bactrim"],
    "amoxicilina": ["amoxicilina", "penicilina", "ampicilina"]
  };

  // ---------- armazenamento ----------
  function ler() {
    var salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { salvo = {}; }
    return { coletas: salvo.coletas || {}, procedimentos: salvo.procedimentos || {} };
  }

  function gravar(estado) {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
  }

  // ---------- auxiliares ----------
  function autor() {
    return window.PerfilEnfermeiro ? PerfilEnfermeiro.obter().nome : "Enfermagem";
  }

  function hora(data) {
    var d = new Date(data);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function diaPorDias(dias, horaTexto) {
    var d = new Date();
    d.setDate(d.getDate() - dias);
    var p = (horaTexto || "08:00").split(":");
    d.setHours(+p[0], +p[1], 0, 0);
    return d;
  }

  function ehHoje(data) {
    return new Date(data).toDateString() === new Date().toDateString();
  }

  function pacienteOuVazio(id) {
    return PacientesProfissional.obter(id) || { id: id, nome: "Paciente", cpf: "", cor: "#64748b", alergias: [], condicoes: [] };
  }

  function alergiaDe(paciente, texto) {
    var t = String(texto || "").toLowerCase();
    if (!t) return null;
    return (paciente.alergias || []).find(function (alergia) {
      var termos = relacoesAlergia[alergia.toLowerCase()] || [alergia.toLowerCase()];
      return termos.some(function (termo) { return t.indexOf(termo) !== -1; });
    }) || null;
  }

  // ---------- fila de triagem ----------
  function fila() {
    return Profissional.agenda().filter(function (a) { return !a.vago; }).map(function (a) {
      return Object.assign({}, a, { paciente: pacienteOuVazio(a.id) });
    });
  }

  function triagemDeHoje(id) {
    var p = PacientesProfissional.obter(id);
    if (!p) return null;
    return p.triagens.find(function (t) { return ehHoje(t.data); }) || null;
  }

  function salvarTriagem(id, dados) {
    PacientesProfissional.adicionarTriagem(id, {
      data: new Date().toISOString(),
      autor: autor(),
      vitais: dados.vitais,
      queixa: dados.queixa,
      observacoes: dados.observacoes,
      risco: dados.risco
    });
    Profissional.definirRisco(id, dados.risco);
    Profissional.definirStatus(id, "triado");
  }

  // ---------- coleta de exames ----------
  function coletas() {
    var estado = ler();
    var lista = [];

    function incluir(pacienteId, pedido, data) {
      var paciente = pacienteOuVazio(pacienteId);
      pedido.exames.forEach(function (exame) {
        var chave = pacienteId + "|" + new Date(data).toISOString() + "|" + exame;
        var feita = estado.coletas[chave];
        lista.push({
          chave: chave, paciente: paciente, exame: exame, medico: pedido.medico, indicacao: pedido.indicacao,
          data: new Date(data), status: feita ? "coletado" : "solicitado", coleta: feita || null
        });
      });
    }

    pedidosBase.forEach(function (p) { incluir(p.pacienteId, p, diaPorDias(p.dias, p.hora)); });
    PacientesProfissional.todos().forEach(function (paciente) {
      PacientesProfissional.registros(paciente.id).pedidos.forEach(function (pedido) { incluir(paciente.id, pedido, pedido.data); });
    });

    return lista.sort(function (a, b) { return b.data - a.data; });
  }

  function registrarColeta(chave, observacao) {
    var estado = ler();
    estado.coletas[chave] = { data: new Date().toISOString(), autor: autor(), observacao: observacao || "" };
    gravar(estado);
  }

  // ---------- medicacao e procedimentos ----------
  function procedimentos() {
    var estado = ler();
    var lista = procedimentosBase.map(function (p) {
      return { chave: p.id, paciente: pacienteOuVazio(p.pacienteId), tipo: p.tipo, titulo: p.titulo, detalhe: p.detalhe, medico: p.medico, data: diaPorDias(0, p.hora) };
    });

    // medicamentos que o medico marcou como "aplicar na unidade" na receita
    PacientesProfissional.todos().forEach(function (paciente) {
      PacientesProfissional.registros(paciente.id).receitas.forEach(function (receita) {
        (receita.itens || []).forEach(function (item) {
          if (!item.naUnidade) return;
          lista.push({
            chave: "rx|" + paciente.id + "|" + receita.data + "|" + item.nome, paciente: paciente, tipo: "medicacao", titulo: item.nome,
            detalhe: item.via + " · " + item.quantidade + " · " + item.instrucoes, medico: receita.medico, data: new Date(receita.data)
          });
        });
      });
    });

    return lista.map(function (p) {
      var feito = estado.procedimentos[p.chave];
      return Object.assign(p, {
        status: feito ? "realizado" : "pendente",
        registro: feito || null,
        alergia: p.tipo === "medicacao" ? alergiaDe(p.paciente, p.titulo) : null
      });
    }).sort(function (a, b) { return a.data - b.data; });
  }

  function registrarProcedimento(chave, observacao) {
    var estado = ler();
    estado.procedimentos[chave] = { data: new Date().toISOString(), autor: autor(), observacao: observacao || "" };
    gravar(estado);
  }

  // ---------- notificacoes do sininho (compartilhado/notificacoes.js) ----------
  window.FluxNotificacoesDinamicas = window.FluxNotificacoesDinamicas || {};
  window.FluxNotificacoesDinamicas.enfermeiro = function () {
    var lista = [];
    var hoje = new Date().toDateString();
    var aguardando = fila().filter(function (a) { return a.status === "aguardando"; });
    if (aguardando.length) {
      lista.push({ id: "enf-fila-" + hoje + "-" + aguardando.length, tipo: "checkin", titulo: "Pacientes aguardando triagem",
        texto: aguardando.length + (aguardando.length === 1 ? " paciente aguarda" : " pacientes aguardam") + " triagem. Próximo: " + aguardando[0].paciente.nome + " (" + aguardando[0].hora + ").",
        minutos: 6, link: Profissional.url("tela_principal_enfermeiro/index.html"), acao: "Abrir a fila" });
    }

    var alerta = procedimentos().find(function (p) { return p.status === "pendente" && p.alergia; });
    if (alerta) {
      lista.push({ id: "enf-alergia-" + alerta.chave, tipo: "alerta", urgente: true, titulo: "Medicação com alerta de alergia",
        texto: alerta.titulo + " prescrita para " + alerta.paciente.nome + ", que tem alergia registrada a " + alerta.alergia + ".",
        minutos: 14, link: Profissional.url("procedimentos_enfermeiro/index.html"), acao: "Ver medicação" });
    }

    var pendentes = coletas().filter(function (c) { return c.status === "solicitado"; });
    if (pendentes.length) {
      lista.push({ id: "enf-coletas-" + hoje + "-" + pendentes.length, tipo: "laudo", titulo: "Coletas pendentes",
        texto: pendentes.length + (pendentes.length === 1 ? " exame aguarda" : " exames aguardam") + " coleta.",
        minutos: 50, link: Profissional.url("coletas_enfermeiro/index.html"), acao: "Ver coletas" });
    }

    lista.push({ id: "enf-escala", tipo: "agendamento", titulo: "Escala confirmada",
      texto: "Sua escala desta semana foi confirmada pela coordenação.", minutos: 1400, lida: true });
    return lista;
  };

  window.Enfermagem = {
    fila: fila,
    triagemDeHoje: triagemDeHoje,
    salvarTriagem: salvarTriagem,
    coletas: coletas,
    registrarColeta: registrarColeta,
    procedimentos: procedimentos,
    registrarProcedimento: registrarProcedimento,
    alergiaDe: alergiaDe,
    hora: hora,
    ehHoje: ehHoje
  };
})();
