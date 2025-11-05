// script.js - robust pointer-based drawing + quiz logic
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const card = document.querySelector('.card');
const clearBtn = document.getElementById('clearBtn');
const newBtn = document.getElementById('newBtn');
const opSelect = document.getElementById('opSelect');
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const operatorEl = document.getElementById('operator');
const answersEl = document.getElementById('answers');
const feedbackEl = document.getElementById('feedback');
const scoreDisplay = document.getElementById('scoreDisplay');
const questionCountSelect = document.getElementById('questionCountSelect');
let questionCount = 0;
let maxQuestions = parseInt(questionCountSelect.value);



let isDrawing = false;
let last = {x:0,y:0};
let currentAnswer = null;
let score = 0;

// HiDPI canvas resize for sharp lines
function resizeCanvas(){
  const rect = card.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // RESERVED: height to leave for controls/answers (match CSS bottom padding)
  const reservedBottom = 140; // px — samakan dengan CSS bottom/padding-bottom

  const width = rect.width;
  const height = Math.max(64, rect.height - reservedBottom); // at least small height

  // set CSS size for canvas element (so it visually fits)
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // set actual pixel buffer for HiDPI displays
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // reset transform then set scaling
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

window.addEventListener('resize', () => {
  // clear and resize - we don't preserve drawing during resize
  ctx.resetTransform && ctx.resetTransform(); // some browsers support
  resizeCanvas();
});
resizeCanvas();

// Pointer events: works with mouse & touch & stylus
canvas.addEventListener('pointerdown', (e) => {
  // Start drawing only when pointer is on canvas (it covers card)
  isDrawing = true;
  const r = canvas.getBoundingClientRect();
  last.x = e.clientX - r.left;
  last.y = e.clientY - r.top;
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  // prevent page scrolling while drawing
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

// Clear drawing
clearBtn.addEventListener('click', () => {
  // clear entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  feedbackEl.textContent = '';
});

// Quiz logic
const ops = ['+','-','×','÷'];

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function generateQuestion(mode = 'mix'){
  // clear drawing and feedback
  ctx.clearRect(0,0,canvas.width,canvas.height);
  feedbackEl.textContent = '';

  let op = mode;
  if (mode === 'mix') op = ops[randInt(0, ops.length-1)];

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
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.background = '#e6f0ff';
    btn.style.fontWeight = '700';
    btn.addEventListener('click', ()=> checkAnswer(v, btn));
    answersEl.appendChild(btn);
  });
}

function checkAnswer(selected, btn){
  // Jika jawapan betul
  if (selected === currentAnswer){
    btn.style.background = '#b2f2bb'; // hijau lembut
    btn.disabled = true;
    feedbackEl.style.color = 'green';
    feedbackEl.textContent = 'Betul! 🎉';
    score++;
    scoreDisplay.textContent = `Skor: ${score}`; // ✅ update skor paparan

    // Disable semua butang supaya tak tekan lagi
    Array.from(answersEl.children).forEach(b => b.disabled = true);

    // Soalan baru selepas sedikit masa
    setTimeout(() => {
      generateQuestion(opSelect.value === 'mix' ? 'mix' : opSelect.value);
    }, 800);

  } else {
    // Salah → warna merah, disable butang tu saja
    btn.style.background = '#ff8a8a';
    btn.disabled = true;

    // Papar mesej tapi masih boleh cuba lagi
    feedbackEl.style.color = 'red';
    feedbackEl.textContent = 'Salah — cuba lagi!';
  }
}


// UI hooks
document.getElementById('newBtn').addEventListener('click', () => {
  if (questionCount >= maxQuestions) {
    // reset permainan
    questionCount = 0;
    score = 0;
    scoreDisplay.textContent = `Skor: ${score}`;
    feedbackEl.textContent = '';
    newBtn.textContent = "Soalan Baru";
  }
  generateQuestion(opSelect.value === 'mix' ? 'mix' : opSelect.value);
});

opSelect.addEventListener('change', ()=> generateQuestion(opSelect.value === 'mix' ? 'mix' : opSelect.value));

questionCountSelect.addEventListener('change', () => {
  maxQuestions = parseInt(questionCountSelect.value);
  questionCount = 0;
  score = 0;
  scoreDisplay.textContent = `Skor: ${score}`;
  feedbackEl.textContent = '';
});


// init
function generateQuestion(mode = 'mix') {
  if (questionCount >= maxQuestions) {
    // Tamat permainan
    feedbackEl.style.color = '#0288d1';
    feedbackEl.innerHTML = `🎯 Tamat!<br>Skor anda: <strong>${score}/${maxQuestions}</strong><br><br>${score === maxQuestions ? '🌟 Excellent Job!' : score > maxQuestions * 0.6 ? '👍 Good Job!' : '💪 Keep Practicing!'}`;

    // Kosongkan butang jawapan
    answersEl.innerHTML = '';

    // Tukar teks butang “Soalan Baru” jadi “Main Semula”
    newBtn.textContent = "Main Semula";
    return;
  }

  // Teruskan game seperti biasa
  questionCount++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  feedbackEl.textContent = '';

  let op = mode;
  if (mode === 'mix') op = ops[randInt(0, ops.length - 1)];

  let a, b, ans;
  if (op === '+') {
    a = randInt(10, 99); b = randInt(0, 99); ans = a + b;
  } else if (op === '-') {
    a = randInt(10, 99); b = randInt(0, a); ans = a - b;
  } else if (op === '×') {
    a = randInt(2, 12); b = randInt(2, 12); ans = a * b;
  } else if (op === '÷') {
    b = randInt(2, 12); ans = randInt(1, 12); a = b * ans;
  }

  num1El.textContent = a;
  num2El.textContent = b;
  operatorEl.textContent = op;
  currentAnswer = ans;

  buildChoices(ans);
}
