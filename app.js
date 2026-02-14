const config = {
  recipientDisplayName: "ميمي",
  introText: "يا أحلى صدفة بحياتي ✨",
  letterText:
    "يا روحي،\nكل يوم معك أحلى من اللي قبله.\nضحكتك بتعدّل المزاج، وحكيك بيريّح القلب.\n\nوعد مني: أضل جنبك بكل التفاصيل الصغيرة قبل الكبيرة 💕",
  flowerText: "وردة صغيرة… بس حبّي إلك أكبر من كل البساتين 🌷",
  finalText: "أنتِ الجائزة الحقيقية بكل المحاولات، يا أحلى قلب 💖",
  startDate: "2024-09-01"
};

const ATTEMPT_KEY = "valentine_attempt_v1";
const SECOND = 1000;
const motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionMediaQuery.matches;
motionMediaQuery.addEventListener("change", (event) => {
  reducedMotion = event.matches;
});

const state = {
  currentModal: null,
  timeoutId: null
};

const splashScreen = document.getElementById("splashScreen");
const homeScreen = document.getElementById("homeScreen");
const introTitle = document.getElementById("introTitle");
const splashDays = document.getElementById("splashDays");
const splashWeeks = document.getElementById("splashWeeks");
const homeDays = document.getElementById("homeDays");
const homeWeeks = document.getElementById("homeWeeks");
const startDateText = document.getElementById("startDateText");
const startBtn = document.getElementById("startBtn");
const resetTopBtn = document.getElementById("resetTopBtn");

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const confettiCanvas = document.getElementById("confettiCanvas");

function getCounters(startDate) {
  // Validate startDate is a proper YYYY-MM-DD string and represents a real calendar date
  if (typeof startDate !== "string") {
    return { days: 0, weeks: 0 };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) {
    return { days: 0, weeks: 0 };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Construct date in UTC and verify components to catch invalid dates like 2024-13-01
  const startDateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    startDateObj.getUTCFullYear() !== year ||
    startDateObj.getUTCMonth() !== month - 1 ||
    startDateObj.getUTCDate() !== day
  ) {
    return { days: 0, weeks: 0 };
  }

  const startUTC = startDateObj.getTime();
  const now = new Date();
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const days = Math.max(0, Math.floor((nowUTC - startUTC) / 86400000));
  const weeks = Math.floor(days / 7);
  return { days, weeks };
}

function renderCounters() {
  const { days, weeks } = getCounters(config.startDate);
  splashDays.textContent = String(days);
  splashWeeks.textContent = String(weeks);
  homeDays.textContent = String(days);
  homeWeeks.textContent = String(weeks);
  startDateText.textContent = config.startDate;
}

function getAttempt() {
  const value = Number(localStorage.getItem(ATTEMPT_KEY));
  if (!Number.isInteger(value) || value < 0) return 0;
  return Math.min(value, 3);
}

function setAttempt(value) {
  localStorage.setItem(ATTEMPT_KEY, String(Math.max(0, Math.min(3, value))));
}

function clearRevealTimers() {
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }
}

function closeModal() {
  clearRevealTimers();
  modal.hidden = true;
  modalContent.innerHTML = "";
  state.currentModal = null;
}

function openModal(type) {
  clearRevealTimers();
  state.currentModal = type;
  if (type === "letter") {
    renderLetterModal();
  }
  if (type === "flower") {
    renderFlowerModal();
  }
  if (type === "envelopes") {
    renderEnvelopesModal();
  }
  modal.hidden = false;
}

function renderLetterModal() {
  modalContent.innerHTML = `
    <h3 id="modalTitle" class="modal-title">رسالة لـ ${config.recipientDisplayName}</h3>
    <p class="letter"></p>
  `;
  modalContent.querySelector(".letter").textContent = config.letterText;
}

function renderFlowerModal() {
  modalContent.innerHTML = `
    <h3 id="modalTitle" class="modal-title">وردة إلك 🌹</h3>
    <div class="flower-wrap">
      <img src="./assets/flower.gif" alt="وردة متحركة" />
      <p>${config.flowerText}</p>
    </div>
  `;
}

function renderEnvelopesModal() {
  modalContent.innerHTML = `
    <h3 id="modalTitle" class="modal-title">اختاري ظرف 🎁</h3>
    <div class="envelope-grid" id="envelopeGrid">
      <button class="envelope-btn">✉️ ظرف</button>
      <button class="envelope-btn">✉️ ظرف</button>
      <button class="envelope-btn">✉️ ظرف</button>
    </div>
    <div id="revealBox" class="reveal-box" aria-live="polite">
      <p class="reveal-sub">كل الظروف نفس الشي… السر بالمحاولات 😉</p>
    </div>
    <div style="margin-top:.8rem; text-align:center;">
      <button class="btn btn-ghost" id="resetGameBtn">إعادة من البداية</button>
    </div>
  `;

  const envelopeButtons = Array.from(modalContent.querySelectorAll(".envelope-btn"));
  const revealBox = modalContent.querySelector("#revealBox");
  const resetBtn = modalContent.querySelector("#resetGameBtn");

  const setEnvelopesDisabled = (disabled) => {
    envelopeButtons.forEach((btn) => {
      btn.disabled = disabled;
    });
  };

  function renderAttemptThreeImmediate() {
    revealBox.innerHTML = `
      <p class="reveal-main">🎉 200€</p>
      <p class="reveal-sub">${config.finalText}</p>
    `;
    setEnvelopesDisabled(true);
    launchConfetti();
  }

  function handleTryAgain(label, stickerPath, stickerText, nextLabel) {
    revealBox.innerHTML = `
      <p class="reveal-main">${label}</p>
      <p class="reveal-sub">استني شوي…</p>
    `;
    setEnvelopesDisabled(true);

    state.timeoutId = window.setTimeout(() => {
      revealBox.innerHTML = `
        <div class="sticker-block">
          <img src="${stickerPath}" class="sticker-image" alt="ملصق لطيف" />
          <p class="reveal-sub">${stickerText}</p>
          <button class="btn btn-primary" id="continueTryBtn">${nextLabel}</button>
        </div>
      `;

      const continueBtn = modalContent.querySelector("#continueTryBtn");
      continueBtn?.addEventListener("click", () => {
        revealBox.innerHTML = `<p class="reveal-sub">جاهزة للمحاولة؟ اختاري أي ظرف ✨</p>`;
        setEnvelopesDisabled(false);
      });
    }, 3 * SECOND);
  }

  const attempt = getAttempt();
  if (attempt >= 3) {
    renderAttemptThreeImmediate();
  }

  envelopeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      clearRevealTimers();
      const currentAttempt = getAttempt();
      const nextAttempt = Math.min(currentAttempt + 1, 3);
      setAttempt(nextAttempt);

      if (nextAttempt === 1) {
        handleTryAgain(
          "🎁 طلع لك: 1000 ليرة سورية",
          "./assets/sticker1.png",
          "هاي تسخين بس… جربي مرة ثانية 😼",
          "محاولة ثانية"
        );
      } else if (nextAttempt === 2) {
        handleTryAgain(
          "🎁 طلع لك: 2000 ليرة سورية",
          "./assets/sticker2.png",
          "قربنا… بس لسا مو هون 😈",
          "المحاولة الأخيرة"
        );
      } else {
        renderAttemptThreeImmediate();
      }
    });
  });

  resetBtn.addEventListener("click", () => {
    clearRevealTimers();
    setAttempt(0);
    revealBox.innerHTML = `<p class="reveal-sub">تم التصفير ✅ اختاري أي ظرف للبداية من جديد</p>`;
    setEnvelopesDisabled(false);
  });
}

function launchConfetti() {
  if (reducedMotion) return;

  const ctx = confettiCanvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = window.innerWidth;
  const height = window.innerHeight;
  confettiCanvas.style.display = "block";
  confettiCanvas.width = Math.floor(width * dpr);
  confettiCanvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ["#ff4fa2", "#ffc14f", "#7be4ff", "#9bffb6", "#c49dff"];
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * -height,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.15 + Math.random() * 0.3
  }));

  let rafId = 0;
  const start = performance.now();

  function frame(now) {
    ctx.clearRect(0, 0, width, height);

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.03;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (now - start < 2500) {
      rafId = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, width, height);
      confettiCanvas.style.display = "none";
    }
  }

  requestAnimationFrame(frame);
}

introTitle.textContent = config.introText;
renderCounters();

startBtn.addEventListener("click", () => {
  splashScreen.hidden = true;
  splashScreen.classList.remove("screen--active");
  homeScreen.hidden = false;
  homeScreen.classList.add("screen--active");
});

document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", () => openModal(card.dataset.modal));
});

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.close === "true") {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});

resetTopBtn.addEventListener("click", () => {
  clearRevealTimers();
  setAttempt(0);
});
