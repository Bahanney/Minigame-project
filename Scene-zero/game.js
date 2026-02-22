/* ════════════════════════════════════════════════
   SCENE ZERO — game.js
   Noir Detective Minesweeper
   Author: Ibinabo Collins
   ════════════════════════════════════════════════ */

/* ── CASES ─────────────────────────────────────── */
const CASES = [
  {
    id: 'case-01',
    number: 'CASE FILE #0047',
    title: 'The Hale Case',
    victim: 'Victor Hale — Private Investigator',
    description:
      'A man who made a living digging up secrets. Found slumped over his desk — single gunshot, 10:17 PM. The window was open. Rain tapped in like it wanted to confess.',
    killer: 'pike',
    suspects: [
      {
        id: 'cross',
        name: 'Lena Cross',
        role: 'Lounge Singer',
        alibi: 'On stage at the Blue Dahlia until 11:30 PM. Multiple witnesses confirmed.',
      },
      {
        id: 'doyle',
        name: 'Marcus Doyle',
        role: 'Business Partner',
        alibi: 'Claims he was at a poker game on the docks. No one remembers when he left.',
      },
      {
        id: 'pike',
        name: 'Edwin Pike',
        role: 'Night Janitor',
        alibi: 'Cleaning the fifth floor. Alone. No witnesses.',
      },
    ],
    clues: [
      { id: 'c1', text: 'Desk Floor: A broken pocket watch engraved "M.D." — stopped at 10:17 PM.' },
      { id: 'c2', text: 'Desk Surface: A Blue Dahlia matchbook, damp from rain but unused.' },
      { id: 'c3', text: 'Hallway: A mop streak mixed with diluted blood, leading toward the supply closet.' },
      { id: 'c4', text: 'Filing Cabinet: A ledger showing Hale paid Lena Cross regularly for information.' },
      { id: 'c5', text: 'Supply Closet Log: Signed "E. Pike — 10:20 PM." The ink was still wet.' },
    ],
    herrings: [
      { id: 'h1', text: "Desk Drawer: Victor's revolver — Marcus Doyle's fingerprints. (From an old argument, days earlier.)" },
      { id: 'h2', text: 'Desk: A whiskey glass with a lipstick mark. The glass is dusty — at least a week old.' },
    ],
    reveal:
      'Edwin Pike killed Victor Hale. Hale had reopened an old robbery case that would have exposed Pike. At 10:17 PM Pike entered quietly and shot him. He planted Doyle\'s pocket watch and forged the cleaning log — but the wet ink and mop streak gave him away.',
  },

  {
    id: 'case-02',
    number: 'CASE FILE #0061',
    title: 'The Ashford Dinner',
    victim: 'Reginald Ashford — Wealthy Industrialist',
    description:
      'Found face-down in his soup at his own dinner party. No marks on the body. The coroner confirmed poison in the wine glass. Six guests. One killer. Nobody left the table.',
    killer: 'pryce',
    suspects: [
      {
        id: 'pryce',
        name: 'Dr. Helena Pryce',
        role: 'Family Physician',
        alibi: 'Seated at the far end of the table. Claims she never approached his glass.',
      },
      {
        id: 'norton',
        name: 'James Norton',
        role: 'Business Rival',
        alibi: 'Was arguing loudly with another guest across the table at time of death.',
      },
      {
        id: 'celeste',
        name: 'Celeste Ashford',
        role: 'Estranged Daughter',
        alibi: 'Arrived late to dinner. Says she barely spoke to her father all evening.',
      },
    ],
    clues: [
      { id: 'c1', text: 'Wine Glass: Trace of odourless poison — requires medical knowledge to source.' },
      { id: 'c2', text: "Coat Room: Dr. Pryce's bag left unattended for 12 minutes before dinner." },
      { id: 'c3', text: 'Kitchen Log: A vial of sedative is missing from the medical supply kept there.' },
      { id: 'c4', text: "Victim's Diary: Ashford planned to cut Dr. Pryce out of his will next morning." },
      { id: 'c5', text: "Butler's Account: Dr. Pryce refilled Ashford's glass herself, just before he collapsed." },
    ],
    herrings: [
      { id: 'h1', text: "Celeste's Purse: A handwritten note reading 'Tonight is the night.' — It was a reminder about a job interview the next day." },
      { id: 'h2', text: "Norton's Jacket: A small flask of whiskey — his own, already half-empty when he arrived." },
    ],
    reveal:
      "Dr. Helena Pryce poisoned Reginald Ashford. She had access to the medication, motive from the will change, and opportunity when she refilled his glass. She gambled that suspicion would fall on the estranged daughter or the business rival — but the butler saw everything.",
  },

  {
    id: 'case-03',
    number: 'CASE FILE #0089',
    title: 'Room 404',
    victim: 'Danny Rowe — Journalist',
    description:
      'Checked into the Meridian Hotel on a Tuesday. By Thursday he was reported missing. By Friday, a chambermaid found him behind the false wall in Room 404. He had been getting close to a story he was never meant to finish.',
    killer: 'voss',
    suspects: [
      {
        id: 'voss',
        name: 'Frank Voss',
        role: 'Hotel Manager',
        alibi: 'Says he was reviewing invoices in his office all evening. Alone.',
      },
      {
        id: 'quinn',
        name: 'Marlene Quinn',
        role: 'Concierge',
        alibi: "Was at the front desk all night. Key logs show she issued Room 404's spare key at 9 PM.",
      },
      {
        id: 'shaw',
        name: 'Detective Shaw',
        role: 'Off-Duty Police',
        alibi: 'Was staying in Room 406. Claims he heard nothing unusual.',
      },
    ],
    clues: [
      { id: 'c1', text: "Victim's Notes: Rowe was investigating Voss for running a blackmail ring out of the hotel." },
      { id: 'c2', text: 'False Wall Panel: Fingerprints match the hotel master key — only management carries it.' },
      { id: 'c3', text: "Room 404 Safe: A USB drive containing guest blackmail files, organized by Voss's initials." },
      { id: 'c4', text: 'Staff Break Room: A torn page from Rowe\'s notebook reading "Voss knows I know."' },
      { id: 'c5', text: "CCTV Blind Spot Log: Voss personally requested maintenance on the hallway camera two days before Rowe's disappearance." },
    ],
    herrings: [
      { id: 'h1', text: "Spare Key Record: Marlene Quinn issued the key — but hotel policy requires manager approval first. Voss approved it." },
      { id: 'h2', text: "Detective Shaw's Room: A handgun found in his luggage — standard issue, legally registered, unfired." },
    ],
    reveal:
      "Frank Voss killed Danny Rowe to protect his blackmail operation. Rowe had enough evidence to expose him. Voss disabled the cameras, used the master key, and hid the body behind the wall he'd had modified years earlier. He nearly got away with it — until the fingerprints on the panel gave him up.",
  },
];

/* ── DIFFICULTY CONFIG ─────────────────────────── */
const DIFFICULTY = {
  rookie:     { cols: 7,  rows: 7  },
  detective:  { cols: 9,  rows: 9  },
  hardboiled: { cols: 11, rows: 11 },
};

/* ── GAME STATE ────────────────────────────────── */
let state = {
  difficulty:     'detective',
  currentCase:    null,
  usedCaseIds:    [],
  grid:           [],
  cols:           9,
  rows:           9,
  revealed:       new Set(),
  flagged:        new Set(),
  foundClues:     [],
  foundHerrings:  [],
  timerInterval:  null,
  seconds:        0,
  gameOver:       false,
  started:        false,
};

/* ── RAIN ──────────────────────────────────────── */
const canvas = document.getElementById('rain-canvas');
const ctx    = canvas.getContext('2d');
let drops    = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drops = Array.from({ length: 130 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    speed:   4 + Math.random() * 6,
    length:  12 + Math.random() * 20,
    opacity: 0.1 + Math.random() * 0.35,
  }));
}

function drawRain() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drops.forEach(d => {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 1, d.y + d.length);
    ctx.strokeStyle = `rgba(180,170,140,${d.opacity})`;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    d.y += d.speed;
    if (d.y > canvas.height) {
      d.y = -d.length;
      d.x = Math.random() * canvas.width;
    }
  });
  requestAnimationFrame(drawRain);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
drawRain();

/* ── PICK NEXT CASE ────────────────────────────── */
function pickNextCase() {
  // Reset used list if all cases have been played
  if (state.usedCaseIds.length >= CASES.length) {
    state.usedCaseIds = [];
  }
  const available = CASES.filter(c => !state.usedCaseIds.includes(c.id));
  const picked    = available[Math.floor(Math.random() * available.length)];
  state.usedCaseIds.push(picked.id);
  return picked;
}

/* ── INIT GAME ─────────────────────────────────── */
function initGame(newCase = true) {
  if (newCase) state.currentCase = pickNextCase();

  const cfg    = DIFFICULTY[state.difficulty];
  state.cols   = cfg.cols;
  state.rows   = cfg.rows;
  state.revealed      = new Set();
  state.flagged       = new Set();
  state.foundClues    = [];
  state.foundHerrings = [];
  state.gameOver      = false;
  state.started       = false;
  state.seconds       = 0;
  clearInterval(state.timerInterval);

  // Build grid
  const total  = state.cols * state.rows;
  state.grid   = Array(total).fill(null).map(() => ({ type: 'empty', content: null }));

  // Place clues
  const clueIdxs = randomIndices(total, state.currentCase.clues.length, []);
  clueIdxs.forEach((idx, i) => {
    state.grid[idx] = { type: 'clue', content: state.currentCase.clues[i] };
  });

  // Place herrings
  const herringIdxs = randomIndices(total, state.currentCase.herrings.length, clueIdxs);
  herringIdxs.forEach((idx, i) => {
    state.grid[idx] = { type: 'herring', content: state.currentCase.herrings[i] };
  });

  // Update UI
  renderCaseBanner();
  renderSuspects();
  renderGrid();
  resetClueLog();
  updateStats();
  updateDeduceBtn();
  document.getElementById('timer').textContent = '00:00';
}

/* ── RENDER CASE BANNER ────────────────────────── */
function renderCaseBanner() {
  const c = state.currentCase;
  const banner = document.querySelector('.case-banner');
  banner.setAttribute('data-case-number', c.number);
  document.getElementById('case-title').textContent = c.title;
  document.getElementById('case-description').innerHTML =
    `<strong style="color:var(--text)">${c.victim}</strong><br/>${c.description}<br/><br/>
     <strong style="color:var(--amber)">Reveal the crime scene. Collect clues. Name your killer.</strong>`;
}

/* ── RENDER SUSPECTS ───────────────────────────── */
function renderSuspects() {
  const container = document.getElementById('suspects-grid');
  container.innerHTML = '';
  state.currentCase.suspects.forEach(s => {
    const card = document.createElement('div');
    card.className = 'suspect-card';
    card.id = `suspect-${s.id}`;
    card.innerHTML = `
      <div class="suspect-name">${s.name}</div>
      <div class="suspect-role">${s.role}</div>
      <div class="suspect-status">${s.alibi}</div>
    `;
    container.appendChild(card);
  });
}

/* ── RENDER GRID ───────────────────────────────── */
function renderGrid() {
  const grid = document.getElementById('game-grid');
  grid.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  grid.innerHTML = '';

  state.grid.forEach((_, idx) => {
    const el = document.createElement('div');
    el.className    = 'cell';
    el.dataset.idx  = idx;
    el.addEventListener('click', () => revealCell(idx));
    el.addEventListener('contextmenu', e => { e.preventDefault(); flagCell(idx); });
    grid.appendChild(el);
  });
}

/* ── REVEAL CELL ───────────────────────────────── */
function revealCell(idx) {
  if (state.gameOver || state.revealed.has(idx) || state.flagged.has(idx)) return;

  // Start timer on first click
  if (!state.started) {
    state.started = true;
    state.timerInterval = setInterval(() => {
      state.seconds++;
      const m = String(Math.floor(state.seconds / 60)).padStart(2, '0');
      const s = String(state.seconds % 60).padStart(2, '0');
      document.getElementById('timer').textContent = `${m}:${s}`;
    }, 1000);
  }

  state.revealed.add(idx);
  const cell = state.grid[idx];
  const el   = document.querySelector(`[data-idx="${idx}"]`);
  el.classList.add('revealed', 'reveal-anim');

  if (cell.type === 'clue') {
    el.classList.add('clue');
    el.textContent = '🔍';
    const alreadyFound = state.foundClues.find(c => c.id === cell.content.id);
    if (!alreadyFound) {
      state.foundClues.push(cell.content);
      addClueLog(cell.content.text, false);
    }
  } else if (cell.type === 'herring') {
    el.classList.add('red-herring');
    el.textContent = '✕';
    const alreadyFound = state.foundHerrings.find(h => h.id === cell.content.id);
    if (!alreadyFound) {
      state.foundHerrings.push(cell.content);
      addClueLog(cell.content.text, true);
    }
  } else {
    // Empty cell — show nearby count or flood fill
    const nearby = countNearby(idx);
    if (nearby > 0) {
      el.textContent = nearby;
      el.classList.add(`n${Math.min(nearby, 5)}`);
    } else {
      el.textContent = '';
      floodReveal(idx);
    }
  }

  updateStats();
  updateDeduceBtn();
}

/* ── COUNT NEARBY ──────────────────────────────── */
function countNearby(idx) {
  return getNeighbours(idx).filter(n =>
    state.grid[n].type === 'clue' || state.grid[n].type === 'herring'
  ).length;
}

/* ── FLOOD REVEAL ──────────────────────────────── */
function floodReveal(idx) {
  getNeighbours(idx).forEach(n => {
    if (!state.revealed.has(n) && !state.flagged.has(n) && state.grid[n].type === 'empty') {
      revealCell(n);
    }
  });
}

/* ── GET NEIGHBOURS ────────────────────────────── */
function getNeighbours(idx) {
  const row  = Math.floor(idx / state.cols);
  const col  = idx % state.cols;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
        result.push(r * state.cols + c);
      }
    }
  }
  return result;
}

/* ── RANDOM INDICES ────────────────────────────── */
function randomIndices(total, count, exclude) {
  const pool = Array.from({ length: total }, (_, i) => i).filter(i => !exclude.includes(i));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/* ── FLAG CELL ─────────────────────────────────── */
function flagCell(idx) {
  if (state.gameOver || state.revealed.has(idx)) return;
  const el = document.querySelector(`[data-idx="${idx}"]`);
  if (state.flagged.has(idx)) {
    state.flagged.delete(idx);
    el.classList.remove('flagged');
    el.textContent = '';
  } else {
    state.flagged.add(idx);
    el.classList.add('flagged');
    el.textContent = '⚑';
  }
}

/* ── UPDATE STATS ──────────────────────────────── */
function updateStats() {
  document.getElementById('clue-count').textContent =
    `${state.foundClues.length} / ${state.currentCase.clues.length}`;
  document.getElementById('herring-count').textContent = state.foundHerrings.length;
  document.getElementById('cells-left').textContent =
    state.grid.length - state.revealed.size;
}

/* ── CLUE LOG ──────────────────────────────────── */
function addClueLog(text, isHerring) {
  const log         = document.getElementById('clue-log');
  const placeholder = document.getElementById('clue-placeholder');
  if (placeholder) placeholder.remove();

  const entry       = document.createElement('p');
  entry.className   = isHerring ? 'clue-entry herring' : 'clue-entry';
  entry.textContent = text;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function resetClueLog() {
  document.getElementById('clue-log').innerHTML =
    '<p id="clue-placeholder">No evidence collected yet. Start investigating the scene...</p>';
}

/* ── DEDUCE BUTTON ─────────────────────────────── */
function updateDeduceBtn() {
  const btn = document.getElementById('deduce-btn');
  if (state.foundClues.length >= 3 && !state.gameOver) {
    btn.classList.add('ready');
    btn.disabled = false;
  }
}

/* ── DEDUCTION MODAL ───────────────────────────── */
function openDeduction() {
  // Populate suspect options
  const options = document.getElementById('modal-options');
  options.innerHTML = '';
  state.currentCase.suspects.forEach(s => {
    const btn      = document.createElement('button');
    btn.className  = 'modal-option';
    btn.textContent = `${s.name} — ${s.role}`;
    btn.onclick    = () => submitAnswer(s.id);
    options.appendChild(btn);
  });
  document.getElementById('deduction-modal').classList.add('open');
}

function closeDeduction() {
  document.getElementById('deduction-modal').classList.remove('open');
}

/* ── SUBMIT ANSWER ─────────────────────────────── */
function submitAnswer(suspectId) {
  closeDeduction();
  state.gameOver = true;
  clearInterval(state.timerInterval);

  const correct   = suspectId === state.currentCase.killer;
  const killerObj = state.currentCase.suspects.find(s => s.id === state.currentCase.killer);
  const guessObj  = state.currentCase.suspects.find(s => s.id === suspectId);
  const modal     = document.getElementById('result-modal');
  const content   = document.getElementById('result-content');

  const timeStr = document.getElementById('timer').textContent;

  if (correct) {
    content.innerHTML = `
      <h2 style="color:var(--clue)">Case Closed.</h2>
      <p>
        <strong style="color:var(--text)">${killerObj.name}.</strong><br/><br/>
        ${state.currentCase.reveal}<br/><br/>
        <em>Time: ${timeStr} &nbsp;·&nbsp; Clues found: ${state.foundClues.length} / ${state.currentCase.clues.length}</em>
      </p>
      <button class="modal-btn success" onclick="closeResult(); initGame(true);">Next Case</button>
    `;
  } else {
    content.innerHTML = `
      <h2 style="color:var(--blood)">Wrong Call.</h2>
      <p>
        You accused <strong style="color:var(--text)">${guessObj.name}</strong>.<br/><br/>
        The real killer was <strong style="color:var(--amber)">${killerObj.name}</strong>.<br/><br/>
        ${state.currentCase.reveal}<br/><br/>
        <em>The city doesn't forgive a wrong accusation.</em>
      </p>
      <button class="modal-btn" onclick="closeResult(); initGame(false);">Try Again</button>
      <button class="modal-btn success" style="margin-left:10px" onclick="closeResult(); initGame(true);">Next Case</button>
    `;
  }

  modal.classList.add('open');
}

function closeResult() {
  document.getElementById('result-modal').classList.remove('open');
}

/* ── DIFFICULTY ────────────────────────────────── */
function setDifficulty(btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.difficulty = btn.dataset.diff;
  initGame(false);
}

/* ── START ─────────────────────────────────────── */
initGame(true);