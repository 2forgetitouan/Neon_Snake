// Game Configuration
const CONFIG = {
  canvas: null,
  ctx: null,
  gridSize: 18,
  tileCountX: 50,
  tileCountY: 38,
  baseSpeed: 150,
  currentSpeed: 150,
  score: 0,
  level: 1,
  highScore: 0,
  gameLoop: null,
  isPaused: false,
  gameStarted: false,
  selectedDifficulty: "medium",
  wallGraceTime: 150, // ms
  tailGraceTime: 150, // ms
};

// Difficulty settings
const DIFFICULTY = {
  easy: {
    startSpeed: 150,
    speedIncrease: 3,
    levelThreshold: 50,
  },
  medium: {
    startSpeed: 120,
    speedIncrease: 5,
    levelThreshold: 40,
  },
  hard: {
    startSpeed: 100,
    speedIncrease: 8,
    levelThreshold: 30,
  },
  extreme: {
    startSpeed: 80,
    speedIncrease: 15,
    levelThreshold: 25,
  },
};

// Snake object
const snake = {
  body: [{ x: 15, y: 15 }],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  color: "#00ffff",
  trailColor: "#ff00ff",
  skipFrame: false,
};

// Food object
const food = {
  position: { x: 5, y: 5 },
  color: "#ff00ff",
  glowIntensity: 0,
};

// Particles for visual effects
const particles = [];
// Input queue to allow buffering quick turns
const inputQueue = [];

// Audio
let clickAudio = null;
let musicAudio = null;
let soundEnabled = true;
let musicEnabled = true;

// Rendering helpers
CONFIG.render = {
  lastTime: 0,
};
CONFIG.shake = 0;

function ensureRenderPositions() {
  for (let seg of snake.body) {
    seg.rx = (seg.x || 0) * CONFIG.gridSize;
    seg.ry = (seg.y || 0) * CONFIG.gridSize;
  }
}

// Initialize game
function init() {
  CONFIG.canvas = document.getElementById("gameCanvas");
  CONFIG.ctx = CONFIG.canvas.getContext("2d");

  CONFIG.canvas.width = CONFIG.gridSize * CONFIG.tileCountX;
  CONFIG.canvas.height = CONFIG.gridSize * CONFIG.tileCountY;

  CONFIG.highScore = localStorage.getItem("neonSnakeHighScore") || 0;
  document.getElementById("highscore").textContent = CONFIG.highScore;

  // Event listeners
  document.addEventListener("keydown", handleKeyPress);
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  // Home button (logo)
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      returnToStart();
    });
  }

  // Home button in Game Over screen
  const homeGameOverBtn = document.getElementById("homeGameOverBtn");
  if (homeGameOverBtn) {
    homeGameOverBtn.addEventListener("click", () => {
      returnToStart();
    });
  }

  // Home button UI (bottom controls)
  const homeBtnUI = document.getElementById("homeBtnUI");
  if (homeBtnUI) {
    homeBtnUI.addEventListener("click", () => {
      returnToStart();
    });
  }

  // Difficulty selection
  const difficultyButtons = document.querySelectorAll(".difficulty-btn");
  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficultyButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      CONFIG.selectedDifficulty = btn.dataset.difficulty;
    });
  });

  // Load audio assets
  try {
    clickAudio = new Audio("./assets/clic.wav");
    clickAudio.volume = 0.5;
  } catch (e) {
    clickAudio = null;
  }

  try {
    musicAudio = new Audio("./assets/music.mp3");
    musicAudio.loop = true;
    musicAudio.volume = 0.25;
  } catch (e) {
    musicAudio = null;
  }

  // Load saved prefs (default both on)
  const savedSound = localStorage.getItem("neonSnake_sound");
  const savedMusic = localStorage.getItem("neonSnake_music");
  soundEnabled = savedSound === null ? true : savedSound === "on";
  musicEnabled = savedMusic === null ? true : savedMusic === "on";

  // Setup UI toggles (switches)
  const sndSwitch = document.getElementById("toggleSound");
  const musSwitch = document.getElementById("toggleMusic");

  if (sndSwitch) {
    sndSwitch.checked = soundEnabled;
    sndSwitch.addEventListener("change", () => {
      soundEnabled = sndSwitch.checked;
      localStorage.setItem("neonSnake_sound", soundEnabled ? "on" : "off");
      if (soundEnabled && clickAudio) {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      }
    });
  }

  if (musSwitch) {
    musSwitch.checked = musicEnabled;
    musSwitch.addEventListener("change", () => {
      musicEnabled = musSwitch.checked;
      localStorage.setItem("neonSnake_music", musicEnabled ? "on" : "off");
      if (musicAudio) {
        if (musicEnabled) musicAudio.play().catch(() => {});
        else musicAudio.pause();
      }
      if (soundEnabled && clickAudio) {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      }
    });
  }

  // Play click sound for UI button clicks
  document.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      if (soundEnabled && clickAudio) {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      }
    });
  });

  generateFood();

  // Ensure render positions for smooth interpolation
  ensureRenderPositions();

  // Start render loop for smooth animations
  requestAnimationFrame(render);
}

// Start game
function startGame() {
  document.getElementById("startScreen").classList.add("hidden");
  // Apply selected difficulty
  const diff = DIFFICULTY[CONFIG.selectedDifficulty];
  CONFIG.baseSpeed = diff.startSpeed;
  CONFIG.currentSpeed = diff.startSpeed;
  CONFIG.gameStarted = true;
  CONFIG.isPaused = false;
  CONFIG.render.accumulator = 0;
  CONFIG.render.lastUpdate = 0;
  if (musicEnabled && musicAudio) {
    musicAudio.play().catch(() => {});
  }
}

// Restart game
function restartGame() {
  const margin = 8;
  const startX =
    margin + Math.floor(Math.random() * (CONFIG.tileCountX - margin * 2));
  const startY =
    margin + Math.floor(Math.random() * (CONFIG.tileCountY - margin * 2));
  snake.body = [{ x: startX, y: startY }];
  snake.direction = { x: 1, y: 0 };
  snake.nextDirection = { x: 1, y: 0 };
  inputQueue.length = 0;

  ensureRenderPositions();
  CONFIG.score = 0;
  CONFIG.level = 1;
  document.getElementById("score").textContent = CONFIG.score;
  document.getElementById("level").textContent = CONFIG.level;
  particles.length = 0;
  document.getElementById("gameOver").classList.add("hidden");
  generateFood();
  const diff = DIFFICULTY[CONFIG.selectedDifficulty];
  CONFIG.baseSpeed = diff.startSpeed;
  CONFIG.currentSpeed = diff.startSpeed;
  CONFIG.isPaused = false;
  CONFIG.render.accumulator = 0;
  CONFIG.render.lastUpdate = 0;
  if (musicEnabled && musicAudio) {
    musicAudio.play().catch(() => {});
  }
}

// Main game update logic, appelée depuis render
function gameUpdateLogic() {
  // apply queued inputs first (allows buffering quick turns)
  if (inputQueue.length > 0) {
    const q = inputQueue[0];
    // only apply if valid (not opposite to current direction)
    if (!(q.x === -snake.direction.x && q.y === -snake.direction.y)) {
      snake.nextDirection = q;
      inputQueue.shift();
    } else {
      inputQueue.shift();
    }
  }

  snake.direction = snake.nextDirection;

  const head = { ...snake.body[0] };
  head.x += snake.direction.x;
  head.y += snake.direction.y;

  // Wall collision with configurable grace period
  if (
    head.x < 0 ||
    head.x >= CONFIG.tileCountX ||
    head.y < 0 ||
    head.y >= CONFIG.tileCountY
  ) {
    if (!snake.wallGraceActive) {
      snake.wallGraceActive = true;
      snake.wallGraceTimeout = setTimeout(() => {
        if (snake.wallGraceActive) {
          gameOver();
          snake.wallGraceActive = false;
        }
      }, CONFIG.wallGraceTime);
      return;
    } else {
      return;
    }
  } else if (snake.wallGraceActive) {
    clearTimeout(snake.wallGraceTimeout);
    snake.wallGraceActive = false;
  }

  // Self collision avec grâce
  const selfCollision = checkSelfCollision(head);
  if (selfCollision) {
    if (!snake.tailGraceActive) {
      snake.tailGraceActive = true;
      snake.tailGraceTimeout = setTimeout(() => {
        if (snake.tailGraceActive) {
          gameOver();
          snake.tailGraceActive = false;
        }
      }, CONFIG.tailGraceTime);
      return;
    } else {
      return;
    }
  } else if (snake.tailGraceActive) {
    clearTimeout(snake.tailGraceTimeout);
    snake.tailGraceActive = false;
  }

  snake.body.unshift(head);

  // Check if food is eaten
  if (head.x === food.position.x && head.y === food.position.y) {
    CONFIG.score += 10;
    document.getElementById("score").textContent = CONFIG.score;
    createParticles(head.x, head.y);
    generateFood();

    // Level progression based on difficulty
    const diff = DIFFICULTY[CONFIG.selectedDifficulty];
    const newLevel = Math.floor(CONFIG.score / diff.levelThreshold) + 1;

    if (newLevel > CONFIG.level) {
      CONFIG.level = newLevel;
      document.getElementById("level").textContent = CONFIG.level;

      // Increase speed based on difficulty
      CONFIG.currentSpeed = Math.max(
        30,
        CONFIG.baseSpeed - CONFIG.level * diff.speedIncrease
      );
    }
  } else {
    snake.body.pop();
  }
}

// Check self collision
function checkSelfCollision(head) {
  for (let i = 0; i < snake.body.length; i++) {
    if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
      return true;
    }
  }
  return false;
}

// Generate food at random position
function generateFood() {
  let validPosition = false;

  while (!validPosition) {
    food.position.x = Math.floor(Math.random() * CONFIG.tileCountX);
    food.position.y = Math.floor(Math.random() * CONFIG.tileCountY);

    validPosition = true;
    for (let segment of snake.body) {
      if (segment.x === food.position.x && segment.y === food.position.y) {
        validPosition = false;
        break;
      }
    }
  }

  food.glowIntensity = 0;
}

// Create particles
function createParticles(x, y) {
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: x * CONFIG.gridSize + CONFIG.gridSize / 2,
      y: y * CONFIG.gridSize + CONFIG.gridSize / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color: Math.random() > 0.5 ? "#00ffff" : "#ff00ff",
      size: 2 + Math.random() * 3,
    });
  }

  // small screen shake and sound feedback
  CONFIG.shake = 6;
  playEatSound();
}

// Update particles
function updateParticles(dtFactor) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.life -= 0.03 * dtFactor;
    p.vx *= 0.98;
    p.vy *= 0.98;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Main draw function
function draw() {
  const ctx = CONFIG.ctx;

  // kept for compatibility; actual continuous render is in render()
}

// Continuous render for smooth visuals et logique jeu synchronisée
function render(timestamp) {
  const ctx = CONFIG.ctx;
  if (!CONFIG.render.lastTime) CONFIG.render.lastTime = timestamp;
  const dt = Math.min(50, timestamp - CONFIG.render.lastTime);
  const dtFactor = dt / 16.67; // approx frames
  CONFIG.render.lastTime = timestamp;

  // Gestion du temps pour la logique du jeu (accumulateur)
  if (CONFIG.gameStarted && !CONFIG.isPaused) {
    if (CONFIG.render.accumulator === undefined) CONFIG.render.accumulator = 0;
    CONFIG.render.accumulator += dt;
    while (CONFIG.render.accumulator >= CONFIG.currentSpeed) {
      gameUpdateLogic();
      CONFIG.render.accumulator -= CONFIG.currentSpeed;
    }
  }

  // update particles with time factor
  updateParticles(dtFactor);

  // clear with trailing fade for glow trails
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // apply subtle screen shake
  if (CONFIG.shake > 0.02) {
    const sx = (Math.random() * 2 - 1) * CONFIG.shake;
    const sy = (Math.random() * 2 - 1) * CONFIG.shake;
    ctx.save();
    ctx.translate(sx, sy);
    CONFIG.shake *= 0.88;
  } else {
    ctx.save();
  }

  drawGrid();
  // use additive blending for neon
  ctx.globalCompositeOperation = "lighter";
  drawParticles();
  drawFood(dtFactor);
  drawSnake(dtFactor);
  ctx.globalCompositeOperation = "source-over";

  ctx.restore();

  requestAnimationFrame(render);
}

// Draw grid
function drawGrid() {
  const ctx = CONFIG.ctx;
  ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= CONFIG.tileCountX; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CONFIG.gridSize, 0);
    ctx.lineTo(i * CONFIG.gridSize, CONFIG.canvas.height);
    ctx.stroke();
  }

  for (let i = 0; i <= CONFIG.tileCountY; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CONFIG.gridSize);
    ctx.lineTo(CONFIG.canvas.width, i * CONFIG.gridSize);
    ctx.stroke();
  }
}

// Draw snake with neon effect
function drawSnake() {
  const ctx = CONFIG.ctx;

  // Interpolate segment render positions for smooth movement
  for (let i = 0; i < snake.body.length; i++) {
    const segment = snake.body[i];
    if (segment.rx === undefined) {
      segment.rx = segment.x * CONFIG.gridSize;
      segment.ry = segment.y * CONFIG.gridSize;
    }
    const targetX = segment.x * CONFIG.gridSize;
    const targetY = segment.y * CONFIG.gridSize;
    segment.rx += (targetX - segment.rx) * 0.24;
    segment.ry += (targetY - segment.ry) * 0.24;

    const x = segment.rx;
    const y = segment.ry;

    const intensity = 1 - (i / snake.body.length) * 0.75;

    ctx.shadowBlur = i === 0 ? 28 : 12;
    ctx.shadowColor = i === 0 ? snake.color : snake.trailColor;

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x + CONFIG.gridSize,
      y + CONFIG.gridSize
    );
    gradient.addColorStop(0, i === 0 ? "#00ffff" : "#ff00ff");
    gradient.addColorStop(1, "rgba(255,255,255,0.05)");

    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, CONFIG.gridSize - 4, CONFIG.gridSize - 4);

    ctx.strokeStyle = i === 0 ? snake.color : snake.trailColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, CONFIG.gridSize - 4, CONFIG.gridSize - 4);
  }

  ctx.shadowBlur = 0;
}

// Draw food with animation
function drawFood() {
  const ctx = CONFIG.ctx;
  const x = food.position.x * CONFIG.gridSize;
  const y = food.position.y * CONFIG.gridSize;

  if (!food.pulse) food.pulse = 0;
  food.pulse += 0.14;
  const pulseScale = 1 + Math.sin(food.pulse) * 0.12;
  const glow = 18 + Math.sin(food.pulse) * 8;

  ctx.shadowBlur = glow;
  ctx.shadowColor = food.color;

  const gradient = ctx.createRadialGradient(
    x + CONFIG.gridSize / 2,
    y + CONFIG.gridSize / 2,
    0,
    x + CONFIG.gridSize / 2,
    y + CONFIG.gridSize / 2,
    CONFIG.gridSize / 2
  );
  gradient.addColorStop(0, "rgba(255, 0, 255, 1)");
  gradient.addColorStop(0.5, "rgba(255, 0, 255, 0.85)");
  gradient.addColorStop(1, "rgba(255, 0, 255, 0.18)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(
    x + CONFIG.gridSize / 2,
    y + CONFIG.gridSize / 2,
    (CONFIG.gridSize / 3) * pulseScale,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = food.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    x + CONFIG.gridSize / 2,
    y + CONFIG.gridSize / 2,
    (CONFIG.gridSize / 2.5) * pulseScale,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.shadowBlur = 0;
}

// Draw particles
function drawParticles() {
  const ctx = CONFIG.ctx;

  particles.forEach((p) => {
    ctx.shadowBlur = 14;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// Simple WebAudio feedback
function playEatSound() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

function playCrashSound() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(120, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

// Handle keyboard input
function handleKeyPress(e) {
  if (!CONFIG.gameStarted) return;

  if (e.code === "Space") {
    e.preventDefault();
    CONFIG.isPaused = !CONFIG.isPaused;
    return;
  }

  // compute desired direction from key (arrows + ZQSD compatible, toutes langues)
  let desired = null;
  const key = e.key.toLowerCase();
  switch (key) {
    case "arrowup":
    case "z": // ZQSD haut
    case "w": // QWERTY haut
      desired = { x: 0, y: -1 };
      break;
    case "arrowdown":
    case "s": // ZQSD/QWERTY bas
      desired = { x: 0, y: 1 };
      break;
    case "arrowleft":
    case "q": // ZQSD gauche
    case "a": // QWERTY gauche
      desired = { x: -1, y: 0 };
      break;
    case "arrowright":
    case "d": // ZQSD/QWERTY droite
      desired = { x: 1, y: 0 };
      break;
    default:
      break;
  }

  if (!desired) return;
  e.preventDefault();

  // ignore opposite direction with visual feedback (shake but don't die)
  if (desired.x === -snake.direction.x && desired.y === -snake.direction.y) {
    CONFIG.shake = 3;
    return;
  }

  // dynamic max queue length: increase if near wall to allow extra buffered turns
  const head = snake.body[0];
  const dangerZoneX = 5;
  const dangerZoneY = 5;
  const nearWall =
    head &&
    (head.x < dangerZoneX ||
      head.x >= CONFIG.tileCountX - dangerZoneX ||
      head.y < dangerZoneY ||
      head.y >= CONFIG.tileCountY - dangerZoneY);
  const maxQueue = nearWall ? 4 : 2;

  // Check against the last direction in queue OR nextDirection if queue is empty
  const lastDir =
    inputQueue.length > 0
      ? inputQueue[inputQueue.length - 1]
      : snake.nextDirection;

  // Only add if different from last direction and not opposite
  const isDifferent = lastDir.x !== desired.x || lastDir.y !== desired.y;
  const isNotOpposite = !(desired.x === -lastDir.x && desired.y === -lastDir.y);

  if (isDifferent && isNotOpposite) {
    if (inputQueue.length < maxQueue) {
      inputQueue.push(desired);
    } else {
      // rotate queue: keep newest
      inputQueue.shift();
      inputQueue.push(desired);
    }
  }
}

// Game over
function gameOver() {
  // feedback
  CONFIG.shake = 15;
  playCrashSound();
  // Full screen shake
  document.body.classList.add("death-shake");
  setTimeout(() => {
    document.body.classList.remove("death-shake");
  }, 600);
  if (CONFIG.score > CONFIG.highScore) {
    CONFIG.highScore = CONFIG.score;
    localStorage.setItem("neonSnakeHighScore", CONFIG.highScore);
    document.getElementById("highscore").textContent = CONFIG.highScore;
  }
  document.getElementById("finalScore").textContent = CONFIG.score;
  document.getElementById("finalLevel").textContent = CONFIG.level;
  document.getElementById("gameOver").classList.remove("hidden");
  CONFIG.gameStarted = false;
}

// Return to start screen
function returnToStart() {
  CONFIG.gameStarted = false;
  CONFIG.isPaused = false;
  inputQueue.length = 0;
  // Reset snake
  const margin = 8;
  const startX =
    margin + Math.floor(Math.random() * (CONFIG.tileCountX - margin * 2));
  const startY =
    margin + Math.floor(Math.random() * (CONFIG.tileCountY - margin * 2));
  snake.body = [{ x: startX, y: startY }];
  snake.direction = { x: 1, y: 0 };
  snake.nextDirection = { x: 1, y: 0 };
  ensureRenderPositions();
  CONFIG.score = 0;
  CONFIG.level = 1;
  document.getElementById("score").textContent = CONFIG.score;
  document.getElementById("level").textContent = CONFIG.level;
  particles.length = 0;
  generateFood();
  // Stop music
  if (musicAudio) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
  }
  // Show start screen, hide game over
  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}

// Initialize on page load
window.addEventListener("load", init);
