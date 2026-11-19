// Triagem do paciente (enfermeiro): sinais vitais, queixa, conferencia de alergias e
// classificacao de risco. Ao concluir, a triagem vai para o prontuario e o paciente fica
// "Triado" na agenda do medico (Enfermagem.salvarTriagem, em compartilhado/enfermagem_dados.js).
// Abra com ?id=<codigo do paciente>. Se ja houver triagem de hoje, ela vem preenchida para corrigir.

var PAGINA_FILA = "../tela_principal_enfermeiro/index.html";

var e = Profissional.escapar;
var idPaciente = new URLSearchParams(window.location.search).get("id") || "";
var item = null;      // horario do paciente na agenda de hoje
var paciente = null;

function el(id) {
  return document.getElementById(id);
}

function campos() {
  return document.querySelectorAll("[data-campo]");
}

function riscoEscolhido() {
  var marcado = document.querySelector('input[name="risco"]:checked');
  return marcado ? marcado.value : "";
}

// ---------- montagem ----------
function montarCabecalho() {
  el("tituloPagina").textContent = paciente.nome;
  el("txtIdadeSexo").textContent = paciente.idade + " anos · " + paciente.sexo;
  el("txtPlano").textContent = "Plano: " + paciente.convenio;
  el("txtProntuario").textContent = "#" + paciente.id;
  el("txtHoraConsulta").textContent = "Consulta às " + item.hora;
  document.title = paciente.nome + " - Triagem - FluxConnect Enfermagem";
}

function mostrarAlertas() {
  var alertas = [];
  if (paciente.alergias.length) alertas.push("Alergias: " + paciente.alergias.join(", "));
  if (paciente.condicoes.length) alertas.push("Condições: " + paciente.condicoes.join(", "));
  el("txtAlerta").textContent = alertas.join("  ·  ");
  el("faixaAlerta").hidden = !alertas.length;
}

function mostrarAlergias() {
  el("listaAlergias").innerHTML = paciente.alergias.map(function (a) {
    return '<span class="tag tag-alergia">' + e(a) + "</span>";
  }).join("") || '<span class="sem-tags">Nenhuma alergia registrada no cadastro.</span>';
}

function montarRiscos(marcado) {
  el("opcoesRisco").innerHTML = Profissional.riscos.map(function (r) {
    return '<label class="opcao-risco risco-' + r.id + '">' +
      '<input type="radio" name="risco" value="' + r.id + '"' + (r.id === marcado ? " checked" : "") + " />" +
      '<span class="risco-nome">' + r.nome + "</span>" +
      '<span class="risco-texto">' + r.texto + "</span></label>";
  }).join("");
}

function atualizarContadores() {
  document.querySelectorAll("[data-contador]").forEach(function (s) {
    var n = document.querySelector('[data-campo="' + s.dataset.contador + '"]').value.length;
    s.textContent = n + (n === 1 ? " caractere" : " caracteres");
  });
}

// ---------- validacao ----------
// lista o que falta; com "marcar" tambem pinta os campos e leva o cursor ao primeiro
function pendencias(marcar) {
  var faltam = [];
  var primeiro = null;

  document.querySelectorAll("[data-obrigatorio]").forEach(function (c) {
    var vazio = !c.value.trim();
    if (marcar) {
      (c.closest(".campo-vital > div") || c).classList.toggle("invalido", vazio);
      c.setAttribute("aria-invalid", vazio);
    }
    if (vazio) {
      faltam.push(c.dataset.campo);
      if (!primeiro) primeiro = c;
    }
  });

  if (!el("alergiasConferidas").checked) {
    faltam.push("alergias");
    if (!primeiro) primeiro = el("alergiasConferidas");
  }
  if (!riscoEscolhido()) {
    faltam.push("risco");
    if (marcar) el("opcoesRisco").classList.add("invalido");
    if (!primeiro) primeiro = document.querySelector('input[name="risco"]');
  }

  if (marcar && primeiro) {
    primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
    primeiro.focus({ preventScroll: true });
  }
  return faltam;
}

function atualizarRodape() {
  var faltam = pendencias(false).length;
  el("txtSalvo").textContent = faltam ? "Faltam " + faltam + (faltam === 1 ? " item obrigatório" : " itens obrigatórios") : "Tudo preenchido: pronto para concluir";
  el("salvoRodape").classList.toggle("salvo", !faltam);
}

function concluir() {
  if (pendencias(true).length) {
    RecepcaoUI.toast("Faltam informações", "Preencha os sinais vitais obrigatórios, a queixa, confira as alergias e classifique o risco.", "erro");
    return;
  }

  var dados = {};
  campos().forEach(function (c) { dados[c.dataset.campo] = c.value.trim(); });
  Enfermagem.salvarTriagem(idPaciente, {
    vitais: { pa: dados.pa, fc: dados.fc, temp: dados.temp, sat: dados.sat, glicemia: dados.glicemia, peso: dados.peso, altura: dados.altura },
    queixa: dados.queixa,
    observacoes: dados.observacoes,
    risco: riscoEscolhido()
  });

  el("btnConcluir").disabled = true;
  FluxConfirmacao.sucesso("Triagem concluída com sucesso", paciente.nome + " está pronto para o atendimento médico.",
    function () { window.location.href = PAGINA_FILA; });
}

document.addEventListener("DOMContentLoaded", function () {
  item = Enfermagem.fila().find(function (a) { return a.id === idPaciente; }) || null;
  paciente = item ? PacientesProfissional.obter(idPaciente) : null;

  // so da para triar quem esta aguardando ou ja foi triado (para corrigir)
  if (!paciente || (item.status !== "aguardando" && item.status !== "triado")) {
    el("formulario").hidden = true;
    el("barraFinal").hidden = true;
    el("avisoErro").hidden = false;
    if (paciente) {
      el("avisoErro").querySelector("strong").textContent = paciente.nome + " não está mais na fila de triagem";
      el("avisoErro").childNodes[2].textContent = " Situação atual: " + Profissional.rotulosStatus[item.status] + ".";
    }
    el("tituloPagina").textContent = "Triagem";
    el("subtituloPagina").textContent = "";
    document.querySelector(".chips-consulta").hidden = true;
    return;
  }

  montarCabecalho();
  mostrarAlertas();
  mostrarAlergias();

  // triagem de hoje ja feita: vem preenchida para corrigir
  var anterior = Enfermagem.triagemDeHoje(idPaciente);
  if (anterior) {
    var valores = Object.assign({}, anterior.vitais, { queixa: anterior.queixa, observacoes: anterior.observacoes });
    campos().forEach(function (c) { if (valores[c.dataset.campo]) c.value = valores[c.dataset.campo]; });
    el("alergiasConferidas").checked = true;
  }
  montarRiscos(anterior ? anterior.risco : "");
  atualizarContadores();
  atualizarRodape();

  campos().forEach(function (c) {
    c.addEventListener("input", function () {
      (c.closest(".campo-vital > div") || c).classList.remove("invalido");
      c.removeAttribute("aria-invalid");
      atualizarContadores();
      atualizarRodape();
    });
  });
  el("alergiasConferidas").addEventListener("change", atualizarRodape);
  el("opcoesRisco").addEventListener("change", function () {
    el("opcoesRisco").classList.remove("invalido");
    atualizarRodape();
  });

  // acrescentar alergia ao cadastro (nao da para remover por aqui)
  var novaAlergia = el("novaAlergia");
  function acrescentarAlergia() {
    var nome = novaAlergia.value.trim();
    if (!nome) return;
    var jaTem = paciente.alergias.some(function (a) { return a.toLowerCase() === nome.toLowerCase(); });
    if (!jaTem) PacientesProfissional.adicionarAlergia(idPaciente, nome);
    paciente = PacientesProfissional.obter(idPaciente);
    novaAlergia.value = "";
    el("btnAdicionarAlergia").disabled = true;
    mostrarAlergias();
    mostrarAlertas();
  }
  novaAlergia.addEventListener("input", function () { el("btnAdicionarAlergia").disabled = !novaAlergia.value.trim(); });
  novaAlergia.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") { ev.preventDefault(); acrescentarAlergia(); }
  });
  el("btnAdicionarAlergia").addEventListener("click", acrescentarAlergia);

  el("btnHistorico").addEventListener("click", function () { ProntuarioModal.abrir(idPaciente); });
  el("btnConcluir").addEventListener("click", concluir);
});
