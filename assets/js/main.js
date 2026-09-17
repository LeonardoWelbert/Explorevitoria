(function () {
  "use strict";

  const GEMINI_API_KEY = "SUA_CHAVE_GEMINI";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getBasePath() {
    return window.location.pathname.includes("/solucoes/") ? "../" : "./";
  }

  function resolveUrl(url) {
    const basePath = getBasePath();

    if (basePath === "../" && !url.startsWith("../") && !url.startsWith("/")) {
      return "../" + url;
    }

    if (basePath === "./" && url.startsWith("../")) {
      return url.replace(/^\.\.\//, "");
    }

    return url;
  }

  function resolveComponentPath(url, isSolutions) {
    if (
      !url ||
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("#") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("/")
    ) {
      return url;
    }

    const clean = url.replace(/^(\.\.\/)+/, "");

    return isSolutions ? "../" + clean : clean;
  }

  function fixContainerPaths(container) {
    if (!container) return container;

    const isSolutions = window.location.pathname.includes("/solucoes/");

    container.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute(
        "href",
        resolveComponentPath(a.getAttribute("href"), isSolutions),
      );
    });

    container.querySelectorAll("img[src]").forEach((img) => {
      img.setAttribute(
        "src",
        resolveComponentPath(img.getAttribute("src"), isSolutions),
      );
    });

    container.querySelectorAll("source[src]").forEach((source) => {
      source.setAttribute(
        "src",
        resolveComponentPath(source.getAttribute("src"), isSolutions),
      );
    });

    return container;
  }

  function setFavicon() {
    const basePath = getBasePath();
    let link = document.querySelector("link[rel~='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = `${basePath}assets/img/Logotipo para hamburgueria amarelo e vermelho simples.png`;
  }

  function loadComponent(url, containerId) {
    const finalUrl = resolveUrl(url);

    return fetch(finalUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Erro ao carregar componente [${response.status}]: ${finalUrl}`,
          );
        }
        return response.text();
      })
      .then((html) => {
        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`Container #${containerId} não encontrado na página.`);
          return null;
        }
        container.innerHTML = html;
        return container;
      })
      .catch((error) => {
        console.error("loadComponent error:", error);
        return null;
      });
  }

  function highlightActiveNavLink(container) {
    if (!container) return;

    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const navLinks = container.querySelectorAll(
      ".navbar-nav .nav-link, .navbar-brand",
    );

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href === "#") return;

      const linkPage = href.split("/").pop();
      if (link.classList.contains("nav-link")) {
        link.classList.toggle("active", linkPage === currentPage);
      }
    });
  }

  function populateHeroBanner(container) {
    if (!container) return;

    const { badge, title, text } = container.dataset;
    const badgeEl = container.querySelector(
      ".hero-banner__badge, .page-banner__badge",
    );
    const titleEl = container.querySelector(
      ".hero-banner__title, .page-banner__title",
    );
    const textEl = container.querySelector(".page-banner__text");

    if (badge && badgeEl) {
      badgeEl.textContent = badge;
    }

    if (title && titleEl) {
      titleEl.innerHTML = title;
      const spanEl = titleEl.querySelector("span");
      if (spanEl && !spanEl.style.color) {
        spanEl.style.color = "#ffffff";
      }
    }

    if (text && textEl) {
      textEl.textContent = text;
    }
  }

  function loadRecaptchaScript(callback) {
    if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
      callback();
      return;
    }

    let script = document.getElementById("recaptcha-script");
    if (!script) {
      script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkLoaded = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
        clearInterval(checkLoaded);
        callback();
      }
    }, 100);

    setTimeout(() => clearInterval(checkLoaded), 5000);
  }

  function loadPageComponents() {
    const isSolutions = window.location.pathname.includes("/solucoes/");

    loadComponent("components/header.html", "header-container").then(
      (container) => {
        fixContainerPaths(container);
        highlightActiveNavLink(container);

        if (container && isSolutions) {
          const logoImg = container.querySelector(".logo-header");
          if (logoImg) {
            logoImg.setAttribute("src", "../assets/img/logotipo-header.png");
          }
        }
      },
    );

    loadComponent("components/footer.html", "footer-container").then(
      fixContainerPaths,
    );
    loadComponent("components/partners.html", "partners-container").then(
      fixContainerPaths,
    );

    loadComponent("components/contact.html", "contact-container").then(
      (container) => {
        fixContainerPaths(container);
        if (!container) return;

        const recaptchaEl = container.querySelector(".g-recaptcha");
        if (recaptchaEl) {
          loadRecaptchaScript(() => {
            try {
              window.grecaptcha.render(recaptchaEl, {
                sitekey:
                  recaptchaEl.getAttribute("data-sitekey") ||
                  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
              });
            } catch (e) {}
          });
        }
      },
    );

    loadComponent("components/banner-video.html", "hero-banner-container").then(
      (container) => {
        fixContainerPaths(container);
        populateHeroBanner(container);

        if (container && isSolutions) {
          const videoSource = container.querySelector("video source");
          if (videoSource) {
            videoSource.setAttribute(
              "src",
              "../assets/img/winter_nexus_espelhado.mp4",
            );
            const videoEl = container.querySelector("video");
            if (videoEl) videoEl.load();
          }
        }
      },
    );
  }

  function initDraggableCarousel(
    trackEl,
    itemSelector,
    activeClass = "is-active",
  ) {
    if (!trackEl) return;

    const carousel = trackEl.closest(
      ".solutions-carousel, .pillars-carousel, .video-gallery-carousel",
    );
    const originalItems = Array.from(trackEl.querySelectorAll(itemSelector));

    if (!originalItems.length) return;
    if (trackEl.dataset.infiniteInitialized === "true") return;
    trackEl.dataset.infiniteInitialized = "true";

    const DRAG_THRESHOLD = 6;
    const MAX_VELOCITY = 25;
    const FRICTION = 0.95;
    const WHEEL_END_DELAY = 180;
    const HIGHLIGHT_DELAY = 60;
    const AUTO_SPEED = 0.45;
    const AUTO_RESUME_DELAY = 1200;

    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      trackEl.appendChild(clone);
    });

    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      trackEl.appendChild(clone);
    });

    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let scrollStart = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let momentumId = null;
    let autoId = null;
    let autoResumeTimeout = null;
    let highlightTimeout = null;
    let wheelEndTimeout = null;
    let isAutoPaused = false;

    function getLoopWidth() {
      return trackEl.scrollWidth / 3;
    }

    function normalizeScroll() {
      const loopWidth = getLoopWidth();
      if (!loopWidth || !Number.isFinite(loopWidth)) return;

      if (trackEl.scrollLeft < loopWidth * 0.5) {
        trackEl.scrollLeft += loopWidth;
      } else if (trackEl.scrollLeft > loopWidth * 1.5) {
        trackEl.scrollLeft -= loopWidth;
      }
    }

    const setSnapDisabled = (state) => {
      carousel?.classList.toggle("is-dragging", state);
      trackEl.classList.toggle("is-dragging", state);
    };

    const cancelMomentum = () => {
      if (momentumId) {
        cancelAnimationFrame(momentumId);
        momentumId = null;
      }
    };

    const startMomentum = () => {
      cancelMomentum();

      const step = () => {
        if (Math.abs(velocity) < 0.5) {
          momentumId = null;
          setSnapDisabled(false);
          highlightActiveItem();
          resumeAutoScroll();
          return;
        }

        trackEl.scrollLeft -= velocity;
        normalizeScroll();
        velocity *= FRICTION;
        momentumId = requestAnimationFrame(step);
      };

      momentumId = requestAnimationFrame(step);
    };

    const allItems = Array.from(trackEl.querySelectorAll(itemSelector));

    function highlightActiveItem() {
      const trackCenter = trackEl.scrollLeft + trackEl.clientWidth / 2;
      let closestIndex = -1;
      let closestDist = Infinity;

      allItems.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const dist = Math.abs(itemCenter - trackCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = index;
        }
      });

      allItems.forEach((item) => item.classList.remove(activeClass));

      if (closestIndex >= 0) {
        const originalIndex = closestIndex % originalItems.length;
        allItems.forEach((item, index) => {
          if (index % originalItems.length === originalIndex) {
            item.classList.add(activeClass);
          }
        });
      }
    }

    function stopAutoScroll() {
      if (autoId) {
        cancelAnimationFrame(autoId);
        autoId = null;
      }
    }

    function autoStep() {
      if (isDown || isAutoPaused || momentumId) {
        autoId = requestAnimationFrame(autoStep);
        return;
      }

      trackEl.scrollLeft += AUTO_SPEED;
      normalizeScroll();
      autoId = requestAnimationFrame(autoStep);
    }

    function startAutoScroll() {
      stopAutoScroll();
      isAutoPaused = false;
      autoId = requestAnimationFrame(autoStep);
    }

    function pauseAutoScroll() {
      isAutoPaused = true;
      stopAutoScroll();
    }

    function resumeAutoScroll() {
      clearTimeout(autoResumeTimeout);
      autoResumeTimeout = setTimeout(() => {
        isAutoPaused = false;
        startAutoScroll();
      }, AUTO_RESUME_DELAY);
    }

    trackEl.addEventListener("dragstart", (e) => e.preventDefault());

    trackEl.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isDown = true;
      hasDragged = false;
      cancelMomentum();
      pauseAutoScroll();
      setSnapDisabled(true);

      startX = e.clientX;
      scrollStart = trackEl.scrollLeft;
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;
    });

    trackEl.addEventListener("pointermove", (e) => {
      if (!isDown) return;

      const dx = e.clientX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) hasDragged = true;

      e.preventDefault();
      trackEl.scrollLeft = scrollStart - dx;
      normalizeScroll();

      const now = performance.now();
      const dt = now - lastTime || 16;
      const rawVelocity = ((e.clientX - lastX) / dt) * 16;
      velocity = clamp(rawVelocity, -MAX_VELOCITY, MAX_VELOCITY);
      lastX = e.clientX;
      lastTime = now;
    });

    const endDrag = (e) => {
      if (!isDown) return;

      isDown = false;
      if (e?.pointerId !== undefined) {
        try {
          trackEl.releasePointerCapture(e.pointerId);
        } catch {}
      }

      if (hasDragged) {
        startMomentum();
      } else {
        setSnapDisabled(false);
        resumeAutoScroll();
      }
    };

    trackEl.addEventListener("pointerup", endDrag);
    trackEl.addEventListener("pointercancel", endDrag);

    trackEl.addEventListener("pointerleave", (e) => {
      if (isDown && e.pointerType === "mouse") endDrag(e);
    });

    trackEl.addEventListener(
      "click",
      (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          hasDragged = false;
        }
      },
      true,
    );

    trackEl.addEventListener(
      "wheel",
      (e) => {
        const delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;

        e.preventDefault();
        cancelMomentum();
        pauseAutoScroll();
        setSnapDisabled(true);
        trackEl.scrollLeft += delta;
        normalizeScroll();

        clearTimeout(wheelEndTimeout);
        wheelEndTimeout = setTimeout(() => {
          setSnapDisabled(false);
          highlightActiveItem();
          resumeAutoScroll();
        }, WHEEL_END_DELAY);
      },
      { passive: false },
    );

    trackEl.addEventListener("scroll", () => {
      normalizeScroll();
      clearTimeout(highlightTimeout);
      highlightTimeout = setTimeout(highlightActiveItem, HIGHLIGHT_DELAY);
    });

    carousel?.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) pauseAutoScroll();
    });

    carousel?.addEventListener("mouseleave", () => {
      if (window.matchMedia("(hover: hover)").matches) resumeAutoScroll();
    });

    requestAnimationFrame(() => {
      trackEl.scrollLeft = getLoopWidth();
      normalizeScroll();
      highlightActiveItem();
      startAutoScroll();
    });
  }

  function initStackCarousel(root) {
    if (!root) return;

    const track = root.querySelector("[data-stack-track]");
    if (!track) return;

    const cards = Array.from(track.querySelectorAll("[data-stack-item]"));
    const prevBtn = root.querySelector("[data-stack-prev]");
    const nextBtn = root.querySelector("[data-stack-next]");
    const total = cards.length;

    if (total === 0) return;

    const STEP_PERCENT = 52;
    const SCALE_STEP = 0.08;
    const OPACITY_STEP = 0.55;
    const BLUR_STEP = 1.5;
    const ROTATE_STEP = 16;
    const MIN_SCALE = 0.55;
    const MAX_ROTATE = 34;
    const DRAG_THRESHOLD = 6;
    const SWIPE_THRESHOLD = 50;
    const WHEEL_LOCK_DELAY = 200;

    let activeIndex = 0;
    let isDown = false;
    let dragged = false;
    let startX = 0;
    let wheelTimeout = null;

    const circularDiff = (i) => {
      let diff = i - activeIndex;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    };

    function render() {
      cards.forEach((card, i) => {
        const offset = circularDiff(i);
        const abs = Math.abs(offset);
        const sign = Math.sign(offset);
        const translateX = offset * STEP_PERCENT;
        const scale = Math.max(1 - abs * SCALE_STEP, MIN_SCALE);
        const opacity = Math.max(1 - abs * OPACITY_STEP, 0);
        const blur = abs === 0 ? 0 : abs * BLUR_STEP;
        const rotateY = -sign * Math.min(abs * ROTATE_STEP, MAX_ROTATE);

        card.style.transform = `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`;
        card.style.opacity = String(opacity);
        card.style.filter = blur ? `blur(${blur}px)` : "none";
        card.style.zIndex = String(100 - abs);
        card.style.pointerEvents = opacity <= 0.05 ? "none" : "auto";
        card.classList.toggle("is-active", offset === 0);
      });
    }

    function goTo(index) {
      activeIndex = ((index % total) + total) % total;
      render();
    }

    const next = () => goTo(activeIndex + 1);
    const prev = () => goTo(activeIndex - 1);

    prevBtn?.addEventListener("click", prev);
    nextBtn?.addEventListener("click", next);

    cards.forEach((card, i) => {
      card.addEventListener("click", () => {
        if (i !== activeIndex) goTo(i);
      });
    });

    track.addEventListener("pointerdown", (e) => {
      isDown = true;
      dragged = false;
      startX = e.clientX;
      root.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    track.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD) dragged = true;
    });

    const endDrag = (e) => {
      if (!isDown) return;

      isDown = false;
      root.classList.remove("is-dragging");

      if (dragged) {
        const dx = e.clientX - startX;
        if (dx < -SWIPE_THRESHOLD) next();
        else if (dx > SWIPE_THRESHOLD) prev();
      }
    };

    track.addEventListener("pointerup", endDrag);

    track.addEventListener("pointercancel", () => {
      isDown = false;
      root.classList.remove("is-dragging");
    });

    root.addEventListener(
      "wheel",
      (e) => {
        const delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;

        e.preventDefault();
        if (wheelTimeout) return;

        if (delta > 0) next();
        else prev();

        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, WHEEL_LOCK_DELAY);
      },
      { passive: false },
    );

    root.setAttribute("tabindex", "0");

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });

    render();
  }

  function initVideoModal(trackEl) {
    if (!trackEl) return;

    const modal = document.getElementById("videoModal");
    const player = document.getElementById("videoModalPlayer");

    if (!modal || !player) {
      console.warn(
        "Modal de vídeo não encontrado: verifique se #videoModal e #videoModalPlayer existem no HTML.",
      );
      return;
    }

    const closeBtn = modal.querySelector(".video-modal__close");
    const backdrop = modal.querySelector(".video-modal__backdrop");

    function openModal(src) {
      if (!src) return;

      player.src = resolveUrl(src);
      modal.classList.add("is-open");
      document.body.classList.add("video-modal-open");
      player.currentTime = 0;
      player.play().catch(() => {});
    }

    function closeModal() {
      modal.classList.remove("is-open");
      document.body.classList.remove("video-modal-open");
      player.pause();
      player.removeAttribute("src");
      player.load();
    }

    trackEl.addEventListener("click", (e) => {
      const card = e.target.closest(".video-card");
      if (!card || !trackEl.contains(card)) return;

      e.preventDefault();
      openModal(card.getAttribute("data-video"));
    });

    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open"))
        closeModal();
    });
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatMarkdownText(text) {
    let formatted = escapeHTML(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/\n/g, "<br>");
    return formatted;
  }

  function initMochilaoChat() {
    const chatMessages = document.getElementById("chatMessages");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");

    if (!chatMessages || !chatForm || !chatInput || !chatSend) return;

    function addMessage(html, tipo) {
      const div = document.createElement("div");
      div.className = "msg msg--" + tipo;
      div.innerHTML = html;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return div;
    }

    function addTypingIndicator() {
      const div = document.createElement("div");
      div.className = "msg msg--typing";
      div.innerHTML = "<span></span><span></span><span></span>";
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return div;
    }

    async function fetchGeminiResponse(userPrompt) {
      const systemInstruction = `Você é o guia turístico virtual 'IA Explore Vitória'. Seu objetivo é fornecer roteiros de viagem práticos, organizados e personalizados em Vitória (Espírito Santo) e região metropolitana (Vila Velha, Serra, Guarapari). 
Considere opções gastronômicas (moqueca, torta capixaba), passeios históricos, praias e transporte (Sistema Transcol e Aquaviário).
Seja amigável, direto, contextualizado e formate o roteiro de forma bem organizada com tópicos.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    systemInstruction +
                    "\n\nSolicitação do usuário: " +
                    userPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Desculpe, ocorreu um erro ao gerar seu roteiro. Tente novamente!"
      );
    }
    async function handleUserMessage(texto) {
      if (!texto.trim()) return;

      addMessage(escapeHTML(texto), "user");
      chatInput.value = "";
      chatSend.disabled = true;

      const typing = addTypingIndicator();

      try {
        const respostaIA = await fetchGeminiResponse(texto);
        typing.remove();
        addMessage(formatMarkdownText(respostaIA), "bot");
      } catch (error) {
        console.error("Erro no chat IA:", error);
        typing.remove();
        addMessage(
          "Desculpe, tivemos um problema ao gerar seu roteiro. Verifique sua conexão e tente novamente.",
          "bot",
        );
      } finally {
        chatSend.disabled = false;
        chatInput.focus();
      }
    }

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleUserMessage(chatInput.value);
    });

    document.querySelectorAll(".hint-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        chatInput.value = prompt;
        handleUserMessage(prompt);
      });
    });
  }

  function init() {
    setFavicon();
    loadPageComponents();

    initDraggableCarousel(
      document.getElementById("solutionsTrack"),
      ".solution-card",
      "is-active",
    );

    const videoTrack = document.getElementById("videoTrack");
    initDraggableCarousel(videoTrack, ".video-card", "is-active");
    initVideoModal(videoTrack);

    initStackCarousel(
      document.querySelector('[data-stack-carousel="pillars"]'),
    );

    initMochilaoChat();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
