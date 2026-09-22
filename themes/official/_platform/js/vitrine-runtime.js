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
      ".vitrine-empty{margin:1rem 0;color:#64748b}";
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

  function offerPropertyPicker() {
    if (propertyId()) return;
    if ((cfg.page || "") !== "schedule") return;
    var host = document.querySelector(".schedule-wrap, .schedule-layout, main, .container");
    if (!host || host.querySelector("[data-vitrine-picker]")) return;
    fetch(cfg.apiBase + "/public/properties?tenantSlug=" + encodeURIComponent(cfg.tenantSlug || ""), {
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .then(function (data) {
        var items = data.items || data.Items || [];
        var box = document.createElement("div");
        box.setAttribute("data-vitrine-picker", "1");
        box.innerHTML = "<p><strong>Escolha o imóvel para visitar</strong></p>";
        if (!items.length) {
          box.innerHTML += "<p>Nenhum imóvel publicado nesta vitrine.</p>";
        } else {
          var list = document.createElement("ul");
          items.forEach(function (item) {
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = "schedule.html?id=" + encodeURIComponent(item.id);
            a.textContent = item.title + " — " + (item.neighborhood || "") + ", " + (item.city || "");
            li.appendChild(a);
            list.appendChild(li);
          });
          box.appendChild(list);
        }
        host.insertBefore(box, host.firstChild);
      })
      .catch(function () { /* sem picker se a API falhar */ });
  }

  function interceptVisitSubmit() {
    var form = document.getElementById("visit-form") || document.querySelector("[data-visit-form]");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var id = propertyId() || (form.querySelector("[name='propertyId']") || {}).value;
      var hidden = document.getElementById("slot-selecionado") || form.querySelector("[name='slot']");
      var startAt = hidden && (hidden.getAttribute("data-start") || hidden.value);
      var status = form.querySelector(".form-status");
      function fail(msg) {
        if (status) { status.hidden = false; status.textContent = msg; }
        else alert(msg);
      }
      if (!id || String(id).indexOf("{{") !== -1) return fail("Escolha um imóvel na vitrine para agendar a visita.");
      if (!startAt || String(startAt).indexOf("{{") !== -1) return fail("Escolha um horário disponível.");
      var privacy = form.querySelector("[name='acceptPrivacy']");
      if (privacy && !privacy.checked) return fail("Aceite a Política de Privacidade para continuar.");
      var body = {
        propertyId: id,
        visitorName: (form.querySelector("[name='nome'], [name='name']") || {}).value,
        visitorPhone: (form.querySelector("[name='telefone'], [name='phone']") || {}).value,
        visitorEmail: (form.querySelector("[name='email']") || {}).value,
        startAt: startAt,
        acceptPrivacy: true
      };
      if (status) { status.hidden = false; status.textContent = "Enviando…"; }
      fetch(cfg.apiBase + "/public/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data && data.message) || "Falha ao agendar");
          var ok = "Visita solicitada! O corretor confirma em breve.";
          if (status) status.textContent = ok;
          else alert(ok);
        });
      }).catch(function (err) {
        fail(err.message || "Não foi possível enviar o agendamento.");
      });
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

  ready(function () {
    injectStyles();
    fillSearchFromQuery();
    hydratePropertyBinds();
    rewriteScheduleLinks();
    wireFavorites();
    offerPropertyPicker();
    initRealSlots();
    interceptVisitSubmit();
    markFavorited();
  });
})();
