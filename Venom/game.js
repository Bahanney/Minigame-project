// VENOM — game.js | Author: Ibinabo Collins

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const COLS = 20, ROWS = 20;

// Canvas fills its container dynamically
function resizeCanvas() {
  const wrapper = canvas.parentElement;
  canvas.width  = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); if (!state.running) render(); });

function cellSize() { return Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS)); }

const C = {
  bg:'#090710', grid:'rgba(212,168,83,0.04)',
  snake:'#5bbf9a', snakeScale:'#4aaa87', snakeDark:'#2d7a5e', snakeGlow:'rgba(91,191,154,0.3)',
  food:'#d4a853', foodGlow:'rgba(212,168,83,0.6)',
  poison:'#c4687a', poisonGlow:'rgba(196,104,122,0.5)',
  hunter:'#a78bca', hunterScale:'#9070b8', hunterDark:'#6040a0', hunterHead:'#c4687a', hunterGlow:'rgba(167,139,202,0.3)',
  shield:'#60c8ff', freeze:'#a0e8ff', speed:'#ffe156',
};

const DIR = { UP:{x:0,y:-1}, DOWN:{x:0,y:1}, LEFT:{x:-1,y:0}, RIGHT:{x:1,y:0} };

// Web Audio for sound effects
const audio = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, dur, type='sine', vol=0.15) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.connect(g); g.connect(audio.destination);
  o.frequency.value = freq; o.type = type;
  g.gain.setValueAtTime(vol, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  o.start(); o.stop(audio.currentTime + dur);
}
const sfx = {
  eat:    () => { beep(880, 0.06, 'triangle', 0.1); setTimeout(() => beep(1109, 0.08, 'triangle', 0.08), 70); setTimeout(() => beep(1319, 0.12, 'triangle', 0.07), 140); },
  power:  () => { beep(523, 0.08, 'sine', 0.15); setTimeout(() => beep(659, 0.08), 80); setTimeout(() => beep(784, 0.15), 160); },
  die:    () => beep(120, 0.4, 'sawtooth', 0.3),
  hunter: () => beep(200, 0.15, 'square', 0.1),
  freeze: () => beep(660, 0.3, 'triangle', 0.2),
};

let state = {}, playerName = 'YOU';

function fresh() {
  return {
    running:false, paused:false, over:false,
    score:0, best:parseInt(localStorage.getItem('venom_best')||'0'), level:1,
    tickRate:180, timer:null, ticks:0,
    snake:[{x:12,y:12},{x:11,y:12},{x:10,y:12}],
    dir:{...DIR.RIGHT}, next:{...DIR.RIGHT},
    food:null, poisons:[], poisonTimer:0,
    hunterOn:false, hunter:[], hunterDir:{...DIR.LEFT}, hunterMod:2, hunterTick:0,
    pattern:[], threat:0,
    powerup:null,
    shield:false, frozen:0, speedy:0,
    countdown:3, counting:true,
  };
}

// Leaderboard — top 5 stored in localStorage
function getBoard() { return JSON.parse(localStorage.getItem('venom_board')||'[]'); }
function saveBoard(score) {
  const name = playerName || 'YOU';
  const board = [...getBoard(), {name, score}]
    .sort((a,b) => b.score - a.score).slice(0,5);
  localStorage.setItem('venom_board', JSON.stringify(board));
  return board;
}
function renderBoard(board) {
  const el = document.getElementById('leaderboard');
  if (!el) return;
  el.innerHTML = board.map((e,i) =>
    `<div class="lb-row ${i===0?'lb-top':''}"><span>#${i+1} ${e.name}</span><span>${String(e.score).padStart(3,'0')}</span></div>`
  ).join('');
}

function init() {
  state = fresh();
  resizeCanvas();
  spawnFood();
  updateHUD();
  updateBar(0, 'Dormant...');
  startCountdown();
}

function startCountdown() {
  state.counting = true;
  render();
  const cd = setInterval(() => {
    state.countdown--;
    render();
    if (state.countdown <= 0) {
      clearInterval(cd);
      state.counting = false;
      state.running = true;
      startLoop();
    }
  }, 900);
}

// Spawn helpers
const occ = () => {
  const s = new Set();
  [...state.snake, ...state.hunter].forEach(p => s.add(`${p.x},${p.y}`));
  state.poisons.forEach(p => s.add(`${p.x},${p.y}`));
  if (state.food) s.add(`${state.food.x},${state.food.y}`);
  if (state.powerup) s.add(`${state.powerup.x},${state.powerup.y}`);
  return s;
};
function randEmpty() {
  const taken = occ(), cells = [];
  for (let x=0;x<COLS;x++) for (let y=0;y<ROWS;y++)
    if (!taken.has(`${x},${y}`)) cells.push({x,y});
  return cells.length ? cells[Math.floor(Math.random()*cells.length)] : null;
}
function spawnFood()   { state.food = randEmpty(); }
function spawnPoison() { const p = randEmpty(); if (p) state.poisons.push({...p, life:28}); }
function spawnPowerup() {
  if (state.powerup) return;
  const types = ['shield','freeze','speed'];
  const p = randEmpty();
  if (p) state.powerup = {...p, type:types[Math.floor(Math.random()*3)], life:40};
}
function spawnHunter() {
  const h = state.snake[0];
  const sx = h.x < COLS/2 ? COLS-3 : 2, sy = h.y < ROWS/2 ? ROWS-3 : 2;
  state.hunter = [{x:sx,y:sy},{x:sx+1,y:sy},{x:sx+2,y:sy}];
  state.hunterOn = true;
  const el = document.getElementById('hunter-status');
  el.textContent = 'ACTIVE'; el.classList.add('active');
  sfx.hunter();
}

function startLoop() {
  clearInterval(state.timer);
  state.timer = setInterval(tick, state.tickRate);
}

function tick() {
  if (!state.running || state.paused || state.over) return;
  state.ticks++;
  if (state.frozen > 0) state.frozen--;

  movePlayer(); if (state.over) return;

  if (state.hunterOn && state.frozen === 0) {
    state.hunterTick++;
    if (state.hunterTick >= state.hunterMod) { state.hunterTick=0; moveHunter(); }
  }

  // Powerup tick
  if (state.powerup) { state.powerup.life--; if (state.powerup.life<=0) state.powerup=null; }
  if (state.speedy > 0) { state.speedy--; if (state.speedy===0) { state.tickRate=Math.max(100,180-(state.level-1)*8); startLoop(); } }

  // Poison spawn
  state.poisonTimer++;
  if (state.poisonTimer%25===0 && state.score>=5) spawnPoison();
  if (state.score>=15 && Math.random()<0.01) spawnPowerup();
  state.poisons = state.poisons.map(p=>({...p,life:p.life-1})).filter(p=>p.life>0);

  // Level up
  const lv = Math.floor(state.score/5)+1;
  if (lv !== state.level) {
    state.level = lv;
    if (state.speedy===0) { state.tickRate=Math.max(100,180-(lv-1)*8); startLoop(); }
    if (lv%3===0) state.hunterMod = Math.max(1, state.hunterMod-0.5);
  }

  updateThreat(); updateHUD(); render();
}

function movePlayer() {
  state.dir = {...state.next};
  state.pattern.push({...state.dir});
  if (state.pattern.length>20) state.pattern.shift();

  const head = {x:state.snake[0].x+state.dir.x, y:state.snake[0].y+state.dir.y};

  if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS) return endGame('You hit the wall.');
  if (state.snake.some(s=>s.x===head.x&&s.y===head.y)) return endGame('You bit yourself.');
  if (!state.shield && state.hunter.some(h=>h.x===head.x&&h.y===head.y)) return endGame('The Hunter got you.');
  if (state.hunter.some(h=>h.x===head.x&&h.y===head.y) && state.shield) { state.shield=false; }
  if (state.poisons.some(p=>p.x===head.x&&p.y===head.y)) return endGame('You ate poison.');

  state.snake.unshift(head);

  if (state.food && head.x===state.food.x && head.y===state.food.y) {
    state.score++; sfx.eat(); animateScore();
    if (state.score===10 && !state.hunterOn) spawnHunter();
    if (state.hunterOn && state.score%5===0) state.hunterMod=Math.max(1,state.hunterMod-0.5);
    spawnFood();
  } else {
    state.snake.pop();
  }

  // Powerup collection
  if (state.powerup && head.x===state.powerup.x && head.y===state.powerup.y) {
    applyPowerup(state.powerup.type);
    state.powerup = null;
  }
}

function applyPowerup(type) {
  sfx.power();
  if (type==='shield') { state.shield=true; }
  else if (type==='freeze') { state.frozen=20; sfx.freeze(); }
  else if (type==='speed')  { state.speedy=15; state.tickRate=280; startLoop(); }
  showPowerupMsg(type);
}

function showPowerupMsg(type) {
  const msgs = {shield:'🛡 Shield Active!', freeze:'❄ Hunter Frozen!', speed:'⚡ Slow Motion!'};
  const el = document.getElementById('powerup-msg');
  if (!el) return;
  el.textContent = msgs[type]; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// BFS pathfinding — finds shortest route to player
function bfs(from, to, body) {
  const q=[{pos:from,path:[]}], seen=new Set([`${from.x},${from.y}`]);
  const blocked=new Set([...state.snake.map(s=>`${s.x},${s.y}`),...body.slice(0,-1).map(h=>`${h.x},${h.y}`)]);
  while (q.length) {
    const {pos,path} = q.shift();
    for (const d of Object.values(DIR)) {
      const nx=pos.x+d.x, ny=pos.y+d.y, k=`${nx},${ny}`;
      if (nx<0||nx>=COLS||ny<0||ny>=ROWS||seen.has(k)||blocked.has(k)) continue;
      const np=[...path,{x:nx,y:ny}];
      if (nx===to.x&&ny===to.y) return np[0]||null;
      seen.add(k); q.push({pos:{x:nx,y:ny},path:np});
    }
  }
  return null;
}

// Pattern prediction — looks at last 10 moves to anticipate player direction
function predict() {
  const recent=state.pattern.slice(-10), counts={};
  recent.forEach(d=>{ const k=`${d.x},${d.y}`; counts[k]=(counts[k]||0)+1; });
  let dom=state.dir, max=0;
  Object.entries(counts).forEach(([k,v])=>{ if(v>max){max=v;const[x,y]=k.split(',').map(Number);dom={x,y};} });
  const steps=state.level>=3?3:2, h=state.snake[0];
  return {x:Math.min(COLS-1,Math.max(0,h.x+dom.x*steps)), y:Math.min(ROWS-1,Math.max(0,h.y+dom.y*steps))};
}

function moveHunter() {
  if (!state.hunterOn||!state.hunter.length) return;
  const next = bfs(state.hunter[0], predict(), state.hunter);
  if (!next) {
    const valid=Object.values(DIR).filter(d=>{
      const nx=state.hunter[0].x+d.x, ny=state.hunter[0].y+d.y;
      return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!state.hunter.some(h=>h.x===nx&&h.y===ny);
    });
    if (!valid.length) return;
    const p=valid[Math.floor(Math.random()*valid.length)];
    state.hunter.unshift({x:state.hunter[0].x+p.x,y:state.hunter[0].y+p.y});
  } else {
    if (state.snake.some(s=>s.x===next.x&&s.y===next.y)) return endGame('The Hunter consumed you.');
    state.hunter.unshift(next);
  }
  state.hunter.pop();
}

function updateThreat() {
  if (!state.hunterOn) { updateBar(Math.min(100,(state.score/10)*100),`Wakes at score 10 (${state.score}/10)`); return; }
  const d=Math.abs(state.hunter[0].x-state.snake[0].x)+Math.abs(state.hunter[0].y-state.snake[0].y);
  const pct=Math.min(100,Math.max(0,100-(d/(COLS+ROWS))*100)+state.level*3);
  state.threat=pct;
  const msgs=['Recalibrating...','Tracking pattern...','Predicting path...','Closing in...','TARGET ACQUIRED'];
  updateBar(pct, state.frozen>0?'❄ Frozen!':msgs[Math.floor(pct/25)]);
}
function updateBar(pct,msg) {
  document.getElementById('ai-threat-fill').style.width=`${pct}%`;
  document.getElementById('ai-threat-text').textContent=msg;
}

function updateHUD() {
  document.getElementById('score').textContent=String(state.score).padStart(3,'0');
  document.getElementById('best').textContent=String(state.best).padStart(3,'0');
  document.getElementById('level').textContent=String(state.level).padStart(2,'0');
}
function animateScore() {
  const el=document.getElementById('score');
  el.classList.remove('score-pop'); void el.offsetWidth; el.classList.add('score-pop');
}


// Grid offscreen cache — drawn once, blitted each frame
let _gridCanvas = null, _gridCELL = 0;
function buildGrid(CELL) {
  if (CELL === _gridCELL && _gridCanvas) return;
  _gridCELL = CELL;
  _gridCanvas = document.createElement('canvas');
  _gridCanvas.width = COLS * CELL; _gridCanvas.height = ROWS * CELL;
  const gc = _gridCanvas.getContext('2d');
  gc.strokeStyle = C.grid; gc.lineWidth = 0.5; gc.beginPath();
  for (let x = 0; x <= COLS; x++) { gc.moveTo(x*CELL,0); gc.lineTo(x*CELL,ROWS*CELL); }
  for (let y = 0; y <= ROWS; y++) { gc.moveTo(0,y*CELL); gc.lineTo(COLS*CELL,y*CELL); }
  gc.stroke();
}

// Render — shadowBlur only on heads + powerup/food (never on body segments)
function render() {
  const CELL = cellSize();
  const offX = Math.floor((canvas.width  - COLS*CELL) / 2);
  const offY = Math.floor((canvas.height - ROWS*CELL) / 2);

  ctx.fillStyle = C.bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#090710'; ctx.fillRect(offX,offY,COLS*CELL,ROWS*CELL);
  buildGrid(CELL);
  ctx.drawImage(_gridCanvas, offX, offY);

  if (state.counting) {
    ctx.fillStyle='rgba(9,7,16,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=state.countdown>0?'#d4a853':'#5bbf9a';
    ctx.font=`bold ${CELL*4}px Cinzel,serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(state.countdown>0?state.countdown:'GO!', offX+COLS*CELL/2, offY+ROWS*CELL/2);
    return;
  }

  // Poisons — flat colour, no blur
  ctx.font=`${CELL-8}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  state.poisons.forEach(p => {
    const a = p.life<=10?p.life/10:1;
    ctx.globalAlpha = a; ctx.fillStyle = C.poison;
    ctx.beginPath(); ctx.roundRect(offX+p.x*CELL+3,offY+p.y*CELL+3,CELL-6,CELL-6,4); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.fillText('✕',offX+p.x*CELL+CELL/2,offY+p.y*CELL+CELL/2);
  });
  ctx.globalAlpha = 1;

  // Powerup — blur only on this one item
  if (state.powerup) {
    const icons={shield:'🛡',freeze:'❄',speed:'⚡'};
    const cols={shield:C.shield,freeze:C.freeze,speed:C.speed};
    const a=state.powerup.life<=10?state.powerup.life/10:1;
    const col=cols[state.powerup.type];
    const px=offX+state.powerup.x*CELL, py=offY+state.powerup.y*CELL;
    const pcx=px+CELL/2, pcy=py+CELL/2;
    ctx.save();
    ctx.globalAlpha=a*0.9; ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=22;
    ctx.beginPath(); ctx.roundRect(px+1,py+1,CELL-2,CELL-2,6); ctx.fill();
    const ring=(state.ticks%20)/20;
    ctx.globalAlpha=a*(0.55-ring*0.5); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.arc(pcx,pcy,CELL/2+ring*CELL*0.5,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=a; ctx.shadowBlur=0;
    ctx.font=`bold ${CELL-5}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#050310'; ctx.fillText(icons[state.powerup.type],pcx,pcy+1);
    ctx.restore();
  }

  // Food — small blur on single item only
  if (state.food) {
    ctx.save(); ctx.shadowColor=C.foodGlow; ctx.shadowBlur=8; ctx.fillStyle=C.food;
    ctx.font=`${CELL-4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('★',offX+state.food.x*CELL+CELL/2,offY+state.food.y*CELL+CELL/2);
    ctx.restore();
  }

  // Hunter body — NO shadowBlur
  state.hunter.forEach((s,i) => {
    if (!i) return;
    ctx.globalAlpha = Math.max(0.3,1-i*0.05);
    drawSeg(s,C.hunter,C.hunterScale,C.hunterDark,CELL,offX,offY);
  });
  ctx.globalAlpha=1;
  if (state.hunter.length) drawHead(state.hunter[0],state.hunterDir,C.hunter,C.hunterHead,C.hunterGlow,CELL,offX,offY);

  // Shield
  if (state.shield) {
    ctx.save(); ctx.strokeStyle=C.shield; ctx.lineWidth=2; ctx.shadowColor=C.shield; ctx.shadowBlur=8;
    ctx.strokeRect(offX+state.snake[0].x*CELL+1,offY+state.snake[0].y*CELL+1,CELL-2,CELL-2);
    ctx.restore();
  }

  // Player body — NO shadowBlur
  state.snake.forEach((s,i) => {
    if (!i) return;
    ctx.globalAlpha = Math.max(0.35,1-i*0.03);
    drawSeg(s,C.snake,C.snakeScale,C.snakeDark,CELL,offX,offY);
  });
  ctx.globalAlpha=1;
  drawHead(state.snake[0],state.dir,C.snake,'#fff',C.snakeGlow,CELL,offX,offY);

  // Name tag
  ctx.fillStyle='rgba(212,168,83,0.85)'; ctx.font='bold 9px Cinzel,serif';
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.fillText(playerName,offX+state.snake[0].x*CELL+CELL/2,offY+state.snake[0].y*CELL-1);
}

function lighten(h,a){const n=parseInt(h.replace('#',''),16);return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&0xff)+a)},${Math.min(255,(n&0xff)+a)})`;}
function darken(h,a){const n=parseInt(h.replace('#',''),16);return `rgb(${Math.max(0,(n>>16)-a)},${Math.max(0,((n>>8)&0xff)-a)},${Math.max(0,(n&0xff)-a)})`;}

// drawSeg — zero shadowBlur. 3D effect via highlight/shadow rects instead
function drawSeg(seg,col,scaleCol,darkCol,CELL,offX,offY) {
  const x=offX+seg.x*CELL, y=offY+seg.y*CELL;
  // Base
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.roundRect(x+2,y+2,CELL-4,CELL-4,5); ctx.fill();
  // Top-left highlight
  ctx.fillStyle=lighten(col,38);
  ctx.beginPath(); ctx.roundRect(x+2,y+2,Math.floor(CELL*0.56),Math.floor(CELL*0.46),4); ctx.fill();
  // Bottom-right shadow
  ctx.fillStyle=darkCol;
  ctx.beginPath(); ctx.roundRect(x+Math.floor(CELL*0.44),y+Math.floor(CELL*0.5),Math.floor(CELL*0.52),Math.floor(CELL*0.46),3); ctx.fill();
  // Scale dots
  const prevAlpha=ctx.globalAlpha; ctx.globalAlpha*=0.25; ctx.fillStyle=scaleCol;
  for(let sx=0;sx<2;sx++)for(let sy=0;sy<2;sy++){
    ctx.beginPath(); ctx.ellipse(x+4+sx*(CELL-8)/2+3,y+4+sy*(CELL-8)/2+3,3,2,0,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=prevAlpha;
}

// drawHead — one shadowBlur only, on heads
function drawHead(seg,dir,col,eyeCol,glow,CELL,offX,offY) {
  const x=offX+seg.x*CELL,y=offY+seg.y*CELL,cx=x+CELL/2,cy=y+CELL/2,r=CELL/2-1;
  ctx.save();
  ctx.shadowColor=glow; ctx.shadowBlur=14;
  const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,1,cx,cy,r);
  g.addColorStop(0,lighten(col,60)); g.addColorStop(0.5,col); g.addColorStop(1,darken(col,30));
  ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x+1,y+1,CELL-2,CELL-2,CELL/2); ctx.fill();
  ctx.shadowBlur=0;
  const eo=3.5;
  const eyes={1:{a:{x:cx+3,y:cy-eo},b:{x:cx+3,y:cy+eo}},'-1':{a:{x:cx-3,y:cy-eo},b:{x:cx-3,y:cy+eo}}};
  const eyeY={1:{a:{x:cx-eo,y:cy+3},b:{x:cx+eo,y:cy+3}},'-1':{a:{x:cx-eo,y:cy-3},b:{x:cx+eo,y:cy-3}}};
  const ep=dir.x?eyes[dir.x]:eyeY[dir.y];
  if(ep){[ep.a,ep.b].forEach(e=>{
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(e.x,e.y,2.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(e.x+dir.x*0.5,e.y+dir.y*0.5,1.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(e.x-0.6,e.y-0.6,0.7,0,Math.PI*2); ctx.fill();
  });}
  ctx.restore();
}

function endGame(reason) {
  state.over=true; state.running=false; clearInterval(state.timer); sfx.die();
  if (state.score>state.best) { state.best=state.score; localStorage.setItem('venom_best',state.best); }
  const board=saveBoard(state.score);
  document.getElementById('gameover-title').textContent=state.score>=20?'IMPRESSIVE':state.score>=10?'FLATLINED':'TERMINATED';
  document.getElementById('gameover-tag').textContent=state.hunterOn?'HUNTER WINS':'GAME OVER';
  document.getElementById('gameover-msg').textContent=reason;
  document.getElementById('final-score').textContent=String(state.score).padStart(3,'0');
  document.getElementById('final-best').textContent=String(state.best).padStart(3,'0');
  renderBoard(board);
  showScreen('gameover-screen'); render();
}

function showScreen(id){['pause-screen','gameover-screen'].forEach(s=>{document.getElementById(s).style.display=s===id?'flex':'none';});}
function hideAll(){['pause-screen','gameover-screen'].forEach(s=>{document.getElementById(s).style.display='none';});}

let _heroActive = true, _lastHeroFrame = 0;
function go(id) {
  ['welcome-screen','game-screen','goodbye-screen'].forEach(s=>{
    document.getElementById(s).style.display=s===id?'flex':'none';
  });
  _heroActive = (id==='welcome-screen');
  if (id==='welcome-screen') {
    const best=localStorage.getItem('venom_best')||'0';
    const el=document.getElementById('welcome-best');
    if (el) el.textContent = parseInt(best)>0 ? `Best · ${best}` : '';
  }
}

// Input
document.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if(!state.running)return;
  if(e.key==='p'||e.key==='P'||e.key==='Escape'){
    state.paused=!state.paused;
    state.paused?showScreen('pause-screen'):(hideAll(),render());
    return;
  }
  if(state.paused||state.over)return;
  const d=state.dir;
  if((e.key==='ArrowUp'   ||e.key==='w')&&d.y!==1)  state.next={...DIR.UP};
  if((e.key==='ArrowDown' ||e.key==='s')&&d.y!==-1) state.next={...DIR.DOWN};
  if((e.key==='ArrowLeft' ||e.key==='a')&&d.x!==1)  state.next={...DIR.LEFT};
  if((e.key==='ArrowRight'||e.key==='d')&&d.x!==-1) state.next={...DIR.RIGHT};
});

// Buttons
document.getElementById('yes-btn').addEventListener('click',()=>{
  resizeCanvas();
  const n=document.getElementById('player-name-input');
  if(n&&n.value.trim()) playerName=n.value.trim().toUpperCase().slice(0,6);
  go('game-screen'); init();
});
document.getElementById('no-btn').addEventListener('click',()=>go('goodbye-screen'));
document.getElementById('return-btn').addEventListener('click',()=>go('welcome-screen'));
document.getElementById('resume-btn').addEventListener('click',()=>{state.paused=false;hideAll();render();});
document.getElementById('restart-btn').addEventListener('click',()=>{hideAll();go('game-screen');init();});
document.getElementById('quit-btn').addEventListener('click',()=>{clearInterval(state.timer);go('welcome-screen');});

// Touch
let touch=null;
document.addEventListener('touchmove',e=>{if(state.running&&!state.paused)e.preventDefault();},{passive:false});
canvas.addEventListener('touchstart',e=>{e.preventDefault();touch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:false});
canvas.addEventListener('touchend',e=>{
  e.preventDefault(); if(!touch||!state.running||state.paused)return;
  const dx=e.changedTouches[0].clientX-touch.x, dy=e.changedTouches[0].clientY-touch.y, d=state.dir;
  if(Math.abs(dx)>Math.abs(dy)){if(dx>20&&d.x!==-1)state.next={...DIR.RIGHT};if(dx<-20&&d.x!==1)state.next={...DIR.LEFT};}
  else{if(dy>20&&d.y!==-1)state.next={...DIR.DOWN};if(dy<-20&&d.y!==1)state.next={...DIR.UP};}
  touch=null;
},{passive:false});


// ── HERO CANVAS — Cinematic welcome screen ─────────────────────────────────
(function () {
  const hc = document.getElementById('hero-canvas');
  const hx = hc.getContext('2d');
  let hw, hh, hf = 0;

  function resize() {
    hw = hc.width  = hc.offsetWidth;
    hh = hc.height = hc.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Helpers ──────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  // ── Background: deep dark jungle/void ────────────────
  function drawBg() {
    // Base dark gradient — deep greens at edges, near black center
    const bg = hx.createRadialGradient(hw*0.5, hh*0.6, hh*0.1, hw*0.5, hh*0.5, hh*0.9);
    bg.addColorStop(0,   '#060a06');
    bg.addColorStop(0.4, '#04080a');
    bg.addColorStop(0.75,'#080510');
    bg.addColorStop(1,   '#020304');
    hx.fillStyle = bg; hx.fillRect(0, 0, hw, hh);

    // Vignette — heavy darkness at all edges
    const vig = hx.createRadialGradient(hw*0.5, hh*0.45, hh*0.15, hw*0.5, hh*0.5, hh*0.8);
    vig.addColorStop(0,   'rgba(0,0,0,0)');
    vig.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    vig.addColorStop(1,   'rgba(0,0,0,0.88)');
    hx.fillStyle = vig; hx.fillRect(0, 0, hw, hh);

    // Ambient green glow behind snake — like undergrowth light
    const glow = hx.createRadialGradient(hw*0.5, hh*0.62, 0, hw*0.5, hh*0.62, hw*0.45);
    glow.addColorStop(0,   'rgba(30,80,20,0.22)');
    glow.addColorStop(0.5, 'rgba(10,40,10,0.1)');
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    hx.fillStyle = glow; hx.fillRect(0, 0, hw, hh);
  }

  // ── Fog layers ────────────────────────────────────────
  const fogLayers = [
    { y: 0.72, speed: 0.00018, offset: 0,    alpha: 0.18, h: 0.22 },
    { y: 0.80, speed: 0.00010, offset: 0.4,  alpha: 0.24, h: 0.28 },
    { y: 0.88, speed: 0.00006, offset: 0.7,  alpha: 0.30, h: 0.22 },
  ];
  function drawFog(t) {
    fogLayers.forEach(f => {
      const ox = ((t * f.speed) % 1) * hw;
      const gy = hh * f.y;
      hx.save();
      for (let pass = 0; pass < 2; pass++) {
        const xOff = pass === 0 ? -ox : hw - ox;
        const fog = hx.createLinearGradient(0, gy - hh*0.04, 0, gy + hh*f.h);
        fog.addColorStop(0, `rgba(140,180,130,0)`);
        fog.addColorStop(0.2, `rgba(140,180,130,${f.alpha})`);
        fog.addColorStop(0.6, `rgba(100,140,90,${f.alpha * 0.6})`);
        fog.addColorStop(1, 'rgba(0,0,0,0)');
        hx.fillStyle = fog;
        hx.fillRect(xOff, gy - hh*0.04, hw, hh * (f.h + 0.08));
      }
      hx.restore();
    });
  }

  // ── Jungle vines / branches (left & right) ────────────
  function drawVines() {
    hx.save();
    // Left branch cluster
    hx.strokeStyle = 'rgba(20,50,15,0.7)';
    hx.lineWidth = 18; hx.lineCap = 'round';
    hx.shadowColor = 'rgba(0,0,0,0.8)'; hx.shadowBlur = 20;
    hx.beginPath(); hx.moveTo(-hw*0.01, hh*0.1); hx.bezierCurveTo(hw*0.06, hh*0.35, hw*0.02, hh*0.55, hw*0.08, hh*0.85); hx.stroke();
    hx.lineWidth = 10;
    hx.beginPath(); hx.moveTo(hw*0.04, 0); hx.bezierCurveTo(hw*0.12, hh*0.25, hw*0.05, hh*0.5, hw*0.12, hh*0.7); hx.stroke();
    hx.lineWidth = 6;
    hx.beginPath(); hx.moveTo(hw*0.09, hh*0.05); hx.bezierCurveTo(hw*0.18, hh*0.3, hw*0.1, hh*0.45, hw*0.16, hh*0.65); hx.stroke();
    // Hanging vine left
    hx.lineWidth = 4; hx.strokeStyle = 'rgba(30,70,20,0.5)';
    hx.beginPath(); hx.moveTo(hw*0.12, 0); hx.bezierCurveTo(hw*0.15, hh*0.3, hw*0.11, hh*0.5, hw*0.14, hh*0.8); hx.stroke();

    // Right branch cluster
    hx.strokeStyle = 'rgba(20,50,15,0.7)';
    hx.lineWidth = 16;
    hx.beginPath(); hx.moveTo(hw*1.01, hh*0.08); hx.bezierCurveTo(hw*0.94, hh*0.3, hw*0.97, hh*0.55, hw*0.91, hh*0.82); hx.stroke();
    hx.lineWidth = 9;
    hx.beginPath(); hx.moveTo(hw*0.96, 0); hx.bezierCurveTo(hw*0.88, hh*0.22, hw*0.94, hh*0.48, hw*0.87, hh*0.68); hx.stroke();
    hx.lineWidth = 5;
    hx.beginPath(); hx.moveTo(hw*0.91, hh*0.03); hx.bezierCurveTo(hw*0.83, hh*0.28, hw*0.89, hh*0.46, hw*0.84, hh*0.62); hx.stroke();
    hx.lineWidth = 3; hx.strokeStyle = 'rgba(30,70,20,0.5)';
    hx.beginPath(); hx.moveTo(hw*0.87, 0); hx.bezierCurveTo(hw*0.85, hh*0.28, hw*0.88, hh*0.5, hw*0.85, hh*0.78); hx.stroke();

    // Moss patches — left edge
    hx.fillStyle = 'rgba(25,65,18,0.6)';
    hx.shadowColor = 'rgba(0,0,0,0.5)'; hx.shadowBlur = 15;
    hx.beginPath(); hx.ellipse(hw*0.03, hh*0.5, hw*0.06, hh*0.12, 0.3, 0, Math.PI*2); hx.fill();
    hx.beginPath(); hx.ellipse(hw*0.06, hh*0.65, hw*0.05, hh*0.09, -0.2, 0, Math.PI*2); hx.fill();
    // Moss patches — right edge
    hx.beginPath(); hx.ellipse(hw*0.97, hh*0.48, hw*0.06, hh*0.11, -0.3, 0, Math.PI*2); hx.fill();
    hx.beginPath(); hx.ellipse(hw*0.94, hh*0.63, hw*0.05, hh*0.09, 0.2, 0, Math.PI*2); hx.fill();
    hx.restore();
  }

  // ── Water surface at base ─────────────────────────────
  function drawWater(t) {
    hx.save();
    const wy = hh * 0.78;
    // Dark water body
    const wg = hx.createLinearGradient(0, wy, 0, hh);
    wg.addColorStop(0, 'rgba(8,20,12,0.9)');
    wg.addColorStop(1, 'rgba(2,6,4,0.98)');
    hx.fillStyle = wg; hx.fillRect(0, wy, hw, hh - wy);

    // Ripple lines
    hx.strokeStyle = 'rgba(80,140,70,0.12)'; hx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ry = wy + hh * 0.03 * i;
      const rx = ((t * 0.0002 + i * 0.2) % 1) * hw;
      hx.beginPath(); hx.moveTo(rx - hw*0.3, ry); hx.bezierCurveTo(rx - hw*0.1, ry - 3, rx + hw*0.1, ry + 2, rx + hw*0.4, ry); hx.stroke();
    }

    // Water glow from snake splash
    const sg = hx.createRadialGradient(hw*0.5, wy, 0, hw*0.5, wy, hw*0.35);
    sg.addColorStop(0,   'rgba(60,120,50,0.25)');
    sg.addColorStop(0.5, 'rgba(20,60,20,0.08)');
    sg.addColorStop(1,   'rgba(0,0,0,0)');
    hx.fillStyle = sg; hx.fillRect(0, wy - hh*0.05, hw, hh*0.2);
    hx.restore();
  }

  // ── Splash droplets ───────────────────────────────────
  const droplets = Array.from({length: 14}, (_, i) => ({
    angle: (i / 14) * Math.PI + Math.PI * 0.1,
    speed: 0.004 + Math.random() * 0.006,
    len:   0.04 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
  }));
  function drawSplash(t) {
    hx.save();
    const ox = hw * 0.5, oy = hh * 0.78;
    droplets.forEach(d => {
      const p = (Math.sin(t * d.speed + d.phase) * 0.5 + 0.5);
      const dist = p * hw * 0.22;
      const ex = ox + Math.cos(d.angle) * dist;
      const ey = oy + Math.sin(d.angle + 0.3) * dist * 0.4 - p * hh * 0.06;
      hx.globalAlpha = (1 - p) * 0.5;
      hx.strokeStyle = 'rgba(180,220,160,0.9)';
      hx.lineWidth = 1.5;
      hx.beginPath();
      hx.moveTo(ex, ey);
      hx.lineTo(ex + Math.cos(d.angle)*hh*d.len*0.15*(1-p), ey - hh*0.03*p);
      hx.stroke();
    });
    hx.globalAlpha = 1;
    hx.restore();
  }

  // ── Snake body coil ───────────────────────────────────
  function drawCoil(riseY) {
    hx.save();
    const cx = hw * 0.5, cy = hh * (0.62 + riseY * 0.1);
    const rx = hw * 0.28, ry = hh * 0.09;

    // Shadow under coil
    hx.shadowColor = 'rgba(0,0,0,0)'; hx.shadowBlur = 0;
    const sh = hx.createRadialGradient(cx, cy + ry*1.2, 0, cx, cy + ry*1.2, rx*1.1);
    sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    hx.fillStyle = sh; hx.beginPath(); hx.ellipse(cx, cy + ry*1.3, rx*1.1, ry*0.7, 0, 0, Math.PI*2); hx.fill();

    // Coil — drawn as thick arc with scale texture
    const coilSegs = 48;
    for (let i = 0; i < coilSegs; i++) {
      const a0 = (i / coilSegs) * Math.PI * 2;
      const a1 = ((i + 1) / coilSegs) * Math.PI * 2;
      const t = i / coilSegs;
      // Thickness varies around coil
      const thick = hw * 0.045 * (0.7 + 0.3 * Math.sin(t * Math.PI));
      const x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry;
      const x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry;
      // Scale colour — dark olive-green like a real python
      const shade = 0.3 + 0.45 * Math.abs(Math.sin(t * Math.PI * 6));
      const gr = Math.floor(40 + shade * 60);
      const gg = Math.floor(55 + shade * 70);
      const gb = Math.floor(15 + shade * 25);
      hx.strokeStyle = `rgb(${gr},${gg},${gb})`;
      hx.lineWidth = thick;
      hx.lineCap = 'round';
      hx.shadowColor = 'rgba(0,0,0,0.6)'; hx.shadowBlur = 8;
      hx.beginPath(); hx.moveTo(x0, y0); hx.lineTo(x1, y1); hx.stroke();
    }
    // Belly stripe along bottom of coil
    hx.strokeStyle = 'rgba(180,160,80,0.25)'; hx.lineWidth = hw * 0.018;
    hx.shadowBlur = 0;
    hx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI * 0.1 + (i / 32) * Math.PI * 0.8;
      const x = cx + Math.cos(a) * rx * 0.92, y = cy + Math.sin(a) * ry * 1.15;
      i === 0 ? hx.moveTo(x, y) : hx.lineTo(x, y);
    }
    hx.stroke();
    hx.restore();
  }

  // ── Snake head rising ─────────────────────────────────
  function drawHead(riseY) {
    hx.save();
    const cx = hw * 0.5;
    // riseY goes 0→1 over time — head rises from water
    const cy = hh * (0.78 - riseY * 0.38);
    const headW = hw * 0.19, headH = hh * 0.24;

    // Neck
    const neckW = hw * 0.10;
    hx.shadowColor = 'rgba(0,0,0,0.7)'; hx.shadowBlur = 20;
    const neck = hx.createLinearGradient(cx - neckW, cy + headH*0.5, cx + neckW, cy + headH*0.5);
    neck.addColorStop(0,   'rgb(25,40,10)');
    neck.addColorStop(0.3, 'rgb(55,75,20)');
    neck.addColorStop(0.5, 'rgb(70,90,25)');
    neck.addColorStop(0.7, 'rgb(55,75,20)');
    neck.addColorStop(1,   'rgb(25,40,10)');
    hx.fillStyle = neck;
    hx.beginPath();
    hx.moveTo(cx - neckW, cy + headH * 0.6);
    hx.bezierCurveTo(cx - neckW * 1.1, cy + headH, cx - neckW * 0.8, hh, cx - neckW * 0.7, hh);
    hx.lineTo(cx + neckW * 0.7, hh);
    hx.bezierCurveTo(cx + neckW * 0.8, hh, cx + neckW * 1.1, cy + headH, cx + neckW, cy + headH * 0.6);
    hx.closePath(); hx.fill();

    // Head shape — flattened teardrop, wider at jaw
    const headPath = () => {
      hx.beginPath();
      hx.moveTo(cx, cy - headH * 0.52);
      hx.bezierCurveTo(cx + headW * 0.65, cy - headH * 0.35, cx + headW, cy + headH * 0.05, cx + headW * 0.9, cy + headH * 0.4);
      hx.bezierCurveTo(cx + headW * 0.75, cy + headH * 0.7, cx + headW * 0.5, cy + headH * 0.88, cx, cy + headH * 0.92);
      hx.bezierCurveTo(cx - headW * 0.5, cy + headH * 0.88, cx - headW * 0.75, cy + headH * 0.7, cx - headW * 0.9, cy + headH * 0.4);
      hx.bezierCurveTo(cx - headW, cy + headH * 0.05, cx - headW * 0.65, cy - headH * 0.35, cx, cy - headH * 0.52);
      hx.closePath();
    };

    // Head shadow
    hx.save(); hx.translate(hw * 0.01, hh * 0.015);
    headPath(); hx.fillStyle = 'rgba(0,0,0,0.5)'; hx.fill(); hx.restore();

    // Head base colour — dark python olive
    const hg = hx.createRadialGradient(cx - headW*0.2, cy - headH*0.1, headW*0.1, cx, cy + headH*0.2, headW*1.1);
    hg.addColorStop(0,   'rgb(80,100,35)');
    hg.addColorStop(0.35,'rgb(60,80,22)');
    hg.addColorStop(0.7, 'rgb(38,55,14)');
    hg.addColorStop(1,   'rgb(18,28,6)');
    headPath(); hx.fillStyle = hg; hx.shadowColor = 'rgba(0,0,0,0.8)'; hx.shadowBlur = 30; hx.fill();

    // Scale pattern overlay — irregular dark patches like a python
    hx.save(); hx.clip();
    const patchCols = [
      [cx - headW*0.3, cy - headH*0.1, headW*0.22, headH*0.14],
      [cx + headW*0.15, cy - headH*0.05, headW*0.18, headH*0.12],
      [cx - headW*0.1, cy + headH*0.18, headW*0.25, headH*0.13],
      [cx + headW*0.35, cy + headH*0.1, headW*0.15, headH*0.1],
      [cx - headW*0.45, cy + headH*0.05, headW*0.16, headH*0.1],
      [cx + headW*0.05, cy + headH*0.38, headW*0.2, headH*0.12],
      [cx - headW*0.25, cy + headH*0.3, headW*0.16, headH*0.1],
    ];
    patchCols.forEach(([px, py, pw, ph]) => {
      hx.fillStyle = 'rgba(15,25,5,0.55)';
      hx.beginPath(); hx.ellipse(px, py, pw, ph, Math.random() * 0.8 - 0.4, 0, Math.PI*2); hx.fill();
    });
    // Fine scale lines
    hx.strokeStyle = 'rgba(100,130,40,0.18)'; hx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      const sx = cx - headW*0.7 + i * headW*0.13;
      hx.beginPath(); hx.moveTo(sx, cy - headH*0.3); hx.lineTo(sx - headW*0.04, cy + headH*0.5); hx.stroke();
    }
    hx.restore();

    // Open jaw — mouth gaping open
    const jawDrop = headH * 0.72;
    // Upper jaw interior
    hx.save();
    hx.shadowBlur = 0;
    const mouthPath = () => {
      hx.beginPath();
      hx.moveTo(cx - headW * 0.82, cy + headH * 0.38);
      hx.bezierCurveTo(cx - headW * 0.6, cy + headH * 0.2, cx - headW * 0.2, cy + headH * 0.12, cx, cy + headH * 0.15);
      hx.bezierCurveTo(cx + headW * 0.2, cy + headH * 0.12, cx + headW * 0.6, cy + headH * 0.2, cx + headW * 0.82, cy + headH * 0.38);
      hx.bezierCurveTo(cx + headW * 0.7, cy + headH * 0.68 + jawDrop*0.15, cx + headW * 0.3, cy + headH * 0.75 + jawDrop*0.3, cx, cy + headH * 0.78 + jawDrop*0.35);
      hx.bezierCurveTo(cx - headW * 0.3, cy + headH * 0.75 + jawDrop*0.3, cx - headW * 0.7, cy + headH * 0.68 + jawDrop*0.15, cx - headW * 0.82, cy + headH * 0.38);
      hx.closePath();
    };
    mouthPath();
    const mg = hx.createLinearGradient(cx, cy + headH*0.1, cx, cy + headH + jawDrop*0.4);
    mg.addColorStop(0,   'rgb(120,30,30)');
    mg.addColorStop(0.3, 'rgb(160,45,45)');
    mg.addColorStop(0.7, 'rgb(80,15,15)');
    mg.addColorStop(1,   'rgb(20,5,5)');
    hx.fillStyle = mg; hx.fill();

    // Throat darkness
    const tg = hx.createRadialGradient(cx, cy + headH * 0.6 + jawDrop*0.25, hh*0.01, cx, cy + headH * 0.6 + jawDrop*0.25, headW*0.7);
    tg.addColorStop(0,   'rgba(0,0,0,0.95)');
    tg.addColorStop(0.5, 'rgba(15,5,5,0.6)');
    tg.addColorStop(1,   'rgba(0,0,0,0)');
    hx.fillStyle = tg; mouthPath(); hx.fill();

    // Fangs
    const fangData = [
      { x: cx - headW*0.38, tip: jawDrop*0.55, w: headW*0.035 },
      { x: cx + headW*0.38, tip: jawDrop*0.55, w: headW*0.035 },
      { x: cx - headW*0.22, tip: jawDrop*0.35, w: headW*0.022 },
      { x: cx + headW*0.22, tip: jawDrop*0.35, w: headW*0.022 },
    ];
    fangData.forEach(f => {
      const fy = cy + headH * 0.38;
      const fg = hx.createLinearGradient(f.x, fy, f.x, fy + f.tip);
      fg.addColorStop(0,   'rgb(245,240,220)');
      fg.addColorStop(0.7, 'rgb(220,210,180)');
      fg.addColorStop(1,   'rgb(180,160,120)');
      hx.fillStyle = fg;
      hx.shadowColor = 'rgba(0,0,0,0.5)'; hx.shadowBlur = 6;
      hx.beginPath();
      hx.moveTo(f.x - f.w, fy);
      hx.lineTo(f.x + f.w, fy);
      hx.bezierCurveTo(f.x + f.w*0.5, fy + f.tip*0.6, f.x + f.w*0.2, fy + f.tip*0.85, f.x, fy + f.tip);
      hx.bezierCurveTo(f.x - f.w*0.2, fy + f.tip*0.85, f.x - f.w*0.5, fy + f.tip*0.6, f.x - f.w, fy);
      hx.closePath(); hx.fill();
      // Blood drip on tips
      hx.fillStyle = 'rgba(180,20,20,0.85)';
      hx.shadowColor = 'rgba(180,20,20,0.5)'; hx.shadowBlur = 8;
      hx.beginPath(); hx.ellipse(f.x, fy + f.tip + hh*0.008, f.w*0.45, hh*0.012, 0, 0, Math.PI*2); hx.fill();
      hx.beginPath(); hx.moveTo(f.x - f.w*0.15, fy + f.tip); hx.lineTo(f.x + f.w*0.15, fy + f.tip); hx.lineTo(f.x, fy + f.tip + hh*0.02); hx.closePath(); hx.fill();
    });

    // Eyes — reptilian slit pupils
    const eyeData = [
      { x: cx - headW*0.42, y: cy - headH*0.06 },
      { x: cx + headW*0.42, y: cy - headH*0.06 },
    ];
    eyeData.forEach(e => {
      const er = headW * 0.11;
      // Eye glow
      hx.shadowColor = 'rgba(200,160,0,0.8)'; hx.shadowBlur = 20;
      hx.fillStyle = 'rgb(180,140,0)';
      hx.beginPath(); hx.ellipse(e.x, e.y, er, er*0.85, 0, 0, Math.PI*2); hx.fill();
      // Iris detail
      const ig = hx.createRadialGradient(e.x, e.y, 0, e.x, e.y, er);
      ig.addColorStop(0,   'rgb(220,180,10)');
      ig.addColorStop(0.4, 'rgb(160,120,0)');
      ig.addColorStop(0.8, 'rgb(80,55,0)');
      ig.addColorStop(1,   'rgb(20,15,0)');
      hx.fillStyle = ig; hx.shadowBlur = 0;
      hx.beginPath(); hx.ellipse(e.x, e.y, er, er*0.85, 0, 0, Math.PI*2); hx.fill();
      // Slit pupil — vertical
      hx.fillStyle = 'rgba(0,0,0,0.95)';
      hx.beginPath(); hx.ellipse(e.x, e.y, er*0.16, er*0.78, 0, 0, Math.PI*2); hx.fill();
      // Eye shine
      hx.fillStyle = 'rgba(255,255,255,0.5)';
      hx.beginPath(); hx.ellipse(e.x - er*0.22, e.y - er*0.28, er*0.18, er*0.12, -0.4, 0, Math.PI*2); hx.fill();
    });
    hx.restore();

    // Scales on top of head — geometric pattern
    hx.save();
    headPath(); hx.clip();
    hx.strokeStyle = 'rgba(90,120,30,0.22)'; hx.lineWidth = 0.7;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 10; col++) {
        const sx = cx - headW*0.8 + col * headW*0.18 + (row%2)*headW*0.09;
        const sy = cy - headH*0.4 + row * headH*0.12;
        hx.beginPath(); hx.ellipse(sx, sy, headW*0.08, headH*0.055, 0.1, 0, Math.PI*2); hx.stroke();
      }
    }
    hx.restore();
  }

  // ── Atmospheric particles ──────────────────────────────
  const spores = Array.from({length: 22}, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random()-0.5)*0.00015, vy: -0.00008 - Math.random()*0.00015,
    r: 0.8 + Math.random()*2, a: 0.1+Math.random()*0.3,
  }));
  function drawSpores(t) {
    spores.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      hx.save();
      hx.globalAlpha = p.a * (0.5 + Math.sin(t*0.003 + p.x*20)*0.5);
      hx.fillStyle = 'rgba(180,220,140,0.9)';
      hx.shadowColor = 'rgba(140,200,80,0.5)'; hx.shadowBlur = 8;
      hx.beginPath(); hx.arc(p.x*hw, p.y*hh, p.r, 0, Math.PI*2); hx.fill();
      hx.restore();
    });
  }

  // ── Main render loop ──────────────────────────────────
  let riseProgress = 0;
  function frame() {
    hf++;
    if (riseProgress < 1) riseProgress = Math.min(1, riseProgress + 0.004);
    const rise = ease(riseProgress);

    drawBg();
    drawVines();
    drawCoil(1 - rise);
    drawWater(hf);
    drawSplash(hf);
    drawHead(rise);
    drawFog(hf);
    drawSpores(hf);

    if (_heroActive) requestAnimationFrame(frame);
  }
  frame();
})();