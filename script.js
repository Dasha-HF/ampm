const loader = document.querySelector("#loader");
const loaderTime = document.querySelector("#loaderTime");
const revealItems = document.querySelectorAll(".reveal");
const themeSections = document.querySelectorAll("[data-theme]");
const compositionDetails = document.querySelectorAll(".composition-details");
const videos = document.querySelectorAll("video[autoplay]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.body.classList.add("is-loading");
document.body.classList.add("theme-morning");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const navigationEntry = performance.getEntriesByType("navigation")[0];

if (navigationEntry?.type === "reload") {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  window.scrollTo(0, 0);
}

const loaderTimes = ["08:00", "11:24", "14:30", "18:06", "20:00"];
let loaderIndex = 0;

const tickLoader = window.setInterval(() => {
  loaderIndex = (loaderIndex + 1) % loaderTimes.length;
  loaderTime.textContent = loaderTimes[loaderIndex];
}, 260);

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

const prepareAutoplayVideo = (video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.controls = false;
  video.playsInline = true;
  video.defaultPlaybackRate = 1;
  video.playbackRate = 1;
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("loop", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
};

const getStaticFrame = (video) => {
  return video.parentElement?.querySelector(".autoplay-static-frame") ?? null;
};

const showStaticFrame = (video) => {
  getStaticFrame(video)?.classList.remove("is-hidden");
};

const hideStaticFrame = (video) => {
  getStaticFrame(video)?.classList.add("is-hidden");
};

const startVideo = (video, allowBlockedRetry = false) => {
  prepareAutoplayVideo(video);

  if (document.hidden || (video.dataset.autoplayBlocked === "true" && !allowBlockedRetry)) {
    return Promise.resolve(false);
  }

  video.playbackRate = 1;
  let playRequest;

  try {
    playRequest = video.play();
  } catch {
    video.dataset.autoplayBlocked = "true";
    showStaticFrame(video);
    return Promise.resolve(false);
  }

  if (playRequest) {
    return playRequest.then(() => {
      delete video.dataset.autoplayBlocked;
      hideStaticFrame(video);
      return true;
    }).catch((error) => {
      video.dataset.autoplayBlocked = "true";
      showStaticFrame(video);
      if (error?.name !== "NotAllowedError" && error?.name !== "AbortError") {
        console.warn("Не удалось запустить видео:", error);
      }
      return false;
    });
  }

  const isPlaying = !video.paused;
  if (!isPlaying) {
    video.dataset.autoplayBlocked = "true";
    showStaticFrame(video);
  } else {
    hideStaticFrame(video);
  }
  return Promise.resolve(isPlaying);
};

const startAllVideos = (allowBlockedRetry = false) => {
  return Promise.all(Array.from(videos, (video) => startVideo(video, allowBlockedRetry)));
};

const resumeVideosFromUserGesture = () => {
  videos.forEach((video) => {
    if (!video.paused && !video.ended) {
      return;
    }

    // Вызов play() остаётся непосредственно внутри настоящего жеста пользователя.
    // Это важно для Safari и других браузеров со строгой политикой автозапуска.
    startVideo(video, true);
  });
};

let loaderDismissed = false;

const hideLoader = () => {
  if (loaderDismissed) {
    return;
  }

  loaderDismissed = true;
  loader.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
};

videos.forEach((video) => {
  prepareAutoplayVideo(video);
  showStaticFrame(video);

  video.addEventListener("loadedmetadata", () => startVideo(video));
  video.addEventListener("canplay", () => startVideo(video));
  video.addEventListener("pause", () => {
    showStaticFrame(video);
  });
  video.addEventListener("ended", () => showStaticFrame(video));
  video.addEventListener("error", () => showStaticFrame(video));
  video.addEventListener("ratechange", () => {
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
  });
  video.addEventListener("playing", () => {
    delete video.dataset.autoplayBlocked;
    video.playbackRate = 1;
    hideStaticFrame(video);
  });
});

window.addEventListener("load", () => {
  window.setTimeout(() => {
    window.clearInterval(tickLoader);
    loaderTime.textContent = "AM.PM";
    window.setTimeout(() => {
      startAllVideos();
      hideLoader();
    }, 520);
  }, 1450);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    startAllVideos();
  }
});
window.addEventListener("pageshow", () => {
  startAllVideos();
});
window.addEventListener("focus", () => {
  startAllVideos();
});
document.addEventListener("pointerdown", resumeVideosFromUserGesture, { passive: true });
document.addEventListener("touchend", resumeVideosFromUserGesture, { passive: true });
document.addEventListener("click", resumeVideosFromUserGesture);
document.addEventListener("keydown", resumeVideosFromUserGesture);

startAllVideos();

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
