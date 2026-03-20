const MOBILE_BREAKPOINT = 900;

function setupImageFallback() {
  const image = document.getElementById("pipeline-image");

  if (!image) return;

  const fallback = image.nextElementSibling;

  function showFallback() {
    image.style.opacity = "0";
    if (fallback) fallback.style.display = "grid";
  }

  function hideFallback() {
    image.style.opacity = "1";
    if (fallback) fallback.style.display = "none";
  }

  image.addEventListener("load", hideFallback);
  image.addEventListener("error", showFallback);

  if (image.complete && image.naturalWidth > 0) {
    hideFallback();
  } else {
    showFallback();
  }
}

function setupCopyBibtex() {
  const copyButton = document.getElementById("copy-bibtex");
  const bibtexBlock = document.getElementById("bibtex-block");

  if (!copyButton || !bibtexBlock) return;

  copyButton.addEventListener("click", async () => {
    const originalLabel = copyButton.textContent;

    try {
      await navigator.clipboard.writeText(bibtexBlock.textContent.trim());
      copyButton.textContent = "Copied";
    } catch (error) {
      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 1600);
  });
}

function refreshVideoSources() {
  const version = `${Date.now()}`;
  const videos = Array.from(document.querySelectorAll("video"));

  videos.forEach((video) => {
    const sources = Array.from(video.querySelectorAll("source"));

    sources.forEach((source) => {
      const baseSrc =
        source.dataset.baseSrc || source.getAttribute("src").split("?")[0];
      source.dataset.baseSrc = baseSrc;
      source.setAttribute("src", `${baseSrc}?v=${version}`);
    });

    video.load();
  });
}

function setupCarousels() {
  const blocks = document.querySelectorAll(".carousel-block");

  blocks.forEach((block) => {
    const carousel = block.querySelector("[data-carousel]");
    const track = block.querySelector(".carousel__track");
    const originalCards = Array.from(track.children);
    const prevButton = block.querySelector("[data-carousel-prev]");
    const nextButton = block.querySelector("[data-carousel-next]");
    const dotsRoot = block.querySelector("[data-carousel-dots]");

    if (!carousel || !track || originalCards.length === 0) return;

    const originalCount = originalCards.length;
    let currentIndex = originalCount;

    function buildTrack() {
      const before = originalCards.map((card) => card.cloneNode(true));
      const center = originalCards.map((card) => card.cloneNode(true));
      const after = originalCards.map((card) => card.cloneNode(true));

      track.innerHTML = "";
      [...before, ...center, ...after].forEach((card) => {
        track.appendChild(card);
      });
    }

    function renderDots() {
      dotsRoot.innerHTML = "";

      for (let index = 0; index < originalCount; index += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Go to case ${index + 1}`);
        dot.addEventListener("click", () => {
          slideTo(originalCount + index);
        });
        dotsRoot.appendChild(dot);
      }
    }

    function updateDots() {
      const activeIndex = ((currentIndex % originalCount) + originalCount) % originalCount;
      const dots = dotsRoot.querySelectorAll(".carousel-dot");

      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
      });
    }

    function getOffset(index) {
      const cards = Array.from(track.children);
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = Number.parseFloat(window.getComputedStyle(track).gap) || 0;
      return index * (cardWidth + gap);
    }

    function update(animate = true) {
      track.style.transition = animate ? "transform 320ms ease" : "none";
      track.style.transform = `translateX(-${getOffset(currentIndex)}px)`;
      updateDots();
    }

    function normalizeIndex() {
      if (currentIndex >= originalCount * 2) {
        currentIndex -= originalCount;
        update(false);
      } else if (currentIndex < originalCount) {
        currentIndex += originalCount;
        update(false);
      }
    }

    function slideTo(index) {
      currentIndex = index;
      update(true);
    }

    buildTrack();
    renderDots();
    update(false);

    prevButton?.addEventListener("click", () => {
      slideTo(currentIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
      slideTo(currentIndex + 1);
    });

    track.addEventListener("transitionend", normalizeIndex);

    window.addEventListener("resize", () => {
      update(false);
    });
  });
}

function setupSectionNav() {
  const dots = Array.from(document.querySelectorAll("[data-nav-target]"));
  const sections = dots
    .map((dot) => {
      const section = document.getElementById(dot.dataset.navTarget);
      return section ? { dot, section } : null;
    })
    .filter(Boolean);

  if (dots.length === 0 || sections.length === 0) return;

  function updateActiveDot() {
    const markerY = window.scrollY + window.innerHeight * 0.35;
    let activeId = sections[0].section.id;

    sections.forEach(({ section }) => {
      if (markerY >= section.offsetTop) {
        activeId = section.id;
      }
    });

    dots.forEach((dot) => {
      dot.classList.toggle("is-active", dot.dataset.navTarget === activeId);
    });
  }

  updateActiveDot();
  window.addEventListener("scroll", updateActiveDot, { passive: true });
  window.addEventListener("resize", updateActiveDot);
}

function setupVideoAutoplay() {
  const videos = Array.from(document.querySelectorAll("video[data-autoplay]"));

  if (videos.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          const playAttempt = video.play();
          if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: [0.2, 0.45, 0.7],
    }
  );

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    observer.observe(video);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupImageFallback();
  refreshVideoSources();
  setupCopyBibtex();
  setupCarousels();
  setupSectionNav();
  setupVideoAutoplay();
});
