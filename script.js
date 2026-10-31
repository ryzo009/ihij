
const list1 = [
    "Мама", "Парусина", "Вода", "Земля", "Книга", "Школа",
    "Страна", "Весна", "Зима", "Гора", "Стена", "Трава",
    "Семья", "Баня", "Дорога", "Липа", "Улыбка", "Муха",
    "Ракета", "Папа", "Дедушка", "Дядя", "Мужчина", "Юноша",
    "Судья", "Звезда", "Река", "Тропа", "Луна", "Туча",
    "Тетрадь", "Птица", "Рыба", "Шляпа", "Тропинка",
    "Ладонь", "Капля"
];

const list2 = [
    "Стол", "Дом", "Конь", "Стул", "Трамвай", "Дуб",
    "Ветер", "Завод", "Врач", "Дождь", "Окно", "Солнце",
    "Небо", "Молоко", "Поле", "Море", "Здание", "Блюдце",
    "Письмо", "Яблоко", "Дерево", "Озеро", "Лето", "Утро",
    "Животное", "Гриб", "Лес", "Пень", "Город", "Забор",
    "Мост", "Огонь", "Цветок", "Брат", "Камень"
];

const TOTAL = list1.length + list2.length;

const field = document.getElementById("game-field");
const basket1 = document.getElementById("basket-1");
const basket2 = document.getElementById("basket-2");
const progressBar = document.getElementById("progress-bar");
const progressCount = document.getElementById("progress-count");
const score1 = document.getElementById("score-1");
const score2 = document.getElementById("score-2");
const errorMessage = document.getElementById("error-cross");
const victoryModal = document.getElementById("victory-modal");
const restartButton = document.getElementById("restart-btn");

let mushrooms = [];
let completed = 0;
let count1 = 0;
let count2 = 0;

let activeMushroom = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let errorTimer = null;
let resizeTimeout = null;

let dragFrame = null;
let pendingPointerEvent = null;
let basket1Rect = null;
let basket2Rect = null;
let fieldRect = null;

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function createMushrooms() {
    mushrooms = shuffle([
        ...list1.map(word => ({ word, type: 1 })),
        ...list2.map(word => ({ word, type: 2 }))
    ]);
}

function getMushroomSize() {
    return window.innerWidth <= 600
        ? { width: 54, height: 66 }
        : { width: 66, height: 76 };
}

function calculatePositions() {
    const fieldWidth = field.clientWidth;
    const fieldHeight = field.clientHeight;
    const size = getMushroomSize();

    const gapX = window.innerWidth <= 600 ? 3 : 8;
    const gapY = window.innerWidth <= 600 ? 5 : 8;

    const columns = Math.max(
        1,
        Math.floor((fieldWidth - 12) / (size.width + gapX))
    );

    const rows = Math.ceil(mushrooms.length / columns);
    const totalHeight = rows * (size.height + gapY) - gapY;
    const startY = Math.max(4, (fieldHeight - totalHeight) / 2);

    const positions = [];

    for (let row = 0; row < rows; row++) {
        const startIndex = row * columns;
        const itemsInRow = Math.min(
            columns,
            mushrooms.length - startIndex
        );

        const rowWidth = itemsInRow * (size.width + gapX) - gapX;
        const startX = Math.max(4, (fieldWidth - rowWidth) / 2);

        for (let col = 0; col < itemsInRow; col++) {
            positions.push({
                x: startX + col * (size.width + gapX),
                y: startY + row * (size.height + gapY)
            });
        }
    }

    return positions;
}

function renderMushrooms() {
    if (activeMushroom) return;

    const fragment = document.createDocumentFragment();
    const positions = calculatePositions();

    mushrooms.forEach((mushroom, index) => {
        const position = positions[index];

        const element = document.createElement("div");
        element.className = "mushroom";
        element.dataset.type = mushroom.type;
        element.dataset.word = mushroom.word;

        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;

        element.innerHTML = `
            <div class="mushroom-cap"></div>
            <div class="mushroom-stem"></div>
            <div class="mushroom-word">${mushroom.word}</div>
        `;

        element.addEventListener("pointerdown", startDrag, {
            passive: false
        });

        fragment.appendChild(element);
    });

    field.replaceChildren(fragment);
}

function startDrag(event) {
    if (activeMushroom) return;

    event.preventDefault();

    const mushroom = event.currentTarget;
    const rect = mushroom.getBoundingClientRect();

    mushroom.dataset.originalLeft = mushroom.style.left;
    mushroom.dataset.originalTop = mushroom.style.top;

    activeMushroom = mushroom;

    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;

    // Размеры считываются один раз перед перетаскиванием
    fieldRect = field.getBoundingClientRect();
    basket1Rect = basket1.getBoundingClientRect();
    basket2Rect = basket2.getBoundingClientRect();

    mushroom.classList.add("dragging");
    mushroom.setPointerCapture(event.pointerId);

    mushroom.addEventListener("pointermove", moveDrag, {
        passive: false
    });

    mushroom.addEventListener("pointerup", endDrag);
    mushroom.addEventListener("pointercancel", cancelDrag);
}

function moveDrag(event) {
    if (!activeMushroom) return;

    event.preventDefault();

    // Сохраняем последнее положение указателя
    pendingPointerEvent = {
        clientX: event.clientX,
        clientY: event.clientY
    };

    // Обновляем положение не чаще одного раза за кадр
    if (!dragFrame) {
        dragFrame = requestAnimationFrame(updateDragPosition);
    }
}

function updateDragPosition() {
    dragFrame = null;

    if (!activeMushroom || !pendingPointerEvent) return;

    const event = pendingPointerEvent;

    const x = event.clientX - fieldRect.left - dragOffsetX;
    const y = event.clientY - fieldRect.top - dragOffsetY;

    activeMushroom.style.left = `${x}px`;
    activeMushroom.style.top = `${y}px`;

    const over1 =
        event.clientX >= basket1Rect.left &&
        event.clientX <= basket1Rect.right &&
        event.clientY >= basket1Rect.top &&
        event.clientY <= basket1Rect.bottom;

    const over2 =
        event.clientX >= basket2Rect.left &&
        event.clientX <= basket2Rect.right &&
        event.clientY >= basket2Rect.top &&
        event.clientY <= basket2Rect.bottom;

    basket1.classList.toggle("drag-over", over1);
    basket2.classList.toggle("drag-over", over2);
}

function isOverBasket(event, basket) {
    const rect = basket === basket1 ? basket1Rect : basket2Rect;

    return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    );
}

function removeDragListeners(mushroom) {
    mushroom.removeEventListener("pointermove", moveDrag);
    mushroom.removeEventListener("pointerup", endDrag);
    mushroom.removeEventListener("pointercancel", cancelDrag);
}

function finishDrag() {
    if (dragFrame) {
        cancelAnimationFrame(dragFrame);
        dragFrame = null;
    }

    pendingPointerEvent = null;

    basket1.classList.remove("drag-over");
    basket2.classList.remove("drag-over");
}

function endDrag(event) {
    if (!activeMushroom) return;

    const mushroom = activeMushroom;

    const over1 = isOverBasket(event, basket1);
    const over2 = isOverBasket(event, basket2);

    finishDrag();

    mushroom.classList.remove("dragging");
    removeDragListeners(mushroom);

    activeMushroom = null;

    if (over1) {
        checkAnswer(mushroom, 1);
    } else if (over2) {
        checkAnswer(mushroom, 2);
    } else {
        returnMushroom(mushroom);
    }
}

function cancelDrag() {
    if (!activeMushroom) return;

    const mushroom = activeMushroom;

    finishDrag();

    mushroom.classList.remove("dragging");
    removeDragListeners(mushroom);

    activeMushroom = null;

    returnMushroom(mushroom);
}

function returnMushroom(mushroom) {
    mushroom.style.left = mushroom.dataset.originalLeft;
    mushroom.style.top = mushroom.dataset.originalTop;
}

function checkAnswer(element, basketNumber) {
    const correctType = Number(element.dataset.type);

    if (correctType === basketNumber) {
        if (basketNumber === 1) {
            count1++;
            score1.textContent = count1;
        } else {
            count2++;
            score2.textContent = count2;
        }

        completed++;
        updateProgress();

        const word = element.dataset.word;

        const index = mushrooms.findIndex(
            item => item.word === word
        );

        if (index !== -1) {
            mushrooms.splice(index, 1);
        }

        element.remove();

        if (completed === TOTAL) {
            showVictory();
        }

    } else {
        showError();
        returnMushroom(element);
    }
}

function updateProgress() {
    progressCount.textContent = completed;

    progressBar.style.width =
        `${(completed / TOTAL) * 100}%`;
}

function showError() {
    errorMessage.classList.remove("hidden");

    clearTimeout(errorTimer);

    errorTimer = setTimeout(() => {
        errorMessage.classList.add("hidden");
    }, 1200);
}

function showVictory() {
    victoryModal.classList.remove("hidden");

    if (typeof confetti === "function") {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
        });
    }
}

function initGame() {
    completed = 0;
    count1 = 0;
    count2 = 0;
    activeMushroom = null;

    finishDrag();
    clearTimeout(errorTimer);

    score1.textContent = "0";
    score2.textContent = "0";

    progressCount.textContent = "0";
    progressBar.style.width = "0%";

    victoryModal.classList.add("hidden");
    errorMessage.classList.add("hidden");

    createMushrooms();
    renderMushrooms();
}

restartButton.addEventListener("click", initGame);

window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
        if (!activeMushroom) {
            renderMushrooms();
        }
    }, 250);
});

initGame();

