/* ════════════════════════════════════════════════
   VENOM — game.js
   AI Snake Game · Adaptive Hunter
   Author: Ibinabo Collins
   ════════════════════════════════════════════════ */

/* ── CANVAS SETUP ──────────────────────────────── */
const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');

const COLS    = 20;
const ROWS    = 20;
const CELL    = 22;

canvas.width  = COLS * CELL;
canvas.height = ROWS * CELL;

/* ── COLOURS ───────────────────────────────────── */
const C = {
  bg:           '#090710',
  gridLine:     'rgba(212,168,83,0.04)',
  snake:        '#5bbf9a',
  snakeScale:   '#4aaa87',
  snakeDark:    '#2d7a5e',
  snakeHead:    '#ffffff',
  snakeGlow:    'rgba(91,191,154,0.3)',
  snakeTongue:  '#c4687a',
  food:         '#d4a853',
  foodGlow:     'rgba(212,168,83,0.6)',
  poison:       '#c4687a',
  poisonGlow:   'rgba(196,104,122,0.5)',
  hunter:       '#a78bca',
  hunterScale:  '#9070b8',
  hunterDark:   '#6040a0',
  hunterHead:   '#c4687a',
  hunterGlow:   'rgba(167,139,202,0.3)',
};

/* ── DIRECTIONS ────────────────────────────────── */
const DIR = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
};

/* ── GAME STATE ────────────────────────────────── */
let state = {};

function freshState() {
  return {
    running:       false,
    paused:        false,
    gameOver:      false,
    score:         0,
    best:          parseInt(localStorage.getItem('venom_best') || '0'),
    level:         1,
    tickRate:      180,       // ms per tick
    tickTimer:     null,

    // Player snake
    snake:         [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }],
    dir:           { ...DIR.RIGHT },
    nextDir:       { ...DIR.RIGHT },

    // Food & poison
    food:          null,
    poisons:       [],
    poisonTimer:   0,

    // AI Hunter
    hunterActive:  false,
    hunter:        [],        // hunter body segments
    hunterDir:     { ...DIR.LEFT },
    hunterTickMod: 2,         // hunter moves every N player ticks
    hunterTick:    0,
    hunterSpeed:   1,         // increases over time

    // Pattern tracking — player's last 20 directions
    playerPattern: [],
    patternMax:    20,

    // Threat level 0–100
    threat:        0,
  };
}

/* ── INIT ──────────────────────────────────────── */
function initGame() {
  state = freshState();
  spawnFood();
  updateHUD();
  updateAIBar(0, 'Initialising...');
  render();
}

/* ── SPAWN ─────────────────────────────────────── */
function spawnFood() {
  state.food = randomEmpty();
}

function spawnPoison() {
  const pos = randomEmpty();
  if (pos) {
    state.poisons.push({ ...pos, life: 28 }); // ~5 seconds at 180ms/tick
  }
}

function spawnHunter() {
  // Spawn hunter on the opposite side of the grid from the player head
  const head   = state.snake[0];
  const spawnX = head.x < COLS / 2 ? COLS - 3 : 2;
  const spawnY = head.y < ROWS / 2 ? ROWS - 3 : 2;
  state.hunter = [
    { x: spawnX,     y: spawnY },
    { x: spawnX + 1, y: spawnY },
    { x: spawnX + 2, y: spawnY },
  ];
  state.hunterActive = true;
  document.getElementById('hunter-status').textContent = 'ACTIVE';
  document.getElementById('hunter-status').classList.add('active');
}

function randomEmpty() {
  const occupied = new Set();
  state.snake.forEach(s   => occupied.add(`${s.x},${s.y}`));
  state.hunter.forEach(h  => occupied.add(`${h.x},${h.y}`));
  state.poisons.forEach(p => occupied.add(`${p.x},${p.y}`));
  if (state.food) occupied.add(`${state.food.x},${state.food.y}`);

  const cells = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  return cells.length ? cells[Math.floor(Math.random() * cells.length)] : null;
}

/* ── GAME LOOP ─────────────────────────────────── */
function startLoop() {
  clearInterval(state.tickTimer);
  state.tickTimer = setInterval(tick, state.tickRate);
}

function tick() {
  if (!state.running || state.paused || state.gameOver) return;
  movePlayer();
  if (state.gameOver) return;

  // Hunter logic
  if (state.hunterActive) {
    state.hunterTick++;
    if (state.hunterTick >= state.hunterTickMod) {
      state.hunterTick = 0;
      moveHunter();
    }
  }

  // Poison tick
  state.poisonTimer++;
  if (state.poisonTimer % 25 === 0 && state.score >= 5) spawnPoison();
  state.poisons = state.poisons
    .map(p => ({ ...p, life: p.life - 1 }))
    .filter(p => p.life > 0);

  // Level up every 5 food
  const newLevel = Math.floor(state.score / 5) + 1;
  if (newLevel !== state.level) {
    state.level = newLevel;
    state.tickRate = Math.max(100, 180 - (state.level - 1) * 8);
    state.hunterTickMod = Math.max(1, 2 - Math.floor(state.level / 3));
    startLoop();
  }

  // Threat meter
  updateThreat();
  updateHUD();
  render();
}

/* ── MOVE PLAYER ───────────────────────────────── */
function movePlayer() {
  state.dir = { ...state.nextDir };

  // Track pattern
  state.playerPattern.push({ ...state.dir });
  if (state.playerPattern.length > state.patternMax) state.playerPattern.shift();

  const head = {
    x: state.snake[0].x + state.dir.x,
    y: state.snake[0].y + state.dir.y,
  };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame('You hit the wall.');
  }

  // Self collision
  if (state.snake.some(s => s.x === head.x && s.y === head.y)) {
    return endGame('You bit yourself.');
  }

  // Hunter collision — player hits hunter body
  if (state.hunter.some(h => h.x === head.x && h.y === head.y)) {
    return endGame('The hunter got you.');
  }

  // Poison collision
  if (state.poisons.some(p => p.x === head.x && p.y === head.y)) {
    return endGame('You ate poison.');
  }

  state.snake.unshift(head);

  // Food collision
  if (state.food && head.x === state.food.x && head.y === state.food.y) {
    state.score++;
    animateScore();

    // Wake up the hunter at score 10
    if (state.score === 10 && !state.hunterActive) spawnHunter();

    // Increase hunter speed every 5 food after it's active
    if (state.hunterActive && state.score % 5 === 0) {
      state.hunterTickMod = Math.max(1, state.hunterTickMod - 0.5);
    }

    spawnFood();
  } else {
    state.snake.pop();
  }
}

/* ── MOVE HUNTER (BFS PATHFINDING) ────────────────
   The AI uses BFS to find the shortest path to the
   player's head, predicting where the player is going
   based on their tracked movement pattern.
   ────────────────────────────────────────────────── */
function moveHunter() {
  if (!state.hunterActive || state.hunter.length === 0) return;

  // Predict where player will be (1–2 steps ahead based on pattern)
  const target = predictPlayerPosition();

  const next = bfsNextStep(state.hunter[0], target, state.hunter);

  if (!next) {
    // No path found — move randomly to avoid getting stuck
    const dirs  = Object.values(DIR);
    const valid = dirs.filter(d => {
      const nx = state.hunter[0].x + d.x;
      const ny = state.hunter[0].y + d.y;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
             !state.hunter.some(h => h.x === nx && h.y === ny);
    });
    if (!valid.length) return;
    const pick = valid[Math.floor(Math.random() * valid.length)];
    const newHead = { x: state.hunter[0].x + pick.x, y: state.hunter[0].y + pick.y };
    state.hunter.unshift(newHead);
    state.hunter.pop();
    return;
  }

  const newHead = { ...next };

  // Hunter eats player — game over
  if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    return endGame('The AI hunter consumed you.');
  }

  state.hunter.unshift(newHead);
  state.hunter.pop();
}

/* ── BFS PATHFINDING ───────────────────────────── */
function bfsNextStep(from, to, hunterBody) {
  const queue   = [{ pos: from, path: [] }];
  const visited = new Set([`${from.x},${from.y}`]);

  // Obstacles: walls implicitly, snake body, hunter body (except tail)
  const blocked = new Set();
  state.snake.forEach(s       => blocked.add(`${s.x},${s.y}`));
  hunterBody.slice(0, -1).forEach(h => blocked.add(`${h.x},${h.y}`));

  while (queue.length) {
    const { pos, path } = queue.shift();

    for (const d of Object.values(DIR)) {
      const nx = pos.x + d.x;
      const ny = pos.y + d.y;
      const key = `${nx},${ny}`;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (visited.has(key) || blocked.has(key)) continue;

      const newPath = [...path, { x: nx, y: ny }];

      if (nx === to.x && ny === to.y) {
        return newPath[0] || null; // return the first step
      }

      visited.add(key);
      queue.push({ pos: { x: nx, y: ny }, path: newPath });
    }
  }
  return null;
}

/* ── PREDICT PLAYER POSITION ───────────────────── */
function predictPlayerPosition() {
  // Analyse last 10 moves to find dominant direction
  const recent = state.playerPattern.slice(-10);
  const counts = {};
  recent.forEach(d => {
    const key = `${d.x},${d.y}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // Find most common direction
  let dominant = state.dir;
  let max = 0;
  Object.entries(counts).forEach(([key, count]) => {
    if (count > max) {
      max = count;
      const [x, y] = key.split(',').map(Number);
      dominant = { x, y };
    }
  });

  // Predict 2 steps ahead
  const head = state.snake[0];
  const steps = state.level >= 3 ? 3 : 2;
  return {
    x: Math.min(COLS - 1, Math.max(0, head.x + dominant.x * steps)),
    y: Math.min(ROWS - 1, Math.max(0, head.y + dominant.y * steps)),
  };
}

/* ── THREAT METER ──────────────────────────────── */
function updateThreat() {
  if (!state.hunterActive) {
    const warmup = Math.min(100, (state.score / 10) * 100);
    state.threat = warmup;
    updateAIBar(warmup, warmup < 100 ? `Wakes at score 10 · (${state.score}/10)` : 'AWAKENING...');
    return;
  }

  const hx = state.hunter[0].x;
  const hy = state.hunter[0].y;
  const px = state.snake[0].x;
  const py = state.snake[0].y;
  const dist = Math.abs(hx - px) + Math.abs(hy - py);
  const maxDist = COLS + ROWS;

  const proximity  = Math.max(0, 100 - (dist / maxDist) * 100);
  const levelBonus = Math.min(30, state.level * 3);
  state.threat = Math.min(100, proximity + levelBonus);

  const messages = [
    'Recalibrating route...',
    'Tracking your pattern...',
    'Predicting your path...',
    'Closing in...',
    'TARGET ACQUIRED',
  ];
  const msgIdx = Math.floor((state.threat / 100) * (messages.length - 1));
  updateAIBar(state.threat, messages[msgIdx]);
}

function updateAIBar(pct, msg) {
  document.getElementById('ai-threat-fill').style.width = `${pct}%`;
  document.getElementById('ai-threat-text').textContent = msg;
}

/* ── HUD ───────────────────────────────────────── */
function updateHUD() {
  const scoreEl = document.getElementById('score');
  scoreEl.textContent = String(state.score).padStart(3, '0');
  document.getElementById('best').textContent  = String(state.best).padStart(3, '0');
  document.getElementById('level').textContent = String(state.level).padStart(2, '0');
}

function animateScore() {
  const el = document.getElementById('score');
  el.classList.remove('score-pop');
  void el.offsetWidth;
  el.classList.add('score-pop');
}

/* ── RENDER ────────────────────────────────────── */
function render() {
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = C.gridLine;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W, y * CELL);
    ctx.stroke();
  }

  // Poisons — fade out in last 10 ticks
  state.poisons.forEach(p => {
    const alpha = p.life <= 10 ? p.life / 10 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = C.poisonGlow; ctx.shadowBlur = 10;
    ctx.fillStyle = C.poison;
    ctx.beginPath();
    ctx.roundRect(p.x * CELL + 3, p.y * CELL + 3, CELL - 6, CELL - 6, 4);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
    ctx.font = `${CELL - 8}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', p.x * CELL + CELL / 2, p.y * CELL + CELL / 2);
    ctx.restore();
  });

  // Food — glowing star
  if (state.food) {
    ctx.save();
    ctx.shadowColor = C.foodGlow; ctx.shadowBlur = 14;
    ctx.fillStyle = C.food;
    ctx.font = `${CELL - 4}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', state.food.x * CELL + CELL / 2, state.food.y * CELL + CELL / 2);
    ctx.restore();
  }

  // Hunter snake — realistic scaly purple
  state.hunter.forEach((seg, i) => {
    if (i === 0) return; // head drawn last
    const alpha = Math.max(0.3, 1 - i * 0.05);
    ctx.globalAlpha = alpha;
    drawSegment(seg, state.hunter[i-1], state.hunter[i+1],
      C.hunter, C.hunterScale, C.hunterDark, C.hunterGlow, false, i, state.hunter.length);
    ctx.globalAlpha = 1;
  });
  if (state.hunter.length > 0) {
    drawHead(state.hunter[0], state.hunterDir, C.hunter, C.hunterHead, '#ff6eb4', C.hunterGlow);
  }

  // Player snake — realistic scaly green
  state.snake.forEach((seg, i) => {
    if (i === 0) return; // head drawn last
    const alpha = Math.max(0.35, 1 - i * 0.03);
    ctx.globalAlpha = alpha;
    drawSegment(seg, state.snake[i-1], state.snake[i+1],
      C.snake, C.snakeScale, C.snakeDark, C.snakeGlow, false, i, state.snake.length);
    ctx.globalAlpha = 1;
  });
  // Player head with eyes and tongue
  drawHead(state.snake[0], state.dir, C.snake, '#ffffff', C.snakeTongue, C.snakeGlow);
}

/* ── DRAW SNAKE SEGMENT (realistic scaly) ──────── */
function drawSegment(seg, next, prev, color, scaleColor, darkColor, glowColor, isHead, index, totalLen) {
  const x  = seg.x * CELL;
  const y  = seg.y * CELL;
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const r  = CELL / 2 - 1;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = isHead ? 16 : 8;

  // Body gradient — gives 3D rounded look
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
  grad.addColorStop(0,   lighten(color, 40));
  grad.addColorStop(0.4, color);
  grad.addColorStop(1,   darkColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, isHead ? CELL / 2 : 5);
  ctx.fill();

  // Scale pattern — small oval highlights
  if (!isHead) {
    const scaleCount = 2;
    ctx.fillStyle = scaleColor;
    ctx.globalAlpha = 0.35;
    for (let sx = 0; sx < scaleCount; sx++) {
      for (let sy = 0; sy < scaleCount; sy++) {
        const ox = x + 4 + sx * (CELL - 8) / scaleCount;
        const oy = y + 4 + sy * (CELL - 8) / scaleCount;
        ctx.beginPath();
        ctx.ellipse(ox + 3, oy + 3, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Belly stripe
    ctx.fillStyle = lighten(color, 60);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(x + CELL * 0.3, y + 2, CELL * 0.4, CELL - 4);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r   = Math.min(255, (num >> 16) + amount);
  const g   = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b   = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

/* ── DRAW HEAD WITH EYES & TONGUE ──────────────── */
function drawHead(seg, dir, bodyColor, eyeColor, tongueColor, glowColor) {
  const x  = seg.x * CELL;
  const y  = seg.y * CELL;
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const r  = CELL / 2 - 1;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = 18;

  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
  grad.addColorStop(0, lighten(bodyColor, 60));
  grad.addColorStop(0.5, bodyColor);
  grad.addColorStop(1, darken(bodyColor, 30));

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, CELL / 2);
  ctx.fill();
  ctx.restore();

  // Eyes
  ctx.save();
  let e1, e2;
  const eo = 3.5;
  if (dir.x === 1)  { e1 = {x: cx+3, y: cy-eo}; e2 = {x: cx+3, y: cy+eo}; }
  if (dir.x === -1) { e1 = {x: cx-3, y: cy-eo}; e2 = {x: cx-3, y: cy+eo}; }
  if (dir.y === -1) { e1 = {x: cx-eo, y: cy-3}; e2 = {x: cx+eo, y: cy-3}; }
  if (dir.y ===  1) { e1 = {x: cx-eo, y: cy+3}; e2 = {x: cx+eo, y: cy+3}; }
  if (e1) {
    // Eye white
    ctx.fillStyle = '#fff';
    ctx.shadowColor = eyeColor; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(e1.x, e1.y, 2.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x, e2.y, 2.8, 0, Math.PI*2); ctx.fill();
    // Pupil
    ctx.fillStyle = '#111';
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(e1.x + dir.x * 0.5, e1.y + dir.y * 0.5, 1.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x + dir.x * 0.5, e2.y + dir.y * 0.5, 1.4, 0, Math.PI*2); ctx.fill();
    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(e1.x - 0.6, e1.y - 0.6, 0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x - 0.6, e2.y - 0.6, 0.7, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Tongue flicker — alternates every other tick
  const flicker = state.seconds % 2 === 0;
  if (flicker) {
    ctx.save();
    ctx.strokeStyle = tongueColor;
    ctx.lineWidth   = 1.2;
    ctx.shadowColor = tongueColor;
    ctx.shadowBlur  = 6;
    const tx = cx + dir.x * (r + 4);
    const ty = cy + dir.y * (r + 4);
    ctx.beginPath(); ctx.moveTo(cx + dir.x * r, cy + dir.y * r);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // Fork
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + dir.x * 3 + dir.y * 2, ty + dir.y * 3 + dir.x * 2);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + dir.x * 3 - dir.y * 2, ty + dir.y * 3 - dir.x * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function darken(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r   = Math.max(0, (num >> 16) - amount);
  const g   = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b   = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

/* ── GAME OVER ─────────────────────────────────── */
function endGame(reason) {
  state.gameOver = true;
  state.running  = false;
  clearInterval(state.tickTimer);

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('venom_best', state.best);
  }

  document.getElementById('gameover-title').textContent =
    state.score >= 20 ? 'IMPRESSIVE.' : state.score >= 10 ? 'FLATLINED' : 'TERMINATED';
  document.getElementById('gameover-tag').textContent =
    state.hunterActive ? 'HUNTER WINS' : 'GAME OVER';
  document.getElementById('gameover-msg').textContent = reason;
  document.getElementById('final-score').textContent = String(state.score).padStart(3, '0');
  document.getElementById('final-best').textContent  = String(state.best).padStart(3, '0');

  showScreen('gameover-screen');
  render();
}

/* ── SCREENS ───────────────────────────────────── */
function showScreen(id) {
  ['pause-screen', 'gameover-screen'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'flex' : 'none';
  });
}

function hideAllScreens() {
  ['pause-screen', 'gameover-screen'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
}

/* ── INPUT ─────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (!state.running) return;

  const key = e.key;

  // Prevent page scroll
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)) {
    e.preventDefault();
  }

  // Pause
  if (key === 'p' || key === 'P' || key === 'Escape') {
    togglePause();
    return;
  }

  if (state.paused || state.gameOver) return;

  // Direction — prevent 180° reversal
  const { dir } = state;
  if ((key === 'ArrowUp'    || key === 'w') && dir.y !== 1)  state.nextDir = { ...DIR.UP };
  if ((key === 'ArrowDown'  || key === 's') && dir.y !== -1) state.nextDir = { ...DIR.DOWN };
  if ((key === 'ArrowLeft'  || key === 'a') && dir.x !== 1)  state.nextDir = { ...DIR.LEFT };
  if ((key === 'ArrowRight' || key === 'd') && dir.x !== -1) state.nextDir = { ...DIR.RIGHT };
});

function togglePause() {
  if (state.gameOver) return;
  state.paused = !state.paused;
  if (state.paused) {
    showScreen('pause-screen');
  } else {
    hideAllScreens();
    render();
  }
}

/* ── SCREEN SWITCHING ──────────────────────────── */
document.getElementById('yes-btn').addEventListener('click', () => {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('game-screen').style.display   = 'flex';
  initGame();
  state.running = true;
  startLoop();
  render();
});

document.getElementById('no-btn').addEventListener('click', () => {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('goodbye-screen').style.display = 'flex';
});

document.getElementById('return-btn').addEventListener('click', () => {
  document.getElementById('goodbye-screen').style.display = 'none';
  document.getElementById('welcome-screen').style.display = 'flex';
});

document.getElementById('resume-btn').addEventListener('click', () => {
  state.paused = false;
  hideAllScreens();
  render();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  hideAllScreens();
  initGame();
  state.running = true;
  startLoop();
  render();
});

document.getElementById('quit-btn').addEventListener('click', () => {
  clearInterval(state.tickTimer);
  document.getElementById('game-screen').style.display   = 'none';
  document.getElementById('welcome-screen').style.display = 'flex';
});

/* ── MOBILE SWIPE ──────────────────────────────── */
let touchStart = null;

// Prevent page scrolling while playing on mobile
document.addEventListener('touchmove', e => {
  if (state.running && !state.paused) e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (!touchStart || !state.running || state.paused) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  const { dir } = state;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20  && dir.x !== -1) state.nextDir = { ...DIR.RIGHT };
    if (dx < -20 && dir.x !==  1) state.nextDir = { ...DIR.LEFT };
  } else {
    if (dy > 20  && dir.y !== -1) state.nextDir = { ...DIR.DOWN };
    if (dy < -20 && dir.y !==  1) state.nextDir = { ...DIR.UP };
  }
  touchStart = null;
}, { passive: false });

/* ── READY ─────────────────────────────────────── */
// Game starts when player clicks Yes on the welcome screen