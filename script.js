const list1 = [
  "Мама", "Парусина", "Вода", "Земля", "Книга", "Школа", "Страна", "Весна", "Зима", "Гора",
  "Стена", "Трава", "Семья", "Баня", "Дорога", "Липа", "Улыбка", "Муха", "Ракета", "Папа",
  "Дедушка", "Дядя", "Мужчина", "Юноша", "Судья",
  "Звезда", "Река", "Тропа", "Луна", "Туча", "Тетрадь", "Птица", "Рыба", "Шляпа", "Тропинка", "Ладонь", "Капля"
];

const list2 = [
  "Стол", "Дом", "Конь", "Стул", "Трамвай", "Дуб", "Ветер", "Завод", "Врач", "Дождь",
  "Окно", "Солнце", "Небо", "Молоко", "Поле", "Море", "Здание", "Блюдце", "Письмо", "Яблоко",
  "Дерево", "Озеро", "Лето", "Утро", "Животное",
  "Гриб", "Лес", "Пень", "Город", "Забор", "Мост", "Огонь", "Цветок", "Брат", "Камень"
];

let score1 = 0;
let score2 = 0;
let totalSolved = 0;
const totalMushrooms = list1.length + list2.length;

let remainingPool = [];
// Слот-система для идеального размещения без наложений
let gridSlots = [];
let activeMushroomsMap = new Map(); // Хранит грибы по их слотам

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
  activeMushroomsMap.clear();
  updateUI();
  gameField.innerHTML = "";
  victoryModal.classList.add("hidden");

  remainingPool = [
    ...list1.map(word => ({ word, target: 1 })),
    ...list2.map(word => ({ word, target: 2 }))
  ];
  remainingPool.sort(() => Math.random() - 0.5);

  setupGridSlots();
  spawnNextBatch();
}

// Создаем безопасную сетку слотов на основе размеров игрового поля
function setupGridSlots() {
  gridSlots = [];
  const fieldWidth = gameField.clientWidth || (window.innerWidth - 20);
  const fieldHeight = gameField.clientHeight - 20;

  const itemWidth = 80;  // ширина гриба + отступ
  const itemHeight = 90; // высота гриба + отступ

  const cols = Math.floor(fieldWidth / itemWidth) || 4;
  const rows = Math.floor(fieldHeight / itemHeight) || 3;

  const cellW = fieldWidth / cols;
  const cellH = fieldHeight / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const posX = c * cellW + (cellW - 75) / 2;
      const posY = r * cellH + (cellH - 85) / 2;
      gridSlots.push({ row: r, col: c, x: Math.max(5, posX), y: Math.max(5, posY), occupied: false });
    }
  }

  // Перемешиваем слоты, чтобы грибы появлялись в случайных местах поля
  gridSlots.sort(() => Math.random() - 0.5);
}

// Заполняем свободные слоты грибами
function spawnNextBatch() {
  for (let i = 0; i < gridSlots.length && remainingPool.length > 0; i++) {
    const slot = gridSlots[i];
    if (!slot.occupied) {
      const item = remainingPool.pop();
      slot.occupied = true;
      createMushroomInSlot(item.word, item.target, slot);
    }
  }
}

function createMushroomInSlot(word, targetBasket, slot) {
  const el = document.createElement("div");
  el.className = "mushroom";
  el.dataset.target = targetBasket;

  el.innerHTML = `
    <div class="mushroom-cap"></div>
    <div class="mushroom-stem"></div>
    <div class="mushroom-text">${word}</div>
  `;

  el.style.left = `${slot.x}px`;
  el.style.top = `${slot.y}px`;

  el.dataset.homeX = slot.x;
  el.dataset.homeY = slot.y;

  activeMushroomsMap.set(el, slot);
  addDragListeners(el);
  gameField.appendChild(el);
}

function addDragListeners(el) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  const onStart = (e) => {
    e.preventDefault();
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
  updateUI();

  // Освобождаем слот ушедшего гриба
  const slot = activeMushroomsMap.get(el);
  if (slot) {
    slot.occupied = false;
    activeMushroomsMap.delete(el);
  }

  const basketRect = basketEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  
  const targetX = basketRect.left + (basketRect.width - elRect.width) / 2;
  const targetY = basketRect.top + 30;

  el.classList.add("falling-in");
  el.style.transition = "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
  el.style.left = `${targetX}px`;
  el.style.top = `${targetY}px`;
  el.style.transform = "scale(0.3) translateY(35px)";
  el.style.opacity = "0";

  setTimeout(() => {
    el.remove();
    // Появляется новый гриб на освободившееся место
    spawnNextBatch();
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
    setTimeout(() => {
      victoryModal.classList.remove("hidden");
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }, 450);
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
