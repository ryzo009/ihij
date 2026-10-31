
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
let errorTimer = null;
let resizeTimeout = null;

let dragFrame = null;
let pendingPointer = null;

let startPointerX = 0;
let startPointerY = 0;

let basket1Rect = null;
let basket2Rect = null;

let originalTransition = "";

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

// Перемещает именно последний гриб на место убранного
function fillEmptySpot(removedMushroom, removedIndex) {
    if (mushrooms.length <= 1) return;

    // Запоминаем последний гриб до удаления выбранного
    const lastMushroom = mushrooms[mushrooms.length - 1];

    // Если убранный гриб сам последний — перемещать нечего
    if (lastMushroom.word === removedMushroom.dataset.word) return;

    // Находим элемент последнего гриба на поле
    const lastElement = Array.from(
        field.querySelectorAll(".mushroom")
    ).find(element => element.dataset.word === lastMushroom.word);

    if (!lastElement) return;

    const emptyX = parseFloat(removedMushroom.dataset.originalLeft);
    const emptyY = parseFloat(removedMushroom.dataset.originalTop);

    const oldX = parseFloat(lastElement.style.left);
    const oldY = parseFloat(lastElement.style.top);

    if (![emptyX, emptyY, oldX, oldY].every(Number.isFinite)) return;

    // Плавное перемещение последнего гриба
    const dx = oldX - emptyX;
    const dy = oldY - emptyY;

    lastElement.style.left = `${emptyX}px`;
    lastElement.style.top = `${emptyY}px`;

    if (typeof lastElement.animate === "function") {
        lastElement.animate(
            [
                { transform: `translate3d(${dx}px, ${dy}px, 0)` },
                { transform: "translate3d(0, 0, 0)" }
            ],
            {
                duration: 300,
                easing: "ease-in-out"
            }
        );
    }
}

function startDrag(event) {
    if (activeMushroom) return;

    event.preventDefault();

    const mushroom = event.currentTarget;

    activeMushroom = mushroom;

    startPointerX = event.clientX;
    startPointerY = event.clientY;

    mushroom.dataset.originalLeft = mushroom.style.left;
    mushroom.dataset.originalTop = mushroom.style.top;

    originalTransition = mushroom.style.transition;

    basket1Rect = basket1.getBoundingClientRect();
    basket2Rect = basket2.getBoundingClientRect();

    mushroom.style.transition = "none";

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

    pendingPointer = {
        x: event.clientX,
        y: event.clientY
    };

    if (!dragFrame) {
        dragFrame = requestAnimationFrame(updateDragPosition);
    }
}

function updateDragPosition() {
    dragFrame = null;

    if (!activeMushroom || !pendingPointer) return;

    const dx = pendingPointer.x - startPointerX;
    const dy = pendingPointer.y - startPointerY;

    activeMushroom.style.transform =
        `translate3d(${dx}px, ${dy}px, 0) scale(1.16)`;

    const x = pendingPointer.x;
    const y = pendingPointer.y;

    const over1 =
        x >= basket1Rect.left &&
        x <= basket1Rect.right &&
        y >= basket1Rect.top &&
        y <= basket1Rect.bottom;

    const over2 =
        x >= basket2Rect.left &&
        x <= basket2Rect.right &&
        y >= basket2Rect.top &&
        y <= basket2Rect.bottom;

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

    pendingPointer = null;

    basket1.classList.remove("drag-over");
    basket2.classList.remove("drag-over");
}

function resetMushroomPosition(mushroom) {
    mushroom.classList.remove("dragging");

    mushroom.style.transition = originalTransition;
    mushroom.style.transform = "";

    mushroom.style.left = mushroom.dataset.originalLeft;
    mushroom.style.top = mushroom.dataset.originalTop;
}

function endDrag(event) {
    if (!activeMushroom) return;

    const mushroom = activeMushroom;

    const over1 = isOverBasket(event, basket1);
    const over2 = isOverBasket(event, basket2);

    finishDrag();

    removeDragListeners(mushroom);

    activeMushroom = null;

    if (over1) {
        mushroom.classList.remove("dragging");
        mushroom.style.transition = originalTransition;
        checkAnswer(mushroom, 1);
    } else if (over2) {
        mushroom.classList.remove("dragging");
        mushroom.style.transition = originalTransition;
        checkAnswer(mushroom, 2);
    } else {
        resetMushroomPosition(mushroom);
    }
}

function cancelDrag() {
    if (!activeMushroom) return;

    const mushroom = activeMushroom;

    finishDrag();
    removeDragListeners(mushroom);

    activeMushroom = null;

    resetMushroomPosition(mushroom);
}

function returnMushroom(mushroom) {
    mushroom.style.left = mushroom.dataset.originalLeft;
    mushroom.style.top = mushroom.dataset.originalTop;
    mushroom.style.transform = "";
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
            // Сначала перемещаем последний гриб
            fillEmptySpot(element, index);

            // Затем удаляем выбранный гриб из массива
            mushrooms.splice(index, 1);
        }

        element.remove();

        if (completed === TOTAL) {
            showVictory();
        }

    } else {
        showError();
        resetMushroomPosition(element);
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


