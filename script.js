/**
 * CONFIGURAÇÃO CENTRAL DE LINKS DE CHECKOUT (GGCHECKOUT)
 */
const CHECKOUT_LINKS = {
  // Plano Completo Principal (R$ 27,90)
  planoCompleto2790: "https://ggcheckout.app/checkout/v5/sYUgTeJpQPzVGdGLdMW7Gh",

  // Oferta Especial de Upgrade no Pop-up (Do Básico pelo Completo por R$ 19,90)
  upgradeEspecial1990: "https://ggcheckout.app/checkout/v5/XDHTStF3u8Ln0MGe48Sz7o",

  // Plano Básico Sem Bônus (R$ 14,90 - quando a cliente recusa o upgrade no pop-up)
  planoBasico1490: "https://ggcheckout.app/checkout/v5/94F1qukZMUYALnoUw3zpzX"
};

function appendTrackingParams(url) {
  const query = window.location.search;
  if (!query) return url;
  const separator = url.includes("?") ? "&" : "?";
  return url + separator + query.substring(1);
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Data dinâmica na barra de urgência do topo
  const dateEl = document.getElementById("dynamic-today-date");
  if (dateEl) {
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const hoje = new Date();
    dateEl.textContent = `HOJE (${hoje.getDate()} de ${meses[hoje.getMonth()]})`;
  }

  // 2. Scroll Reveal com IntersectionObserver
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  // 3. Carrosséis rodam via GPU CSS @keyframes (zero uso de CPU JavaScript no celular)

  // 4. FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const answer = item.querySelector(".faq-answer");
    if (!trigger || !answer) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faqItems.forEach((other) => {
        other.classList.remove("open");
        const otherAns = other.querySelector(".faq-answer");
        if (otherAns) otherAns.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // 5. Pop-up de Upgrade (Quando clica no Plano Básico de R$ 14,90 -> Oferta Completo por R$ 19,90)
  const modal = document.getElementById("upgrade-modal");
  const openModalBtns = document.querySelectorAll("[data-open-upgrade-modal]");
  const closeModalBtn = document.getElementById("close-upgrade-modal");
  const acceptUpgradeBtn = document.getElementById("btn-accept-upgrade");
  const declineUpgradeBtn = document.getElementById("btn-decline-upgrade");
  const directPremiumBtns = document.querySelectorAll("[data-checkout-completo]");

  let countdownInterval = null;

  function startModalTimer() {
    const timerEl = document.getElementById("modal-timer");
    if (!timerEl) return;
    let remaining = 4 * 60 + 59; // 04:59
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        timerEl.textContent = "00:00";
        return;
      }
      remaining--;
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function warmUpCheckoutUrl(url) {
    if (!url || document.querySelector(`link[data-prefetch="${url}"]`)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";
    link.setAttribute("data-prefetch", url);
    document.head.appendChild(link);
  }

  function openUpgradeModal(e) {
    if (e) e.preventDefault();
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    startModalTimer();
    // Pré-aquece os 2 checkouts do modal assim que ele abre
    if (acceptUpgradeBtn) warmUpCheckoutUrl(acceptUpgradeBtn.href);
    if (declineUpgradeBtn) warmUpCheckoutUrl(declineUpgradeBtn.href);
  }

  function closeUpgradeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    clearInterval(countdownInterval);
  }

  openModalBtns.forEach((btn) => {
    btn.addEventListener("click", openUpgradeModal);
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeUpgradeModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUpgradeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
      closeUpgradeModal();
    }
  });

  // Pré-aquecimento no toque/hover + Feedback visual instantâneo no clique
  const allCheckoutBtns = [
    ...directPremiumBtns,
    ...(acceptUpgradeBtn ? [acceptUpgradeBtn] : []),
    ...(declineUpgradeBtn ? [declineUpgradeBtn] : [])
  ];

  allCheckoutBtns.forEach((btn) => {
    // Caso não esteja usando Utmify na URL local, preserva query string sem sobrescrever o que a Utmify já injetou
    if (window.location.search && !btn.getAttribute("href").includes("?")) {
      btn.setAttribute("href", appendTrackingParams(btn.getAttribute("href")));
    }

    // Ao encostar o dedo (mobile) ou passar o mouse (PC), já pré-carrega a página de destino
    ["mouseenter", "touchstart"].forEach((evt) => {
      btn.addEventListener(evt, () => warmUpCheckoutUrl(btn.href), { passive: true, once: true });
    });

    // Feedback visual imediato no milissegundo do clique
    btn.addEventListener("click", () => {
      const span = btn.querySelector("span");
      if (span) {
        span.textContent = "⏳ ABRINDO CHECKOUT SEGURO...";
      } else {
        btn.textContent = "⏳ Abrindo checkout...";
      }
      btn.style.opacity = "0.92";
    });
  });

  // 6. Barra Flutuante Inferior após rolar a dobra principal
  const stickyBar = document.getElementById("sticky-cta-bar");
  const pricingSection = document.getElementById("planos");

  window.addEventListener(
    "scroll",
    () => {
      if (!stickyBar) return;
      const scrollY = window.scrollY;
      let inPricing = false;
      if (pricingSection) {
        const rect = pricingSection.getBoundingClientRect();
        inPricing = rect.top < window.innerHeight * 0.7 && rect.bottom > 100;
      }

      if (scrollY > 650 && !inPricing) {
        stickyBar.classList.add("visible");
      } else {
        stickyBar.classList.remove("visible");
      }
    },
    { passive: true }
  );
});
