// Dados do portal do paciente (demonstracao): perfil, consultas e exames.
// Todas as telas do paciente leem daqui, entao o que muda numa tela aparece nas outras
// (agendar, reagendar e cancelar ficam salvos no navegador).
//
// Uso:
//   Paciente.perfil()                         -> dados do cadastro
//   Paciente.consultas()                      -> todas, da mais antiga para a mais nova
//   Paciente.proximas() / realizadas() / canceladas()
//   Paciente.obterConsulta(id)
//   Paciente.agendarConsulta({ data, hora, medico, especialidade, local })
//   Paciente.reagendarConsulta(id, dataISO, hora)
//   Paciente.cancelarConsulta(id, motivo)
//   Paciente.exames()                         -> laudos disponiveis e exames marcados
//   Paciente.url("Consultas/index.html")      -> endereco de outra tela, de qualquer pasta
// As datas de exemplo sao contadas a partir de hoje, para sempre existir algo futuro.

(function () {
  var CHAVE = "fluxconnect_paciente";
  // pasta "paginas/": serve para montar links que funcionam em telas de qualquer nivel
  var RAIZ = new URL("../", document.currentScript.src).href;

  var diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var mesesCurtos = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  var horarios = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];

  var dadosPerfil = {
    nome: "Neymar da Silva Santos Junior",
    nomeCurto: "Neymar Jr",
    email: "neymarjunior@gmail.com",
    cpf: "123.456.789-10",
    nascimento: "05/02/1992",
    sexo: "Masculino",
    telefone: "(89) 99410-1112",
    convenio: "Unimed",
    rua: "Jardim Glória",
    numero: "2112",
    bairro: "Av. Min. Marcos Freire",
    cidade: "Praia Grande - SP",
    estado: "São Paulo",
    cep: "11724-000",
    desde: "2024"
  };

  // "dias" = distancia de hoje (negativo = ja passou)
  var consultasBase = [
    { id: "c-1", dias: 3, hora: "10:30", medico: "Dr. Carlos Lima", especialidade: "Clínica Geral", local: "Clínica FluxMed — Rua Defala Attem, 1200", modalidade: "Presencial", status: "confirmada" },
    { id: "c-2", dias: 9, hora: "08:30", medico: "Dra. Ana Paula", especialidade: "Cardiologia", local: "UBS Centro", modalidade: "Presencial", status: "confirmada" },
    { id: "c-3", dias: 16, hora: "10:00", medico: "Dr. Carlos Mendes", especialidade: "Dermatologia", local: "UBS Centro", modalidade: "Presencial", status: "pendente" },
    { id: "c-4", dias: 27, hora: "14:30", medico: "Dra. Renata Silva", especialidade: "Neurologia", local: "UBS Centro", modalidade: "Teleconsulta", status: "confirmada" },
    { id: "c-5", dias: 40, hora: "09:30", medico: "Dr. Fábio Almeida", especialidade: "Ortopedia", local: "UBS Centro", modalidade: "Presencial", status: "pendente" },

    { id: "r-1", dias: -12, hora: "09:00", medico: "Dra. Mariana Costa", especialidade: "Ginecologia", local: "UBS Centro", modalidade: "Presencial", status: "realizada", resumo: "Consulta de rotina. Exames preventivos solicitados.", receita: "Sem medicação prescrita." },
    { id: "r-2", dias: -41, hora: "08:00", medico: "Dra. Juliana Ferreira", especialidade: "Endocrinologia", local: "Hospital Regional", modalidade: "Presencial", status: "realizada", resumo: "Avaliação da glicemia. Orientação alimentar e retorno em 3 meses.", receita: "Metformina 500 mg — 1 comprimido após o jantar." },
    { id: "r-3", dias: -64, hora: "16:00", medico: "Dr. Paulo Neto", especialidade: "Cardiologia", local: "UBS Centro", modalidade: "Presencial", status: "realizada", resumo: "Pressão arterial controlada. Solicitado ecocardiograma de acompanhamento.", receita: "Losartana 50 mg — 1 comprimido pela manhã." },
    { id: "r-4", dias: -97, hora: "10:30", medico: "Dr. Carlos Mendes", especialidade: "Dermatologia", local: "UBS Centro", modalidade: "Teleconsulta", status: "realizada", resumo: "Dermatite leve. Orientado uso de hidratante e protetor solar.", receita: "Creme hidratante com ureia 10% — 2 vezes ao dia." },
    { id: "r-5", dias: -133, hora: "10:00", medico: "Dr. Carlos Lima", especialidade: "Clínica Geral", local: "Clínica FluxMed — Rua Defala Attem, 1200", modalidade: "Presencial", status: "realizada", resumo: "Check-up anual. Solicitados hemograma e glicemia de jejum.", receita: "Sem medicação prescrita." },
    { id: "r-6", dias: -188, hora: "15:00", medico: "Dr. Ricardo Alves", especialidade: "Ortopedia", local: "Hospital Regional", modalidade: "Presencial", status: "realizada", resumo: "Dor lombar. Encaminhado para fisioterapia e ressonância da coluna.", receita: "Anti-inflamatório por 5 dias, se houver dor." },
    { id: "r-7", dias: -251, hora: "09:30", medico: "Dra. Fernanda Rocha", especialidade: "Dermatologia", local: "UBS Centro", modalidade: "Presencial", status: "realizada", resumo: "Avaliação de sinais na pele. Nenhuma alteração preocupante.", receita: "Sem medicação prescrita." },
    { id: "r-8", dias: -330, hora: "10:00", medico: "Dr. Paulo Neto", especialidade: "Cardiologia", local: "UBS Centro", modalidade: "Presencial", status: "realizada", resumo: "Primeira avaliação cardiológica. Início do acompanhamento da pressão.", receita: "Losartana 50 mg — 1 comprimido pela manhã." },
    { id: "r-9", dias: -402, hora: "08:30", medico: "Dr. Carlos Lima", especialidade: "Clínica Geral", local: "Clínica FluxMed — Rua Defala Attem, 1200", modalidade: "Presencial", status: "realizada", resumo: "Quadro gripal. Repouso e hidratação.", receita: "Antitérmico, se houver febre." },

    { id: "x-1", dias: -7, hora: "09:00", medico: "Dr. Marcos Oliveira", especialidade: "Psiquiatria", local: "UBS Centro", modalidade: "Teleconsulta", status: "cancelada", motivo: "Imprevisto pessoal" },
    { id: "x-2", dias: -24, hora: "14:00", medico: "Dra. Beatriz Santos", especialidade: "Oftalmologia", local: "UBS Centro", modalidade: "Presencial", status: "cancelada", motivo: "Problema de transporte" },
    { id: "x-3", dias: -52, hora: "10:30", medico: "Dr. André Rocha", especialidade: "Urologia", local: "Hospital Regional", modalidade: "Presencial", status: "cancelada", motivo: "Conflito de horário" }
  ];

  var examesBase = [
    { id: "e-1", dias: -8, titulo: "Hemograma Completo", categoria: "laboratorial", status: "disponivel", solicitante: "Dr. Carlos Lima", local: "Lab FluxLab" },
    { id: "e-2", dias: -13, titulo: "Ressonância Magnética — Coluna Lombar", categoria: "imagem", status: "disponivel", solicitante: "Dr. Ricardo Alves", local: "Centro de Imagem FluxScan" },
    { id: "e-3", dias: -21, titulo: "Tomografia Computadorizada — Abdômen", categoria: "imagem", status: "disponivel", solicitante: "Dr. Carlos Lima", local: "Lab FluxLab" },
    { id: "e-4", dias: -29, titulo: "Glicemia de Jejum", categoria: "laboratorial", status: "disponivel", solicitante: "Dra. Juliana Ferreira", local: "FluxDiagnósticos" },

    { id: "e-5", dias: 2, hora: "08:00", titulo: "Hemograma Completo", descricao: "Análise clínica de sangue", categoria: "laboratorial", status: "agendado", local: "Lab FluxLab — Rua Defala Attem, 822",
      preparo: { principal: "Jejum obrigatório de 8 horas antes da coleta.", instrucoes: [
        "Água é permitida, com moderação, durante o jejum.",
        "Evite bebidas alcoólicas nas 24 horas anteriores.",
        "Evite exercícios físicos intensos no dia anterior.",
        "Mantenha os medicamentos de uso contínuo, salvo orientação médica em contrário.",
        "Leve documento oficial com foto, o pedido médico e a carteirinha do convênio.",
        "Chegue com pelo menos 15 minutos de antecedência."
      ], observacao: "Resultado estimado em até 24 horas úteis após a coleta." } },
    { id: "e-6", dias: 6, hora: "08:00", titulo: "Ecocardiograma", descricao: "Ultrassom do coração", categoria: "cardiologico", status: "agendado", local: "Lab FluxLab — Rua Defala Attem, 822",
      preparo: { principal: "Não precisa de jejum: faça uma refeição leve até 2 horas antes.", instrucoes: [
        "Vista roupas confortáveis de duas peças, para facilitar o exame.",
        "Evite café, chá preto, energéticos e cigarro nas 4 horas anteriores.",
        "Leve exames cardiológicos anteriores, se tiver, e documento com foto."
      ], observacao: "O exame dura cerca de 30 minutos e não exige repouso depois." } },
    { id: "e-7", dias: 10, hora: "10:00", titulo: "Ultrassonografia Abdominal", descricao: "Diagnóstico por imagem", categoria: "imagem", status: "aguardando", local: "Centro de Imagem FluxScan — Rua São Pedro, 300",
      preparo: { principal: "Jejum de 6 a 8 horas e bexiga cheia.", instrucoes: [
        "Evite alimentos gordurosos e laticínios no dia anterior.",
        "Beba de 4 a 6 copos de água 1 hora antes e não urine até fazer o exame.",
        "Não fume nem masque chiclete antes do exame.",
        "Leve ultrassons ou tomografias anteriores para comparação."
      ], observacao: "Exame seguro, indolor e sem radiação." } },
    { id: "e-8", dias: 13, hora: "09:00", titulo: "Teste Ergométrico", descricao: "Teste de esforço em esteira", categoria: "cardiologico", status: "agendado", local: "Lab FluxLab — Rua Defala Attem, 822",
      preparo: { principal: "Faça uma refeição leve até 2 horas antes. Não vá em jejum.", instrucoes: [
        "Use tênis e roupas esportivas confortáveis.",
        "Não consuma cafeína (café, refrigerante de cola, chocolate) nas 12 horas anteriores.",
        "Pergunte ao seu cardiologista se algum remédio deve ser suspenso antes do teste."
      ], observacao: "Recomenda-se repouso nas primeiras horas depois do teste." } }
  ];

  // ---------- datas ----------
  function hoje() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function somarDias(data, dias) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
  }

  function iso(data) {
    return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");
  }

  function lerISO(texto) {
    var p = texto.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  // data de exemplo: nunca cai no domingo
  function dataDeExemplo(dias) {
    var d = somarDias(hoje(), dias);
    if (d.getDay() === 0) d = somarDias(d, dias < 0 ? -1 : 1);
    return iso(d);
  }

  // quantos dias faltam (0 = hoje, negativo = ja passou)
  function diasAte(dataISO) {
    return Math.round((lerISO(dataISO) - hoje()) / 86400000);
  }

  // "18/11/2026"
  function formatarData(dataISO) {
    var p = dataISO.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  // "18 de novembro de 2026"
  function dataLonga(dataISO) {
    var d = lerISO(dataISO);
    return d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear();
  }

  // "Quarta-feira, 18 de novembro de 2026"
  function dataExtenso(dataISO) {
    return diasSemana[lerISO(dataISO).getDay()] + ", " + dataLonga(dataISO);
  }

  // "hoje", "amanhã", "em 5 dias"
  function quando(dataISO) {
    var n = diasAte(dataISO);
    if (n === 0) return "hoje";
    if (n === 1) return "amanhã";
    return "em " + n + " dias";
  }

  // ---------- armazenamento ----------
  function ler() {
    var estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { estado = {}; }
    return { novas: estado.novas || [], alteracoes: estado.alteracoes || {} };
  }

  function gravar(estado) {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
  }

  // ---------- consultas ----------
  function consultas() {
    var estado = ler();
    var hojeISO = iso(hoje());
    var fixas = consultasBase.map(function (c) {
      var copia = Object.assign({}, c, { data: dataDeExemplo(c.dias) });
      delete copia.dias;
      return copia;
    });
    return fixas.concat(estado.novas).map(function (c) {
      var final = Object.assign({}, c, estado.alteracoes[c.id] || {});
      // consulta marcada cuja data ja passou conta como realizada
      if ((final.status === "confirmada" || final.status === "pendente") && final.data < hojeISO) final.status = "realizada";
      return final;
    }).sort(function (a, b) {
      return (a.data + a.hora).localeCompare(b.data + b.hora);
    });
  }

  function comStatus(lista) {
    return consultas().filter(function (c) { return lista.indexOf(c.status) !== -1; });
  }

  function proximas() { return comStatus(["confirmada", "pendente"]); }
  function realizadas() { return comStatus(["realizada"]).reverse(); }
  function canceladas() { return comStatus(["cancelada"]).reverse(); }

  function obterConsulta(id) {
    return consultas().find(function (c) { return c.id === id; }) || null;
  }

  function alterar(id, campos) {
    var estado = ler();
    estado.alteracoes[id] = Object.assign({}, estado.alteracoes[id] || {}, campos);
    gravar(estado);
    return obterConsulta(id);
  }

  function agendarConsulta(dados) {
    var estado = ler();
    var nova = Object.assign({ id: "n-" + Date.now(), modalidade: "Presencial", status: "confirmada" }, dados);
    estado.novas.push(nova);
    gravar(estado);
    return nova;
  }

  function reagendarConsulta(id, dataISO, hora) {
    return alterar(id, { data: dataISO, hora: hora, status: "confirmada", motivo: "" });
  }

  function cancelarConsulta(id, motivo) {
    return alterar(id, { status: "cancelada", motivo: motivo });
  }

  // outra consulta do proprio paciente no mesmo dia e horario
  function conflito(dataISO, hora, ignorarId) {
    return proximas().find(function (c) { return c.data === dataISO && c.hora === hora && c.id !== ignorarId; }) || null;
  }

  // ---------- exames ----------
  function exames() {
    return examesBase.map(function (x) {
      var copia = Object.assign({}, x, { data: dataDeExemplo(x.dias) });
      delete copia.dias;
      return copia;
    });
  }

  function examesPendentes() {
    return exames().filter(function (x) { return x.status !== "disponivel"; })
      .sort(function (a, b) { return a.data.localeCompare(b.data); });
  }

  function laudos() {
    return exames().filter(function (x) { return x.status === "disponivel"; })
      .sort(function (a, b) { return b.data.localeCompare(a.data); });
  }

  // ---------- series para os graficos dos cards ----------
  // quantos itens da lista em cada um dos ultimos "quantos" meses (o ultimo e o mes atual)
  function serieMeses(lista, quantos) {
    var base = hoje();
    var valores = [], rotulos = [];
    for (var i = quantos - 1; i >= 0; i--) {
      var mes = new Date(base.getFullYear(), base.getMonth() - i, 1);
      var prefixo = iso(mes).slice(0, 7);
      valores.push(lista.filter(function (x) { return x.data.slice(0, 7) === prefixo; }).length);
      rotulos.push(mesesCurtos[mes.getMonth()].toLowerCase() + "/" + String(mes.getFullYear()).slice(2));
    }
    return { valores: valores, rotulos: rotulos };
  }

  // quantos itens da lista em cada uma das proximas "quantas" semanas (a primeira comeca hoje)
  function serieSemanas(lista, quantas) {
    var valores = [], rotulos = [];
    for (var i = 0; i < quantas; i++) {
      valores.push(lista.filter(function (x) { var n = diasAte(x.data); return n >= i * 7 && n < (i + 1) * 7; }).length);
      rotulos.push(i === 0 ? "Esta semana" : "Semana de " + formatarData(iso(somarDias(hoje(), i * 7))).slice(0, 5));
    }
    return { valores: valores, rotulos: rotulos };
  }

  // ---------- textos ----------
  function escapar(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // "Dra. Ana Paula" -> "AP"
  function iniciais(nome) {
    var partes = String(nome || "").replace(/^(Dr|Dra)\.?\s+/i, "").trim().split(/\s+/);
    if (!partes[0]) return "--";
    return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
  }

  function perfil() {
    return Object.assign({ iniciais: iniciais(dadosPerfil.nomeCurto) }, dadosPerfil);
  }

  function url(caminho) {
    return RAIZ + caminho;
  }

  // ---------- notificacoes do sininho (compartilhado/notificacoes.js) ----------
  window.FluxNotificacoesDinamicas = window.FluxNotificacoesDinamicas || {};
  window.FluxNotificacoesDinamicas.paciente = function () {
    var lista = [];
    var telaConsultas = url("Consultas/index.html");
    var telaExames = url("tela_principal_paciente/tela_meus_exames/index.html");

    proximas().forEach(function (c) {
      var faltam = diasAte(c.data);
      if (faltam <= 3) {
        lista.push({ id: "pac-lembrete-" + c.id + "-" + c.data, tipo: "agendamento", titulo: "Lembrete de consulta", urgente: faltam <= 1,
          texto: "Sua consulta com " + c.medico + " (" + c.especialidade + ") é " + quando(c.data) + ", " + formatarData(c.data) + " às " + c.hora + ".",
          minutos: 12, link: telaConsultas, acao: "Ver consulta" });
      } else if (c.status === "pendente") {
        lista.push({ id: "pac-pendente-" + c.id, tipo: "alerta", titulo: "Consulta aguardando confirmação",
          texto: "A clínica ainda vai confirmar sua consulta com " + c.medico + " em " + formatarData(c.data) + " às " + c.hora + ".",
          minutos: 95, link: telaConsultas, acao: "Ver consulta" });
      }
    });

    examesPendentes().forEach(function (x) {
      if (diasAte(x.data) <= 3 && x.preparo) {
        lista.push({ id: "pac-preparo-" + x.id + "-" + x.data, tipo: "alerta", titulo: "Preparo para o exame",
          texto: x.titulo + " " + quando(x.data) + " às " + x.hora + ". " + x.preparo.principal,
          minutos: 40, link: telaExames + "?aba=pendentes", acao: "Ver preparo" });
      }
    });

    laudos().slice(0, 2).forEach(function (x, i) {
      lista.push({ id: "pac-laudo-" + x.id, tipo: "laudo", titulo: "Laudo disponível",
        texto: "O resultado de " + x.titulo + " já pode ser baixado.", minutos: 300 + i * 600, lida: i > 0,
        link: telaExames, acao: "Ver laudo" });
    });

    lista.push({ id: "pac-cadastro", tipo: "checkin", titulo: "Cadastro completo",
      texto: "Seus dados cadastrais estão atualizados. Obrigado por manter tudo em dia.", minutos: 1500, lida: true });
    return lista;
  };

  // nome e iniciais do paciente no menu lateral e onde mais houver data-paciente="..."
  function preencherNome() {
    var p = perfil();
    var valores = { "nome": p.nome, "nome-curto": p.nomeCurto, "iniciais": p.iniciais, "email": p.email };
    document.querySelectorAll("[data-paciente]").forEach(function (el) {
      if (valores[el.dataset.paciente] != null) el.textContent = valores[el.dataset.paciente];
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preencherNome);
  else preencherNome();

  window.Paciente = {
    perfil: perfil,
    consultas: consultas,
    proximas: proximas,
    realizadas: realizadas,
    canceladas: canceladas,
    obterConsulta: obterConsulta,
    agendarConsulta: agendarConsulta,
    reagendarConsulta: reagendarConsulta,
    cancelarConsulta: cancelarConsulta,
    conflito: conflito,
    exames: exames,
    examesPendentes: examesPendentes,
    laudos: laudos,
    serieMeses: serieMeses,
    serieSemanas: serieSemanas,
    horarios: function () { return horarios.slice(); },
    hoje: hoje,
    somarDias: somarDias,
    iso: iso,
    lerISO: lerISO,
    diasAte: diasAte,
    quando: quando,
    formatarData: formatarData,
    dataLonga: dataLonga,
    dataExtenso: dataExtenso,
    diasSemana: diasSemana,
    meses: meses,
    mesesCurtos: mesesCurtos,
    escapar: escapar,
    iniciais: iniciais,
    url: url
  };
})();
