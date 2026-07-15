const snakeCanvas = document.querySelector("#snake-board");
const snakeStartButton = document.querySelector("#start-game");
const snakePauseButton = document.querySelector("#pause-game");
const snakeRestartButton = document.querySelector("#restart-game");
const snakeScoreElement = document.querySelector("#score");
const snakeBestScoreElement = document.querySelector("#best-score");
const snakeStateElement = document.querySelector("#game-state");
const snakeDirectionButtons = document.querySelectorAll("[data-direction]");

if (
  snakeCanvas &&
  snakeStartButton &&
  snakePauseButton &&
  snakeRestartButton &&
  snakeScoreElement &&
  snakeBestScoreElement &&
  snakeStateElement
) {
  const ctx = snakeCanvas.getContext("2d");
  const gridSize = 18;
  const tileCount = snakeCanvas.width / gridSize;
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

  snakeBestScoreElement.textContent = String(bestScore);

  function syncSnakeState(label) {
    snakeStateElement.textContent = label;
  }

  function syncSnakeScore() {
    snakeScoreElement.textContent = String(score);
    snakeBestScoreElement.textContent = String(bestScore);
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

  function drawSnakeBoard() {
    ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

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

  function updateSnakeBestScore() {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(storageKey, String(bestScore));
    }
  }

  function stopSnakeLoop() {
    if (gameInterval !== null) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
  }

  function resetSnakeGame() {
    stopSnakeLoop();
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
    syncSnakeScore();
    syncSnakeState("Ready");
    drawSnakeBoard();
  }

  function queueSnakeDirection(nextDirection) {
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
      stopSnakeLoop();
      updateSnakeBestScore();
      syncSnakeScore();
      syncSnakeState("Game Over");
      drawSnakeBoard();
      return;
    }

    snake.unshift(nextHead);

    if (nextHead.x === food.x && nextHead.y === food.y) {
      score += 10;
      food = randomFoodPosition();
      updateSnakeBestScore();
    } else {
      snake.pop();
    }

    syncSnakeScore();
    drawSnakeBoard();
  }

  function startSnakeGame() {
    if (gameInterval !== null) {
      return;
    }

    if (isGameOver) {
      resetSnakeGame();
    }

    hasStarted = true;
    isPaused = false;
    syncSnakeState("Running");
    stopSnakeLoop();
    gameInterval = window.setInterval(moveSnake, 140);
  }

  function pauseSnakeGame() {
    if (!hasStarted || isGameOver) {
      return;
    }

    if (isPaused) {
      isPaused = false;
      syncSnakeState("Running");
      stopSnakeLoop();
      gameInterval = window.setInterval(moveSnake, 140);
    } else {
      isPaused = true;
      stopSnakeLoop();
      syncSnakeState("Paused");
    }
  }

  function restartSnakeGame() {
    resetSnakeGame();
    startSnakeGame();
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
      queueSnakeDirection(nextDirection);
      if (!hasStarted) {
        startSnakeGame();
      }
    }

    if (event.key === " " && document.activeElement?.id !== "runner-start") {
      event.preventDefault();
      pauseSnakeGame();
    }
  });

  snakeDirectionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextDirection = button.getAttribute("data-direction");
      if (nextDirection) {
        queueSnakeDirection(nextDirection);
        if (!hasStarted) {
          startSnakeGame();
        }
      }
    });
  });

  snakeStartButton.addEventListener("click", startSnakeGame);
  snakePauseButton.addEventListener("click", pauseSnakeGame);
  snakeRestartButton.addEventListener("click", restartSnakeGame);

  resetSnakeGame();
}

const runnerCanvas = document.querySelector("#runner-board");
const runnerStartButton = document.querySelector("#runner-start");
const runnerPauseButton = document.querySelector("#runner-pause");
const runnerRestartButton = document.querySelector("#runner-restart");
const runnerScoreElement = document.querySelector("#runner-score");
const runnerBestScoreElement = document.querySelector("#runner-best-score");
const runnerStateElement = document.querySelector("#runner-state");
const runnerActionButtons = document.querySelectorAll("[data-runner-action]");

if (
  runnerCanvas &&
  runnerStartButton &&
  runnerPauseButton &&
  runnerRestartButton &&
  runnerScoreElement &&
  runnerBestScoreElement &&
  runnerStateElement
) {
  const ctx = runnerCanvas.getContext("2d");
  const storageKey = "wonder-runner-best-score";
  const gravity = 0.75;
  const floorHeight = 64;
  const player = {
    x: 110,
    y: 0,
    width: 36,
    height: 46,
    velocityX: 0,
    velocityY: 0,
    speed: 4.5,
    jumpStrength: -12.5,
    grounded: true,
    facing: "right",
  };

  let gameLoopId = null;
  let hasStarted = false;
  let isPaused = false;
  let isGameOver = false;
  let score = 0;
  let distance = 0;
  let obstacleCooldown = 0;
  let collectibleCooldown = 0;
  let backgroundOffset = 0;
  let obstacleSpeed = 4.2;
  let runnerElapsedFrames = 0;
  let runnerDifficultyLevel = 0;
  let bestScore = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  let obstacles = [];
  let collectibles = [];
  const runnerInput = {
    left: false,
    right: false,
  };

  runnerBestScoreElement.textContent = String(bestScore);

  function syncRunnerState(label) {
    runnerStateElement.textContent = label;
  }

  function syncRunnerScore() {
    runnerScoreElement.textContent = String(score);
    runnerBestScoreElement.textContent = String(bestScore);
  }

  function updateRunnerBestScore() {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(storageKey, String(bestScore));
    }
  }

  function resetRunner() {
    cancelRunnerLoop();
    player.y = runnerCanvas.height - floorHeight - player.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.grounded = true;
    player.facing = "right";
    runnerInput.left = false;
    runnerInput.right = false;
    score = 0;
    distance = 0;
    obstacleCooldown = 40;
    collectibleCooldown = 95;
    backgroundOffset = 0;
    obstacleSpeed = 4.2;
    runnerElapsedFrames = 0;
    runnerDifficultyLevel = 0;
    obstacles = [];
    collectibles = [];
    hasStarted = false;
    isPaused = false;
    isGameOver = false;
    syncRunnerScore();
    syncRunnerState("Ready");
    drawRunnerFrame();
  }

  function cancelRunnerLoop() {
    if (gameLoopId !== null) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }
  }

  function jumpRunner() {
    if (player.grounded) {
      player.velocityY = player.jumpStrength;
      player.grounded = false;
    }
  }

  function setRunnerAction(action, isPressed) {
    if (action === "left") {
      runnerInput.left = isPressed;
      if (isPressed) {
        player.facing = "left";
      }
    }
    if (action === "right") {
      runnerInput.right = isPressed;
      if (isPressed) {
        player.facing = "right";
      }
    }
    if (action === "jump" && isPressed) {
      jumpRunner();
      if (!hasStarted) {
        startRunnerGame();
      }
    }
  }

  function spawnObstacle() {
    const width = 24 + Math.random() * 18 + runnerDifficultyLevel * 4;
    const height = 26 + Math.random() * 16 + runnerDifficultyLevel * 5;
    obstacles.push({
      x: runnerCanvas.width + 30,
      y: runnerCanvas.height - floorHeight - height,
      width,
      height,
    });
  }

  function spawnCollectible() {
    collectibles.push({
      x: runnerCanvas.width + 40,
      y: runnerCanvas.height - floorHeight - 90 - Math.random() * 50,
      size: 16,
      pulse: Math.random() * Math.PI,
    });
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function drawRunnerFrame() {
    ctx.clearRect(0, 0, runnerCanvas.width, runnerCanvas.height);

    const skyGradient = ctx.createLinearGradient(0, 0, 0, runnerCanvas.height);
    skyGradient.addColorStop(0, "#19345e");
    skyGradient.addColorStop(0.6, "#10243d");
    skyGradient.addColorStop(1, "#0a140c");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, runnerCanvas.width, runnerCanvas.height);

    backgroundOffset = (backgroundOffset + obstacleSpeed * 0.6) % runnerCanvas.width;
    ctx.fillStyle = "rgba(124,255,172,0.08)";
    for (let i = -1; i < 8; i += 1) {
      const hillX = i * 140 - backgroundOffset * 0.35;
      ctx.beginPath();
      ctx.arc(hillX, runnerCanvas.height - 28, 95, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = "#173522";
    ctx.fillRect(0, runnerCanvas.height - floorHeight, runnerCanvas.width, floorHeight);

    ctx.strokeStyle = "rgba(124,255,172,0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i < runnerCanvas.width; i += 48) {
      const lineX = (i - backgroundOffset) % runnerCanvas.width;
      ctx.beginPath();
      ctx.moveTo(lineX, runnerCanvas.height - floorHeight + 16);
      ctx.lineTo(lineX + 22, runnerCanvas.height - 12);
      ctx.stroke();
    }

    collectibles.forEach((collectible) => {
      const pulse = Math.sin(collectible.pulse) * 2;
      ctx.fillStyle = "#ffdf78";
      ctx.beginPath();
      ctx.arc(collectible.x, collectible.y + pulse, collectible.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    obstacles.forEach((obstacle) => {
      ctx.fillStyle = "#ff6d5a";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = "#ffd17a";
      ctx.fillRect(obstacle.x + 6, obstacle.y + 5, 4, 4);
    });

    ctx.fillStyle = "#7cffac";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#15211a";
    const eyeX = player.facing === "right" ? player.x + 24 : player.x + 10;
    ctx.fillRect(eyeX, player.y + 10, 5, 5);
    ctx.fillRect(player.x + 9, player.y + 18, 18, 14);
  }

  function endRunnerGame() {
    isGameOver = true;
    hasStarted = false;
    cancelRunnerLoop();
    updateRunnerBestScore();
    syncRunnerScore();
    syncRunnerState("Game Over");
    drawRunnerFrame();
  }

  function updateRunnerDifficulty() {
    runnerElapsedFrames += 1;
    const elapsedSeconds = runnerElapsedFrames / 60;
    runnerDifficultyLevel = Math.floor(elapsedSeconds / 5);

    obstacleSpeed = 4.2 + Math.min(runnerDifficultyLevel * 0.55, 4.4);

    const targetObstacleCount = Math.min(1 + runnerDifficultyLevel, 4);
    if (obstacles.length < targetObstacleCount && obstacleCooldown <= 12) {
      spawnObstacle();
      obstacleCooldown = Math.max(22, 54 - runnerDifficultyLevel * 5);
    }
  }

  function updateRunnerGame() {
    if (isPaused || isGameOver) {
      return;
    }

    if (runnerInput.left && !runnerInput.right) {
      player.velocityX = -player.speed;
      player.facing = "left";
    } else if (runnerInput.right && !runnerInput.left) {
      player.velocityX = player.speed;
      player.facing = "right";
    } else {
      player.velocityX *= 0.72;
    }

    player.x += player.velocityX;
    player.x = Math.max(40, Math.min(runnerCanvas.width - player.width - 40, player.x));

    player.velocityY += gravity;
    player.y += player.velocityY;

    const floorY = runnerCanvas.height - floorHeight - player.height;
    if (player.y >= floorY) {
      player.y = floorY;
      player.velocityY = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }

    updateRunnerDifficulty();
    distance += obstacleSpeed;
    score = Math.floor(distance / 8);

    obstacleCooldown -= 1;
    collectibleCooldown -= 1;

    if (obstacleCooldown <= 0) {
      spawnObstacle();
      obstacleCooldown = Math.max(20, 54 - runnerDifficultyLevel * 5) + Math.floor(Math.random() * 18);
    }

    if (collectibleCooldown <= 0) {
      spawnCollectible();
      collectibleCooldown = Math.max(50, 92 - runnerDifficultyLevel * 4) + Math.floor(Math.random() * 30);
    }

    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
    collectibles = collectibles.filter((collectible) => collectible.x + collectible.size > -30);

    obstacles.forEach((obstacle) => {
      obstacle.x -= obstacleSpeed;
      if (
        intersects(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          obstacle
        )
      ) {
        endRunnerGame();
      }
    });

    collectibles.forEach((collectible) => {
      collectible.x -= obstacleSpeed * 0.9;
      collectible.pulse += 0.15;
    });

    collectibles = collectibles.filter((collectible) => {
      const hit =
        player.x < collectible.x + collectible.size / 2 &&
        player.x + player.width > collectible.x - collectible.size / 2 &&
        player.y < collectible.y + collectible.size / 2 &&
        player.y + player.height > collectible.y - collectible.size / 2;
      if (hit) {
        score += 25;
        return false;
      }
      return true;
    });

    updateRunnerBestScore();
    syncRunnerScore();
    drawRunnerFrame();

    if (!isGameOver && !isPaused) {
      gameLoopId = requestAnimationFrame(updateRunnerGame);
    }
  }

  function startRunnerGame() {
    if (gameLoopId !== null) {
      return;
    }

    if (isGameOver) {
      resetRunner();
    }

    hasStarted = true;
    isPaused = false;
    syncRunnerState("Running");
    cancelRunnerLoop();
    gameLoopId = requestAnimationFrame(updateRunnerGame);
  }

  function pauseRunnerGame() {
    if (!hasStarted || isGameOver) {
      return;
    }

    if (isPaused) {
      isPaused = false;
      syncRunnerState("Running");
      cancelRunnerLoop();
      gameLoopId = requestAnimationFrame(updateRunnerGame);
    } else {
      isPaused = true;
      cancelRunnerLoop();
      syncRunnerState("Paused");
    }
  }

  function restartRunnerGame() {
    resetRunner();
    startRunnerGame();
  }

  document.addEventListener("keydown", (event) => {
    const runnerKeys = {
      j: "left",
      J: "left",
      l: "right",
      L: "right",
      i: "jump",
      I: "jump",
    };
    const action = runnerKeys[event.key];

    if (action) {
      event.preventDefault();
      setRunnerAction(action, true);
      if (action !== "jump" && !hasStarted) {
        startRunnerGame();
      }
    }

    if (event.key === " " && runnerCanvas) {
      event.preventDefault();
      if (!hasStarted) {
        startRunnerGame();
      }
      setRunnerAction("jump", true);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "j" || event.key === "J") {
      setRunnerAction("left", false);
    }
    if (event.key === "l" || event.key === "L") {
      setRunnerAction("right", false);
    }
  });

  runnerActionButtons.forEach((button) => {
    const action = button.getAttribute("data-runner-action");
    if (!action) {
      return;
    }

    const press = () => setRunnerAction(action, true);
    const release = () => {
      if (action !== "jump") {
        setRunnerAction(action, false);
      }
    };

    button.addEventListener("mousedown", press);
    button.addEventListener("mouseup", release);
    button.addEventListener("mouseleave", release);
    button.addEventListener("touchstart", (event) => {
      event.preventDefault();
      press();
    }, { passive: false });
    button.addEventListener("touchend", (event) => {
      event.preventDefault();
      release();
    }, { passive: false });
    button.addEventListener("click", () => {
      if (action === "jump") {
        press();
      }
      if (!hasStarted) {
        startRunnerGame();
      }
    });
  });

  runnerStartButton.addEventListener("click", startRunnerGame);
  runnerPauseButton.addEventListener("click", pauseRunnerGame);
  runnerRestartButton.addEventListener("click", restartRunnerGame);

  resetRunner();
}
