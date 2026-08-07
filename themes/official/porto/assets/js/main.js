(function () {
  "use strict";

  const DEMO = {
    tenant: {
      name: "Porto & Lar",
      phone: "(11) 3456-7890",
      logo_url: "",
    },
    properties: [
      {
        id: "1",
        title: "Apartamento luminoso em Pinheiros",
        price: "R$ 4.200/mês",
        city: "São Paulo",
        neighborhood: "Pinheiros",
        bedrooms: 2,
        operation: "rent",
        image:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      },
      {
        id: "2",
        title: "Cobertura com terraço e vista",
        price: "R$ 1.850.000",
        city: "São Paulo",
        neighborhood: "Itaim Bibi",
        bedrooms: 3,
        operation: "sale",
        image:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      },
      {
        id: "3",
        title: "Studio mobiliado perto do metrô",
        price: "R$ 2.900/mês",
        city: "São Paulo",
        neighborhood: "Vila Madalena",
        bedrooms: 1,
        operation: "rent",
        image:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      },
    ],
  };

  function needsDemo(el) {
    return el && /\{\{/.test(el.textContent || "");
  }

  function fillTenant() {
    document.querySelectorAll("[data-bind='tenant.name']").forEach((el) => {
      if (needsDemo(el) || !el.textContent.trim()) el.textContent = DEMO.tenant.name;
    });
    document.querySelectorAll("[data-bind='tenant.phone']").forEach((el) => {
      if (needsDemo(el) || !el.textContent.trim()) {
        el.textContent = DEMO.tenant.phone;
        if (el.tagName === "A") el.href = "tel:+551134567890";
      }
    });
  }

  function opLabel(op) {
    return op === "sale" ? "Comprar" : "Alugar";
  }

  function cardHtml(p) {
    return `
      <article class="property-card">
        <a href="property.html">
          <div class="property-card__media">
            <img src="${p.image}" alt="${p.title}" loading="lazy" width="640" height="480" />
            <span class="badge badge--${p.operation}">${opLabel(p.operation)}</span>
          </div>
          <div class="property-card__body">
            <p class="property-card__price">${p.price}</p>
            <h3 class="property-card__title">${p.title}</h3>
            <p class="property-card__meta">${p.neighborhood}, ${p.city} · ${p.bedrooms} quarto(s)</p>
          </div>
        </a>
      </article>`;
  }

  function fillPropertyGrids() {
    document.querySelectorAll("[data-demo-properties]").forEach((grid) => {
      if (grid.children.length && !/\{\{/.test(grid.innerHTML)) return;
      grid.innerHTML = DEMO.properties.map(cardHtml).join("");
    });
  }

  function initNav() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const mobile = document.querySelector("[data-nav-mobile]");
    if (!toggle || !mobile) return;
    toggle.addEventListener("click", () => {
      const open = mobile.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function initSlots() {
    const box = document.querySelector("[data-slots]");
    if (!box) return;
    if (!box.children.length || /\{\{/.test(box.innerHTML)) {
      const hours = ["09:00", "10:30", "14:00", "15:30", "17:00"];
      box.innerHTML = hours
        .map((h) => `<button type="button" class="slot" data-slot="${h}">${h}</button>`)
        .join("");
    }
    let selected = null;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".slot");
      if (!btn || btn.disabled) return;
      box.querySelectorAll(".slot").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      selected = btn.dataset.slot;
      const hidden = document.querySelector("[name='slot']");
      if (hidden) hidden.value = selected;
    });
  }

  function initScheduleForm() {
    const form = document.querySelector("[data-visit-form]");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const slotEl = form.querySelector("[name='slot']");
      const slot = slotEl?.value;
      const privacy = form.querySelector("[name='acceptPrivacy']");
      if (!slot) {
        alert("Selecione um horário disponível.");
        return;
      }
      if (privacy && !privacy.checked) {
        alert("Aceite a Política de Privacidade para continuar.");
        return;
      }
      const action = form.getAttribute("action") || "";
      if (action.includes("{{")) {
        alert("Solicitação registrada (demo). O corretor receberá o aviso no WhatsApp.");
        form.reset();
        document.querySelectorAll(".slot.is-selected").forEach((b) => b.classList.remove("is-selected"));
        return;
      }
      const body = {
        propertyId: form.querySelector("[name='propertyId']")?.value,
        visitorName: form.querySelector("[name='name']")?.value,
        visitorPhone: form.querySelector("[name='phone']")?.value,
        visitorEmail: form.querySelector("[name='email']")?.value,
        startAt: slotEl.getAttribute("data-start") || slot,
        acceptPrivacy: true
      };
      try {
        const r = await fetch(action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body)
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || "Falha ao agendar");
        alert("Visita solicitada! O corretor confirma em breve.");
        form.reset();
        document.querySelectorAll(".slot.is-selected").forEach((b) => b.classList.remove("is-selected"));
      } catch (err) {
        alert(err.message || "Não foi possível enviar o agendamento.");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fillTenant();
    fillPropertyGrids();
    initNav();
    initSlots();
    initScheduleForm();
    if (document.querySelector(".sticky-cta-mobile")) {
      document.body.classList.add("has-sticky-cta");
    }
  });
})();
