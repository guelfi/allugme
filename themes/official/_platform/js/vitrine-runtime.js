(function () {
  "use strict";

  var cfg = window.ALLUGME_VITRINE || {};
  if (!cfg.apiBase) return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function propertyId() {
    return cfg.propertyId || qs("id") || qs("propertyId") || "";
  }

  function favoriteUrl(id) {
    var dash = (cfg.dashboardUrl || "").replace(/\/$/, "");
    var returnUrl = window.location.href;
    return dash + "/portal/register?propertyId=" + encodeURIComponent(id) +
      "&returnUrl=" + encodeURIComponent(returnUrl);
  }

  function injectStyles() {
    if (document.getElementById("am-vitrine-style")) return;
    var style = document.createElement("style");
    style.id = "am-vitrine-style";
    style.textContent =
      ".am-fav{position:absolute;top:.6rem;right:.6rem;z-index:3;width:42px;height:42px;border:0;border-radius:999px;background:#fff;box-shadow:0 1px 6px rgba(15,23,42,.18);cursor:pointer;font-size:1.1rem;line-height:1}" +
      ".am-fav[aria-pressed='true']{background:#fff1f2;color:#be123c}" +
      "[data-property-id],.card-imovel,.property-card{position:relative}" +
      ".am-fav--panel{position:static;width:100%;height:auto;border-radius:10px;padding:.75rem 1rem;margin:.75rem 0;box-shadow:none;border:1px solid rgba(15,23,42,.12)}" +
      ".vitrine-empty{margin:1rem 0;color:#64748b}" +
      ".vitrine-picker{position:relative;z-index:1;padding:1rem 0;border-bottom:1px solid rgba(15,23,42,.1);background:inherit}" +
      ".vitrine-picker .container{width:min(100% - 2rem,1100px);margin-inline:auto}" +
      ".vitrine-picker ul{margin:.5rem 0 0;padding-left:1.2rem}" +
      ".vitrine-picker li{margin:.4rem 0}" +
      ".vitrine-picker a{text-decoration:underline}" +
      "[data-slots][hidden],#slots[hidden],[data-visit-form][hidden],#visit-form[hidden],.schedule-form[hidden]{display:none!important}";
    document.head.appendChild(style);
  }

  function addFavoriteButton(host, id, variant) {
    if (!id || host.querySelector(".am-fav")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = variant === "panel" ? "am-fav am-fav--panel" : "am-fav";
    btn.setAttribute("aria-label", "Favoritar imóvel");
    btn.textContent = variant === "panel" ? "♡ Salvar nos favoritos" : "♡";
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      window.location.href = favoriteUrl(id);
    });
    host.appendChild(btn);
  }

  function wireFavorites() {
    document.querySelectorAll("[data-property-id]").forEach(function (el) {
      addFavoriteButton(el, el.getAttribute("data-property-id"));
    });

    var page = cfg.page || document.body.getAttribute("data-page") || "";
    var id = propertyId();
    if ((page === "property" || document.body.getAttribute("data-page") === "property") && id) {
      var panel = document.querySelector(".price-panel, .property-detail__aside, .sticky-cta, .sticky-cta-mobile") || document.querySelector("main, .container");
      if (panel) addFavoriteButton(panel, id, "panel");
    }
  }

  function rewriteScheduleLinks() {
    var id = propertyId();
    if (!id) return;
    document.querySelectorAll('a[href*="schedule.html"]').forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("id=") !== -1) return;
      a.setAttribute("href", href.indexOf("?") === -1 ? href + "?id=" + id : href + "&id=" + id);
    });
  }

  function fillSearchFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var aliases = {
      city: ["city", "cidade"],
      neighborhood: ["neighborhood", "bairro"],
      operation: ["operation", "operacao"],
      bedrooms: ["bedrooms", "quartos"],
      price: ["price", "maxPrice", "valor_max"]
    };
    Object.keys(aliases).forEach(function (canonical) {
      var value = null;
      aliases[canonical].forEach(function (key) {
        if (value == null && params.get(key)) value = params.get(key);
      });
      if (value == null) return;
      aliases[canonical].forEach(function (name) {
        document.querySelectorAll("[name='" + name + "']").forEach(function (el) {
          if (el.type === "radio") {
            el.checked = el.value === value ||
              (value === "rent" && el.value === "alugar") ||
              (value === "sale" && el.value === "comprar") ||
              (value === "alugar" && el.value === "rent") ||
              (value === "comprar" && el.value === "sale");
          } else {
            el.value = value;
          }
        });
      });
    });
  }

  function hydratePropertyBinds() {
    var p = cfg.property;
    if (!p) return;
    document.querySelectorAll("[data-bind='property.images']").forEach(function (el) {
      if (el.tagName === "IMG" && p.imageUrl) el.setAttribute("src", p.imageUrl);
    });
    if (p.title) {
      document.querySelectorAll("h1").forEach(function (el) {
        if (el.textContent.indexOf("{{") !== -1 || !el.textContent.trim()) el.textContent = p.title;
      });
    }
  }

  function isoToDayTime(iso) {
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");
    return { date: y + "-" + m + "-" + day, time: hh + ":" + mm, startAt: iso };
  }

  function groupSlots(slots) {
    var days = [];
    var index = {};
    (slots || []).forEach(function (slot) {
      var parsed = isoToDayTime(slot.startAt || slot.start || slot);
      if (!parsed) return;
      if (!index[parsed.date]) {
        index[parsed.date] = { date: parsed.date, times: [] };
        days.push(index[parsed.date]);
      }
      index[parsed.date].times.push({ label: parsed.time, startAt: slot.startAt || parsed.startAt });
    });
    return days;
  }

  function nextDates(count) {
    var out = [];
    var d = new Date();
    while (out.length < count) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  function setHiddenSlot(startAt, label) {
    var hidden = document.getElementById("slot-selecionado") || document.querySelector("[name='slot']");
    if (!hidden) return;
    hidden.value = label || startAt;
    hidden.setAttribute("data-start", startAt);
  }

  function renderModernoSlots(root, days) {
    var daysEl = root.querySelector(".slots__days");
    var timesEl = root.querySelector(".slots__times");
    var status = document.getElementById("slots-status");
    if (!daysEl || !timesEl) return false;
    daysEl.innerHTML = "";
    timesEl.innerHTML = "";
    if (!days.length) {
      if (status) status.textContent = "Nenhum horário disponível nos próximos dias.";
      return true;
    }
    function showTimes(day) {
      timesEl.innerHTML = "";
      day.times.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "slot-time";
        b.textContent = t.label;
        b.addEventListener("click", function () {
          timesEl.querySelectorAll(".slot-time").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          setHiddenSlot(t.startAt, day.date + " " + t.label);
          if (status) status.textContent = "Horário escolhido: " + t.label + ".";
        });
        timesEl.appendChild(b);
      });
    }
    days.forEach(function (day, i) {
      var d = new Date(day.date + "T12:00:00");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-day";
      btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      btn.innerHTML = "<small>" + d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") +
        "</small><strong>" + d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + "</strong>";
      btn.addEventListener("click", function () {
        daysEl.querySelectorAll(".slot-day").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        showTimes(day);
      });
      daysEl.appendChild(btn);
    });
    showTimes(days[0]);
    return true;
  }

  function renderSimpleSlots(box, days) {
    if (!box) return;
    var hours = [];
    days.forEach(function (day) {
      day.times.forEach(function (t) {
        hours.push({ label: t.label, startAt: t.startAt });
      });
    });
    box.innerHTML = "";
    hours.forEach(function (h) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = h.label;
      b.setAttribute("data-slot", h.startAt);
      b.addEventListener("click", function () {
        box.querySelectorAll(".slot").forEach(function (x) { x.classList.remove("is-selected"); });
        b.classList.add("is-selected");
        setHiddenSlot(h.startAt, h.label);
      });
      box.appendChild(b);
    });
  }

  function loadSlotsForDate(date, done) {
    var id = propertyId();
    if (!id) { done([]); return; }
    var url = cfg.apiBase + "/public/properties/" + id + "/visit-slots?date=" + encodeURIComponent(date);
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : { slots: [] }; })
      .then(function (data) { done(data.slots || data || []); })
      .catch(function () { done([]); });
  }

  function initRealSlots() {
    var id = propertyId();
    if (!id) return;
    var dates = nextDates(5);
    var collected = [];
    var pending = dates.length;
    dates.forEach(function (date) {
      loadSlotsForDate(date, function (slots) {
        collected = collected.concat(slots);
        pending -= 1;
        if (pending > 0) return;
        var days = groupSlots(collected);
        var moderno = document.getElementById("slots");
        if (!renderModernoSlots(moderno || { querySelector: function () { return null; } }, days)) {
          renderSimpleSlots(document.querySelector("[data-slots]"), days);
        }
      });
    });

    var dateInput = document.getElementById("visit-date");
    if (dateInput) {
      dateInput.addEventListener("change", function () {
        if (!dateInput.value) return;
        loadSlotsForDate(dateInput.value, function (slots) {
          renderSimpleSlots(document.querySelector("[data-slots]"), groupSlots(slots));
        });
      });
    }
  }

  function isSchedulePage() {
    return (cfg.page || document.body.getAttribute("data-page") || "") === "schedule";
  }

  function gateScheduleWithoutProperty() {
    if (!isSchedulePage() || propertyId()) return;
    document.querySelectorAll("[data-schedule-property]").forEach(function (el) {
      el.innerHTML = "<strong>Imóvel:</strong> escolha um da lista acima.";
    });
    document.querySelectorAll("[data-visit-form], #visit-form, .schedule-form").forEach(function (form) {
      form.setAttribute("hidden", "");
      if (form.parentNode && !form.parentNode.querySelector("[data-schedule-wait]")) {
        var note = document.createElement("p");
        note.setAttribute("data-schedule-wait", "1");
        note.className = "vitrine-empty";
        note.textContent = "Depois de escolher o imóvel, você poderá selecionar o horário e enviar o pedido.";
        form.parentNode.insertBefore(note, form);
      }
    });
    document.querySelectorAll("[data-slots], #slots").forEach(function (el) {
      el.setAttribute("hidden", "");
      el.style.display = "none";
      el.innerHTML = "";
    });
  }

  function offerPropertyPicker() {
    if (!isSchedulePage()) return;
    if (propertyId()) return;
    if (document.querySelector("[data-vitrine-picker]")) return;

    var box = document.createElement("section");
    box.setAttribute("data-vitrine-picker", "1");
    box.className = "vitrine-picker";
    box.setAttribute("aria-label", "Escolher imóvel para visitar");
    box.innerHTML = "<div class=\"container\"><p><strong>Escolha o imóvel para visitar</strong></p><p class=\"vitrine-empty\">Selecione um imóvel da carteira. A agenda não sugere um imóvel por conta própria.</p></div>";

    var header = document.querySelector("header.site-header, header");
    if (header && header.parentNode) {
      header.insertAdjacentElement("afterend", box);
    } else {
      var main = document.querySelector(".schedule-wrap, .schedule-layout, main");
      if (!main) return;
      main.insertBefore(box, main.firstChild);
    }

    var inner = box.querySelector(".container") || box;
    fetch(cfg.apiBase + "/public/properties?tenantSlug=" + encodeURIComponent(cfg.tenantSlug || ""), {
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .then(function (data) {
        var items = data.items || data.Items || [];
        if (!items.length) {
          inner.innerHTML += "<p class=\"vitrine-empty\">Nenhum imóvel publicado nesta vitrine.</p>";
          return;
        }
        var list = document.createElement("ul");
        items.forEach(function (item) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "schedule.html?id=" + encodeURIComponent(item.id || item.Id);
          a.textContent = (item.title || item.Title || "Imóvel") + " — " +
            (item.neighborhood || item.Neighborhood || "") + ", " + (item.city || item.City || "");
          li.appendChild(a);
          list.appendChild(li);
        });
        inner.appendChild(list);
      })
      .catch(function () {
        inner.innerHTML += "<p class=\"vitrine-empty\">Não foi possível carregar a carteira agora.</p>";
      });
  }

  function visitLoginUrl(id) {
    var dash = (cfg.dashboardUrl || "").replace(/\/$/, "");
    var next = dash + "/portal/agendar?propertyId=" + encodeURIComponent(id);
    return dash + "/login?returnUrl=" + encodeURIComponent(next);
  }

  function visitRegisterUrl(id) {
    var dash = (cfg.dashboardUrl || "").replace(/\/$/, "");
    var next = dash + "/portal/agendar?propertyId=" + encodeURIComponent(id);
    return dash + "/portal/register?returnUrl=" + encodeURIComponent(next);
  }

  function replaceScheduleFormWithAuthCta() {
    if (!isSchedulePage() || !propertyId()) return;
    var form = document.getElementById("visit-form") || document.querySelector("[data-visit-form]");
    if (!form || form.parentNode.querySelector("[data-schedule-auth]")) return;
    form.setAttribute("hidden", "");
    form.style.display = "none";
    document.querySelectorAll("[data-slots], #slots").forEach(function (el) {
      el.setAttribute("hidden", "");
      el.style.display = "none";
    });
    var box = document.createElement("div");
    box.setAttribute("data-schedule-auth", "1");
    box.innerHTML =
      "<p><strong>Para agendar você precisa de uma conta de cliente.</strong></p>" +
      "<p class=\"vitrine-empty\">Entre se já for cliente, ou cadastre-se. Depois você escolhe o horário no portal.</p>" +
      "<p><a class=\"btn btn--primary btn-primary\" href=\"" + visitLoginUrl(propertyId()) + "\">Entrar para agendar</a> " +
      "<a class=\"btn btn--outline btn-secondary\" href=\"" + visitRegisterUrl(propertyId()) + "\">Cadastrar</a></p>";
    form.parentNode.insertBefore(box, form);
  }

  function interceptVisitSubmit() {
    replaceScheduleFormWithAuthCta();
    var form = document.getElementById("visit-form") || document.querySelector("[data-visit-form]");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var id = propertyId() || (form.querySelector("[name='propertyId']") || {}).value;
      if (!id || String(id).indexOf("{{") !== -1) return;
      window.location.href = visitLoginUrl(id);
    }, true);
  }

  function markFavorited() {
    var id = qs("favorited");
    if (!id) return;
    document.querySelectorAll(".am-fav").forEach(function (btn) {
      var host = btn.closest("[data-property-id]");
      if (!host || host.getAttribute("data-property-id") === id || propertyId() === id) {
        btn.setAttribute("aria-pressed", "true");
        btn.textContent = btn.classList.contains("am-fav--panel") ? "♥ Salvo nos favoritos" : "♥";
      }
    });
  }

  function markCurrentNav() {
    var page = cfg.page || document.body.getAttribute("data-page") || "";
    var op = (qs("operation") || qs("operacao") || "").toLowerCase();
    document.querySelectorAll(".nav a, .nav--mobile a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var nav = a.getAttribute("data-nav") || "";
      var current = false;
      if (nav === "rent" || /[?&]operation=rent\b/.test(href)) {
        current = page === "listing" && (op === "rent" || op === "alugar");
      } else if (nav === "sale" || /[?&]operation=sale\b/.test(href)) {
        current = page === "listing" && (op === "sale" || op === "comprar");
      } else if (nav === "schedule" || /schedule\.html/.test(href)) {
        current = page === "schedule";
      } else if (nav === "listing" || /listing\.html/.test(href)) {
        current = page === "listing" && !op;
      } else if (nav === "home" || /home\.html/.test(href)) {
        current = page === "home";
      }
      if (current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  ready(function () {
    injectStyles();
    fillSearchFromQuery();
    hydratePropertyBinds();
    rewriteScheduleLinks();
    markCurrentNav();
    wireFavorites();
    offerPropertyPicker();
    gateScheduleWithoutProperty();
    initRealSlots();
    interceptVisitSubmit();
    markFavorited();
  });
})();
