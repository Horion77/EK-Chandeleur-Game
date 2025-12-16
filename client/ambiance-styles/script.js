// ======================================================
// STATE GLOBAL
// ======================================================

let currentStep = 1;
let currentQuestionIndex = 0;
let quizAnswers = [];
let usedWords = new Set();

// ======================================================
// CONFIG QUIZ
// ======================================================

const QUESTIONS = [
  {
    text: "Quelle est ta crêpe préférée ?",
    image: "/IMAGES APP A&S/IMAGE_1_MEMORY_CREPE_CHOCO_BANANE.png",
    options: [
      { label: "Sucre", value: "A" },
      { label: "Chocolat", value: "B" },
      { label: "Originale", value: "C" }
    ]
  },
  {
    text: "Quand fais-tu des crêpes ?",
    image: "/IMAGES APP A&S/QUIZZ.png",
    options: [
      { label: "Une fois par an", value: "A" },
      { label: "Souvent", value: "B" },
      { label: "Tout le temps", value: "C" }
    ]
  }
];

// ======================================================
// CONFIG JEU DE MOTS
// ======================================================

const WORDS = [
  { word: "CREPE", hint: "La star de la Chandeleur" },
  { word: "SPATULE", hint: "Indispensable pour retourner" },
  { word: "FROMENT", hint: "La base de la pâte" }
];

let currentWord = null;
let currentAnswer = "";

// ======================================================
// DOM
// ======================================================

const steps = {
  1: document.getElementById("step-1"),
  2: document.getElementById("step-2"),
  3: document.getElementById("step-wordgame"),
  4: document.getElementById("step-3"),
  5: document.getElementById("step-4"),
  6: document.getElementById("step-5")
};

const progressBar = document.getElementById("progressBar");

// Quiz
const questionText = document.getElementById("questionText");
const questionImage = document.getElementById("questionImage");
const optionsContainer = document.getElementById("optionsContainer");
const questionIndicator = document.getElementById("questionIndicateur");

// Word game
const scrambledWordContainer = document.getElementById("scrambled-word");
const userAnswerDisplay = document.getElementById("user-answer");
const wordHint = document.getElementById("wordGameHint");
const hintTimer = document.getElementById("hintTimer");
const timerSeconds = document.getElementById("timerSeconds");

// Modal
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

// ======================================================
// NAVIGATION
// ======================================================

function showStep(step) {
  Object.values(steps).forEach(s => s.classList.remove("active"));
  steps[step].classList.add("active");
  currentStep = step;
  updateProgress();
}

function updateProgress() {
  const percent = ((currentStep - 1) / 5) * 100;
  progressBar.style.width = `${percent}%`;
}

function backToMenu() {
  showStep(1);
}

function launchLevel(level) {
  if (level === 1) {
    showStep(2);
    initMemory();
  }
  if (level === 2) {
    showStep(3);
    initWordGame();
  }
  if (level === 3) {
    showStep(4);
    startQuiz();
  }
}

// ======================================================
// MEMORY (placeholder simple)
// ======================================================

function initMemory() {
  // Ton memory est déjà fonctionnel → rien à casser ici
  // Tu peux brancher ici la logique de fin :
  setTimeout(() => {
    document.querySelector(".node-1").classList.add("completed");
    document.querySelector(".node-2").classList.remove("locked");
  }, 500);
}

// ======================================================
// JEU DE MOTS
// ======================================================

function initWordGame() {
  currentWord = WORDS.find(w => !usedWords.has(w.word));
  if (!currentWord) currentWord = WORDS[0];

  usedWords.add(currentWord.word);
  currentAnswer = "";
  userAnswerDisplay.textContent = "";
  scrambledWordContainer.innerHTML = "";
  wordHint.style.display = "none";

  const letters = shuffle([...currentWord.word]);

  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "word-btn";
    btn.textContent = letter;
    btn.onclick = () => addLetter(letter, btn);
    scrambledWordContainer.appendChild(btn);
  });

  startHintTimer();
}

function addLetter(letter, btn) {
  currentAnswer += letter;
  userAnswerDisplay.textContent = currentAnswer;
  btn.style.visibility = "hidden";
}

function resetWord() {
  initWordGame();
}

function checkWord() {
  if (currentAnswer === currentWord.word) {
    document.querySelector(".node-2").classList.add("completed");
    document.querySelector(".node-3").classList.remove("locked");
    showModal("Bravo !", "Mot trouvé 🎉");
    setTimeout(() => showStep(1), 800);
  } else {
    showModal("Oups", "Ce n’est pas le bon mot.");
  }
}

// ======================================================
// INDICE TIMER
// ======================================================

function startHintTimer() {
  let time = 10;
  timerSeconds.textContent = time;
  hintTimer.classList.remove("clickable");

  const interval = setInterval(() => {
    time--;
    timerSeconds.textContent = time;
    if (time <= 0) {
      clearInterval(interval);
      hintTimer.classList.add("clickable");
      hintTimer.onclick = () => {
        wordHint.textContent = currentWord.hint;
        wordHint.style.display = "block";
      };
    }
  }, 1000);
}

// ======================================================
// QUIZ
// ======================================================

function startQuiz() {
  currentQuestionIndex = 0;
  quizAnswers = [];
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentQuestionIndex];
  questionText.textContent = q.text;
  questionImage.src = q.image;
  optionsContainer.innerHTML = "";
  questionIndicator.textContent = `Question ${currentQuestionIndex + 1}/${QUESTIONS.length}`;

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.textContent = opt.label;
    btn.onclick = () => selectOption(opt.value);
    optionsContainer.appendChild(btn);
  });
}

function selectOption(value) {
  quizAnswers.push(value);
  currentQuestionIndex++;

  if (currentQuestionIndex >= QUESTIONS.length) {
    document.querySelector(".node-3").classList.add("completed");
    document.getElementById("centerGiftBtn").classList.remove("locked");
    document.getElementById("centerGiftBtn").disabled = false;
    showStep(5);
  } else {
    renderQuestion();
  }
}

// ======================================================
// FORM / RESULT
// ======================================================

function submitForm(e) {
  e.preventDefault();
  showStep(6);
}

function resetGame() {
  location.reload();
}

// ======================================================
// MODAL
// ======================================================

function showModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalOverlay.classList.add("active");
}

function closeModal() {
  modalOverlay.classList.remove("active");
}

// ======================================================
// UTIL
// ======================================================

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
