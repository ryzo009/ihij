const list1 = [
  "Мама", "Парусина", "Вода", "Земля", "Книга", "Школа", "Страна", "Весна", "Зима", "Гора",
  "Стена", "Трава", "Семья", "Баня", "Дорога", "Липа", "Улыбка", "Муха", "Ракета", "Папа",
  "Дедушка", "Дядя", "Мужчина", "Юноша", "Судья",
  "Звезда", "Река", "Тропа", "Луна", "Туча", "Птица", "Рыба", "Шляпа", "Тропинка", "Капля",
  "Ручка", "Роза", "Деревня", "Армия", "Нота"
];

const list2 = [
  "Стол", "Дом", "Конь", "Стул", "Трамвай", "Дуб", "Ветер", "Завод", "Врач", "Дождь",
  "Окно", "Солнце", "Небо", "Молоко", "Поле", "Море", "Здание", "Блюдце", "Письмо", "Яблоко",
  "Дерево", "Озеро", "Лето", "Утро", "Животное",
  "Гриб", "Лес", "Пень", "Город", "Забор", "Мост", "Огонь", "Цветок", "Брат", "Камень",
  "Леопард", "Ключ",
  "День", "Закон", "Герой"
];

let score1 = 0;
let score2 = 0;
let totalSolved = 0;
let totalMushrooms = 0;

const gameField = document.getElementById("game-field");
const score1El = document.getElementById("score-1");
const score2El = document.getElementById("score-2");
const progressBar = document.getElementById("progress-bar");
const errorCross = document.getElementById("error-cross");
const victoryModal = document.getElementById("victory-modal");
const basket1 = document.getElementById("basket-1");
const basket2 = document.getElementById("basket-2");

function spawnLargeOrderedGrid(items) {
  const fw = gameField.clientWidth;
  const fh = gameField.clientHeight - 14;   // запас, чтобы ничего не заходило под корзины
  const gapX = 10, gapY = 8, startY = 8;

  // подбираем масштаб, при котором все грибочки помещаются над корзинами
  let k = 1, cols, rows;
  while (true) {
    cols = Math.max(1, Math.floor((fw - 16) / (78 * k + gapX)));
    rows = Math.ceil(items.length / cols);
    if (rows * (86 * k + gapY) <= fh || k <= 0.62) break;
    k = Math.round((k - 0.02) * 100) / 100;
  }
  // если и при минимальном масштабе не помещается (телефон, сложный уровень) — берём столько, сколько влезает
  const maxRows = Math.max(1, Math.floor(fh / (86 * k + gapY)));
  items = items.slice(0, cols * maxRows);
  totalMushrooms = items.length;
  updateUI();

  const cellW = 78 * k, cellH = 86 * k;
  const totalGridW = cols * cellW + (cols - 1) * gapX;
  const startX = Math.max(8, (fw - totalGridW) / 2);

  items.forEach((item, index) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const el = createMushroomAt(item.word, item.target, startX + c * (cellW + gapX), startY + r * (cellH + gapY), k);
    // Плавный каскадный эффект появления грибочков
    el.style.animationDelay = `${(r + c) * 0.07}s`;
  });
}

function createMushroomAt(word, targetBasket, x, y, k = 1) {
  const el = document.createElement("div");
  el.className = "mushroom";
  el.dataset.target = targetBasket;

  el.innerHTML = `
    <div class="mushroom-inner" style="transform: scale(${k});">
      <div class="mushroom-cap" style="width: 70px; height: 38px;"></div>
      <div class="mushroom-stem" style="width: 26px; height: 34px;"></div>
      <div class="mushroom-text">${esc(word)}</div>
    </div>
  `;

  el.style.width = `${78 * k}px`;
  el.style.height = `${86 * k}px`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  el.dataset.homeX = x;
  el.dataset.homeY = y;

  const clearAnim = () => { el.style.animation = "none"; };
  el.addEventListener("animationend", clearAnim, { once: true });
  el.addEventListener("animationcancel", clearAnim, { once: true });

  addDragListeners(el);
  gameField.appendChild(el);
  return el;
}

function addDragListeners(el) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  const onStart = (e) => {
    e.preventDefault();
    isDragging = true;
    el.style.transition = "none";
    el.classList.add("dragging");
    clearTimeout(liftTimer);
    gameField.classList.add("lift");
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    initialLeft = parseFloat(el.style.left);
    initialTop = parseFloat(el.style.top);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    el.style.left = `${initialLeft + deltaX}px`;
    el.style.top = `${initialTop + deltaY}px`;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    el.classList.remove("dragging");

    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchend", onEnd);

    checkDrop(el);
    // грибочек остаётся поверх корзин, пока летит в корзину или возвращается домой
    liftTimer = setTimeout(() => gameField.classList.remove("lift"), 450);
  };

  el.addEventListener("mousedown", onStart);
  el.addEventListener("touchstart", onStart, { passive: false });
}

function checkDrop(el) {
  const rect = el.getBoundingClientRect();
  const mushroomCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };

  const b1Rect = basket1.getBoundingClientRect();
  const b2Rect = basket2.getBoundingClientRect();

  const expandedB1 = {
    left: b1Rect.left - 40,
    right: b1Rect.right + 40,
    top: b1Rect.top - 80,
    bottom: b1Rect.bottom + 20
  };

  const expandedB2 = {
    left: b2Rect.left - 40,
    right: b2Rect.right + 40,
    top: b2Rect.top - 80,
    bottom: b2Rect.bottom + 20
  };

  const inBasket1 = isInside(mushroomCenter, expandedB1);
  const inBasket2 = isInside(mushroomCenter, expandedB2);

  const target = parseInt(el.dataset.target);

  if (inBasket1) {
    if (target === 1) handleSuccess(el, basket1, 1);
    else handleError(el);
  } else if (inBasket2) {
    if (target === 2) handleSuccess(el, basket2, 2);
    else handleError(el);
  } else {
    returnToHome(el);
  }
}

function isInside(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function returnToHome(el) {
  el.style.transition = "left 0.25s ease-out, top 0.25s ease-out";
  el.style.left = `${el.dataset.homeX}px`;
  el.style.top = `${el.dataset.homeY}px`;
}

function handleSuccess(el, basketEl, basketNum) {
  if (basketNum === 1) score1++;
  else score2++;
  
  totalSolved++;
  streak++;
  if (streak % 4 === 0) showCritter();
  playSound("ok");
  updateUI();

  el.style.zIndex = "999999";
  el.classList.add("falling-in");

  const fieldRect = gameField.getBoundingClientRect();
  const basketRect = basketEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  
  const targetX = (basketRect.left + basketRect.width / 2) - fieldRect.left - (elRect.width / 2);
  const targetY = (basketRect.top + basketRect.height / 2) - fieldRect.top;

  el.style.transition = "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
  el.style.left = `${targetX}px`;
  el.style.top = `${targetY}px`;
  el.style.transform = "scale(0.25)";
  el.style.opacity = "0";

  setTimeout(() => {
    el.remove();
  }, 400);

  basketEl.classList.remove("basket-bounce");
  void basketEl.offsetWidth;
  basketEl.classList.add("basket-bounce");

  if (window.confetti) {
    confetti({
      particleCount: 25,
      spread: 50,
      origin: {
        x: (basketRect.left + basketRect.width / 2) / window.innerWidth,
        y: basketRect.top / window.innerHeight
      }
    });
  }

  if (totalSolved === totalMushrooms) {
    stopTimer();
    setTimeout(() => {
      showVictory();
    }, 450);
  }
}

function handleError(el) {
  errors++;
  streak = 0;
  updateStats();
  playSound("err");
  errorCross.classList.remove("hidden");
  errorCross.style.animation = "none";
  void errorCross.offsetWidth;
  errorCross.style.animation = "errorPopShake 0.4s ease forwards";

  returnToHome(el);

  setTimeout(() => {
    errorCross.classList.add("hidden");
  }, 400);
}

function updateUI() {
  score1El.textContent = score1;
  score2El.textContent = score2;
  const progressPercent = (totalSolved / totalMushrooms) * 100;
  progressBar.style.width = `${progressPercent}%`;
  const pm = document.getElementById("progress-mush");
  if (pm) pm.style.left = `${progressPercent}%`;
  document.querySelector(".forest-bg").style.setProperty("--p", progressPercent / 100);
}

// ===== Уровни, таймер, звук, рекорды, свои слова =====
const LEVELS = { easy: 20, normal: 40, hard: Infinity };

function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch (e) { return def; }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
}

let level = load("level", "normal");
if (!(level in LEVELS)) level = "normal";
let soundOn = load("sound", "on") !== "off";
let liftTimer = null;
let errors = 0, startTime = 0, timerId = null, finalTime = 0, audioCtx = null;

const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const parseWords = t => [...new Set(t.split(/[,;\n]+/).map(w => w.trim()).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)))];

function activeLists() { return load("customWords", null) || { l1: list1, l2: list2 }; }
function recKey() { return "rec_" + level + (load("customWords", null) ? "_own" : ""); }

function pickWords() {
  const { l1, l2 } = activeLists();
  const half = LEVELS[level] / 2;
  return [
    ...shuffle(l1).slice(0, half).map(word => ({ word, target: 1 })),
    ...shuffle(l2).slice(0, half).map(word => ({ word, target: 2 }))
  ];
}

function initGame() {
  score1 = 0; score2 = 0; totalSolved = 0; errors = 0; streak = 0;
  gameField.innerHTML = "";
  victoryModal.classList.add("hidden");
  const items = shuffle(pickWords());
  spawnLargeOrderedGrid(items);
  startTimer();
  updateStats();
}

function startTimer() { stopTimer(); startTime = Date.now(); finalTime = 0; timerId = setInterval(updateStats, 500); }
function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; finalTime = Math.round((Date.now() - startTime) / 1000); }
}
function updateStats() {
  const t = timerId ? Math.round((Date.now() - startTime) / 1000) : finalTime;
  document.getElementById("timer").textContent = "⏱ " + fmt(t);
  document.getElementById("errors").textContent = "❌ " + errors;
}

// Звёзды: считаем среднее «время + штраф 5 с за ошибку» на одно слово
function calcStars(time, err, n) {
  const avg = (time + err * 5) / n;
  return avg <= 4 ? 3 : avg <= 7 ? 2 : 1;
}

function showVictory() {
  updateStats();
  const stars = calcStars(finalTime, errors, totalMushrooms);
  const pts = finalTime + errors * 5;
  const rec = load(recKey(), null);
  const isNew = !rec || pts < rec.pts;
  if (isNew) save(recKey(), { pts, time: finalTime, errors, stars });
  const msgs = ["", "Хорошо! Попробуй быстрее и без ошибок", "Отлично! Совсем чуть-чуть до трёх звёзд", "Безупречно! Настоящий знаток склонений"];
  const $ = id => document.getElementById(id);
  $("victory-msg").textContent = msgs[stars];
  $("stars").innerHTML = [1, 2, 3].map(i => `<span class="star ${i <= stars ? "on" : ""}" style="animation-delay:${0.25 + i * 0.25}s">★</span>`).join("");
  $("res-time").textContent = fmt(finalTime);
  $("res-errors").textContent = errors;
  $("res-words").textContent = totalMushrooms;
  $("new-record").textContent = rec ? "🏆 Новый рекорд!" : "💾 Результат сохранён";
  $("new-record").classList.toggle("hidden", !isNew);
  victoryModal.classList.remove("hidden");
  playSound("win");
  fireworks();
}

function playSound(type) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = {
      ok: [[660, 0], [880, 0.08]],
      err: [[200, 0], [150, 0.12]],
      win: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]]
    }[type];
    seq.forEach(([f, d]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type === "err" ? "sawtooth" : "sine";
      o.frequency.value = f;
      const t = audioCtx.currentTime + d;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.16);
    });
  } catch (e) {}
}

let streak = 0, critterBusy = false;

function fireworks() {
  if (!window.confetti) return;
  const colors = [["#ffb703", "#ffd166"], ["#52b788", "#95d5b2"], ["#e76f51", "#f4a261"], ["#4ea8de", "#90e0ef"]];
  for (let i = 0; i < 6; i++) {
    setTimeout(() => confetti({
      particleCount: 70, startVelocity: 38, spread: 360, ticks: 70, gravity: 0.9,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 },
      colors: colors[i % 4], zIndex: 5000
    }), i * 350);
  }
}

function showCritter() {
  if (critterBusy) return;
  critterBusy = true;
  const say = ["😉 Так держать!", "Умница!", "Молодец!", "Ух ты!"][Math.floor(Math.random() * 4)];
  const el = document.createElement("div");
  el.className = "critter " + (Math.random() < 0.5 ? "left" : "right");
  el.innerHTML = `<span class="bubble">${say}</span><span class="animal">${Math.random() < 0.5 ? "🐿️" : "🦔"}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  setTimeout(() => el.classList.remove("show"), 2200);
  setTimeout(() => { el.remove(); critterBusy = false; }, 2900);
}

function buildAtmosphere() {
  const r = (a, b) => a + Math.random() * (b - a);
  let h = '<div class="dawn"></div>';
  [[8, 10], [34, -6], [62, 14], [84, -10]].forEach(([l, rot], i) =>
    h += `<div class="ray" style="left:${l}%;transform:rotate(${rot}deg);animation-delay:${i * 1.3}s"></div>`);
  h += '<div class="fog"></div><div class="fog fog2"></div><div class="fx-fire">';
  for (let i = 0; i < 16; i++)
    h += `<div class="firefly" style="top:${r(10, 85)}%;left:${r(2, 96)}%;animation-duration:${r(5, 9)}s;animation-delay:${-r(0, 8)}s"></div>`;
  h += "</div>";
  for (let i = 0; i < 10; i++)
    h += `<span class="leaf" style="left:${r(0, 95)}%;font-size:${r(14, 22)}px;animation-duration:${r(10, 18)}s;animation-delay:${-r(0, 16)}s">${["🍂", "🍁", "🍃"][i % 3]}</span>`;
  const fx = document.createElement("div");
  fx.className = "fx";
  fx.innerHTML = h;
  document.querySelector(".forest-bg").appendChild(fx);
}

window.addEventListener("load", () => {
  buildAtmosphere();
  const $ = id => document.getElementById(id);
  const startScreen = $("start-screen"), editor = $("words-modal");
  const l1El = $("words-1"), l2El = $("words-2");

  const refresh = () => {
    document.querySelectorAll(".level-btn").forEach(b => b.classList.toggle("active", b.dataset.level === level));
    const r = load(recKey(), null);
    $("record-line").textContent = r ? `🏆 Рекорд: ${fmt(r.time)}, ошибок: ${r.errors} ${"⭐".repeat(r.stars)}` : "🏆 Рекорда пока нет";
    $("words-btn").textContent = load("customWords", null) ? "✏️ Свои слова: вкл." : "✏️ Свои слова";
    document.querySelectorAll(".sound-toggle").forEach(b => b.textContent = soundOn ? "🔊" : "🔇");
  };
  const fill = () => { const a = activeLists(); l1El.value = a.l1.join(", "); l2El.value = a.l2.join(", "); };

  document.querySelectorAll(".level-btn").forEach(b => b.addEventListener("click", () => {
    level = b.dataset.level; save("level", level); refresh();
  }));
  document.querySelectorAll(".sound-toggle").forEach(b => b.addEventListener("click", () => {
    soundOn = !soundOn; save("sound", soundOn ? "on" : "off"); refresh();
  }));
  $("start-btn").addEventListener("click", () => { startScreen.classList.add("hidden"); initGame(); });
  $("menu-btn").addEventListener("click", () => { stopTimer(); refresh(); startScreen.classList.remove("hidden"); });
  $("to-menu-btn").addEventListener("click", () => { victoryModal.classList.add("hidden"); refresh(); startScreen.classList.remove("hidden"); });

  $("words-btn").addEventListener("click", () => { fill(); editor.classList.remove("hidden"); });
  $("words-close").addEventListener("click", () => editor.classList.add("hidden"));
  $("words-reset").addEventListener("click", () => { localStorage.removeItem("customWords"); fill(); refresh(); });
  $("words-save").addEventListener("click", () => {
    const a = parseWords(l1El.value), b = parseWords(l2El.value);
    if (!a.length || !b.length) return alert("В каждой корзине должно быть хотя бы одно слово.");
    const dup = a.filter(w => b.includes(w));
    if (dup.length) return alert("Слово не может быть в двух корзинах: " + dup.join(", "));
    save("customWords", { l1: a, l2: b });
    editor.classList.add("hidden");
    refresh();
  });

  refresh();
});
