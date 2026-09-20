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
    // URLs externas (http, https, //) nunca devem ser alteradas
    if (/^(https?:)?\/\//i.test(url)) return url;

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

  /* ==================================================================
   * MODAL DE VÍDEO (YouTube + arquivo local)
   *
   * O data-video do .video-card aceita:
   *   - Link do YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
   *   - Caminho de arquivo local (ex.: assets/video/meu-video.mp4)
   *
   * Requer no HTML:
   *   <div id="videoModalPlayer" class="video-modal__player"></div>
   * ================================================================== */

  function isYouTubeUrl(url) {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/i.test(url);
  }

  function getYouTubeEmbedUrl(url) {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    );

    if (!match || !match[1]) return "";
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
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

      const rawSrc = src.trim();
      player.innerHTML = "";

      // Checa o YouTube ANTES do resolveUrl, para não mexer na URL externa
      if (isYouTubeUrl(rawSrc)) {
        const embedUrl = getYouTubeEmbedUrl(rawSrc);
        if (!embedUrl) {
          console.warn("Link do YouTube inválido:", rawSrc);
          return;
        }

        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.title = "Vídeo do YouTube";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
        iframe.allowFullscreen = true;
        iframe.setAttribute("frameborder", "0");
        player.appendChild(iframe);
      } else {
        const video = document.createElement("video");
        video.src = resolveUrl(rawSrc);
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        player.appendChild(video);
        video.play().catch(() => {});
      }

      modal.classList.add("is-open");
      document.body.classList.add("video-modal-open");
    }

    function closeModal() {
      modal.classList.remove("is-open");
      document.body.classList.remove("video-modal-open");

      const video = player.querySelector("video");
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      // Remove o iframe (e para o áudio do YouTube)
      player.innerHTML = "";
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

  /* ==================================================================
   * PÁGINAS DE EXPERIÊNCIA  (solucoes/*.html com data-experience="...")
   *
   * Como funciona:
   *   1. A página tem <div class="historic-page" data-experience="chave"></div>
   *   2. initExperiencePage() lê EXPERIENCIAS[chave] (logo abaixo)
   *   3. Monta hero + guia da IA + galeria dentro dessa div.
   *
   * Para criar uma página nova: copie o HTML, troque o data-experience
   * e adicione um bloco novo em EXPERIENCIAS.
   * Se a página não tiver [data-experience], nada disso executa.
   * ================================================================== */

  // Ícones do guia (só o miolo do SVG). Para criar um novo: adicione aqui
  // e use o nome no campo "icon" dos dados.
  const EXPERIENCE_ICONS = {
    clock:
      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    language:
      '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    cloudsun:
      '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    rain: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
    storm:
      '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/>',
    fog: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7"/><path d="M17 21H9"/>',
    waves:
      '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  };

  const EXPERIENCE_LABEL_SAVE = "Salvar no meu roteiro";
  const EXPERIENCE_LABEL_SAVED = "Adicionado ao roteiro";
  const EXPERIENCE_BACK_URL = "../index.html";

  // Seção "Planejar viagem" (aparece no fim de TODAS as páginas de experiência).
  // Para mudar só numa página, adicione um campo "plan" no bloco dela em
  // EXPERIENCIAS (ele sobrescreve estes valores).
  const EXPERIENCE_PLAN = {
    kicker: "Planejar viagem",
    title: "Planeje sua viagem",
    text: "Deixe a IA montar um roteiro personalizado com mapa em PDF.",
    ctaLabel: "Montar roteiro",
    ctaUrl: "../mochilao.html",
    cards: [
      // Clima em TEMPO REAL (Open-Meteo) — ver EXPERIENCE_WEATHER abaixo
      { type: "weather", label: "Clima agora" },
      // ATENÇÃO: maré é texto FIXO de exemplo (vindo do design), não é ao vivo.
      {
        icon: "waves",
        label: "Maré do dia",
        value: "Cheia 14:32 · baixa 20:50",
      },
    ],
  };

  // Clima em tempo real: Open-Meteo (sem chave de API).
  // Guarda a resposta no sessionStorage por alguns minutos para não
  // chamar a API a cada página que o visitante abre.
  const EXPERIENCE_WEATHER = {
    city: "Vitória",
    latitude: -20.3155,
    longitude: -40.3128,
    timezone: "America/Sao_Paulo",
    cacheMinutes: 10,
  };

  // Imagens: caminhos relativos à página em /solucoes/
  // ex.: "../assets/img/convento-da-penha.jpg"
  const EXPERIENCIAS = {
    // ----------------------------------------------------------------
    historico: {
      hero: {
        image:
          "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/a65d237a3_generated_abf2b648.jpg",
        alt: "Convento da Penha",
      },
      kicker: "Patrimônio",
      title: "Turismo Histórico e Cultural",
      subtitle:
        "Centros coloniais, conventos e palácios que contam quase cinco séculos de história.",
      guide: {
        title: "Dicas práticas para visitantes estrangeiros",
        items: [
          {
            icon: "clock",
            label: "Melhor momento",
            text: "Manhã e fim de tarde, para luz dourada e menos calor.",
          },
          {
            icon: "shield",
            label: "Segurança",
            text: "Centro histórico bem vigiado; mantenha pertences à vista em ruas movimentadas.",
          },
          {
            icon: "language",
            label: "Idioma",
            text: "Poucos guias bilíngues — leve tradutor no celular; placas em português.",
          },
          {
            icon: "navigation",
            label: "Como chegar",
            text: "Caminhe pelo Centro; use app de transporte para o Convento da Penha (Vila Velha).",
          },
        ],
        note: "A maioria dos monumentos é gratuita; chegue cedo no Convento da Penha para evitar filas.",
      },
      galleryTitle: "Lugares para conhecer",
      locations: [
        {
          name: "Convento da Penha",
          description:
            "O cartão-postal do Espírito Santo. Fundado em 1558 no alto de um morro em Vila Velha, oferece vista de 360° da baía de Vitória. Subida de bondinho ou a pé por trilha pavimentada — pôr do sol inesquecível.",
          tip: "Visite entre 15h e 17h para o pôr do sol; bondinho funciona até as 18h.",
          image:
            "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/a65d237a3_generated_abf2b648.jpg",
        },
        {
          name: "Catedral Metropolitana de Vitória",
          description:
            "No coração do Centro, a Catedral Nossa Senhora da Vitória mistura pedra e luz. Vitrais coloridos contam a história da evangelização capixaba; o interior sereno é um respiro no meio da cidade.",
          tip: "Aberta para visitação das 8h às 17h; missa dominical às 18h.",
          image:
            "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/f2e73087a_generated_3598b5d1.jpg",
        },
        {
          name: "Palácio Anchieta",
          description:
            "Sede do governo do estado e um dos edifícios administrativos mais antigos das Américas (século XVI). Fachada de pedra e visitas guiadas mostram a história política capixaba.",
          tip: "Visitas guiadas gratuitas de terça a domingo, das 9h às 17h.",
          // ATENÇÃO: mesma imagem do Convento (placeholder) — troque
          image:
            "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/a65d237a3_generated_abf2b648.jpg",
        },
        {
          name: "Igreja do Rosário e Largo do Carmo",
          description:
            "Conjunto colonial no alto da cidade, com a Igreja de Nossa Senhora do Rosário dos Pretos e o Largo do Carmo. Ruas de paralelepípedos, casarios restaurados e cafés charmosos.",
          tip: "Caminhe no fim de tarde; cafés ao redor abrem até a noite.",
          // ATENÇÃO: mesma imagem do Convento (placeholder) — troque
          image:
            "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/a65d237a3_generated_abf2b648.jpg",
        },
      ],
    },

    // ----------------------------------------------------------------
    // RASCUNHO: revise textos, dicas e horários antes de publicar e
    // coloque as fotos em assets/img/ com os nomes abaixo.
    gastronomia: {
      hero: {
        image: "../assets/img/gastronomia-hero.jpg",
        alt: "Moqueca capixaba servida em panela de barro",
      },
      kicker: "Sabores",
      title: "Gastronomia Capixaba",
      subtitle:
        "Moqueca na panela de barro, torta capixaba e frutos do mar direto das comunidades de pescadores.",
      guide: {
        title: "Dicas práticas para visitantes estrangeiros",
        items: [
          {
            icon: "clock",
            label: "Melhor momento",
            text: "O almoço é a refeição principal; muitas casas de frutos do mar enchem no fim de semana, então chegue cedo.",
          },
          {
            icon: "shield",
            label: "Segurança",
            text: "Prefira restaurantes movimentados, onde os frutos do mar têm giro rápido; em mercados, mantenha bolsa e celular à vista.",
          },
          {
            icon: "language",
            label: "Idioma",
            text: "Nem todo cardápio tem versão em inglês — use o tradutor do celular e pergunte pelo prato do dia. Muitos pratos servem duas pessoas.",
          },
          {
            icon: "navigation",
            label: "Como chegar",
            text: "O Mercado da Vila Rubim dá para fazer a pé pelo Centro; para Goiabeiras e Ilha das Caieiras, use app de transporte.",
          },
        ],
        note: "A moqueca capixaba leva urucum e não leva dendê nem leite de coco. A torta capixaba é tradição da Semana Santa, mas muitas casas servem o ano todo.",
      },
      galleryTitle: "Onde provar",
      locations: [
        {
          name: "Galpão das Paneleiras de Goiabeiras",
          description:
            "Onde nasce a panela da moqueca capixaba. As paneleiras moldam a argila à mão e finalizam a peça com tinta natural extraída da casca do mangue — um ofício reconhecido como patrimônio cultural imaterial do Brasil. Nas redondezas, restaurantes servem a moqueca na própria panela.",
          tip: "Vá pela manhã para ver o trabalho das paneleiras e confirme os dias de funcionamento antes.",
          image: "../assets/img/paneleiras-goiabeiras.jpg",
        },
        {
          name: "Ilha das Caieiras",
          description:
            "Comunidade de pescadores à beira do manguezal, conhecida pelos restaurantes de frutos do mar. Ponto tradicional para moqueca de peixe, casquinha de siri e torta capixaba.",
          tip: "Fins de semana costumam lotar; chegue cedo ou reserve mesa para o almoço.",
          image: "../assets/img/ilha-das-caieiras.jpg",
        },
        {
          name: "Mercado da Vila Rubim",
          description:
            "Mercado tradicional na região central de Vitória. Nos corredores há queijos, temperos, cafés, cachaças e produtos regionais — boa parada para sentir o cotidiano da cidade e levar lembranças comestíveis.",
          tip: "Vá de manhã, quando o movimento é maior, e combine com um passeio a pé pelo Centro.",
          image: "../assets/img/mercado-vila-rubim.jpg",
        },
        {
          name: "Praia do Canto",
          description:
            "Bairro com grande concentração de restaurantes e bares, ótimo para provar a moqueca em ambiente mais moderno e esticar a noite com uma caminhada.",
          tip: "Compare cardápios e preços na porta antes de escolher a casa.",
          image: "../assets/img/praia-do-canto.jpg",
        },
      ],
    },

    // ----------------------------------------------------------------
    // Próximas: praias, "vida-noturna", compras, aventura
    // (copie o bloco "gastronomia", troque a chave e o conteúdo)
  };

  function experienceSvg(inner, cls) {
    return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  // Escapa texto E aspas (seguro para usar dentro de atributos)
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function experienceHeroHTML(d) {
    return `
      <section class="historic-hero">
        <img class="historic-hero__img" src="${esc(d.hero.image)}" alt="${esc(d.hero.alt)}" />
        <div class="historic-hero__overlay"></div>
        <div class="historic-hero__content">
          <a href="${EXPERIENCE_BACK_URL}" class="historic-hero__back">
            ${experienceSvg(EXPERIENCE_ICONS.back)}
            Todas as experiências
          </a>
          <p class="historic-hero__kicker">${esc(d.kicker)}</p>
          <h1 class="historic-hero__title">${esc(d.title)}</h1>
          <p class="historic-hero__subtitle">${esc(d.subtitle)}</p>
        </div>
      </section>
      <div class="historic-line"></div>`;
  }

  function experienceGuideHTML(g) {
    const items = (g.items || [])
      .map(
        (item) => `
          <li class="historic-guide__item">
            ${experienceSvg(EXPERIENCE_ICONS[item.icon] || EXPERIENCE_ICONS.clock, "historic-guide__icon")}
            <div>
              <p class="historic-guide__key">${esc(item.label)}</p>
              <p class="historic-guide__val">${esc(item.text)}</p>
            </div>
          </li>`,
      )
      .join("");

    return `
      <aside class="historic-guide">
        <div class="historic-guide__card">
          <p class="historic-guide__label">Guia da IA</p>
          <h2 class="historic-guide__title">${esc(g.title)}</h2>
          <div class="historic-line historic-line--soft historic-guide__divider"></div>
          <ul class="historic-guide__list">${items}</ul>
          ${g.note ? `<p class="historic-guide__note">${esc(g.note)}</p>` : ""}
        </div>
      </aside>`;
  }

  function experienceLocationsHTML(list) {
    return (list || [])
      .map(
        (loc, i) => `
        <article class="historic-location">
          <div class="historic-location__media">
            <img class="historic-location__img" src="${esc(loc.image)}" alt="${esc(loc.name)}" loading="lazy" />
            <span class="historic-location__badge">${String(i + 1).padStart(2, "0")}</span>
          </div>
          <div class="historic-location__body">
            <h3 class="historic-location__name">${esc(loc.name)}</h3>
            <p class="historic-location__desc">${esc(loc.description)}</p>
            <div class="historic-location__tip">
              ${experienceSvg(EXPERIENCE_ICONS.clock)}
              <span>${esc(loc.tip)}</span>
            </div>
            <button type="button" class="historic-location__save" aria-pressed="false">
              ${experienceSvg(EXPERIENCE_ICONS.bookmark)}
              <span>${EXPERIENCE_LABEL_SAVE}</span>
            </button>
          </div>
        </article>`,
      )
      .join("");
  }

  // ---------- Clima: texto + tipo + ícone a partir do código WMO ----------
  function experienceWeatherInfo(code, isDay) {
    const c = Number(code);
    const is = (kind, text, icon) => ({ kind, text, icon });

    if (c === 0)
      return isDay
        ? is("clear", "Ensolarado", "sun")
        : is("night", "Céu limpo", "moon");
    if (c === 1)
      return isDay
        ? is("partly", "Poucas nuvens", "cloudsun")
        : is("night", "Poucas nuvens", "moon");
    if (c === 2)
      return isDay
        ? is("partly", "Parcialmente nublado", "cloudsun")
        : is("cloud", "Parcialmente nublado", "cloud");
    if (c === 3) return is("cloud", "Nublado", "cloud");
    if (c === 45 || c === 48) return is("fog", "Neblina", "fog");
    if (c >= 51 && c <= 57) return is("rain", "Garoa", "rain");
    if (c === 61 || c === 66) return is("rain", "Chuva fraca", "rain");
    if (c === 63 || c === 67) return is("rain", "Chuva", "rain");
    if (c === 65 || c === 82) return is("rain", "Chuva forte", "rain");
    if (c === 80 || c === 81) return is("rain", "Pancadas de chuva", "rain");
    if ((c >= 71 && c <= 77) || c === 85 || c === 86)
      return is("cloud", "Neve", "cloud");
    if (c === 95) return is("storm", "Trovoada", "storm");
    if (c === 96 || c === 99)
      return is("storm", "Trovoada com granizo", "storm");
    return is("cloud", "Condição indisponível", "cloud");
  }

  async function loadExperienceWeather(cfg) {
    const cacheKey = `explore-weather:${cfg.latitude},${cfg.longitude}`;

    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.t < cfg.cacheMinutes * 60000) {
        return cached.current;
      }
    } catch {}

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${cfg.latitude}&longitude=${cfg.longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m" +
      `&timezone=${encodeURIComponent(cfg.timezone)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

      const data = await res.json();
      if (!data.current) throw new Error("Resposta sem o campo current");

      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ t: Date.now(), current: data.current }),
        );
      } catch {}

      return data.current;
    } finally {
      clearTimeout(timer);
    }
  }

  function renderExperienceWeather(card, cur, cfg) {
    const info = experienceWeatherInfo(cur.weather_code, cur.is_day === 1);
    const n = (v) => Math.round(Number(v));
    const time = String(cur.time || "").slice(11, 16);

    card.classList.remove("is-loading", "is-error");
    card.classList.add(`historic-plan__card--${info.kind}`);

    const icon = card.querySelector("[data-weather-icon]");
    if (icon) icon.innerHTML = experienceSvg(EXPERIENCE_ICONS[info.icon]);

    card.querySelector("[data-weather-body]").innerHTML = `
      <p class="historic-plan__card-value">
        <span class="historic-plan__temp">${n(cur.temperature_2m)}°</span>
        <span class="historic-plan__cond">${esc(info.text)}</span>
      </p>
      <dl class="historic-plan__stats">
        <div><dt>Sensação</dt><dd>${n(cur.apparent_temperature)}°</dd></div>
        <div><dt>Umidade</dt><dd>${n(cur.relative_humidity_2m)}%</dd></div>
        <div><dt>Vento</dt><dd>${n(cur.wind_speed_10m)} km/h</dd></div>
      </dl>
      <p class="historic-plan__caption">${esc(cfg.city)}${time ? ` · atualizado ${esc(time)}` : ""}</p>`;
  }

  function renderExperienceWeatherError(card) {
    card.classList.remove("is-loading");
    card.classList.add("is-error");
    card.querySelector("[data-weather-body]").innerHTML = `
      <p class="historic-plan__card-value">Clima indisponível</p>
      <p class="historic-plan__caption">Não foi possível atualizar agora. Recarregue a página em instantes.</p>`;
  }

  function initExperienceWeather(root, data) {
    const card = root.querySelector("[data-weather]");
    if (!card) return;

    const cfg = {
      ...EXPERIENCE_WEATHER,
      ...((data.plan && data.plan.weather) || {}),
    };

    loadExperienceWeather(cfg)
      .then((cur) => renderExperienceWeather(card, cur, cfg))
      .catch((err) => {
        console.warn("[experiência] Clima indisponível:", err);
        renderExperienceWeatherError(card);
      });
  }

  function experienceWeatherCardHTML(c) {
    return `
        <div class="historic-plan__card historic-plan__card--weather is-loading" data-weather aria-live="polite">
          <p class="historic-plan__card-label">
            <span class="historic-plan__icon" data-weather-icon>${experienceSvg(EXPERIENCE_ICONS.sun)}</span>
            ${esc(c.label || "Clima agora")}
          </p>
          <div data-weather-body>
            <span class="historic-plan__skeleton historic-plan__skeleton--temp"></span>
            <span class="historic-plan__skeleton historic-plan__skeleton--stats"></span>
          </div>
        </div>`;
  }

  function experienceStaticCardHTML(c) {
    return `
        <div class="historic-plan__card">
          <p class="historic-plan__card-label">
            ${EXPERIENCE_ICONS[c.icon] ? `<span class="historic-plan__icon">${experienceSvg(EXPERIENCE_ICONS[c.icon])}</span>` : ""}
            ${esc(c.label)}
          </p>
          <p class="historic-plan__card-value">${esc(c.value)}</p>
        </div>`;
  }

  function experiencePlanHTML(d) {
    const p = { ...EXPERIENCE_PLAN, ...(d.plan || {}) };

    const cards = (p.cards || [])
      .map((c) =>
        c.type === "weather"
          ? experienceWeatherCardHTML(c)
          : experienceStaticCardHTML(c),
      )
      .join("");

    return `
      <section class="historic-plan">
        <div class="historic-plan__inner">
          <div class="historic-plan__intro">
            <p class="historic-plan__kicker">${esc(p.kicker)}</p>
            <h2 class="historic-plan__title">${esc(p.title)}</h2>
            <p class="historic-plan__text">${esc(p.text)}</p>
            <a href="${esc(p.ctaUrl)}" class="historic-plan__cta">
              ${esc(p.ctaLabel)}
              ${experienceSvg(EXPERIENCE_ICONS.arrow)}
            </a>
          </div>
          <div class="historic-plan__cards">${cards}</div>
        </div>
      </section>
      <div class="historic-line"></div>`;
  }

  function experiencePageHTML(d) {
    return `
      ${experienceHeroHTML(d)}
      <main class="historic-split">
        ${experienceGuideHTML(d.guide || {})}
        <div class="historic-gallery">
          <h2 class="historic-gallery__title">${esc(d.galleryTitle || "Lugares para conhecer")}</h2>
          <div class="historic-gallery__list">${experienceLocationsHTML(d.locations)}</div>
        </div>
      </main>
      ${experiencePlanHTML(d)}`;
  }

  function initExperiencePage() {
    const root = document.querySelector("[data-experience]");
    if (!root) return;

    const key = root.dataset.experience;
    const data = EXPERIENCIAS[key];

    if (!data) {
      console.warn(
        `[experiência] Não achei "${key}" em EXPERIENCIAS. Confira o data-experience da página.`,
      );
      return;
    }

    root.innerHTML = experiencePageHTML(data);
    initExperienceWeather(root, data);

    // Botão "Salvar no meu roteiro" (um listener só, na raiz)
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".historic-location__save");
      if (!btn || !root.contains(btn)) return;

      const isSaved = btn.classList.toggle("is-saved");
      btn.setAttribute("aria-pressed", String(isSaved));
      btn.innerHTML = isSaved
        ? `${experienceSvg(EXPERIENCE_ICONS.check)}<span>${EXPERIENCE_LABEL_SAVED}</span>`
        : `${experienceSvg(EXPERIENCE_ICONS.bookmark)}<span>${EXPERIENCE_LABEL_SAVE}</span>`;
    });

    // Imagem que não carregou (arquivo ainda não existe): esconde e avisa no console
    root.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (img && img.tagName === "IMG") {
          img.style.visibility = "hidden";
          console.warn(
            "[experiência] Imagem não encontrada:",
            img.getAttribute("src"),
          );
        }
      },
      true,
    );
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
    initExperiencePage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
