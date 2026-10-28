const list1 = [
  "Мама", "Парусина", "Вода", "Земля", "Книга", "Школа", "Страна", "Весна", "Зима", "Гора",
  "Стена", "Трава", "Семья", "Баня", "Дорога", "Липа", "Улыбка", "Муха", "Ракета", "Папа",
  "Дедушка", "Дядя", "Мужчина", "Юноша", "Судья"
];

const list2 = [
  "Стол", "Дом", "Конь", "Стул", "Трамвай", "Дуб", "Ветер", "Завод", "Врач", "Дождь",
  "Окно", "Солнце", "Небо", "Молоко", "Поле", "Море", "Здание", "Блюдце", "Письмо", "Яблоко",
  "Дерево", "Озеро", "Лето", "Утро", "Животное"
];

let score1 = 0;
let score2 = 0;
let totalSolved = 0;
const totalMushrooms = list1.length + list2.length;

const gameField = document.getElementById("game-field");
const score1El = document.getElementById("score-1");
const score2El = document.getElementById("score-2");
const progressBar = document.getElementById("progress-bar");
const errorCross = document.getElementById("error-cross");
const victoryModal = document.getElementById("victory-modal");
const basket1 = document.getElementById("basket-1");
const basket2 = document.getElementById("basket-2");

function initGame() {
  score1 = 0;
  score2 = 0;
  totalSolved = 0;
  updateUI();
  gameField.innerHTML = "";
  victoryModal.classList.add("hidden");

  const allWords = [
    ...list1.map(word => ({ word, target: 1 })),
    ...list2.map(word => ({ word, target: 2 }))
  ].sort(() => Math.random() - 0.5);

  const fieldWidth = gameField.clientWidth || (window.innerWidth - 10);
  const fieldHeight = gameField.clientHeight || (window.innerHeight - 180);

  const cols = Math.floor(fieldWidth / 70) || 5;
  const rows = Math.ceil(allWords.length / cols);

  const cellWidth = fieldWidth / cols;
  const cellHeight = Math.min(78, fieldHeight / rows);

  allWords.forEach((item, index) => {
    createMushroom(item.word, item.target, index, cols, cellWidth, cellHeight);
  });
}

function createMushroom(word, targetBasket, index, cols, cellWidth, cellHeight) {
  const el = document.createElement("div");
  el.className = "mushroom";
  el.dataset.target = targetBasket;

  const col = index % cols;
  const row = Math.floor(index / cols);

  const posX = Math.max(2, Math.min(col * cellWidth + (cellWidth - 65) / 2, window.innerWidth - 70));
  const posY = Math.max(2, row * cellHeight + (cellHeight - 75) / 2);

  el.style.left = `${posX}px`;
  el.style.top = `${posY}px`;

  el.dataset.homeX = posX;
  el.dataset.homeY = posY;

  el.innerHTML = `
    <div class="mushroom-cap"></div>
    <div class="mushroom-stem"></div>
    <div class="mushroom-text">${word}</div>
  `;

  addDragListeners(el);
  gameField.appendChild(el);
}

function addDragListeners(el) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  const onStart = (e) => {
    isDragging = true;
    el.style.transition = "none";
    el.classList.add("dragging");
    
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
    if (e.touches) e.preventDefault();

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
    left: b1Rect.left - 50,
    right: b1Rect.right + 50,
    top: b1Rect.top - 100,
    bottom: b1Rect.bottom + 30
  };

  const expandedB2 = {
    left: b2Rect.left - 50,
    right: b2Rect.right + 50,
    top: b2Rect.top - 100,
    bottom: b2Rect.bottom + 30
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
  updateUI();

  el.style.transition = "all 0.2s ease-in";
  el.style.transform = "scale(0.1)";
  el.style.opacity = "0";

  setTimeout(() => el.remove(), 200);

  basketEl.classList.remove("basket-bounce");
  void basketEl.offsetWidth;
  basketEl.classList.add("basket-bounce");

  if (window.confetti) {
    const rect = basketEl.getBoundingClientRect();
    confetti({
      particleCount: 25,
      spread: 50,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: rect.top / window.innerHeight
      }
    });
  }

  if (totalSolved === totalMushrooms) {
    setTimeout(() => {
      victoryModal.classList.remove("hidden");
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }, 300);
  }
}

function handleError(el) {
  errorCross.classList.remove("hidden");
  errorCross.style.animation = "none";
  void errorCross.offsetWidth;
  errorCross.style.animation = "popAndShake 0.4s ease forwards";

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
}

window.addEventListener("load", initGame);
window.addEventListener("resize", () => {
  if (totalSolved === 0) initGame();
});