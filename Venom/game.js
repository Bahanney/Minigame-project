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

// Render
function render() {
  const CELL = cellSize();
  const offX = Math.floor((canvas.width  - COLS * CELL) / 2);
  const offY = Math.floor((canvas.height - ROWS * CELL) / 2);
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw game area background
  ctx.fillStyle='#090710'; ctx.fillRect(offX,offY,COLS*CELL,ROWS*CELL);
  ctx.strokeStyle=C.grid; ctx.lineWidth=0.5;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(offX+x*CELL,offY);ctx.lineTo(offX+x*CELL,offY+ROWS*CELL);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(offX,offY+y*CELL);ctx.lineTo(offX+COLS*CELL,offY+y*CELL);ctx.stroke();}

  // Countdown overlay
  if (state.counting) {
    ctx.fillStyle='rgba(9,7,16,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=state.countdown>0?'#d4a853':'#5bbf9a';
    ctx.font=`bold ${CELL*4}px Cinzel,serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(state.countdown>0?state.countdown:'GO!', offX+COLS*CELL/2, offY+ROWS*CELL/2);
    return;
  }

  // Poisons
  state.poisons.forEach(p=>{
    const a=p.life<=10?p.life/10:1;
    ctx.save(); ctx.globalAlpha=a; ctx.shadowColor=C.poisonGlow; ctx.shadowBlur=10;
    ctx.fillStyle=C.poison; ctx.beginPath();
    ctx.roundRect(offX+p.x*CELL+3,offY+p.y*CELL+3,CELL-6,CELL-6,4); ctx.fill();
    ctx.fillStyle=`rgba(255,255,255,${a*0.8})`; ctx.font=`${CELL-8}px monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('✕',offX+p.x*CELL+CELL/2,offY+p.y*CELL+CELL/2); ctx.restore();
  });

  // Powerup — bright glowing tile with pulsing ring
  if (state.powerup) {
    const icons={shield:'🛡',freeze:'❄',speed:'⚡'};
    const cols={shield:C.shield,freeze:C.freeze,speed:C.speed};
    const a=state.powerup.life<=10?state.powerup.life/10:1;
    const col=cols[state.powerup.type];
    const px=offX+state.powerup.x*CELL, py=offY+state.powerup.y*CELL;
    const cx=px+CELL/2, cy=py+CELL/2;
    ctx.save();
    // Glowing background tile
    ctx.globalAlpha=a*0.9; ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=30;
    ctx.beginPath(); ctx.roundRect(px+1,py+1,CELL-2,CELL-2,6); ctx.fill();
    // Pulsing outer ring
    const ring=(state.ticks%20)/20;
    ctx.globalAlpha=a*(0.6-ring*0.55); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.shadowBlur=20;
    ctx.beginPath(); ctx.arc(cx,cy,CELL/2+ring*CELL*0.55,0,Math.PI*2); ctx.stroke();
    // Dark icon on bright background
    ctx.globalAlpha=a; ctx.shadowBlur=0;
    ctx.font=`bold ${CELL-5}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#050310';
    ctx.fillText(icons[state.powerup.type],cx,cy+1);
    ctx.restore();
  }

  // Food
  if (state.food) {
    ctx.save(); ctx.shadowColor=C.foodGlow; ctx.shadowBlur=14; ctx.fillStyle=C.food;
    ctx.font=`${CELL-4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('★',offX+state.food.x*CELL+CELL/2,offY+state.food.y*CELL+CELL/2); ctx.restore();
  }

  // Hunter
  state.hunter.forEach((s,i)=>{ if(!i)return; ctx.globalAlpha=Math.max(0.3,1-i*0.05); drawSeg(s,C.hunter,C.hunterScale,C.hunterDark,C.hunterGlow,CELL,offX,offY); ctx.globalAlpha=1; });
  if (state.hunter.length) drawHead(state.hunter[0],state.hunterDir,C.hunter,C.hunterHead,C.hunterGlow,CELL,offX,offY);

  // Player — shield flashes gold outline
  if (state.shield) { ctx.save(); ctx.strokeStyle=C.shield; ctx.lineWidth=2; ctx.shadowColor=C.shield; ctx.shadowBlur=12; ctx.strokeRect(offX+state.snake[0].x*CELL+1,offY+state.snake[0].y*CELL+1,CELL-2,CELL-2); ctx.restore(); }
  state.snake.forEach((s,i)=>{ if(!i)return; ctx.globalAlpha=Math.max(0.35,1-i*0.03); drawSeg(s,C.snake,C.snakeScale,C.snakeDark,C.snakeGlow,CELL,offX,offY); ctx.globalAlpha=1; });
  drawHead(state.snake[0],state.dir,C.snake,'#fff',C.snakeGlow,CELL,offX,offY);

  // Player name tag above head
  ctx.save(); ctx.fillStyle='rgba(212,168,83,0.85)'; ctx.font=`bold 9px Cinzel,serif`;
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.fillText(playerName, offX+state.snake[0].x*CELL+CELL/2, offY+state.snake[0].y*CELL-1); ctx.restore();
}

// Tint helpers
function lighten(h,a){const n=parseInt(h.replace('#',''),16);return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&0xff)+a)},${Math.min(255,(n&0xff)+a)})`;}
function darken(h,a){const n=parseInt(h.replace('#',''),16);return `rgb(${Math.max(0,(n>>16)-a)},${Math.max(0,((n>>8)&0xff)-a)},${Math.max(0,(n&0xff)-a)})`;}

function drawSeg(seg,col,scaleCol,darkCol,glow,CELL,offX,offY) {
  const x=offX+seg.x*CELL, y=offY+seg.y*CELL, cx=x+CELL/2, cy=y+CELL/2, r=CELL/2-1;
  ctx.save(); ctx.shadowColor=glow; ctx.shadowBlur=8;
  const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,1,cx,cy,r);
  g.addColorStop(0,lighten(col,40)); g.addColorStop(0.4,col); g.addColorStop(1,darkCol);
  ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x+2,y+2,CELL-4,CELL-4,5); ctx.fill();
  ctx.fillStyle=scaleCol; ctx.globalAlpha=0.3;
  for(let sx=0;sx<2;sx++)for(let sy=0;sy<2;sy++){ctx.beginPath();ctx.ellipse(x+4+sx*(CELL-8)/2+3,y+4+sy*(CELL-8)/2+3,3.5,2.5,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1; ctx.restore();
}

function drawHead(seg,dir,col,eyeCol,glow,CELL,offX,offY) {
  const x=offX+seg.x*CELL,y=offY+seg.y*CELL,cx=x+CELL/2,cy=y+CELL/2,r=CELL/2-1;
  ctx.save(); ctx.shadowColor=glow; ctx.shadowBlur=18;
  const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,1,cx,cy,r);
  g.addColorStop(0,lighten(col,60)); g.addColorStop(0.5,col); g.addColorStop(1,darken(col,30));
  ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x+1,y+1,CELL-2,CELL-2,CELL/2); ctx.fill(); ctx.restore();
  ctx.save();
  const eo=3.5;
  const eyes={1:{a:{x:cx+3,y:cy-eo},b:{x:cx+3,y:cy+eo}},'-1':{a:{x:cx-3,y:cy-eo},b:{x:cx-3,y:cy+eo}}};
  const eyeY={1:{a:{x:cx-eo,y:cy+3},b:{x:cx+eo,y:cy+3}},'-1':{a:{x:cx-eo,y:cy-3},b:{x:cx+eo,y:cy-3}}};
  const ep=dir.x?eyes[dir.x]:eyeY[dir.y];
  if (ep) {
    [ep.a,ep.b].forEach(e=>{
      ctx.fillStyle='#fff'; ctx.shadowColor=eyeCol; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(e.x,e.y,2.8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#111'; ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(e.x+dir.x*0.5,e.y+dir.y*0.5,1.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(e.x-0.6,e.y-0.6,0.7,0,Math.PI*2); ctx.fill();
    });
  }
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

function go(id) {
  ['welcome-screen','game-screen','goodbye-screen'].forEach(s=>{
    document.getElementById(s).style.display=s===id?'flex':'none';
  });
  if (id==='welcome-screen') {
    const best=localStorage.getItem('venom_best')||'0';
    const el=document.getElementById('welcome-best');
    if (el) el.textContent = parseInt(best)>0 ? `Best Score: ${best}` : '';
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