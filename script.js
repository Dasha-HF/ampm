const loader = document.querySelector("#loader");
const loaderTime = document.querySelector("#loaderTime");
const revealItems = document.querySelectorAll(".reveal");
const themeSections = document.querySelectorAll("[data-theme]");
const compositionDetails = document.querySelectorAll(".composition-details");
const pageSections = [
  document.querySelector(".poster"),
  document.querySelector("#about"),
  document.querySelector("#rhythm"),
  ...document.querySelectorAll(".flavors > .section"),
  document.querySelector(".advantages"),
  document.querySelector(".video-band"),
  document.querySelector("#buy"),
  document.querySelector("#contact"),
].filter(Boolean);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pageModeQuery = window.matchMedia("(min-width: 999999px)");

document.body.classList.add("is-loading");
document.body.classList.add("theme-morning");

const loaderTimes = ["08:00", "11:24", "14:30", "18:06", "20:00"];
let loaderIndex = 0;

const tickLoader = window.setInterval(() => {
  loaderIndex = (loaderIndex + 1) % loaderTimes.length;
  loaderTime.textContent = loaderTimes[loaderIndex];
}, 260);

window.addEventListener("load", () => {
  window.setTimeout(() => {
    window.clearInterval(tickLoader);
    loaderTime.textContent = "AM.PM";
    window.setTimeout(() => {
      loader.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
    }, 520);
  }, 1450);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px",
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

const themeObserver = new IntersectionObserver(
  (entries) => {
    if (pageModeEnabled) {
      return;
    }

    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      document.body.classList.remove("theme-morning", "theme-day", "theme-evening");
      document.body.classList.add(`theme-${entry.target.dataset.theme}`);
    });
  },
  {
    threshold: 0.46,
  },
);

themeSections.forEach((section) => themeObserver.observe(section));

const cards = document.querySelectorAll(".product-section__visual, .advantage-card");

cards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

compositionDetails.forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) {
      return;
    }

    compositionDetails.forEach((otherDetails) => {
      if (otherDetails !== details) {
        otherDetails.open = false;
      }
    });
  });
});

let currentPageIndex = 0;
let pageModeEnabled = false;
let isPageTransitioning = false;
let touchStartX = 0;
let touchStartY = 0;

const lockHorizontalScroll = () => {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;

  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
};

window.addEventListener("scroll", lockHorizontalScroll, { passive: true });

window.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();
    lockHorizontalScroll();
  },
  { passive: false },
);

const setPageTheme = (section) => {
  const themeSource = section.matches("[data-theme]")
    ? section
    : section.querySelector("[data-theme]");

  if (!themeSource) {
    return;
  }

  document.body.classList.remove("theme-morning", "theme-day", "theme-evening");
  document.body.classList.add(`theme-${themeSource.dataset.theme}`);
};

const revealPageContent = (section) => {
  section.querySelectorAll(".reveal").forEach((item) => {
    item.classList.add("is-visible");
  });
};

const setActivePage = (index, shouldUpdateHash = true) => {
  currentPageIndex = Math.max(0, Math.min(index, pageSections.length - 1));

  pageSections.forEach((section, sectionIndex) => {
    section.classList.toggle("is-page-active", sectionIndex === currentPageIndex);
    section.classList.toggle("is-page-before", sectionIndex < currentPageIndex);
    section.classList.toggle("is-page-after", sectionIndex > currentPageIndex);
    section.setAttribute("aria-hidden", sectionIndex === currentPageIndex ? "false" : "true");
  });

  const activePage = pageSections[currentPageIndex];
  activePage.scrollTop = 0;
  setPageTheme(activePage);
  revealPageContent(activePage);

  if (shouldUpdateHash) {
    const pageId = activePage.id || (activePage.classList.contains("poster") ? "top" : "");
    if (pageId) {
      history.replaceState(null, "", `#${pageId}`);
    }
  }
};

const pageForHash = (hash) => {
  const id = hash.replace("#", "") || "top";

  if (id === "top") {
    return 0;
  }

  const target = document.getElementById(id);
  if (!target) {
    return currentPageIndex;
  }

  const exactIndex = pageSections.indexOf(target);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  const childIndex = pageSections.findIndex((section) => target.contains(section));
  if (childIndex !== -1) {
    return childIndex;
  }

  const parentIndex = pageSections.findIndex((section) => section.contains(target));
  return parentIndex === -1 ? currentPageIndex : parentIndex;
};

const goToPage = (index, shouldUpdateHash = true) => {
  const nextIndex = Math.max(0, Math.min(index, pageSections.length - 1));

  if (!pageModeEnabled || isPageTransitioning || nextIndex === currentPageIndex) {
    return;
  }

  isPageTransitioning = true;
  setActivePage(nextIndex, shouldUpdateHash);
  window.setTimeout(() => {
    isPageTransitioning = false;
  }, 900);
};

const scrollActivePage = (direction) => {
  const activePage = pageSections[currentPageIndex];
  activePage.scrollBy({
    top: direction * Math.max(160, activePage.clientHeight * 0.72),
    behavior: "smooth",
  });
};

const canScrollActivePage = (direction) => {
  const activePage = pageSections[currentPageIndex];
  const activeOverflow = window.getComputedStyle(activePage).overflowY;

  if (activeOverflow === "hidden" || activeOverflow === "clip") {
    return false;
  }

  const maxScroll = activePage.scrollHeight - activePage.clientHeight;

  if (maxScroll < 8) {
    return false;
  }

  if (direction > 0) {
    return activePage.scrollTop < maxScroll - 8;
  }

  return activePage.scrollTop > 8;
};

const enablePageMode = () => {
  if (pageModeEnabled || prefersReducedMotion.matches || !pageModeQuery.matches) {
    return;
  }

  pageModeEnabled = true;
  document.body.classList.add("page-mode");
  pageSections.forEach((section) => {
    section.classList.add("page-section");
  });
  setActivePage(pageForHash(window.location.hash), false);
};

const disablePageMode = () => {
  if (!pageModeEnabled) {
    return;
  }

  const activePage = pageSections[currentPageIndex];
  pageModeEnabled = false;
  document.body.classList.remove("page-mode");
  pageSections.forEach((section) => {
    section.classList.remove("page-section", "is-page-active", "is-page-before", "is-page-after");
    section.removeAttribute("aria-hidden");
  });
  activePage.scrollIntoView({ block: "start" });
};

const syncPageMode = () => {
  if (pageModeQuery.matches && !prefersReducedMotion.matches) {
    enablePageMode();
  } else {
    disablePageMode();
  }
};

syncPageMode();
pageModeQuery.addEventListener("change", syncPageMode);
prefersReducedMotion.addEventListener("change", syncPageMode);

window.addEventListener(
  "wheel",
  (event) => {
    if (!pageModeEnabled || document.body.classList.contains("is-loading")) {
      return;
    }

    const direction = Math.sign(event.deltaY);
    if (!direction) {
      return;
    }

    if (canScrollActivePage(direction)) {
      return;
    }

    event.preventDefault();
    goToPage(currentPageIndex + direction);
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.touches[0]?.clientX || 0;
    touchStartY = event.touches[0]?.clientY || 0;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    const currentX = event.touches[0]?.clientX || touchStartX;
    const currentY = event.touches[0]?.clientY || touchStartY;
    const deltaX = touchStartX - currentX;
    const deltaY = touchStartY - currentY;

    if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      lockHorizontalScroll();
      return;
    }

    if (!pageModeEnabled || document.body.classList.contains("is-loading")) {
      return;
    }

    const delta = touchStartY - currentY;
    if (Math.abs(delta) < 42) {
      return;
    }

    const direction = Math.sign(delta);
    if (canScrollActivePage(direction)) {
      return;
    }

    event.preventDefault();
    goToPage(currentPageIndex + direction);
    touchStartY = currentY;
  },
  { passive: false },
);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!pageModeEnabled) {
      return;
    }

    event.preventDefault();
    goToPage(pageForHash(link.getAttribute("href")));
  });
});

window.addEventListener("keydown", (event) => {
  if (!pageModeEnabled || document.body.classList.contains("is-loading")) {
    return;
  }

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    if (canScrollActivePage(1)) {
      scrollActivePage(1);
      return;
    }
    goToPage(currentPageIndex + 1);
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    if (canScrollActivePage(-1)) {
      scrollActivePage(-1);
      return;
    }
    goToPage(currentPageIndex - 1);
  }
});

window.addEventListener("hashchange", () => {
  if (!pageModeEnabled) {
    return;
  }

  goToPage(pageForHash(window.location.hash), false);
});
