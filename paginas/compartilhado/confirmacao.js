// Confirmacao de sucesso: janela no meio da tela com o icone verde, que some sozinha
// depois de alguns segundos (ou ao clicar). Usada pelas telas do paciente, do profissional e da recepcao.
//   FluxConfirmacao.sucesso("Consulta cancelada com sucesso", "Texto opcional", function aoFechar() {})
// O visual vem junto neste arquivo (variavel "estilos"), entao funciona em qualquer tela
// que tenha as classes de modal (.modal-overlay e .modal-caixa).

(function () {
  var TEMPO = 2400;

  var estilos = `
    .overlay-sucesso {
      z-index: 3200;
      cursor: pointer;
    }

    .overlay-sucesso .modal-caixa.modal-sucesso {
      width: 100%;
      max-width: 420px;
      padding: 44px 34px 38px;
      border-radius: 20px;
      text-align: center;
      font-family: "Inter", sans-serif;
    }

    .overlay-sucesso.visivel .modal-sucesso {
      animation: sucessoEntrar 0.28s ease both;
    }

    @keyframes sucessoEntrar {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: none; }
    }

    /* circulo verde com o check, que e desenhado ao aparecer */
    .overlay-sucesso .modal-check-sucesso {
      width: 74px;
      height: 74px;
      margin: 0 auto 22px;
      border: 2.5px solid #b2e5d5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0fdf8;
      color: #0f6e56;
    }

    .overlay-sucesso.visivel .modal-check-sucesso {
      animation: sucessoCirculo 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
    }

    .overlay-sucesso .modal-check-sucesso polyline {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
    }

    .overlay-sucesso.visivel .modal-check-sucesso polyline {
      animation: sucessoCheck 0.4s ease 0.25s forwards;
    }

    @keyframes sucessoCirculo {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: none; opacity: 1; }
    }

    @keyframes sucessoCheck {
      to { stroke-dashoffset: 0; }
    }

    .overlay-sucesso .modal-sucesso .modal-titulo {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 10px;
      color: var(--rv-texto, #0f1923);
    }

    .overlay-sucesso .modal-sucesso .modal-sub {
      font-size: 15.5px;
      line-height: 1.5;
      margin: 0;
      color: var(--rv-texto-suave, #55606f);
    }

    html[data-tema="escuro"] .overlay-sucesso .modal-check-sucesso {
      background: #12301f;
      border-color: #2f6b4c;
      color: #86e0ac;
    }

    /* quem pediu menos animacao ve a confirmacao pronta, sem movimento */
    @media (prefers-reduced-motion: reduce) {
      .overlay-sucesso.visivel .modal-sucesso,
      .overlay-sucesso.visivel .modal-check-sucesso,
      .overlay-sucesso.visivel .modal-check-sucesso polyline {
        animation: none;
      }

      .modal-check-sucesso polyline {
        stroke-dashoffset: 0;
      }
    }
  `;
  var caixa = null;
  var timer = null;
  var aoFecharAtual = null;

  function fechar() {
    if (!caixa || !caixa.classList.contains("visivel")) return;
    clearTimeout(timer);
    caixa.classList.remove("visivel");
    var depois = aoFecharAtual;
    aoFecharAtual = null;
    if (depois) depois();
  }

  function sucesso(titulo, texto, aoFechar) {
    if (!caixa) {
      var estilo = document.createElement("style");
      estilo.textContent = estilos;
      document.head.appendChild(estilo);

      caixa = document.createElement("div");
      caixa.className = "modal-overlay overlay-sucesso";
      caixa.innerHTML =
        '<div class="modal-caixa modal-sucesso" role="alertdialog" aria-modal="true" aria-labelledby="fluxSucessoTitulo" aria-describedby="fluxSucessoTexto">' +
          '<div class="modal-check-sucesso" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7.5"/></svg></div>' +
          '<h2 class="modal-titulo" id="fluxSucessoTitulo"></h2>' +
          '<p class="modal-sub" id="fluxSucessoTexto"></p>' +
        "</div>";
      document.body.appendChild(caixa);
      caixa.addEventListener("click", fechar);
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" || ev.key === "Enter") fechar();
      });
    }
    clearTimeout(timer);
    caixa.querySelector(".modal-titulo").textContent = titulo;
    caixa.querySelector(".modal-sub").textContent = texto || "";
    caixa.querySelector(".modal-sub").hidden = !texto;
    aoFecharAtual = aoFechar || null;
    // tira e recoloca a classe para a animacao tocar de novo
    caixa.classList.remove("visivel");
    void caixa.offsetWidth;
    caixa.classList.add("visivel");
    timer = setTimeout(fechar, TEMPO);
  }

  window.FluxConfirmacao = { sucesso: sucesso, fechar: fechar };
})();
