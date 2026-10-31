"use strict";

// ========================================
// СЛОВА ДЛЯ ИГРЫ
// ========================================

const list1 = [
  "Мама", "Парусина", "Вода", "Земля", "Книга",
  "Школа", "Страна", "Весна", "Зима", "Гора",
  "Стена", "Трава", "Семья", "Баня", "Дорога",
  "Липа", "Улыбка", "Муха", "Ракета", "Папа",
  "Дедушка", "Дядя", "Мужчина", "Юноша", "Судья",
  "Звезда", "Река", "Тропа", "Луна", "Туча",
  "Тетрадь", "Птица", "Рыба", "Шляпа",
  "Тропинка", "Ладонь", "Капля"
];

const list2 = [
  "Стол", "Дом", "Конь", "Стул", "Трамвай",
  "Дуб", "Ветер", "Завод", "Врач", "Дождь",
  "Окно", "Солнце", "Небо", "Молоко", "Поле",
  "Море", "Здание", "Блюдце", "Письмо", "Яблоко",
  "Дерево", "Озеро", "Лето", "Утро", "Животное",
  "Гриб", "Лес", "Пень", "Город", "Забор",
  "Мост", "Огонь", "Цветок", "Брат", "Камень"
];

// ========================================
// ПЕРЕМЕННЫЕ ИГРЫ
// ========================================

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

let resizeTimer;

// ========================================
// ЗАПУСК И ПЕРЕЗАПУСК
// ========================================

function initGame() {
  score1 = 0;
  score2 = 0;
  totalSolved = 0;

  gameField.innerHTML = "";

  victoryModal.classList.add("hidden");
  errorCross.classList.add("hidden");

  const allMushrooms = [
    ...list1.map(word => ({ word, target: 1 })),
    ...list2.map(word => ({ word, target: 2 }))
  ];

  // Перемешиваем слова
  for (let i = allMushrooms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [allMushrooms[i], allMushrooms[j]] =
      [allMushrooms[j], allMushrooms[i]];
  }

  updateUI();
  spawnAllMushrooms(allMushrooms);
}

// ========================================
// АДАПТИВНОЕ РАСПОЛОЖЕНИЕ ГРИБОВ
// ========================================

function getMushroomSize() {
  const mushroom = document.createElement("div");
  mushroom.className = "mushroom";

  mushroom.style.visibility = "hidden";
  mushroom.style.left = "0";
  mushroom.style.top = "0";

  gameField.appendChild(mushroom);

  const rect = mushroom.getBoundingClientRect();

  mushroom.remove();

  return {
    width: rect.width || 43,
    height: rect.height || 53
  };
}

function spawnAllMushrooms(items) {
  const fieldWidth = gameField.clientWidth;
  const fieldHeight = gameField.clientHeight;

  if (!fieldWidth || !fieldHeight) {
    requestAnimationFrame(() => spawnAllMushrooms(items));
    return;
  }

  const size = getMushroomSize();

  const mushroomW = size.width;
  const mushroomH = size.height;

  // Определяем число колонок по ширине экрана
  const gapX = 2;
  const gapY = 3;

  const cols = Math.max(
    1,
    Math.floor((fieldWidth + gapX) / (mushroomW + gapX))
  );

  const rows = Math.ceil(items.length / cols);

  // Равномерно распределяем грибы по полю
  const cellW = fieldWidth / cols;
  const cellH = fieldHeight / rows;

  items.forEach((item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const rowItems = Math.min(
      cols,
      items.length - row * cols
    );

    // Центрируем последнюю неполную строку
    const rowWidth = rowItems * cellW;
    const rowOffset = (fieldWidth - rowWidth) / 2;

    const posX =
      rowOffset + col * cellW + (cellW - mushroomW) / 2;

    const posY =
      row * cellH + (cellH - mushroomH) / 2;

    const safeX = Math.max(
      0,
      Math.min(posX, fieldWidth - mushroomW)
    );

    const safeY = Math.max(
      0,
      Math.min(posY, fieldHeight - mushroomH)
    );

    createMushroomAt(
      item.word,
      item.target,
      safeX,
      safeY,
      index
    );
  });
}

// ========================================
// СОЗДАНИЕ ГРИБА
// ========================================

function createMushroomAt(word, targetBasket, x, y, index) {
  const el = document.createElement("div");

  el.className = "mushroom";
  el.dataset.target = targetBasket;

  const cap = document.createElement("div");
  cap.className = "mushroom-cap";

  const stem = document.createElement("div");
  stem.className = "mushroom-stem";

  const text = document.createElement("div");
  text.className = "mushroom-text";
  text.textContent = word;
  text.title = word;

  el.append(cap, stem, text);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.animationDelay = `${Math.min(index * 5, 150)}ms`;

  el.dataset.homeX = x;
  el.dataset.homeY = y;

  addDragListeners(el);

  gameField.appendChild(el);
}

// ========================================
// ПЕРЕТАСКИВАНИЕ МЫШЬЮ И ПАЛЬЦЕМ
// ========================================

function addDragListeners(el) {
  let isDragging = false;

  let startX = 0;
  let startY = 0;

  let initialLeft = 0;
  let initialTop = 0;

  el.addEventListener("pointerdown", onStart);

  function onStart(e) {
    if (e.button !== undefined && e.button !== 0) return;

    if (el.classList.contains("falling-in")) return;

    e.preventDefault();

    isDragging = true;

    startX = e.clientX;
    startY = e.clientY;

    initialLeft = parseFloat(el.style.left) || 0;
    initialTop = parseFloat(el.style.top) || 0;

    el.style.transition = "none";
    el.classList.add("dragging");

    el.style.zIndex = "1000";

    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {
      // Браузер может не поддерживать захват указателя
    }
  }

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onEnd);
  el.addEventListener("pointercancel", onCancel);

  function onMove(e) {
    if (!isDragging) return;

    e.preventDefault();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    el.style.left = `${initialLeft + dx}px`;
    el.style.top = `${initialTop + dy}px`;
  }

  function onEnd(e) {
    if (!isDragging) return;

    isDragging = false;

    el.classList.remove("dragging");
    el.style.zIndex = "";

    checkDrop(el);
  }

  function onCancel() {
    if (!isDragging) return;

    isDragging = false;

    el.classList.remove("dragging");
    el.style.zIndex = "";

    returnToHome(el);
  }
}

// ========================================
// ПРОВЕРКА КОРЗИНЫ
// ========================================

function checkDrop(el) {
  if (!el.isConnected) return;

  const rect = el.getBoundingClientRect();

  const center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };

  const b1 = basket1.getBoundingClientRect();
  const b2 = basket2.getBoundingClientRect();

  // Немного увеличиваем область попадания в корзины
  const expandedB1 = {
    left: b1.left - 12,
    right: b1.right + 12,
    top: b1.top - 45,
    bottom: b1.bottom + 10
  };

  const expandedB2 = {
    left: b2.left - 12,
    right: b2.right + 12,
    top: b2.top - 45,
    bottom: b2.bottom + 10
  };

  const inBasket1 = isInside(center, expandedB1);
  const inBasket2 = isInside(center, expandedB2);

  const target = Number(el.dataset.target);

  if (inBasket1) {
    if (target === 1) {
      handleSuccess(el, basket1, 1);
    } else {
      handleError(el);
    }

    return;
  }

  if (inBasket2) {
    if (target === 2) {
      handleSuccess(el, basket2, 2);
    } else {
      handleError(el);
    }

    return;
  }

  returnToHome(el);
}

function isInside(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

// ========================================
// ВОЗВРАТ ГРИБА НА МЕСТО
// ========================================

function returnToHome(el) {
  if (!el.isConnected) return;

  el.style.zIndex = "";
  el.style.transition = "left 0.22s ease, top 0.22s ease";

  el.style.left = `${el.dataset.homeX}px`;
  el.style.top = `${el.dataset.homeY}px`;
}

// ========================================
// ПРАВИЛЬНЫЙ ОТВЕТ
// ========================================

function handleSuccess(el, basketEl, basketNum) {
  if (!el.isConnected) return;

  if (basketNum === 1) {
    score1++;
  } else {
    score2++;
  }

  totalSolved++;

  updateUI();

  const basketRect = basketEl.getBoundingClientRect();

  basketEl.classList.remove("basket-bounce");

  void basketEl.offsetWidth;

  basketEl.classList.add("basket-bounce");

  // Убираем гриб после правильной сортировки
  el.classList.add("falling-in");

  el.style.transition =
    "transform 0.3s ease, opacity 0.3s ease";

  el.style.transform = "scale(0.25)";
  el.style.opacity = "0";

  setTimeout(() => {
    el.remove();
  }, 320);

  // Эффект конфетти
  if (typeof window.confetti === "function") {
    window.confetti({
      particleCount: 18,
      spread: 45,
      origin: {
        x: (basketRect.left + basketRect.width / 2) /
          window.innerWidth,

        y: basketRect.top / window.innerHeight
      }
    });
  }

  // Победа
  if (totalSolved >= totalMushrooms) {
    setTimeout(() => {
      victoryModal.classList.remove("hidden");

      if (typeof window.confetti === "function") {
        window.confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.5 }
        });
      }
    }, 350);
  }
}

// ========================================
// НЕПРАВИЛЬНЫЙ ОТВЕТ
// ========================================

function handleError(el) {
  errorCross.classList.remove("hidden");

  errorCross.style.animation = "none";

  void errorCross.offsetWidth;

  errorCross.style.animation =
    "errorPop 0.4s ease forwards";

  returnToHome(el);

  setTimeout(() => {
    errorCross.classList.add("hidden");
  }, 420);
}

// ========================================
// СЧЁТ И ПРОГРЕСС
// ========================================

function updateUI() {
  score1El.textContent = score1;
  score2El.textContent = score2;

  const progressPercent =
    (totalSolved / totalMushrooms) * 100;

  progressBar.style.width = `${progressPercent}%`;
}

// ========================================
// ПЕРЕРАСЧЁТ ПРИ ИЗМЕНЕНИИ ЭКРАНА
// ========================================

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    // Перестраиваем поле только если игра ещё не закончена
    if (totalSolved < totalMushrooms) {
      initGame();
    }
  }, 200);
});

// Запускаем игру после загрузки страницы
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
