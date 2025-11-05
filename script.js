// 🎯 Jom Kira v4.1 — polished UI + alignment fix + end screen card

// Elements
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const card = document.querySelector('.card');
const clearBtn = document.getElementById('clearBtn');
const newBtn = document.getElementById('newBtn');
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const operatorEl = document.getElementById('operator');
const answersEl = document.getElementById('answers');
const feedbackEl = document.getElementById('feedback');
const scoreDisplay = document.getElementById('scoreDisplay');
const qNumberEl = document.getElementById('qNumber');

// Home screen
const homeScreen = document.getElementById('homeScreen');
const quizScreen = document.getElementById('quizScreen');
const startBtn = document.getElementById('startBtn');
const homeOpSelect = document.getElementById('homeOpSelect');
const homeCountSelect = document.getElementById('homeCountSelect');
const homeBtn = document.getElementById('homeBtn');

// Variables
let currentOp = "mix";
let questionCount = 0;
let maxQuestions = parseInt(homeCountSelect.value || 10);
let isDrawing = false;
let last = {x:0,y:0};
let currentAnswer = null;
let score = 0;
const ops = ['+','-','×','÷'];

// ================================================================
// Canvas setup
function resizeCanvas(){
  const rect = card.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const reservedBottom = 140;
  const width = rect.width;
  const height = Math.max(64, rect.height - reservedBottom);

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  // map drawing to CSS pixels (so drawing uses logical CSS px)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawGuideLine();
}
window.addEventListener('resize', () => {
  if (ctx.resetTransform) ctx.resetTransform();
  resizeCanvas();
});
resizeCanvas();

// draw faint horizontal guides (like exercise book)
function drawGuideLine(){
  // clear then draw faint lines
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 1;
  // draw every 20px (CSS px coordinates because of setTransform)
  const cssHeight = canvas.height / (window.devicePixelRatio || 1);
  for (let y = 18; y < cssHeight; y += 20) {
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo((canvas.width / (window.devicePixelRatio || 1)) - 6, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ================================================================
// Drawing logic
canvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  const r = canvas.getBoundingClientRect();
  last.x = e.clientX - r.left;
  last.y = e.clientY - r.top;
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.lineTo(x, y);
  ctx.stroke();
  last.x = x; last.y = y;
});
canvas.addEventListener('pointerup', (e) => {
  isDrawing = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch(_) {}
});
canvas.addEventListener('pointercancel', () => { isDrawing = false; });

clearBtn.addEventListener('click', () => {
  drawGuideLine();
  feedbackEl.textContent = '';
});

// ================================================================
// Quiz logic
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function updateQuestionNumber(){
  qNumberEl.textContent = `Soalan: ${Math.min(questionCount, maxQuestions)} / ${maxQuestions}`;
}

function buildChoices(correct){
  const s = new Set([correct]);
  while (s.size < 4){
    let delta = Math.max(1, Math.round(Math.abs(correct)*0.2));
    let r = correct + (Math.random()<0.5 ? -1 : 1) * randInt(1, delta+3);
    if (r < 0) r = Math.abs(r) + 1;
    s.add(r);
  }
  const arr = Array.from(s).sort(()=>Math.random()-0.5);
  answersEl.innerHTML = '';
  arr.forEach(v=>{
    const btn = document.createElement('button');
    btn.textContent = v;
    btn.className = 'choice-btn';
    btn.addEventListener('click', ()=> checkAnswer(v, btn));
    answersEl.appendChild(btn);
  });
}

// ================================================================
// Jawapan logic
function checkAnswer(selected, btn){
  // elak klik selepas tamat
  if (questionCount > maxQuestions) return;

  Array.from(answersEl.children).forEach(b => b.disabled = true);

  if (selected === currentAnswer){
    btn.style.background = '#b2f2bb';
    feedbackEl.textContent = 'Betul! 🎉';
    feedbackEl.className = 'feedback correct';
    score++;
    scoreDisplay.textContent = `Skor: ${score}`;
  } else {
    btn.style.background = '#ff8a8a';
    feedbackEl.textContent = 'Salah ❌';
    feedbackEl.className = 'feedback wrong';
  }

  // teruskan ke soalan seterusnya selepas 1 saat
  setTimeout(() => generateQuestion(currentOp), 1000);
}

// ================================================================
// Generate soalan
function generateQuestion(mode = 'mix', isRefresh = false) {
  // Tamat permainan
  if (questionCount >= maxQuestions && !isRefresh) {
  feedbackEl.className = 'feedback';
  feedbackEl.innerHTML = `
    <div class="end-screen" role="status">
      <h2>🎯 Tamat!</h2>
      <p>Skor anda: <strong>${score}/${maxQuestions}</strong></p>
      <p>${score === maxQuestions ? '🌟 Excellent Job!' : score > maxQuestions * 0.6 ? '👍 Good Job!' : '💪 Keep Practicing!'}</p>
      <p class="hint">Tekan <strong>🏠</strong> untuk balik ke menu utama.</p>
    </div>
  `;
  answersEl.innerHTML = '';
  newBtn.textContent = "🔄";

  // 🚫 Hanya homeBtn kekal, sembunyi butang lain
  newBtn.style.display = "none";
  clearBtn.style.display = "none";
  homeBtn.style.display = "inline-block";
  return;
}


  // Tambah bilangan soalan hanya bila bukan refresh manual
  if (!isRefresh) questionCount++;

  updateQuestionNumber();
  drawGuideLine();
  feedbackEl.textContent = '';

  let op = mode;
  if (mode === 'mix') op = ops[randInt(0, ops.length - 1)];

  let a,b,ans;
  if (op === '+'){
    a = randInt(10,99); b = randInt(0,99); ans = a + b;
  } else if (op === '-'){
    a = randInt(10,99); b = randInt(0,a); ans = a - b;
  } else if (op === '×'){
    a = randInt(2,12); b = randInt(2,12); ans = a*b;
  } else if (op === '÷'){
    b = randInt(2,12); ans = randInt(1,12); a = b * ans;
  }

  num1El.textContent = a;
  num2El.textContent = b;
  operatorEl.textContent = op;
  currentAnswer = ans;

  buildChoices(ans);
}

// ================================================================
// Buttons
newBtn.addEventListener('click', () => {
  // Kalau sudah tamat semua soalan
  if (questionCount >= maxQuestions) {
    questionCount = 0;
    score = 0;
    scoreDisplay.textContent = `Skor: ${score}`;
    feedbackEl.textContent = '';
    newBtn.textContent = "🔄";
    generateQuestion(currentOp);
  } else {
    // Kalau belum tamat, refresh current question tanpa tambah count
    generateQuestion(currentOp, true);
  }
});

startBtn.addEventListener('click', () => {
  currentOp = homeOpSelect.value;
  maxQuestions = parseInt(homeCountSelect.value);
  questionCount = 0;
  score = 0;
  scoreDisplay.textContent = `Skor: ${score}`;
  feedbackEl.textContent = '';
  newBtn.textContent = "🔄";
  homeScreen.classList.remove('active');
  quizScreen.classList.add('active');
  resizeCanvas();
  generateQuestion(currentOp);
  // pastikan semua butang muncul semula
  newBtn.style.display = "inline-block";
  clearBtn.style.display = "inline-block";
  homeBtn.style.display = "inline-block";

});

homeBtn.addEventListener('click', () => {
  // Kalau dah habis semua soalan, terus balik ke home tanpa tanya
  if (questionCount >= maxQuestions) {
    questionCount = 0;
    score = 0;
    feedbackEl.textContent = '';
    scoreDisplay.textContent = `Skor: 0`;
    homeScreen.classList.add('active');
    quizScreen.classList.remove('active');
    return;
  }

  // Kalau belum habis, baru tanya confirm
  const confirmExit = confirm("Betul nak balik ke menu utama? Progres akan hilang.");
  if (confirmExit) {
    questionCount = 0;
    score = 0;
    feedbackEl.textContent = '';
    scoreDisplay.textContent = `Skor: 0`;
    homeScreen.classList.add('active');
    quizScreen.classList.remove('active');
  }
});

// ================================================================
updateQuestionNumber();
