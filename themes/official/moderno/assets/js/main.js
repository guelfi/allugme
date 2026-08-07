/* Tema "moderno" — JS vanilla leve.
   Sem framework: o backend injeta dados via placeholders {{...}} e
   substitui os marcadores <!-- partial:header --> / <!-- partial:footer -->.
   Este script só adiciona interação e fallback de preview. */
(function () {
  "use strict";

  var ICONS_REFRESH = function () {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };

  /* ------------------------------------------------------------------
     1) Preview local: se os marcadores de partial ainda estiverem no DOM
        (ou seja, o backend não substituiu), carrega o partial via fetch.
        Em produção o marcador some na renderização e isto é no-op.
     ------------------------------------------------------------------ */
  function injectPartials(done) {
    var markers = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    var node;
    while ((node = walker.nextNode())) {
      var m = node.nodeValue.match(/^\s*partial:(header|footer)\s*$/);
      if (m) markers.push({ comment: node, name: m[1] });
    }
    if (!markers.length) { done(); return; }

    var pending = markers.length;
    markers.forEach(function (marker) {
      // Se o backend já renderizou o partial ao lado do marcador, não duplica.
      if (marker.name === "header" && document.querySelector(".site-header")) return finish();
      if (marker.name === "footer" && document.querySelector(".site-footer")) return finish();

      fetch("../partials/" + marker.name + ".html", { credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (html) {
          if (html) {
            var tpl = document.createElement("template");
            tpl.innerHTML = html.trim();
            marker.comment.parentNode.insertBefore(tpl.content, marker.comment);
          }
        })
        .catch(function () { /* preview offline: segue sem partial */ })
        .then(finish);

      function finish() {
        pending -= 1;
        if (pending <= 0) done();
      }
    });
  }

  /* ------------------------------------------------------------------
     2) Reconciliação de preview: blocos data-preview-only existem só para
        demonstrar o layout. Se o placeholder correspondente foi substituído
        pelo backend (token não existe mais no HTML), eles são removidos.
     ------------------------------------------------------------------ */
  function reconcilePreviewBlocks() {
    var html = document.documentElement.innerHTML;
    document.querySelectorAll("[data-preview-only]").forEach(function (el) {
      var token = el.getAttribute("data-preview-for");
      if (token && html.indexOf(token) === -1) el.remove();
    });
  }

  /* ------------------------------------------------------------------
     3) Logo: se {{tenant.logo_url}} não foi substituído, esconde o <img>
        quebrado e mantém o nome textual do tenant.
     ------------------------------------------------------------------ */
  function fixPlaceholderImages() {
    document.querySelectorAll('img[src*="{{"]').forEach(function (img) {
      img.style.display = "none";
    });
  }

  /* ------------------------------------------------------------------
     4) Header: menu mobile + estado ativo do nav.
     ------------------------------------------------------------------ */
  function initHeader() {
    var page = document.body.getAttribute("data-page");
    if (page) {
      document.querySelectorAll(".site-nav [data-nav]").forEach(function (a) {
        if (a.getAttribute("data-nav") === page) a.setAttribute("aria-current", "page");
      });
    }
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      });
    }
  }

  /* ------------------------------------------------------------------
     5) Listing: drawer de filtros no mobile.
     ------------------------------------------------------------------ */
  function initFiltersDrawer() {
    var panel = document.getElementById("filters");
    var openBtn = document.querySelector(".filters-toggle");
    var overlay = document.querySelector(".filters-overlay");
    var closeBtn = document.querySelector(".filters__close");
    if (!panel || !openBtn || !overlay) return;

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      overlay.classList.toggle("is-open", open);
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) panel.querySelector("input, select, button") && panel.querySelector("input, select").focus();
    }
    openBtn.addEventListener("click", function () { setOpen(true); });
    overlay.addEventListener("click", function () { setOpen(false); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     6) Property: galeria com miniaturas.
     ------------------------------------------------------------------ */
  function initGallery() {
    var main = document.querySelector(".gallery__main img");
    if (!main) return;
    document.querySelectorAll(".gallery__thumbs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        if (!img) return;
        main.src = img.getAttribute("src");
        main.alt = img.getAttribute("alt") || main.alt;
        document.querySelectorAll(".gallery__thumbs button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     7) Schedule: slots de visita.
        - Endpoint real: GET {{visit.slots_endpoint}} deve responder
          [{ "date": "2026-08-05", "times": ["09:00", "10:30"] }, ...]
        - Em preview (placeholder não substituído ou fetch falhou),
          gera dias úteis de demonstração.
     ------------------------------------------------------------------ */
  function initSlots() {
    var root = document.getElementById("slots");
    if (!root) return;
    var daysEl = root.querySelector(".slots__days");
    var timesEl = root.querySelector(".slots__times");
    var hidden = document.getElementById("slot-selecionado");
    var status = document.getElementById("slots-status");

    function demoDays() {
      var out = [];
      var d = new Date();
      while (out.length < 6) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0) continue; // sem domingo
        out.push({
          date: d.toISOString().slice(0, 10),
          times: ["09:00", "10:30", "13:30", "15:00", "16:30", "18:00"]
        });
      }
      return out;
    }

    function render(days) {
      daysEl.innerHTML = "";
      timesEl.innerHTML = "";
      if (!days.length) {
        status.textContent = "Nenhum horário disponível nos próximos dias.";
        return;
      }
      days.forEach(function (day, i) {
        var d = new Date(day.date + "T12:00:00");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-day";
        btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        btn.innerHTML =
          "<small>" + d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") + "</small>" +
          "<strong>" + d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + "</strong>";
        btn.addEventListener("click", function () {
          daysEl.querySelectorAll(".slot-day").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          renderTimes(day);
        });
        daysEl.appendChild(btn);
      });
      renderTimes(days[0]);
    }

    function renderTimes(day) {
      timesEl.innerHTML = "";
      day.times.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "slot-time";
        b.textContent = t;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          timesEl.querySelectorAll(".slot-time").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          hidden.value = day.date + " " + t;
          status.textContent = "Horário escolhido: " +
            new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }) +
            " às " + t + ".";
        });
        timesEl.appendChild(b);
      });
    }

    var endpoint = root.getAttribute("data-endpoint") || "";
    if (endpoint.indexOf("{{") !== -1) {
      render(demoDays()); // preview: placeholder ainda não substituído
      return;
    }
    fetch(endpoint, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) { render(Array.isArray(data) && data.length ? data : demoDays()); })
      .catch(function () { render(demoDays()); });
  }

  /* ------------------------------------------------------------------
     8) Schedule: envio do formulário. Em preview (action ainda é o
        placeholder), simula confirmação sem sair da página.
     ------------------------------------------------------------------ */
  function initVisitForm() {
    var form = document.getElementById("visit-form");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var action = form.getAttribute("action") || "";
      var slot = document.getElementById("slot-selecionado");
      var status = form.querySelector(".form-status");
      var privacy = form.querySelector("[name=acceptPrivacy]");
      if (!slot || !slot.value) {
        status.textContent = "Escolha um dia e horário ao lado para concluir o agendamento.";
        status.hidden = false;
        return;
      }
      if (privacy && !privacy.checked) {
        status.textContent = "Aceite a Política de Privacidade para continuar.";
        status.hidden = false;
        return;
      }
      if (action.indexOf("{{") !== -1) {
        status.textContent = "Visita solicitada para " + slot.value +
          ". Em produção, estes dados seriam enviados ao corretor.";
        status.hidden = false;
        return;
      }
      var propertyId = (form.querySelector("[name=propertyId]") || {}).value;
      var startAt = slot.getAttribute("data-start") || slot.value;
      var body = {
        propertyId: propertyId,
        visitorName: (form.querySelector("[name=nome]") || {}).value,
        visitorPhone: (form.querySelector("[name=telefone]") || {}).value,
        visitorEmail: (form.querySelector("[name=email]") || {}).value,
        startAt: startAt,
        acceptPrivacy: true
      };
      status.textContent = "Enviando…";
      status.hidden = false;
      fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data && data.message) || "Falha ao agendar");
          status.textContent = "Visita solicitada! O corretor confirma em breve.";
        });
      }).catch(function (err) {
        status.textContent = err.message || "Não foi possível enviar o agendamento.";
      });
    });
  }

  /* ------------------------------------------------------------------ */
  function init() {
    reconcilePreviewBlocks();
    fixPlaceholderImages();
    initHeader();
    initFiltersDrawer();
    initGallery();
    initSlots();
    initVisitForm();
    ICONS_REFRESH();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { injectPartials(init); });
  } else {
    injectPartials(init);
  }
})();
