const loader = document.querySelector("#loader");
const loaderTime = document.querySelector("#loaderTime");
const revealItems = document.querySelectorAll(".reveal");
const themeSections = document.querySelectorAll("[data-theme]");
const compositionDetails = document.querySelectorAll(".composition-details");
const videos = document.querySelectorAll("video");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    if (prefersReducedMotion.matches) {
      return;
    }

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

const playVideo = (video) => {
  video.muted = true;
  video.defaultMuted = true;

  video.play().then(() => {
    delete video.dataset.autoplayBlocked;
  }).catch(() => {
    video.dataset.autoplayBlocked = "true";
  });
};

const syncVideoPlayback = () => {
  videos.forEach((video) => {
    if (document.hidden) {
      video.pause();
      return;
    }

    playVideo(video);
  });
};

videos.forEach((video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  video.addEventListener("canplay", () => {
    if (!document.hidden && video.paused) {
      playVideo(video);
    }
  });
});

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !document.hidden) {
      playVideo(entry.target);
    }
  });
}, { threshold: 0.08 });

videos.forEach((video) => videoObserver.observe(video));

document.addEventListener("visibilitychange", syncVideoPlayback);
window.addEventListener("pageshow", syncVideoPlayback);
window.addEventListener("load", syncVideoPlayback);
window.addEventListener("pointerdown", syncVideoPlayback, { once: true });

syncVideoPlayback();

const lockHorizontalScroll = () => {
  const hasHorizontalShift =
    window.scrollX !== 0 ||
    document.documentElement.scrollLeft !== 0 ||
    document.body.scrollLeft !== 0;

  if (!hasHorizontalShift) {
    return;
  }

  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  window.scrollTo(0, window.scrollY);
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
