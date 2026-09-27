(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getBasePath() {
    return window.location.pathname.includes("/solucoes/") ? "../" : "./";
  }

  function resolveUrl(url) {
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

    const headerPromise = loadComponent(
      "components/header.html",
      "header-container",
    ).then((container) => {
      fixContainerPaths(container);
      highlightActiveNavLink(container);

      if (container && isSolutions) {
        const logoImg = container.querySelector(".logo-header");
        if (logoImg) {
          logoImg.setAttribute(
            "src",
            "../assets/img/logo-exploretevitoria.png",
          );
        }
      }

      return container;
    });

    const footerPromise = loadComponent(
      "components/footer.html",
      "footer-container",
    ).then(fixContainerPaths);

    const partnersPromise = loadComponent(
      "components/partners.html",
      "partners-container",
    ).then(fixContainerPaths);

    const contactPromise = loadComponent(
      "components/contact.html",
      "contact-container",
    ).then((container) => {
      fixContainerPaths(container);
      if (!container) return container;

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

      const contactForm = container.querySelector("#contactForm");
      if (contactForm) {
        contactForm.addEventListener("submit", async function (event) {
          event.preventDefault();

          const submitBtn = document.getElementById("btnSubmit");
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "A enviar...";
          }

          const dados = {
            nome: document.getElementById("name")?.value || "",
            email: document.getElementById("email")?.value || "",
            telefone: document.getElementById("phone")?.value || "",
            mensagem: document.getElementById("message")?.value || "",
          };

          try {
            const resposta = await fetch("http://localhost:3000/api/contato", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dados),
            });

            const resultado = await resposta.json();

            if (resultado.sucesso) {
              const numeroWhats = "5527996461183";

              const texto =
                `Olá! Vim pelo site Explore Vitória.%0A%0A` +
                `*Nome:* ${encodeURIComponent(dados.nome)}%0A` +
                `*E-mail:* ${encodeURIComponent(dados.email)}%0A` +
                `*Telefone:* ${encodeURIComponent(dados.telefone)}%0A` +
                `*Mensagem:* ${encodeURIComponent(dados.mensagem)}`;

              window.open(
                `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${texto}`,
                "_blank"
              );

              contactForm.reset();
            } else {
              alert("Ocorreu um erro ao guardar na base de dados: " + (resultado.mensagem || resultado.erro || "Erro desconhecido."));
            }
          } catch (error) {
            console.error("Erro de ligação:", error);
            alert("Não foi possível conectar ao servidor Node.js.");
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerText = "Enviar";
            }
          }
        });
      }

      return container;
    });

    const heroPromise = loadComponent(
      "components/banner-video.html",
      "hero-banner-container",
    ).then((container) => {
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

      return container;
    });

    Promise.all([
      headerPromise,
      footerPromise,
      partnersPromise,
      contactPromise,
      heroPromise,
    ]).then(() => {
      const idiomaSalvo = localStorage.getItem("idioma-selecionado") || "pt-BR";
      if (typeof mudarIdioma === "function") {
        mudarIdioma(idiomaSalvo);
      }
    });
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

    // CORREÇÃO CRÍTICA: Atualiza o scrollStart ao ajustar a posição do loop
    function normalizeScroll() {
      const loopWidth = getLoopWidth();
      if (!loopWidth || !Number.isFinite(loopWidth) || loopWidth === 0) return;

      if (trackEl.scrollLeft < loopWidth * 0.5) {
        trackEl.scrollLeft += loopWidth;
        if (isDown) scrollStart += loopWidth;
      } else if (trackEl.scrollLeft > loopWidth * 1.5) {
        trackEl.scrollLeft -= loopWidth;
        if (isDown) scrollStart -= loopWidth;
      }
    }

    const setSnapDisabled = (state) => {
      carousel?.classList.toggle("is-dragging", state);
      trackEl.classList.toggle("is-dragging", state);
      trackEl.style.scrollBehavior = state ? "auto" : "";
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

      try {
        trackEl.setPointerCapture(e.pointerId);
      } catch {}
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

      // Se parou de mover o mouse por mais de 80ms antes de soltar, ignora inércia
      if (performance.now() - lastTime > 80) {
        velocity = 0;
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
      try {
        track.setPointerCapture(e.pointerId);
      } catch {}
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

  function isYouTubeUrl(url) {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/i.test(url);
  }

  function getYouTubeEmbedUrl(url) {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
    );

    if (!match || !match[1]) return "";
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  }

  function initVideoModal(trackEl) {
    if (!trackEl) return;
    if (trackEl.dataset.videoModalInitialized === "true") return;
    trackEl.dataset.videoModalInitialized = "true";

    function getModalElements() {
      const modal = document.getElementById("videoModal");
      const player = document.getElementById("videoModalPlayer");
      return { modal, player };
    }

    function openModal(src) {
      if (!src) return;

      const { modal, player } = getModalElements();
      if (!modal || !player) {
        console.warn(
          "Modal de vídeo não encontrado: verifique se #videoModal e #videoModalPlayer existem no HTML."
        );
        return;
      }

      const rawSrc = src.trim();
      player.innerHTML = "";

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
        video.play().catch((err) => {
          console.warn("Erro ou restrição na reprodução do vídeo:", err);
        });
      }

      modal.classList.add("is-open");
      document.body.classList.add("video-modal-open");
    }

    function closeModal() {
      const { modal, player } = getModalElements();
      if (!modal || !player) return;

      modal.classList.remove("is-open");
      document.body.classList.remove("video-modal-open");

      const video = player.querySelector("video");
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      player.innerHTML = "";
    }

    let pressedCard = null;

    trackEl.addEventListener("pointerdown", (e) => {
      pressedCard = e.target.closest(".video-card");
    });

    trackEl.addEventListener(
      "click",
      (e) => {
        const card = e.target.closest(".video-card") || pressedCard;
        pressedCard = null;

        if (e.defaultPrevented || !card || !trackEl.contains(card)) return;

        e.preventDefault();
        openModal(card.getAttribute("data-video"));
      },
      true,
    );

    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".video-modal__close") ||
        e.target.closest(".video-modal__backdrop")
      ) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.resposta ||
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
    chevron: '<polyline points="6 9 12 15 18 9"/>',
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

  const EXPERIENCE_LABEL_MORE = "Ver mais";
  const EXPERIENCE_LABEL_LESS = "Ver menos";
  const EXPERIENCE_INTRO_MIN = 140;
  const EXPERIENCE_INTRO_MAX = 300;
  const EXPERIENCE_MORE_MIN = 120;
  const EXPERIENCE_PARAGRAPH_MAX = 320;

  const EXPERIENCE_PLAN = {
    kicker: "Planejar viagem",
    title: "Planeje sua viagem",
    text: "Deixe a IA montar um roteiro personalizado com mapa em PDF.",
    ctaLabel: "Montar roteiro",
    ctaUrl: "../mochilao.html",
    cards: [
      { type: "weather", label: "Clima agora" },
      {
        icon: "waves",
        label: "Maré do dia",
        value: "Cheia 14:32 · baixa 20:50",
      },
    ],
  };

  const EXPERIENCE_WEATHER = {
    city: "Vitória",
    latitude: -20.3155,
    longitude: -40.3128,
    timezone: "America/Sao_Paulo",
    cacheMinutes: 10,
  };

  const EXPERIENCIAS = {
    historico: {
      hero: {
        image:
          "https://media.base44.com/images/public/6ab043291eb7ef8c1be42282/a65d237a3_generated_abf2b648.jpg",
        alt: "Centro Histórico de Vitória",
      },
      kicker: "Patrimônio",
      title: "Turismo Histórico e Cultural",
      subtitle:
        "Igrejas, palácios, teatros, escadarias e construções que preservam mais de quatro séculos da história de Vitória e ajudam a contar a formação cultural do Espírito Santo.",
      guide: {
        title: "Dicas práticas para visitantes estrangeiros",
        items: [
          {
            icon: "clock",
            label: "Melhor momento",
            text: "Prefira as manhãs ou o fim da tarde para caminhar pelo Centro Histórico, especialmente nos períodos mais quentes do ano. O roteiro reúne diversos monumentos próximos e pode ser feito parcialmente a pé.",
          },
          {
            icon: "shield",
            label: "Segurança",
            text: "Durante o passeio pelo Centro Histórico, mantenha documentos, celular e outros objetos pessoais próximos. Prefira circular pelas áreas movimentadas e durante o dia.",
          },
          {
            icon: "language",
            label: "Idioma",
            text: "O idioma oficial é o português. O programa Visitar possui sinalização turística interpretativa e mapa do Centro Histórico com informações bilíngues, facilitando a experiência de visitantes estrangeiros.",
          },
          {
            icon: "navigation",
            label: "Como chegar",
            text: "O Centro Histórico concentra vários atrativos próximos. É possível conhecer parte do roteiro caminhando pela Cidade Alta e utilizar ônibus ou aplicativos de transporte para chegar a outros pontos de Vitória.",
          },
        ],
        note: "O programa Visitar Centro Histórico oferece atendimento turístico gratuito e monitores em monumentos históricos da região. Para grupos com mais de 10 pessoas, é possível realizar agendamento.",
      },
      galleryTitle: "Lugares para conhecer",
      locations: [
        {
          name: "Palácio Anchieta",
          description:
            "Localizado na Cidade Alta, no Centro Histórico de Vitória, o Palácio Anchieta é uma das construções mais importantes da história do Espírito Santo. Sua origem remonta ao século XVI, quando o local abrigava o Colégio de São Tiago, ligado aos padres jesuítas. Com a expulsão dos jesuítas, o edifício passou por diferentes funções administrativas e tornou-se sede do Governo do Espírito Santo. O prédio passou por importantes restaurações ao longo de sua história e preserva ambientes, móveis e elementos arquitetônicos relacionados à trajetória política e cultural do Estado.",
          tip: "Visitação: terça a sexta, das 9h às 17h; aos sábados, das 9h às 16h. Para informações sobre visitas guiadas e agendamentos, consulte a programação oficial do Palácio Anchieta.",
          image: "/assets/img/4ad2bc4086b0e93ffb1f8c468eb771fa.jpg",
        },
        {
          name: "Catedral Metropolitana de Vitória",
          description:
            "A história da Catedral Metropolitana de Vitória remonta ao século XVI. Uma primeira capela provavelmente foi construída por volta de 1550, tornando-se um marco da antiga Vila de Nossa Senhora da Vitória. Ao longo dos séculos, o templo foi ampliado e substituído até dar lugar à atual catedral. As obras da construção atual começaram em 1920 e foram concluídas em 1970. O edifício apresenta arquitetura eclética com características neogóticas e possui vitrais que estão entre seus elementos mais marcantes. Em 1984, a Catedral foi tombada pelo Conselho Estadual de Cultura.",
          tip: "Visitas monitoradas e gratuitas pelo programa Visitar, de quarta a domingo, inclusive feriados, das 13h às 17h.",
          image: "/assets/img/ef3c9bbe8ce466af0345944f3e4cff23.jpg",
        },
        {
          name: "Farol de Santa Luzia",
          description:
            "Inaugurado em 1871 durante o reinado de Dom Pedro II, o Farol de Santa Luzia é um dos principais cartões-postais de Vila Velha e guarda a entrada da Baía de Vitória. A torre octogonal de 12 metros de altura, feita em ferro fundido, foi fabricada na Escócia (Glasgow) e trazida de navio para o Brasil. Além da sua importância histórica e naval para a orientação das embarcações, o local oferece uma vista panorâmica espetacular do mar, da orla de Vila Velha e de Vitória, cercado por um belo ambiente preservado.",
          tip: "A entrada é gratuita, mas há limite de pessoas simultâneas e o farol costuma fechar às segundas-feiras para manutenção. Chegue cedo para garantir boas fotos e evitar filas nos finais de semana.",
          image: "/assets/img/905364d20d717798d9afbba811e28584.jpg",
        },
        {
          name: "Igreja de São Gonçalo",
          description:
            "A Igreja de São Gonçalo está localizada na Cidade Alta e possui uma história ligada às antigas irmandades religiosas de Vitória. No local existia uma capela dedicada a Nossa Senhora do Amparo e da Boa Morte. Em 1715, a irmandade solicitou autorização para construir uma nova igreja dedicada a São Gonçalo Garcia. A construção em pedra e cal foi concluída em 1766. O templo apresenta elementos associados à arquitetura barroca, incluindo entalhes em madeira pintados de dourado no altar-mor. Em seu interior também estão duas imagens portuguesas do século XVII. A igreja foi tombada pelo IPHAN em 1948.",
          tip: "O local integra o patrimônio histórico do Centro de Vitória. Para visitação monitorada, consulte previamente a programação atual do programa Visitar.",
          image: "/assets/img/0c43b1fa16bb818a4b86708f02de3de2.jpg",
        },
        {
          name: "Convento São Francisco",
          description:
            "O Convento São Francisco foi construído no final do século XVI pelos padres franciscanos, atendendo a um pedido de Vasco Fernandes Coutinho Filho, segundo donatário da Capitania do Espírito Santo. O conjunto religioso incluía o convento, a igreja dedicada a São Francisco de Assis e a Capela da Ordem Terceira da Penitência. O complexo teve diferentes funções ao longo do tempo, incluindo atividades religiosas, escola, enfermaria e outras utilizações. Atualmente, o espaço abriga a Cúria Metropolitana e entidades ligadas à Igreja Católica. O frontispício preservado foi reformado nos séculos XVIII e o conjunto foi tombado pelo Conselho Estadual de Cultura em 1984.",
          tip: "Visitas pelo programa Visitar: quarta a sexta, das 13h às 17h; sábado e domingo, das 9h às 13h. O serviço de monitoria é gratuito.",
          image: "/assets/img/0ac0e89eb4e6ab9019b732280c5a984b.jpg",
        },
        {
          name: "Parque Pedra da Cebola",
          description:
            "Um dos parques mais famosos e visitados de Vitória, o Parque Pedra da Cebola leva esse nome devido a uma curiosa formação rochosa esculpida pela natureza que lembra uma cebola descascando. O espaço, que antigamente abrigava uma pedreira, hoje é um grande refúgio verde localizado entre os bairros Jardim da Penha e Mata da Praia. O parque oferece uma rica biodiversidade com vegetação de Mata Atlântica e restinga, um belo jardim oriental, lagos, campo de futebol, parquinhos e amplos gramados. É comum cruzar com animais silvestres soltos pelo local, como iguanas, tartarugas e diversas espécies de aves.",
          tip: "O lugar é perfeito para fazer um piquenique ou caminhar no fim da tarde. Leve sua canga para relaxar no gramado, mas lembre-se da regra principal do parque: é proibido alimentar os animais silvestres.",
          image: "/assets/img/57ef4c891bca1bdf0ace1a6e0a1e4f84.jpg",
        },
        {
          name: "Igreja Nossa Senhora do Carmo",
          description:
            "A história do conjunto Nossa Senhora do Carmo começou no século XVII, quando os padres carmelitas se estabeleceram na região de Vitória. Por volta de 1675, começou a construção do Convento de Nossa Senhora do Monte do Carmo, que incluía a igreja e a Capela da Ordem Terceira. O conjunto originalmente apresentava características da arquitetura colonial e barroca. Ao longo do tempo, o espaço passou por diversas transformações e chegou a ser utilizado pelo governo provincial. Entre 1910 e 1913, o convento passou por uma grande reforma. A igreja preserva imagens religiosas e quadros da Via-Crucis.",
          tip: "Visitas pelo programa Visitar: quarta a sexta, das 13h às 17h; sábado e domingo, das 9h às 13h. O atendimento turístico é gratuito.",
          image: "/assets/img/normal@2x.jpg",
        },
        {
          name: "Theatro Carlos Gomes",
          description:
            "O Theatro Carlos Gomes é um dos principais símbolos culturais do Centro de Vitória. Sua construção ocorreu após o antigo Teatro Melpômene sofrer um incêndio em 1924. O governo estadual decidiu construir um novo teatro na região da Praça Costa Pereira. O projeto foi realizado pelo arquiteto autodidata e construtor André Carloni, que reutilizou colunas de ferro fundido do antigo teatro para sustentar os balcões e galerias. A construção foi concluída em janeiro de 1927, seguindo o estilo arquitetônico eclético. O teatro passou por uma grande restauração em 1970 e foi tombado pelo Conselho Estadual de Cultura em 1983.",
          tip: "O Theatro Carlos Gomes recebe programação cultural e artística. Para conhecer apresentações, visitas e horários de funcionamento, consulte a programação oficial antes de ir.",
          image: "/assets/img/Theatro_Carlos_Gomes_(Vitória,_Brasil).jpg",
        },
        {
          name: "Parque Moscoso",
          description:
            "Inaugurado em 1912, o Parque Moscoso é um dos espaços públicos históricos mais antigos de Vitória. O parque foi criado durante o processo de modernização urbana promovido pelo governo de Jerônimo Monteiro e possui aproximadamente 24 mil metros quadrados. Inspirado em jardins europeus, o espaço possui áreas arborizadas, alamedas, lagos, fontes e jardins. Um dos seus principais elementos é a Concha Acústica, palco histórico de apresentações culturais e estrutura tombada como patrimônio cultural pelo Conselho Estadual de Cultura.",
          tip: "Aberto todos os dias, das 5h às 22h. Às segundas-feiras, o parque permanece fechado das 9h às 17h para manutenção.",
          image: "/assets/img/20171119-114743-largejpg.jpg",
        },
      ],
    },

    gastronomia: {
      hero: {
        image: "/assets/img/b061a3a177a27f9a8fa3687f2ac27294.jpg",
        alt: "Gastronomia Capixaba e Moqueca",
      },
      kicker: "Sabores",
      title: "Turismo Gastronômico e Culinária Típica",
      subtitle:
        "Da tradicional panela de barro à fusão de sabores do mar e da terra, a gastronomia capixaba preserva receitas centenárias, frutos do mar frescos e uma identidade única reconhecida nacionalmente.",
      guide: {
        title: "Dicas práticas para visitantes estrangeiros",
        items: [
          {
            icon: "clock",
            label: "Melhor momento",
            text: "O horário do almoço é ideal para desfrutar da tradicional Moqueca Capixaba acompanhada de pirão e arroz. À noite, os polos gastronômicos da Praia do Canto oferecem excelentes opções de petiscos e jantares.",
          },
          {
            icon: "shield",
            label: "Segurança",
            text: "Os polos gastronômicos e restaurantes recomendados estão localizados em áreas seguras e movimentadas de Vitória e Vila Velha. Mantenha seus pertences monitorados ao sentar em mesas nas calçadas.",
          },
          {
            icon: "language",
            label: "Idioma",
            text: "O idioma oficial é o português. Muitos restaurantes nos principais polos turísticos possuem cardápios bilíngues (inglês/espanhol) e equipes capacitadas para atender turistas estrangeiros.",
          },
          {
            icon: "navigation",
            label: "Como chegar",
            text: "Os principais restaurantes e galpões de culinária típica estão concentrados em regiões de fácil acesso, como a Ilha das Caieiras, a Praia do Canto e a orla de Camburi, acessíveis por táxi ou aplicativos de transporte.",
          },
        ],
        note: "A autêntica Moqueca Capixaba é preparada exclusivamente em panela de barro feita por paneleiras artesãs de Goiabeiras, patrimônio cultural do Brasil. A receita não leva azeite de dendê nem leite de coco.",
      },
      galleryTitle: "Onde comer e o que saborear",
      locations: [
        {
          name: "Panela Capixaba",
          description:
            "Restaurante tradicional no HortoMercado, referência em moqueca e culinária típica capixaba com excelente custo-benefício. Situado no tradicional HortoMercado da Enseada do Suá, o Panela Capixaba é um dos grandes guardiões da gastronomia regional em Vitória. O restaurante nasceu com o compromisso de resgatar e valorizar as receitas raízes do Espírito Santo, trazendo a autêntica Moqueca Capixaba preparada em panelas de barro artesanais produzidas pelas paneleiras de Goiabeiras. O ambiente é acolhedor, espaçoso e descontraído, ideal para reuniões de família e almoços em grupo. Além da moqueca de peixe e camarão, a experiência se completa com a famosa Torta Capixaba, moquequinha de banana, casquinha de siri e petiscos de frutos do mar bem servidos, consolidando o local como uma das opções de melhor custo-benefício para provar a verdadeira culinária capixaba com sabor caseiro e regional.",
          tip: "Aberto de segunda a sábado das 11h às 23h e aos domingos das 11h às 16h.",
          image: "/assets/img/panelacapi.webp",
        },
        {
          name: "Partido Alto",
          description:
            "Fundado em 1983, o Restaurante Partido Alto é uma das maiores referências em culinária capixaba e frutos do mar em Vitória. Localizado na Praia do Canto (na movimentada Rua João da Cruz), o estabelecimento destaca-se pelo preparo da autêntica Moqueca Capixaba servida na panela de barro, além de casquinha de siri, torta capixaba e pratos com peixes e mariscos frescos.",
          tip: "Aberto de segunda a sábado das 11h às 01h e aos domingos das 11h às 00h, é ideal tanto para o almoço quanto para o jantar na Praia do Canto.",
          image: "/assets/img/partidoalto.jpg",
        },
        {
          name: "Don Camaleone",
          description:
            "Forneria e pizzaria descolada na Praia do Canto, famosa pelas pizzas artesanais de massa fina, drinks autorais e ambiente moderno. Inaugurada no final dos anos 2000 no coração da Praia do Canto, a Don Camaleone surgiu com a proposta de unir a tradição da pizza italiana ao conceito de forneria moderna e cosmopolita. A casa é famosa por sua arquitetura marcante e urbana, combinando iluminação aconchegante, arte e uma atmosfera jovem e animada. No cardápio, o grande destaque são as pizzas assadas no forno a lenha, preparadas com massa fina e crocante e recheios nobres, além de entradas clássicas como focaccias e arancinis, massas bem elaboradas e uma das cartas de drinks e cervejas mais movimentadas do bairro.",
          tip: "Aberto diariamente a partir das 17h30 até as 23h30. É recomendável chegar cedo nos fins de semana, pois o local costuma ter fila de espera devido à grande popularidade.",
          image: "/assets/img/doncamaleone.jpeg",
        },
        {
          name: "A Oca - Botequim & Aconchego",
          description:
            "Espaço cultural e gastronômico no Centro Histórico de Vitória, famoso por pratos executivos saborosos, petiscos brasileiros e ambiente acolhedor. Localizada em um casarão charmoso no Centro Histórico de Vitória, A Oca é muito mais do que um restaurante: é um ponto de encontro cultural que celebra a brasilidade, a arte e a boa gastronomia. O espaço surgiu com a proposta de revitalizar a experiência no centro da capital, oferecendo um ambiente aconchegante, repleto de elementos artísticos, música ao vivo e vegetação. Durante o dia, destaca-se pelos almoços executivos com tempero caseiro sofisticado e preços bastante acessíveis. À noite e nos fins de semana, o local se transforma em um botequim descontraído, servindo petiscos brasileiros criativos, opções vegetarianas e veganas, chope gelado e drinks autorais. A experiência na Oca combina sabor, preços justos e uma imersão na efervescência cultural e boêmia de Vitória.",
          tip: "Aberto de terça a quinta das 12h às 15h, sextas e sábados das 12h às 23h e domingos das 12h às 17h. Excelente escolha para almoços durante a semana ou para curtir o fim de tarde no Centro Histórico.",
          image: "/assets/img/aoca.jpg",
        },
        {
          name: "Divino Botequim",
          description:
            "Boteco clássico e boêmio em Jardim da Penha, famoso pela comida de boteco premiada, feijoada aos sábados e chope trincando. Fundado no tradicional bairro de Jardim da Penha, o Divino Botequim é uma das grandes instituições da boemia e da cultura de boteco em Vitória. Com mesas espalhadas pela calçada e um clima super urbano, acolhedor e descontraído, o local atrai desde turmas de amigos para o happy hour até famílias em almoços de fim de semana. O grande destaque da casa é a gastronomia de botequim raiz elevada a outro patamar, com petiscos premiados no festival Roda de Boteco, como torresmo crocante, bolinhos recheados, gurjões de peixe e moquequinhas. Aos sábados, o local vira ponto de encontro para a tradicional feijoada completa servida com samba e cerveja bem gelada, proporcionando uma experiência legitimamente capixaba, boêmia e de preço justo.",
          tip: "Aberto de terça a sexta das 17h às 00h, sábados das 11h30 às 00h e domingos das 11h30 às 17h. A feijoada de sábado é concorridíssima, então vale a pena chegar cedo.",
          image: "/assets/img/divinobutequin.jpg",
        },
        {
          name: "Casa de Bamba",
          description:
            "Ponto de encontro cultural e boêmio no Centro de Vitória, combinando roda de samba, brasilidade, comida de boteco gourmet e drinks. A Casa de Bamba é um dos centros culturais e gastronômicos mais vibrantes do Centro Histórico de Vitória. Com uma pegada totalmente urbana e focada na valorização da música e da brasilidade, o espaço atrai artistas, estudantes e amantes da boemia. A experiência combina apresentações ao vivo — que variam do samba de raiz ao choro e MPB — com uma gastronomia de boteco bem executada. O cardápio conta com porções fartas, caldos, arrumadinhos, opções vegetarianas e petiscos regionais a preços honestos, além de cerveja bem gelada e cachaças artesanais. É a escolha ideal para quem quer sentir a energia cultural noturna do centro da cidade.",
          tip: "Aberto de quarta a sábado das 18h às 00h. Vale a pena conferir a programação musical nas redes sociais antes de ir, pois costuma ter rodas de samba bastante movimentadas.",
          image: "/assets/img/casadabamba.jpg",
        },
      ],
    },
    //praias

    praia: {
      hero: {
        image: "/assets/img/praia.jpg",
        alt: "Orla da Praia de Camburi",
      },
      kicker: "Litoral",
      title: "Praias, Ilhas e Orlas Marítimas",
      subtitle:
        "Com uma costa deslumbrante que combina praias urbanas bem estruturadas, enseadas de águas calmas e vilas históricas de pescadores, o litoral de Vitória oferece o cenário perfeito para relaxar e praticar desportos à beira-mar.",
      guide: {
        title: "Dicas práticas para visitantes estrangeiros",
        items: [
          {
            icon: "sun",
            label: "Melhor momento",
            text: "As manhãs e o início da tarde são ideais para aproveitar o banho de mar em praias de águas calmas, como a Ilha do Boi e a Curva da Jurema. O fim da tarde é perfeito para caminhadas no calçadão de Camburi.",
          },
          {
            icon: "shield",
            label: "Segurança",
            text: "As praias da capital contam com postos de salvamento e policiamento frequente. Mantenha os seus pertences à vista ao ir ao mar e evite nadar longe da costa em áreas com correntes.",
          },
          {
            icon: "umbrella",
            label: "Estrutura",
            text: "A maioria das praias conta com quiosques modernos, aluguer de espreguiçadeiras, guarda-sóis e serviço de mesa na areia, aceitando pagamentos em cartão ou por aproximação.",
          },
          {
            icon: "navigation",
            label: "Como chegar",
            text: "Todas as principais praias da cidade estão localizadas na área urbana e possuem fácil acesso via aplicações de transporte, autocarros municipais ou passeios de bicicleta pela ciclovia da orla.",
          },
        ],
        note: "Vitória é uma ilha cercada por manguezais, enseadas e vegetação de restinga. Respeite a fauna local e utilize os contentores de lixo espalhados ao longo de todos os calçadões.",
      },
      galleryTitle: "Praias imperdíveis para conhecer em Vitória",
      locations: [
        {
          name: "Praia de Camburi",
          description:
            "A praia urbana mais famosa e extensa de Vitória, perfeita para caminhadas, esportes náuticos, quiosques modernos e um pôr do sol incrível.Com cerca de 6 km de orla, a Praia de Camburi é o verdadeiro cartão-postal e ponto de encontro ao ar livre na capital capixaba. Localizada na zona norte da cidade, a praia conta com um calçadão largo muito frequentado para caminhadas, corridas e passeios de bicicleta, além de quiosques modernos que servem petiscos, água de coco e pratos da culinária local. Por ter um mar de águas calmas em alguns trechos e mais agitado em outros, atrai praticantes de stand-up paddle, kitesurf e vela. É o local ideal para sentir o ritmo urbano e litorâneo da cidade tanto de dia quanto à noite.",
          tip: "Acesso livre 24 horas. O calçadão fica especialmente movimentado e agradável no fim da tarde para ver o pôr do sol ou fazer atividades físicas.",
          image: "/assets/img/praiacamburi.jpg",
        },
        {
          name: "Praia da Curva da Jurema",
          description:
            "Praia de águas calmas próxima ao Shopping Vitória, famosa por seus quiosques charmosos, gastronomia diversificada e vista para a Terceira Ponte.Localizada estrategicamente entre a Praia do Canto e a Enseada do Suá, a Curva da Jurema se destaca pelas suas águas tranquilas e sem ondas, protegidas por recifes naturais. Nos últimos anos, a orla passou por uma revitalização que transformou seus quiosques em lounges e restaurantes à beira-mar com propostas gastronômicas refinadas e descontraídas. É uma das praias favoritas dos moradores para tomar banho de mar com segurança, praticar esportes de areia como beach tennis e futevôlei, ou simplesmente relaxar admirando a vista para a Terceira Ponte e o Convento da Penha ao fundo.",
          tip: "Acesso livre. Os quiosques funcionam geralmente das 09h às 22h, sendo uma ótima opção para emendar a praia com um almoço ou drink ao pôr do sol.",
          image: "/assets/img/curvajurema.jpg",
        },
        {
          name: "Praia do Canto (Praia das Castanheiras)",
          description:
            "Pequena praia urbana e arborizada no bairro da Praia do Canto, com mar tranquilo e sombra natural de castanheiras.Escondida ao longo da orla do bairro nobre da Praia do Canto e próxima às Praças dos Namorados e do Desejo, essa pequena faixa de areia é um refúgio calmo e muito arborizado. Sombreada por frondosas castanheiras, a praia possui mar extremamente calmo e raso, parecendo uma piscina natural, o que a torna ideal para famílias com crianças pequenas e para quem busca relaxar no meio da cidade. Além disso, sua localização permite conciliar um momento de descanso à beira-mar com um passeio pelo polo gastronômico e de lojas do bairro.",
          tip: "Acesso livre 24 horas. Muito recomendada para ir pela manhã ou início da tarde aproveitando a sombra natural das árvores.",
          image: "/assets/img/praiacanto.jpg",
        },
        {
          name: "Ilha do Boi (Praia da Direita e Praia da Esquerda)",
          description:
            "Praias paradisíacas com águas cristalinas e esverdeadas em um dos bairros mais nobres e calmos da ilha de Vitória.Localizada em um bairro residencial de alto padrão em uma península da cidade, a Ilha do Boi abriga duas das praias mais bonitas e frequentadas da capital: a Praia da Direita e a Praia da Esquerda. Cercadas por pedras, vegetação nativa e com águas calmas, limpas e em tons de verde, essas pequenas enseadas parecem verdadeiras piscinas naturais escondidas na área urbana. É o destino preferido do público jovem e de quem busca um visual paradisíaco, ótimo para mergulho e contemplação da natureza.",
          tip: "Acesso livre. O estacionamento no bairro é limitado, por isso vale a pena chegar cedo nos fins de semana e ensolarados.",
          image: "/assets/img/ilhaboi.jpg",
        },
        {
          name: "Ilha das Caieiras",
          description:
            "Polo histórico, gastronômico e litorâneo no manguezal de Vitória, berço da cultura das desfiadeiras de siri e da moqueca tradicional.Localizada no canal do manguezal na região noroeste de Vitória, a Ilha das Caieiras oferece uma experiência litorânea única e culturalmente rica. Antiga colônia de pescadores e uma das ocupações mais antigas da ilha, o local é o berço das tradicionais desfiadeiras de siri e paneleiras. Com um deck à beira da baía de Vitória, a região une um visual bucólico de barcos coloridos e manguezais a diversos restaurantes especializados em moquecas, torta capixaba e frutos do mar frescos. É um passeio imperdível para quem quer vivenciar o litoral pelo lado histórico, comunitário e gastronômico da capital.",
          tip: "Acesso livre. Os restaurantes do deck funcionam geralmente entre 10h e 17h, sendo o destino ideal para o almoço de fim de semana.",
          image: "/assets/img/ilhacareiras.jpg",
        },
      ],
    },

    "vida-noturna": {
    hero: {
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
      alt: "Vida Noturna e Lazer Econômico em Vitória",
    },
    kicker: "Lazer & Noite",
    title: "Vida Noturna e Lazer Barato",
    subtitle:
      "Aproveite a boemia capixaba sem pesar no bolso: bares universitários, feirinhas ao ar livre, música ao vivo e calçadões agitados.",
    guide: {
      title: "Dicas para economizar na noite capixaba",
      items: [
        {
          icon: "glass",
          label: "Dobradinha & Happy Hour",
          text: "Muitos bares na Rua da Lama e em Jardim da Penha oferecem promoções de chopp e petiscos até as 20h.",
        },
        {
          icon: "music",
          label: "Eventos na Rua",
          text: "Praças e calçadões costumam ter shows gratuitos, feirinhas gastronômicas e rodas de samba nos fins de semana.",
        },
      ],
      note: "Dica de economia: prefira transporte coletivo ou aplicativo dividido em grupo ao frequentar os polos boêmios.",
    },
    galleryTitle: "Onde ir gastando pouco",
    locations: [
      {
        name: "Rua da Lama (Jardim da Penha)",
        description:
          "O polo boêmio universitário mais famoso da cidade. Repleto de bares com mesas na calçada, cerveja barata e espetinhos.",
        tip: "Ideal para ir em grupo. Os preços são acessíveis e o ambiente é descontraído ao ar livre.",
        image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Triângulo das Bermudas (Praia do Canto)",
        description:
          "Apesar de ter opções sofisticadas, possui diversos pubs e bares com happy hour econômico e boa música ao vivo.",
        tip: "Chegue cedo (entre 18h e 20h) para aproveitar as promoções de comida e bebida antes dos horários de pico.",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Feirinha da Praça dos Namorados",
        description:
          "Realizada nos fins de semana, combina artesanato, música e uma praça de alimentação variada a preços populares.",
        tip: "Uma ótima opção de lazer noturno para passear, comer bem e gastar pouco antes de estender a noite.",
        image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Centro Histórico & Rua Sete",
        description:
          "Ponto de encontro do público alternativo, com bares culturais, rodas de samba de rua e drinks a preços acessíveis.",
        tip: "Fique atento à programação cultural das praças do Centro, que frequentemente contam com eventos gratuitos.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
      },
     
      {
        name: "Calçadão de Camburi (Quiosques Noturnos)",
        description:
          "Ótimo local para caminhadas noturnas, água de coco ou cerveja gelada nos quiosques com música ao vivo e brisa do mar.",
        tip: "Lazer 100% gratuito para passear e com opções de lanches e porções acessíveis nos quiosques.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
      },
      
      {
        name: "Praça do Papa (Enseada do Suá)",
        description:
          "Espaço amplo com vista panorâmica para a Terceira Ponte e Convento da Penha. Ponto de encontro para food trucks e luaus.",
        tip: "Leve a sua própria bebida ou lanche para fazer um piquenique noturno com uma das melhores vistas da cidade.",
        image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&auto=format&fit=crop",
      }
    ],
  },
  "compras-artesanato": {
    hero: {
      image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1200&auto=format&fit=crop",
      alt: "Feiras de Artesanato e Compras em Vitória",
    },
    kicker: "Compras & Cultura",
    title: "Feiras, Artesanato e Compras Econômicas",
    subtitle:
      "Descubra os melhores locais em Vitória e região para adquirir souvenirs autênticos, arte local, roupas e artigos artesanais direto de quem produz, garantindo excelentes preços e apoiando a cultura capixaba.",
    guide: {
      title: "Guia e Dicas Práticas para Economizar nas Compras",
      items: [
        {
          icon: "tag",
          label: "Direto do Produtor",
          text: "Comprar diretamente em feiras de rua ou associações comunitárias elimina intermediários, garantindo um valor muito mais acessível e apoiando o trabalho local.",
        },
        {
          icon: "shopping-bag",
          label: "Pechincha e Formas de Pagamento",
          text: "Muitos expositores e lojas populares oferecem margem de negociação e ótimos descontos ao optar por pagamentos em dinheiro ou via Pix.",
        },
      ],
      note: "Dica de ouro: A autêntica Panela de Barro conta com selo de Indicação Geográfica e é confeccionada manualmente pelas paneleiras registradas na Associação de Goiabeiras.",
    },
    galleryTitle: "Onde Fazer Compras Gastando Pouco",
    locations: [
      {
        name: "Associação das Paneleiras de Goiabeiras",
        description:
          "O galpão oficial onde é mantida viva a tradição secular do fazer artesanal da Panela de Barro Capixaba, patrimônio imaterial do Brasil. Aqui você encontra desde minipaneiras para lembrancinhas até conjuntos completos para cozinhar a tradicional moqueca. Comprar diretamente no galpão com as artesãs garante os menores preços do Estado e peças autênticas de alta durabilidade.",
        tip: "Além de adquirir as peças por valores bem menores que no comércio tradicional, você pode observar gratuitamente todo o processo de modelagem, queima e tintura com casca de mangue vermelho.",
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Feirinha da Praça dos Namorados (Artesanato)",
        description:
          "Um dos pontos turísticos e culturais mais tradicionais das noites de fim de semana na Praia do Canto. A feira reúne centenas de barracas com grande variedade de produtos: vestuário artesanal, peças em couro, bijuterias, bolsas, cerâmicas, objetos de decoração e souvenirs temáticos do Espírito Santo, atendendo a todos os orçamentos.",
        tip: "Ideal para passear no início da noite de sábado ou domingo. É o melhor local para comprar lembrancinhas criativas, como ímãs, chaveiros e acessórios exclusivos por valores super em conta.",
        image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Polo de Moda da Glória (Vila Velha)",
        description:
          "Localizado a poucos minutos do centro de Vitória, o Polo da Glória é o maior centro comercial a céu aberto focado em vestuário e calçados da Região Metropolitana. Com centenas de lojas de fábrica e galerias populares, o local oferece moda praia, moda feminina, masculina e infantil com preços de atacado e varejo imbatíveis.",
        tip: "Excelente para quem quer renovar o guarda-roupa ou comprar biquínis, sungas e roupas de praia com valores muito inferiores aos praticados nos shoppings.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Mercado da Vila Rubim (Centro)",
        description:
          "O mercado popular mais antigo e emblemático de Vitória. Um verdadeiro celeiro da cultura capixaba onde você encontra de tudo: temperos frescos, pimentas locais, cachaças artesanais, camarão seco, panelas, utilidades em palha e vime, além de souvenirs regionais por preços imbatíveis no comércio varejista.",
        tip: "Lugar obrigatório para comprar produtos gastronômicos típicos para levar de viagem, como a tradicional pimenta da moqueca ou cachaças locais a preços bem populares.",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Feira de Orgânicos e Artesanato de Jardim da Penha",
        description:
          "Uma feira comunitária vibrante realizada ao ar livre que reúne pequenos produtores rurais e artesãos locais. Oferece desde bordados, crochês, saboaria natural e plantas ornamentais até doces caseiros, compotas e quitutes tradicionais com preços amigáveis e atendimento acolhedor.",
        tip: "Aproveite as manhãs de sábado para passear, tomar um café com quitutes caseiros e adquirir peças artesanais feitas por produtores independentes da região.",
        image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Lojas e Ateliês do Centro Histórico",
        description:
          "Nas redondezas do Palácio Anchieta e da Praça Costa Pereira, surgiram diversos coletivos artísticos e pequenas lojas colaborativas. Esses espaços reúnem produções de artistas independentes capixabas, como gravuras, quadros em miniatura, cerâmicas estilizadas, postais ilustrados e ecobags exclusivas.",
        tip: "Procure por postais pintados à mão e pequenas esculturas em cerâmica — são lembranças autênticas, cheias de identidade cultural e que custam muito pouco.",
        image: "https://images.unsplash.com/photo-1459908676235-d5f02a50184b?q=80&w=800&auto=format&fit=crop",
      }
    ],
  },
  "aventura-natureza": {
    hero: {
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      alt: "Trilhas, Parques e Natureza em Vitória",
    },
    kicker: "Ecoturismo & Ar Livre",
    title: "Aventura e Natureza Gastando Pouco",
    subtitle: "Explore parques naturais, trilhas com vistas panorâmicas, reservas florestais e mirantes incríveis em Vitória e arredores, aproveitando o melhor do ecoturismo sem pagar nada ou gastando muito pouco.",
    guide: {
      title: "Dicas Práticas para Aventureiros Econômicos",
      items: [
        {
          icon: "compass",
          label: "Acesso Gratuito",
          text: "A grande maioria dos parques municipais e estaduais da grande Vitória possui entrada 100% gratuita para caminhadas e contemplação.",
        },
        {
          icon: "sun",
          label: "Preparação e Economia",
          text: "Leve a sua própria garrafa de água para reabastecer nos bebedouros dos parques e prepare lanches leves para fazer um piquenique ao ar livre.",
        },
      ],
      note: "Dica de segurança: Para trilhas mais isoladas, como o Morro do Moreno ou Pedra da Cebola, prefira ir em grupo e nos horários de maior movimento pela manhã.",
    },
    galleryTitle: "Destinos Naturais e Imperdíveis",
    locations: [
      {
        name: "Parque Pedra da Cebola",
        description:
          "Um dos parques urbanos mais emblemáticos de Vitória, famoso pela enorme rocha esculpida pela natureza em formato de cebola. Oferece vasta área verde, lagos, répteis, aves soltas, parquinho infantil e amplo gramado ideal para piqueniques, caminhadas e contemplação.",
        tip: "A entrada é totalmente gratuita. É um local perfeito para descansar à sombra das árvores, praticar ioga ou fazer um piquenique econômico em família.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Trilha do Morro do Moreno (Vila Velha)",
        description:
          "Localizado bem ao lado da Terceira Ponte, o Morro do Moreno oferece diversas opções de trilhas com subidas de diferentes níveis de dificuldade e vias de escalada. No topo, o visitante é recompensado com uma das vistas panorâmicas mais impressionantes de Vitória, Vila Velha e da baía.",
        tip: "A caminhada pela estrada principal é gratuita e acessível. O melhor horário para subir é no início da manhã ou no fim da tarde para contemplar o pôr do sol.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Parque Estadual da Fonte Grande",
        description:
          "O verdadeiro pulmão verde da ilha de Vitória, encravado no coração da cidade. O parque conta com diversos mirantes estruturados (como o Mirante da Cidade e o do Sumaré) que oferecem vistas espetaculares de quase toda a Região Metropolitana e do canal de Vitória.",
        tip: "A entrada no centro de visitantes e o acesso aos mirantes são gratuitos. Conta com acompanhamento de guias em horários específicos e ótimas pistas de caminhada.",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Parque Botânico Vale",
        description:
          "Inserido em um cinturão verde no bairro Jardim Camburi, é um espaço de preservação da Mata Atlântica com trilhas ecológicas guiadas, orquidário, vagão cultural e áreas para caminhada e passeios em família.",
        tip: "A visitação é inteiramente gratuita. É um local extremamente seguro e limpo, excelente para passear com crianças e relaxar em meio à fauna e flora locais.",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Projeto Tamar (Praça do Papa)",
        description:
          "Localizado no Parque Moscoso/Enseada do Suá, o Centro de Visitação do Projeto Tamar oferece um espaço educativo com tanques de observação de tartarugas marinhas, exposição interativa, mirante com vista para a Terceira Ponte e ilhas próximas.",
        tip: "O ingresso tem preço simbólico e acessível, com opção de meia-entrada para estudantes e idosos, além de ter gratuidade em dias e eventos comunitários específicos.",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "Reserva Ecológica Ilha das Caieiras",
        description:
          "Tradicional vila de pescadores onde a natureza do manguezal se encontra com a cultura capixaba. Além de ser o berço da torta capixaba, o local oferece passeios de barco econômicos pelos canais de mangue, observação de garças e um pôr do sol inesquecível.",
        tip: "O passeio pelo deque de madeira à beira do mangue é gratuito. Passeios de barco comunitários no canal costumam ter preços bem em conta ao combinar com os barqueiros locais.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
      }
    ],
  },
  };

  

  function experienceSvg(inner, cls) {
    return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

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

  function experienceSplitText(text) {
    const clean = String(text ?? "").trim();
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length < 2) return { intro: clean, paragraphs: [] };

    let intro = "";
    let i = 0;

    while (i < sentences.length) {
      const next = intro ? `${intro} ${sentences[i]}` : sentences[i];
      if (
        intro &&
        (intro.length >= EXPERIENCE_INTRO_MIN ||
          next.length > EXPERIENCE_INTRO_MAX)
      ) {
        break;
      }
      intro = next;
      i++;
    }

    const rest = sentences.slice(i);
    if (rest.join(" ").length < EXPERIENCE_MORE_MIN) {
      return { intro: clean, paragraphs: [] };
    }

    const paragraphs = [];
    let current = "";

    rest.forEach((sentence) => {
      current = current ? `${current} ${sentence}` : sentence;
      if (current.length >= EXPERIENCE_PARAGRAPH_MAX) {
        paragraphs.push(current);
        current = "";
      }
    });

    if (current) paragraphs.push(current);

    return { intro, paragraphs };
  }

  function experienceLocationsHTML(list) {
    return (list || [])
      .map((loc, i) => {
        const { intro, paragraphs } = experienceSplitText(loc.description);
        const hasMore = paragraphs.length > 0;
        const moreId = `experience-more-${i + 1}`;

        const toggleBtn = hasMore
          ? `
            <button type="button" class="historic-location__toggle" aria-expanded="false" aria-controls="${moreId}">
              <span>${EXPERIENCE_LABEL_MORE}</span>
              ${experienceSvg(EXPERIENCE_ICONS.chevron)}
            </button>`
          : "";

        const morePanel = hasMore
          ? `
          <div class="historic-location__more" id="${moreId}">
            <div class="historic-location__more-inner">
              <div class="historic-location__more-content">
                ${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
              </div>
            </div>
          </div>`
          : "";

        return `
        <article class="historic-location">
          <div class="historic-location__media">
            <img class="historic-location__img" src="${esc(loc.image)}" alt="${esc(loc.name)}" loading="lazy" />
            <span class="historic-location__badge">${String(i + 1).padStart(2, "0")}</span>
          </div>
          <div class="historic-location__body">
            <h3 class="historic-location__name">${esc(loc.name)}</h3>
            <p class="historic-location__desc">${esc(intro)}</p>
            ${toggleBtn}
            <div class="historic-location__tip">
              ${experienceSvg(EXPERIENCE_ICONS.clock)}
              <span>${esc(loc.tip)}</span>
            </div>
            <button type="button" class="historic-location__save" aria-pressed="false">
              ${experienceSvg(EXPERIENCE_ICONS.bookmark)}
              <span>${EXPERIENCE_LABEL_SAVE}</span>
            </button>
          </div>
          ${morePanel}
        </article>`;
      })
      .join("");
  }

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

    root.addEventListener("click", (e) => {
      const toggle = e.target.closest(".historic-location__toggle");
      if (toggle && root.contains(toggle)) {
        const card = toggle.closest(".historic-location");
        const panel = card && card.querySelector(".historic-location__more");
        if (!panel) return;

        const isOpen = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));

        const label = toggle.querySelector("span");
        if (label) {
          label.textContent = isOpen
            ? EXPERIENCE_LABEL_LESS
            : EXPERIENCE_LABEL_MORE;
        }
        return;
      }

      const btn = e.target.closest(".historic-location__save");
      if (!btn || !root.contains(btn)) return;

      const isSaved = btn.classList.toggle("is-saved");
      btn.setAttribute("aria-pressed", String(isSaved));
      btn.innerHTML = isSaved
        ? `${experienceSvg(EXPERIENCE_ICONS.check)}<span>${EXPERIENCE_LABEL_SAVED}</span>`
        : `${experienceSvg(EXPERIENCE_ICONS.bookmark)}<span>${EXPERIENCE_LABEL_SAVE}</span>`;
    });

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

// ==========================================
// SISTEMA DE TRADUÇÃO (PT-BR, PT-PT, EN)
// ==========================================

const translations = {
  "pt-BR": {
    "nav.home": "HOME",
    "nav.sobre": "SOBRE NÓS",
    "nav.experiencias": "EXPERIÊNCIAS",
    "exp.historia": "Turismo Histórico e Cultural",
    "exp.gastronomia": "Gastronomia Capixaba",
    "exp.praias": "Praias e Litoral",
    "exp.vidaNoturna": "Vida Noturna e Lazer",
    "exp.compras": "Compras e Artesanato",
    "exp.aventura": "Aventura e Natureza",
    "nav.mochilao": "MOCHILÃO",
    "nav.faleConosco": "FALE CONOSCO",
  },
  "pt-PT": {
    "nav.home": "INÍCIO",
    "nav.sobre": "QUEM SOMOS",
    "nav.experiencias": "EXPERIÊNCIAS",
    "exp.historia": "Turismo Histórico e Cultural",
    "exp.gastronomia": "Gastronomia local",
    "exp.praias": "Praias e Litoral",
    "exp.vidaNoturna": "Vida Noturna e Lazer",
    "exp.compras": "Compras e Artesanato",
    "exp.aventura": "Aventura e Natureza",
    "nav.mochilao": "MOCHILÃO",
    "nav.faleConosco": "CONTACTE-NOS",
  },
  en: {
    "nav.home": "HOME",
    "nav.sobre": "ABOUT US",
    "nav.experiencias": "EXPERIENCES",
    "exp.historia": "Historical & Cultural Tourism",
    "exp.gastronomia": "Local Gastronomy",
    "exp.praias": "Beaches & Coastline",
    "exp.vidaNoturna": "Nightlife & Leisure",
    "exp.compras": "Shopping & Handicrafts",
    "exp.aventura": "Adventure & Nature",
    "nav.mochilao": "BACKPACKING",
    "nav.faleConosco": "CONTACT US",
  },
};

function mudarIdioma(idioma) {
  const elementos = document.querySelectorAll("[data-i18n]");

  elementos.forEach((elemento) => {
    const chave = elemento.getAttribute("data-i18n");
    if (translations[idioma] && translations[idioma][chave]) {
      elemento.textContent = translations[idioma][chave];
    }
  });

  const labelMap = { "pt-BR": "PT-BR", "pt-PT": "PT-PT", en: "EN" };
  const labelElement = document.getElementById("current-lang-label");
  if (labelElement) {
    labelElement.textContent = labelMap[idioma];
  }

  localStorage.setItem("idioma-selecionado", idioma);
}

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Captura os dados diretamente pelos IDs do seu HTML
    const formData = {
        nome: document.getElementById('name').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('phone').value,
        mensagem: document.getElementById('message').value
    };

    // Validação básica
    if (!formData.nome || !formData.email || !formData.telefone) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/contato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.sucesso) {
            alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
            document.getElementById('contactForm').reset(); // Limpa os campos do formulário
        } else {
            alert('Erro: ' + result.mensagem);
        }
    } catch (error) {
        console.error('Erro na conexão com o servidor:', error);
        alert('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
});