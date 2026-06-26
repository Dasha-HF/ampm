const loader = document.querySelector("#loader");
const loaderTime = document.querySelector("#loaderTime");
const revealItems = document.querySelectorAll(".reveal");

document.body.classList.add("is-loading");

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

const cards = document.querySelectorAll(".sku-card");

cards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
