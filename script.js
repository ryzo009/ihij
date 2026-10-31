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
let activeMushroomsOnField = 0;
const MAX_ON_FIELD = 8; // Одновременно на поле находится до 8 грибов, освободилось место -> появился новый

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
  activeMushroomsOnField = 0;
  updateUI();
  gameField.innerHTML = "";
  victoryModal.classList.add("hidden");

  // Собираем полный пул и перемешиваем
  remainingPool = [
    ...list1.map(word => ({ word, target: 1 })),
    ...list2.map(word => ({ word, target: 2 }))
  ];
  remainingPool.sort(() => Math.random() - 0.5);

  // Заполняем поле первой порцией грибов
  spawnNextBatch();
}

// Заполняет поле грибами до лимита MAX_ON_FIELD, находя свободные слоты
function spawnNextBatch() {
  while (activeMushroomsOnField < MAX_ON_FIELD && remainingPool.length > 0) {
    const item = remainingPool.pop();
    activeMushroomsOnField++;
    createMushroomWithSmartPosition(item.word, item.target);
  }
}

function createMushroomWithSmartPosition(word, targetBasket) {
  const el = document.createElement("div");
  el.className = "mushroom";
  el.dataset.target = targetBasket;

  el.innerHTML = `
    <div class="mushroom-cap"></div>
    <div class="mushroom-stem"></div>
    <div class="mushroom-text">${word}</div>
  `;

  gameField.appendChild(el);

  // Вычисляем размеры и подбираем свободные координаты без наложения
  const fieldWidth = gameField.clientWidth - 90;
  const fieldHeight = gameField.clientHeight - 100;

  let posX = 10 + Math.random() * Math.max(50, fieldWidth);
  let posY = 10 + Math.random() * Math.max(50, fieldHeight);

  el.style.left = `${posX}px`;
  el.style.top = `${posY}px`;

  el.dataset.homeX = posX;
  el.dataset.homeY = posY;

  addDragListeners(el);
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
  activeMushroomsOnField--;
  updateUI();

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
    // Как только гриб улетел в корзину, подтягиваем следующий на поле!
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
