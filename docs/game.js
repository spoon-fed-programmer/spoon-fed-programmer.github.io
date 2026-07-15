const canvas = document.querySelector("#snake-board");
const startButton = document.querySelector("#start-game");
const pauseButton = document.querySelector("#pause-game");
const restartButton = document.querySelector("#restart-game");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const stateElement = document.querySelector("#game-state");
const directionButtons = document.querySelectorAll("[data-direction]");

if (canvas && startButton && pauseButton && restartButton && scoreElement && bestScoreElement && stateElement) {
  const ctx = canvas.getContext("2d");
  const gridSize = 18;
  const tileCount = canvas.width / gridSize;
  const storageKey = "snake-best-score";
  const oppositeDirections = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  const vectors = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  let snake;
  let food;
  let direction;
  let queuedDirection;
  let score;
  let bestScore = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  let gameInterval = null;
  let hasStarted = false;
  let isPaused = false;
  let isGameOver = false;

  bestScoreElement.textContent = String(bestScore);

  function syncStateLabel(label) {
    stateElement.textContent = label;
  }

  function syncScore() {
    scoreElement.textContent = String(score);
    bestScoreElement.textContent = String(bestScore);
  }

  function randomFoodPosition() {
    let nextFood = { x: 0, y: 0 };
    let isOnSnake = true;

    while (isOnSnake) {
      nextFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
      };
      isOnSnake = snake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y);
    }

    return nextFood;
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < tileCount; row += 1) {
      for (let col = 0; col < tileCount; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#08140d" : "#0b1b12";
        ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
      }
    }

    ctx.fillStyle = "#ff8c69";
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#7cffac" : "#37c26f";
      ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
  }

  function updateBestScore() {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(storageKey, String(bestScore));
    }
  }

  function stopLoop() {
    if (gameInterval !== null) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
  }

  function resetGame() {
    stopLoop();
    snake = [
      { x: 9, y: 9 },
      { x: 8, y: 9 },
      { x: 7, y: 9 },
    ];
    direction = "right";
    queuedDirection = "right";
    score = 0;
    food = randomFoodPosition();
    hasStarted = false;
    isPaused = false;
    isGameOver = false;
    syncScore();
    syncStateLabel("Ready");
    drawBoard();
  }

  function queueDirection(nextDirection) {
    if (!vectors[nextDirection]) {
      return;
    }

    const currentDirection = queuedDirection || direction;
    if (oppositeDirections[currentDirection] === nextDirection) {
      return;
    }

    queuedDirection = nextDirection;
  }

  function moveSnake() {
    direction = queuedDirection;
    const head = snake[0];
    const nextHead = {
      x: head.x + vectors[direction].x,
      y: head.y + vectors[direction].y,
    };

    const hitWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= tileCount ||
      nextHead.y >= tileCount;
    const hitSelf = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

    if (hitWall || hitSelf) {
      isGameOver = true;
      stopLoop();
      updateBestScore();
      syncScore();
      syncStateLabel("Game Over");
      drawBoard();
      return;
    }

    snake.unshift(nextHead);

    if (nextHead.x === food.x && nextHead.y === food.y) {
      score += 10;
      food = randomFoodPosition();
      updateBestScore();
    } else {
      snake.pop();
    }

    syncScore();
    drawBoard();
  }

  function startGame() {
    if (gameInterval !== null) {
      return;
    }

    if (isGameOver) {
      resetGame();
    }

    hasStarted = true;
    isPaused = false;
    syncStateLabel("Running");
    stopLoop();
    gameInterval = window.setInterval(moveSnake, 140);
  }

  function pauseGame() {
    if (!hasStarted || isGameOver) {
      return;
    }

    if (isPaused) {
      isPaused = false;
      syncStateLabel("Running");
      stopLoop();
      gameInterval = window.setInterval(moveSnake, 140);
    } else {
      isPaused = true;
      stopLoop();
      syncStateLabel("Paused");
    }
  }

  function restartGame() {
    resetGame();
    startGame();
  }

  document.addEventListener("keydown", (event) => {
    const keyDirectionMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      a: "left",
      s: "down",
      d: "right",
      W: "up",
      A: "left",
      S: "down",
      D: "right",
    };
    const nextDirection = keyDirectionMap[event.key];

    if (nextDirection) {
      event.preventDefault();
      queueDirection(nextDirection);
      if (!hasStarted) {
        startGame();
      }
    }

    if (event.key === " ") {
      event.preventDefault();
      pauseGame();
    }
  });

  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextDirection = button.getAttribute("data-direction");
      if (nextDirection) {
        queueDirection(nextDirection);
        if (!hasStarted) {
          startGame();
        }
      }
    });
  });

  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", restartGame);

  resetGame();
}
