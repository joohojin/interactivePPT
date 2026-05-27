(function () {
  const slides = window.DECK_SLIDES || [];
  const app = document.querySelector(".app");
  const stage = document.getElementById("stage");
  const thumbs = document.getElementById("thumbs");
  const currentSlide = document.getElementById("currentSlide");
  const totalSlides = document.getElementById("totalSlides");
  const progressBar = document.getElementById("progressBar");
  const notes = document.getElementById("speakerNotes");
  const notesText = document.getElementById("notesText");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const pointerBtn = document.getElementById("pointerBtn");
  const muteBtn = document.getElementById("muteBtn");

  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let hasRendered = false;
  let transitionInProgress = false;
  let pointerMode = false;
  let isMusicMuted = false;
  let currentMusicKey = null;
  let musicBlocked = false;
  let pendingCastTilt = null;
  let castTiltFrame = 0;
  const castTiltState = new WeakMap();
  let pendingSceneTilt = null;
  let sceneTiltFrame = 0;
  const sceneTiltState = new WeakMap();
  const useNativeViewTransitions = false;

  const image = (name) => `assets/img/${name}`;
  const music = (name) => `music/${encodeURIComponent(name)}`;
  const musicTracks = {
    home: {
      src: "120 BPM Metronome.mp3",
      volume: 0.34,
    },
    bamboo: {
      src: "[MR  원키] For good 너로 인하여 (뮤지컬 Wicked ) Inst, MR   한글가사.mp3",
      volume: 0.52,
    },
    glitch: {
      src: "Tension Flashback - Sound Effect (HD).mp3",
      volume: 0.92,
      loop: true,
    },
    real: {
      src: "[뮤지컬 매디슨 카운티의 다리]어떤떨림 mr.mp3",
      volume: 0.48,
    },
  };
  const audioByKey = new Map();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function bgLayers(extra = "", variant = "night") {
    const pptBase = `
        <img class="bg bg-ppt-sky bg-ppt-sky-left" src="${image("image1.png")}" alt="" />
        <img class="bg bg-ppt-sky bg-ppt-sky-right" src="${image("image1.png")}" alt="" />
        <img class="bg bg-ppt-horizon" src="${image("image2.png")}" alt="" />
      `;

    const presets = {
      night: `
        <img class="bg bg-sky" src="${image("image1.png")}" alt="" />
        <img class="bg bg-horizon" src="${image("image2.png")}" alt="" />
        <img class="bg bg-moon" src="${image("image6.png")}" alt="" />
        <img class="bg bg-tree" src="${image("image3.png")}" alt="" />
        <img class="bg bg-grass-left" src="${image("image4.png")}" alt="" />
        <img class="bg bg-grass-right" src="${image("image5.png")}" alt="" />
      `,
      overview: `
        ${pptBase}
        <img class="bg bg-ppt-overview-tree" src="${image("image8.png")}" alt="" />
        <img class="bg bg-ppt-overview-foliage" src="${image("image9.png")}" alt="" />
        <img class="bg bg-ppt-overview-grass" src="${image("image10.png")}" alt="" />
      `,
      intent: `
        <img class="bg bg-sky bg-sky-deep" src="${image("image1.png")}" alt="" />
        <img class="bg bg-moon bg-moon-soft" src="${image("image6.png")}" alt="" />
        <img class="bg bg-tree-large" src="${image("image8.png")}" alt="" />
        <img class="bg bg-flower" src="${image("image15.png")}" alt="" />
      `,
      cast: `
        <img class="bg bg-sky bg-sky-soft" src="${image("image1.png")}" alt="" />
        <img class="bg bg-clouds bg-clouds-cast" src="${image("image14.png")}" alt="" />
        <img class="bg bg-cast-strip" src="${image("image13.png")}" alt="" />
      `,
      synopsis: `
        ${pptBase}
        <img class="bg bg-ppt-synopsis-cloud-line" src="${image("image22.png")}" alt="" />
        <img class="bg bg-ppt-synopsis-flower" src="${image("image15.png")}" alt="" />
      `,
      home: `
        ${pptBase}
        <img class="bg bg-ppt-home-foliage" src="${image("image23.png")}" alt="" />
        <img class="bg bg-ppt-home-digital" src="${image("image24.png")}" alt="" />
        <img class="bg bg-ppt-home-fireflies" src="${image("image7.png")}" alt="" />
      `,
      bamboo: `
        <img class="bg bg-sky bg-sky-bamboo" src="${image("image1.png")}" alt="" />
        <img class="bg bg-tree-large bg-tree-bamboo" src="${image("image8.png")}" alt="" />
        <img class="bg bg-digital-streak bg-digital-bamboo" src="${image("image24.png")}" alt="" />
        <img class="bg bg-horizon bg-horizon-bamboo" src="${image("image2.png")}" alt="" />
      `,
      visual: `
        <img class="bg bg-sky bg-sky-bamboo" src="${image("image1.png")}" alt="" />
        <img class="bg bg-digital-streak bg-digital-bamboo" src="${image("image24.png")}" alt="" />
      `,
      ending: `
        <img class="bg bg-sky bg-sky-ending" src="${image("image1.png")}" alt="" />
        <img class="bg bg-room-lamp bg-room-lamp-ending" src="${image("image11.png")}" alt="" />
        <img class="bg bg-bottom-foliage bg-bottom-foliage-ending" src="${image("image12.png")}" alt="" />
      `,
      planning: `
        ${pptBase}
        <img class="bg bg-ppt-planning-strip" src="${image("image13.png")}" alt="" />
        <img class="bg bg-ppt-planning-branch-right" src="${image("image16.png")}" alt="" />
        <img class="bg bg-ppt-planning-lantern-right" src="${image("image29.png")}" alt="" />
        <img class="bg bg-ppt-planning-lantern-left" src="${image("image30.png")}" alt="" />
        <img class="bg bg-ppt-planning-branch-left" src="${image("image16.png")}" alt="" />
      `,
      thanks: `
        <img class="bg bg-sky bg-sky-ending" src="${image("image1.png")}" alt="" />
        <img class="bg bg-thanks-light" src="${image("image31.png")}" alt="" />
        <img class="bg bg-bottom-foliage bg-bottom-foliage-thanks" src="${image("image12.png")}" alt="" />
      `,
    };

    return `
      ${presets[variant] || presets.night}
      ${extra}
    `;
  }

  function renderSlide(slide, i) {
    const el = document.createElement("article");
    el.className = `slide slide-${slide.type} theme-${slide.theme || "night"}`;
    el.setAttribute("aria-label", `${i + 1}번 슬라이드`);
    el.dataset.slide = i + 1;
    if (slide.type === "planning" && slide.plans?.length) {
      el.dataset.effect = slide.plans[0].effect;
    }

    const renderers = {
      cover: renderCover,
      overview: renderOverview,
      intent: renderIntent,
      cast: renderCast,
      synopsis: renderSynopsis,
      scene: renderScene,
      visual: renderVisual,
      endingScene: renderEndingScene,
      planning: renderPlanning,
      thanks: renderThanks,
    };

    el.innerHTML = renderers[slide.type](slide, i);
    return el;
  }

  function renderKicker(slide) {
    return `
      <div class="kicker">
        <span class="kicker-mark"></span>
        <span>${escapeHtml(slide.kicker || slide.eyebrow || "")}</span>
      </div>
    `;
  }

  function renderCover(slide) {
    return `
      ${bgLayers(`<img class="bg bg-fireflies" src="${image("image7.png")}" alt="" />`, "night")}
      <div class="cover-copy">
        <div class="cover-title">
          <span>${escapeHtml(slide.title[0])}</span>
          <span>${escapeHtml(slide.title[1])}</span>
        </div>
        <p>${escapeHtml(slide.subtitle)}</p>
      </div>
      <footer class="credit-block">
        <strong>${escapeHtml(slide.eyebrow)}</strong>
        <span>${escapeHtml(slide.members)}</span>
      </footer>
    `;
  }

  function renderOverview(slide) {
    return `
      ${bgLayers("", "overview")}
      <div class="content-panel overview-panel">
        ${renderKicker(slide)}
        <h1>${escapeHtml(slide.title)}</h1>
        <div class="overview-list">
          ${slide.items
            .map(
              ([label, value]) => `
                <div class="overview-row">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderIntent(slide) {
    return `
      ${bgLayers("", "intent")}
      <div class="intent-grid">
        <section>
          ${renderKicker(slide)}
          <h1>${escapeHtml(slide.title)}</h1>
          <blockquote>${escapeHtml(slide.emphasis)}</blockquote>
        </section>
        <div class="intent-copy">
          ${slide.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        </div>
      </div>
    `;
  }

  function renderCast(slide) {
    return `
      ${bgLayers("", "cast")}
      <div class="slide-header">
        ${renderKicker(slide)}
        <h1>${escapeHtml(slide.title)}</h1>
      </div>
      <div class="cast-grid">
        ${slide.cast
          .map(
            (person) => `
              <article class="cast-card" tabindex="0">
                <div class="cast-photo-frame ${person.imageFit === "cover" ? "is-cover" : ""}">
                  <img src="${image(person.image)}" alt="${escapeHtml(person.name)}" />
                </div>
                <span class="cast-name" aria-label="${escapeHtml(person.name)} 역, ${escapeHtml(person.actor || person.name)} 배우">
                  <span class="cast-character">${escapeHtml(person.name)}</span>
                  <span class="cast-actor">${escapeHtml(person.actor || person.name)}</span>
                </span>
                <span class="cast-role">${escapeHtml(person.role)}</span>
                <span class="cast-line">${escapeHtml(person.line)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function applyImageRatio(img) {
    if (!img?.naturalWidth || !img?.naturalHeight) return;

    const ratio = `${img.naturalWidth} / ${img.naturalHeight}`;
    const castFrame = img.closest(".cast-photo-frame");
    const effectScene = img.closest(".effect-scene");

    if (castFrame) castFrame.style.setProperty("--photo-ratio", ratio);
    if (effectScene) effectScene.style.setProperty("--effect-ratio", ratio);
  }

  function syncImageRatios(root = document) {
    root.querySelectorAll(".cast-photo-frame img, .effect-photo").forEach((img) => {
      if (img.complete) {
        applyImageRatio(img);
        return;
      }

      img.addEventListener("load", () => applyImageRatio(img), { once: true });
    });
  }

  function warmUpImages() {
    const urls = [...new Set([...stage.querySelectorAll("img")].map((img) => img.currentSrc || img.src).filter(Boolean))];
    let cursor = 0;

    const schedule = (callback) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 1400 });
      } else {
        window.setTimeout(() => callback({ timeRemaining: () => 8, didTimeout: true }), 120);
      }
    };

    const decodeNext = (deadline) => {
      if (cursor >= urls.length) return;
      if (!deadline.didTimeout && deadline.timeRemaining() < 6) {
        schedule(decodeNext);
        return;
      }

      const preloader = new Image();
      preloader.decoding = "async";
      preloader.src = urls[cursor];
      cursor += 1;
      if (preloader.decode) preloader.decode().catch(() => {});

      if (cursor < urls.length) schedule(decodeNext);
    };

    schedule(decodeNext);
  }

  function renderSynopsis(slide) {
    return `
      ${bgLayers("", "synopsis")}
      <div class="slide-header">
        ${renderKicker(slide)}
        <h1>${escapeHtml(slide.title)}</h1>
      </div>
      <div class="timeline">
        ${slide.acts
          .map(
            (act) => `
              <section class="act-card" tabindex="0">
                <div class="act-number">${escapeHtml(act.label)}</div>
                <h2>${escapeHtml(act.title)}</h2>
                <p>${escapeHtml(act.body)}</p>
              </section>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderScene(slide) {
    return `
      ${bgLayers("", slide.theme === "home" ? "home" : "bamboo")}
      <div class="scene-layout">
        <figure class="scene-image">
          <img src="${image(slide.image)}" alt="${escapeHtml(slide.place)} 무대 이미지" />
          <figcaption><span>${escapeHtml(slide.number)}</span> ${escapeHtml(slide.place)}</figcaption>
        </figure>
        <section class="scene-copy ${slide.qr ? "has-qr" : ""}">
          ${renderKicker(slide)}
          <h1>${escapeHtml(slide.title)}</h1>
          <div class="scene-copy-main">
            <div class="script-lines" style="--line-cycle: ${slide.script.length * 3}s">
              ${slide.script
                .map((line, idx) => `<p style="--line-delay: ${idx * 3}s; --intro-delay: ${120 + idx * 60}ms">${escapeHtml(line)}</p>`)
                .join("")}
            </div>
            ${
              slide.qr
                ? `<aside class="qr-card" tabindex="0" aria-label="대나무숲 입장 QR 크게 보기"><img src="${image(slide.qr)}" alt="대나무숲 QR 코드" /><span>대나무숲 입장 QR</span></aside>`
                : ""
            }
          </div>
          <div class="direction-list">
            ${slide.direction.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>
      </div>
      ${
        slide.qr
          ? `<div class="qr-spotlight" aria-hidden="true"><img src="${image(slide.qr)}" alt="" /><span>대나무숲 입장 QR</span></div>`
          : ""
      }
    `;
  }

  function renderVisual(slide) {
    return `
      ${bgLayers(`<img class="bg bg-visual-stage" src="${image(slide.image)}" alt="" />`, "visual")}
      <div class="visual-caption">
        ${renderKicker(slide)}
        <div>${escapeHtml(slide.place)}</div>
        <h1>${escapeHtml(slide.title)}</h1>
      </div>
      <div class="mist mist-one"></div>
      <div class="mist mist-two"></div>
      <img class="bg bg-fireflies visual-fireflies" src="${image("image7.png")}" alt="" />
    `;
  }

  function renderEndingScene(slide) {
    return `
      ${bgLayers(`<img class="bg bg-lantern-a" src="${image("image29.png")}" alt="" /><img class="bg bg-lantern-b" src="${image("image30.png")}" alt="" />`, "ending")}
      <div class="ending-layout">
        <figure class="scene-image">
          <img src="${image(slide.image)}" alt="${escapeHtml(slide.place)} 무대 이미지" />
          <figcaption><span>${escapeHtml(slide.number)}</span> ${escapeHtml(slide.place)}</figcaption>
        </figure>
        <section class="scene-copy">
          ${renderKicker(slide)}
          <h1>${escapeHtml(slide.title)}</h1>
          <div class="script-lines" style="--line-cycle: ${slide.script.length * 3}s">
            ${slide.script
              .map((line, idx) => `<p style="--line-delay: ${idx * 3}s; --intro-delay: ${120 + idx * 60}ms">${escapeHtml(line)}</p>`)
              .join("")}
          </div>
          <div class="logout-box" aria-live="polite">
            <span>로그아웃 하시겠습니까?</span>
            <button type="button" data-logout="yes">예</button>
            <button type="button" data-logout="no">아니오</button>
          </div>
          <div class="direction-list">
            ${slide.direction.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderPlanning(slide) {
    const firstPlan = slide.plans[0];
    return `
      ${bgLayers("", "planning")}
      <div class="planning-page-light" aria-hidden="true"></div>
      <div class="planning-page-fog" aria-hidden="true"></div>
      <div class="planning-page-noise" aria-hidden="true"></div>
      <div class="planning-page-blackout" aria-hidden="true"></div>
      <div class="planning-stage" data-effect="${escapeHtml(firstPlan.effect)}">
        <figure class="effect-scene">
          <img class="effect-photo" src="${image(firstPlan.image)}" alt="${escapeHtml(firstPlan.name)} 무대 연출 미리보기" />
          <div class="effect-light"></div>
          <div class="effect-fog"></div>
          <div class="effect-noise"></div>
          <div class="effect-blackout"></div>
          <figcaption id="effectSceneName">${escapeHtml(firstPlan.name)}</figcaption>
        </figure>
        <section class="effect-copy">
          <div class="planning-copy-header">
            ${renderKicker(slide)}
            <h1>${escapeHtml(slide.title)}</h1>
          </div>
          <h2 id="effectTitle">${escapeHtml(firstPlan.name)}</h2>
          <div id="effectRows" class="effect-rows">
            ${firstPlan.rows.map((row) => `<p>${escapeHtml(row)}</p>`).join("")}
          </div>
          <div class="cue-buttons" aria-label="무대 연출 효과 선택">
            ${slide.plans
              .map(
                (plan, idx) => `
                  <button class="cue-card ${idx === 0 ? "is-selected" : ""}" type="button" data-plan-index="${idx}">
                    <img src="${image(plan.image)}" alt="" />
                    <span>${escapeHtml(plan.name)}</span>
                  </button>
                `,
              )
              .join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderThanks(slide) {
    return `
      ${bgLayers("", "thanks")}
      <div class="thanks-copy">
        <h1>${escapeHtml(slide.title)}</h1>
        <strong>${escapeHtml(slide.team)}</strong>
        <span>${escapeHtml(slide.members)}</span>
      </div>
    `;
  }

  function buildDeck() {
    stage.innerHTML = "";
    thumbs.innerHTML = "";
    totalSlides.textContent = slides.length;

    slides.forEach((slide, i) => {
      stage.appendChild(renderSlide(slide, i));
      const button = document.createElement("button");
      button.className = "thumb";
      button.type = "button";
      button.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span><strong>${escapeHtml(slide.kicker || slide.eyebrow || slide.title)}</strong>`;
      button.addEventListener("click", () => goTo(i));
      thumbs.appendChild(button);
    });

    syncImageRatios(stage);
    warmUpImages();
  }

  function applySlideState(nextIndex) {
    if (document.activeElement && stage.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    document.querySelectorAll(".slide").forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
      slide.classList.toggle("is-before", i < index);
      slide.toggleAttribute("hidden", i !== index);
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });
    document.querySelectorAll(".thumb").forEach((thumb, i) => {
      thumb.classList.toggle("is-active", i === index);
    });
    currentSlide.textContent = index + 1;
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
    notesText.textContent = slides[index].note || "";
    window.location.hash = `slide-${index + 1}`;
    syncMusicForSlide();
  }

  function goTo(nextIndex) {
    const targetIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
    if (hasRendered && targetIndex === index) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage.dataset.direction = targetIndex >= index ? "forward" : "back";

    const update = () => applySlideState(targetIndex);

    if (useNativeViewTransitions && hasRendered && !transitionInProgress && document.startViewTransition && !prefersReducedMotion) {
      transitionInProgress = true;
      const transition = document.startViewTransition(update);
      transition.finished.finally(() => {
        transitionInProgress = false;
      });
    } else {
      update();
    }

    hasRendered = true;
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function requestFullscreen(element) {
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    }
    if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen();
    }
    if (element.msRequestFullscreen) {
      return element.msRequestFullscreen();
    }
    return Promise.reject(new Error("Fullscreen API is not available."));
  }

  function exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
    return Promise.resolve();
  }

  function syncFullscreenUi() {
    const active = Boolean(fullscreenElement());
    app.classList.toggle("is-fullscreen", active);
    fullscreenBtn.textContent = active ? "전체화면 종료" : "전체화면";
    fullscreenBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }

  async function toggleFullscreen(event) {
    event?.preventDefault();
    const target = document.documentElement;
    let failed = false;
    try {
      if (!fullscreenElement()) {
        if (document.fullscreenEnabled === false && document.webkitFullscreenEnabled === false) {
          throw new Error("Fullscreen is blocked by this browser context.");
        }
        await requestFullscreen(target);
      } else {
        await exitFullscreen();
      }
    } catch (error) {
      failed = true;
      console.warn("Fullscreen request failed:", error);
      syncFullscreenUi();
      fullscreenBtn.textContent = "전체화면 불가";
      window.setTimeout(syncFullscreenUi, 1400);
    } finally {
      if (!failed) syncFullscreenUi();
    }
  }

  function updatePointer(clientX, clientY, active = true) {
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const xPercent = rect.width ? (x / rect.width) * 100 : 50;
    const yPercent = rect.height ? (y / rect.height) * 100 : 50;

    stage.style.setProperty("--pointer-x", `${xPercent}%`);
    stage.style.setProperty("--pointer-y", `${yPercent}%`);
    stage.style.setProperty("--pointer-opacity", active ? (pointerMode ? "1" : "0.48") : "0");
    stage.dataset.pointerActive = active ? "true" : "false";
  }

  function setPointerMode(active) {
    pointerMode = active;
    app.classList.toggle("is-pointer-mode", pointerMode);
    stage.dataset.pointerMode = pointerMode ? "true" : "false";
    if (pointerBtn) {
      pointerBtn.textContent = pointerMode ? "포인터 끄기" : "포인터";
      pointerBtn.setAttribute("aria-pressed", pointerMode ? "true" : "false");
    }
    if (!pointerMode && stage.dataset.pointerActive !== "true") {
      stage.style.setProperty("--pointer-opacity", "0");
    }
  }

  function togglePointerMode() {
    setPointerMode(!pointerMode);
  }

  function addPointerRipple(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "pointer-ripple";
    ripple.style.left = `${clientX - rect.left}px`;
    ripple.style.top = `${clientY - rect.top}px`;
    stage.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function flushCastTilt() {
    castTiltFrame = 0;
    const next = pendingCastTilt;
    pendingCastTilt = null;
    if (!next?.card?.isConnected) return;

    const rect = next.card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (next.clientX - rect.left) / rect.width)) - 0.5;
    const y = Math.max(0, Math.min(1, (next.clientY - rect.top) / rect.height)) - 0.5;
    const tiltX = Number((-y * 6.4).toFixed(2));
    const tiltY = Number((x * 6.4).toFixed(2));
    const prev = castTiltState.get(next.card);

    if (prev && Math.abs(prev.x - tiltX) < 0.18 && Math.abs(prev.y - tiltY) < 0.18) return;

    next.card.style.setProperty("--tilt-x", `${tiltX}deg`);
    next.card.style.setProperty("--tilt-y", `${tiltY}deg`);
    castTiltState.set(next.card, { x: tiltX, y: tiltY });
  }

  function updateCastTilt(card, event) {
    pendingCastTilt = { card, clientX: event.clientX, clientY: event.clientY };
    if (!castTiltFrame) {
      castTiltFrame = window.requestAnimationFrame(flushCastTilt);
    }
  }

  function resetCastTilt(card) {
    if (pendingCastTilt?.card === card) pendingCastTilt = null;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    castTiltState.set(card, { x: 0, y: 0 });
  }

  function flushSceneTilt() {
    sceneTiltFrame = 0;
    const next = pendingSceneTilt;
    pendingSceneTilt = null;
    if (!next?.scene?.isConnected) return;

    const rect = next.scene.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (next.clientX - rect.left) / rect.width)) - 0.5;
    const y = Math.max(0, Math.min(1, (next.clientY - rect.top) / rect.height)) - 0.5;
    const tiltX = Number((-y * 3.2).toFixed(2));
    const tiltY = Number((x * 3.2).toFixed(2));
    const prev = sceneTiltState.get(next.scene);

    if (prev && Math.abs(prev.x - tiltX) < 0.12 && Math.abs(prev.y - tiltY) < 0.12) return;

    next.scene.style.setProperty("--scene-tilt-x", `${tiltX}deg`);
    next.scene.style.setProperty("--scene-tilt-y", `${tiltY}deg`);
    sceneTiltState.set(next.scene, { x: tiltX, y: tiltY });
  }

  function updateSceneTilt(scene, event) {
    pendingSceneTilt = { scene, clientX: event.clientX, clientY: event.clientY };
    if (!sceneTiltFrame) {
      sceneTiltFrame = window.requestAnimationFrame(flushSceneTilt);
    }
  }

  function resetSceneTilt(scene) {
    if (pendingSceneTilt?.scene === scene) pendingSceneTilt = null;
    scene.style.setProperty("--scene-tilt-x", "0deg");
    scene.style.setProperty("--scene-tilt-y", "0deg");
    sceneTiltState.set(scene, { x: 0, y: 0 });
  }

  function audioForKey(key) {
    if (!key || !musicTracks[key]) return null;
    if (audioByKey.has(key)) return audioByKey.get(key);

    const track = musicTracks[key];
    const audio = new Audio(music(track.src));
    audio.loop = track.loop !== false;
    audio.preload = "auto";
    audio.volume = track.volume;
    audioByKey.set(key, audio);
    return audio;
  }

  function stopMusic(exceptKey = null) {
    audioByKey.forEach((audio, key) => {
      if (key === exceptKey) return;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browsers may reject currentTime while metadata is not ready.
      }
    });
  }

  function musicForActiveSlide() {
    const slide = slides[index];
    if (!slide) return null;

    if (slide.type === "planning") {
      const activePlanningSlide = document.querySelector(".slide-planning.is-active");
      const activeEffect = activePlanningSlide?.dataset.effect || slide.plans?.[0]?.effect;
      const plan = slide.plans?.find((item) => item.effect === activeEffect) || slide.plans?.[0];
      return plan?.music || null;
    }

    return slide.music || null;
  }

  function updateMuteUi() {
    stage.dataset.musicMuted = isMusicMuted ? "true" : "false";
    stage.dataset.musicBlocked = musicBlocked ? "true" : "false";
    if (!muteBtn) return;
    muteBtn.textContent = isMusicMuted ? "음악 켜기" : musicBlocked ? "음악 재생" : "음소거";
    muteBtn.setAttribute("aria-pressed", isMusicMuted ? "true" : "false");
    muteBtn.title = musicBlocked ? "브라우저가 자동 재생을 막았습니다. 클릭하면 현재 장면 음악을 재생합니다." : "";
  }

  function syncMusicForSlide(options = {}) {
    const key = musicForActiveSlide();
    stage.dataset.music = key || "none";
    if (!key || !musicTracks[key]) {
      currentMusicKey = null;
      musicBlocked = false;
      stopMusic();
      updateMuteUi();
      return;
    }

    if (isMusicMuted) {
      currentMusicKey = key;
      musicBlocked = false;
      stopMusic();
      updateMuteUi();
      return;
    }

    const audio = audioForKey(key);
    if (!audio) return;
    const shouldRestart = options.restart || currentMusicKey !== key;
    currentMusicKey = key;
    stopMusic(key);
    audio.muted = false;
    audio.volume = musicTracks[key].volume;

    if (shouldRestart) {
      try {
        audio.currentTime = 0;
      } catch {
        // Keep playback resilient if seeking is temporarily unavailable.
      }
    }

    const playPromise = audio.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          musicBlocked = false;
          updateMuteUi();
        })
        .catch(() => {
          musicBlocked = true;
          updateMuteUi();
        });
    }
  }

  function setMusicMuted(muted) {
    isMusicMuted = muted;
    musicBlocked = false;
    if (isMusicMuted) {
      stopMusic();
      updateMuteUi();
      return;
    }
    syncMusicForSlide();
  }

  function handleMuteButton() {
    if (musicBlocked && !isMusicMuted) {
      syncMusicForSlide();
      return;
    }
    setMusicMuted(!isMusicMuted);
  }

  function isBackgroundAdvanceClick(event) {
    if (event.button && event.button !== 0) return false;

    const blockedSelector = [
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "[role='button']",
      ".cover-copy",
      ".credit-block",
      ".content-panel",
      ".intent-grid",
      ".slide-header",
      ".cast-grid",
      ".timeline",
      ".scene-layout",
      ".ending-layout",
      ".scene-image",
      ".scene-copy",
      ".visual-caption",
      ".planning-stage",
      ".thanks-copy",
    ].join(",");

    if (event.target.closest(blockedSelector)) return false;
    return event.target === stage || event.target.classList.contains("slide") || event.target.classList.contains("bg") || event.target.classList.contains("mist");
  }

  function bindEvents() {
    document.getElementById("nextBtn").addEventListener("click", next);
    document.getElementById("prevBtn").addEventListener("click", prev);
    fullscreenBtn.addEventListener("click", toggleFullscreen);
    pointerBtn?.addEventListener("click", togglePointerMode);
    muteBtn?.addEventListener("click", handleMuteButton);
    document.addEventListener("fullscreenchange", syncFullscreenUi);
    document.addEventListener("webkitfullscreenchange", syncFullscreenUi);
    document.getElementById("toggleNav").addEventListener("click", () => {
      app.dataset.navOpen = app.dataset.navOpen === "true" ? "false" : "true";
    });
    document.getElementById("toggleNotes").addEventListener("click", () => {
      notes.classList.toggle("is-open");
    });

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "p" || key === "l") {
        event.preventDefault();
        togglePointerMode();
        return;
      }
      if (key === "m") {
        event.preventDefault();
        handleMuteButton();
        return;
      }
      if (event.target.closest("button")) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
        next();
      }
      if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
        event.preventDefault();
        prev();
      }
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(slides.length - 1);
      if (key === "f") toggleFullscreen();
    });

    stage.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      updatePointer(event.clientX, event.clientY);

      const castCard = event.target.closest(".cast-card");
      if (castCard) updateCastTilt(castCard, event);

      const sceneImage = event.target.closest(".scene-image");
      if (sceneImage) updateSceneTilt(sceneImage, event);
    });
    stage.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      updatePointer(event.clientX, event.clientY);
    });
    stage.addEventListener("pointerleave", () => {
      if (!pointerMode) updatePointer(0, 0, false);
    });
    stage.addEventListener("pointerout", (event) => {
      const castCard = event.target.closest(".cast-card");
      if (castCard && !castCard.contains(event.relatedTarget)) resetCastTilt(castCard);

      const sceneImage = event.target.closest(".scene-image");
      if (sceneImage && !sceneImage.contains(event.relatedTarget)) resetSceneTilt(sceneImage);
    });
    stage.addEventListener("focusout", (event) => {
      const castCard = event.target.closest(".cast-card");
      if (castCard) resetCastTilt(castCard);

      const sceneImage = event.target.closest(".scene-image");
      if (sceneImage) resetSceneTilt(sceneImage);
    });
    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      updatePointer(event.clientX, event.clientY);
      addPointerRipple(event.clientX, event.clientY);
    });

    stage.addEventListener("click", (event) => {
      const logout = event.target.closest("[data-logout]");
      if (logout) {
        const box = logout.closest(".logout-box");
        box.dataset.choice = logout.dataset.logout;
        box.querySelector("span").textContent =
          logout.dataset.logout === "yes" ? "로그아웃되었습니다. 하지만 감정은 남아 있습니다." : "접속은 유지됩니다. 질문도 계속됩니다.";
      }

      const cueCard = event.target.closest(".cue-card");
      if (cueCard) {
        const plan = slides[index]?.plans?.[Number(cueCard.dataset.planIndex)];
        const planningStage = cueCard.closest(".planning-stage");
        if (!plan || !planningStage) return;

        planningStage.classList.remove("is-cue-changing");
        void planningStage.offsetWidth;

        planningStage.dataset.effect = plan.effect;
        const planningSlide = planningStage.closest(".slide-planning");
        if (planningSlide) planningSlide.dataset.effect = plan.effect;
        const effectPhoto = planningStage.querySelector(".effect-photo");
        effectPhoto.src = image(plan.image);
        effectPhoto.alt = `${plan.name} 무대 연출 미리보기`;
        syncImageRatios(planningStage);
        planningStage.querySelector("#effectSceneName").textContent = plan.name;
        planningStage.querySelector("#effectTitle").textContent = plan.name;
        planningStage.querySelector("#effectRows").innerHTML = plan.rows.map((row) => `<p>${escapeHtml(row)}</p>`).join("");
        planningStage.querySelectorAll(".cue-card").forEach((card) => card.classList.toggle("is-selected", card === cueCard));
        planningStage.classList.add("is-cue-changing");
        syncMusicForSlide({ restart: true });
        window.setTimeout(() => planningStage.classList.remove("is-cue-changing"), 680);
      }

      if (isBackgroundAdvanceClick(event)) {
        next();
      }
    });

    stage.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    });
    stage.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? next() : prev();
      }
    });
  }

  function initialIndex() {
    const match = window.location.hash.match(/slide-(\d+)/);
    if (!match) return 0;
    return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
  }

  buildDeck();
  bindEvents();
  goTo(initialIndex());
})();
