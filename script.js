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

let activeMushroomsMap = new Map();

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

  // Собираем абсолютно все грибы и перемешиваем их
  let allMushrooms = [
    ...list1.map(word => ({ word, target: 1 })),
    ...list2.map(word => ({ word, target: 2 }))
  ];
  allMushrooms.sort(() => Math.random() - 0.5);

  spawnAllMushrooms(allMushrooms);
}

// РАССТАНОВКА ВСЕХ ГРИБОВ СРАЗУ В АККУРАТНУЮ ПЛОТНУЮ СЕТКУ
function spawnAllMushrooms(items) {
  const fieldWidth = gameField.clientWidth;
  const fieldHeight = gameField.clientHeight;

  // Компактный размер гриба, чтобы все 72 штуки влезли на экран
  const mushroomW = 58;
  const mushroomH = 64;

  // Вычисляем сколько колонок и рядов нужно для всех элементов
  const cols = Math.floor(fieldWidth / (mushroomW + 4)) || 5;
  const rows = Math.ceil(items.length / cols);

  const cellW = fieldWidth / cols;
  const cellH = fieldHeight / rows;

  items.forEach((item, index) => {
    const r = Math.floor(index / cols);
    const c = index % cols;

    const posX = c * cellW + (cellW - mushroomW) / 2;
    const posY = r * cellH + (cellH - mushroomH) / 2;

    const safeX = Math.max(2, Math.min(posX, fieldWidth - mushroomW - 2));
    const safeY = Math.max(2, Math.min(posY, fieldHeight - mushroomH - 2));

    createMushroomAt(item.word, item.target, safeX, safeY);
  });
}

function createMushroomAt(word, targetBasket, x, y) {
  const el = document.createElement("div");
  el.className = "mushroom compact-mushroom"; // компактный класс для текста и размеров
  el.dataset.target = targetBasket;

  el.innerHTML = `
    <div class="mushroom-cap"></div>
    <div class="mushroom-stem"></div>
    <div class="mushroom-text">${word}</div>
  `;

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  el.dataset.homeX = x;
  el.dataset.homeY = y;

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
