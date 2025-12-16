// =========================================================================
// CONFIG
// =========================================================================

const API_BASE_URL = (typeof window !== "undefined" && window.API_BASE_URL) ? window.API_BASE_URL : "";
const ENSEIGNE = (typeof window !== "undefined" && window.ENSEIGNE) ? window.ENSEIGNE : "ambiance-styles";

// =========================================================================
// STATE
// =========================================================================

let currentStep = 1;         // 1..4
let currentQuestion = 0;
let answers = [];
let profile = null;

// Exemple de questions (à adapter à ton contenu réel si besoin)
const QUESTIONS = [
  {
    title: "Question 1",
    image: "./assets/q1.jpg",
    options: [
      { label: "Option A", value: "A" },
      { label: "Option B", value: "B" },
      { label: "Option C", value: "C" }
    ]
  },
  {
    title: "Question 2",
    image: "./assets/q2.jpg",
    options: [
      { label: "Option A", value: "A" },
      { label: "Option B", value: "B" },
      { label: "Option C", value: "C" }
    ]
  },
  {
    title: "Question 3",
    image: "./assets/q3.jpg",
    options: [
      { label: "Option A", value: "A" },
      { label: "Option B", value: "B" },
      { label: "Option C", value: "C" }
    ]
  }
];

// Exemples de profils (à adapter)
const PROFILES = {
  A: {
    title: "Crêpier du dimanche",
    desc: "Tu aimes la simplicité, les classiques, et tu sais faire plaisir sans prise de tête."
  },
  B: {
    title: "Chef Crêpier",
    desc: "Tu optimises tout : texture, cuisson, garnitures… tu vis crêpe."
  },
  C: {
    title: "Créatif Gourmand",
    desc: "Tu testes, tu mixes, tu surprends — la crêpe est ton terrain de jeu."
  }
};

// Word mini-game (exemple)
const WORD_GAME = {
  target: "CREPE",
  hint: "Indice : ce que tu cuisines pour la Chandeleur"
};

// =========================================================================
// DOM
// =========================================================================

const progressBar = document.getElementById("progressBarFill");
const progressText = document.getElementById("progressText");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");

const btnStart = document.getElementById("btnStart");
const btnStep1Next = document.getElementById("btnStep1Next");

const questionTitle = document.getElementById("questionTitle");
const questionImage = document.getElementById("questionImage");
const optionsGrid = document.getElementById("optionsGrid");

const resultTitle = document.getElementById("resultTitle");
const resultDesc = document.getElementById("resultDesc");
const btnGoRewards = document.getElementById("btnGoRewards");

// Rewards
const centerGiftBtn = document.getElementById("centerGiftBtn");
const node1 = document.getElementById("node1");
const node2 = document.getElementById("node2");
const node3 = document.getElementById("node3");

// Modal
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalPrimary = document.getElementById("modalPrimary");
const modalSecondary = document.getElementById("modalSecondary");

// Word game DOM (optional container inside modal)
const wordGameWrap = document.getElementById("wordGameWrap");
const scrambledContainer = document.getElementById("scrambledContainer");
const wordInput = document.getElementById("wordInput");
const wordHint = document.getElementById("wordHint");
const btnCheckWord = document.getElementById("btnCheckWord");

// =========================================================================
// INIT
// =========================================================================

function init(){
  updateProgress();
  showStep(1);

  if (btnStart) btnStart.addEventListener("click", () => goToStep(2));
  if (btnStep1Next) btnStep1Next.addEventListener("click", () => goToStep(2));

  if (btnGoRewards) btnGoRewards.addEventListener("click", () => goToStep(4));

  if (modalOverlay) modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  if (modalSecondary) modalSecondary.addEventListener("click", closeModal);

  if (centerGiftBtn) centerGiftBtn.addEventListener("click", openWordGame);

  // Nodes (locked example)
  if (node1) node1.addEventListener("click", () => showToast("Récompense 1", "Encore verrouillée."));
  if (node2) node2.addEventListener("click", () => showToast("Récompense 2", "Encore verrouillée."));
  if (node3) node3.addEventListener("click", () => showToast("Récompense 3", "Encore verrouillée."));

  if (btnCheckWord) btnCheckWord.addEventListener("click", checkWord);

  // Load first question when step2 is shown
  renderQuestion(0);
}

document.addEventListener("DOMContentLoaded", init);

// =========================================================================
// NAV / PROGRESS
// =========================================================================

function showStep(n){
  [step1, step2, step3, step4].forEach(el => {
    if (!el) return;
    el.classList.remove("active");
  });

  const target = [null, step1, step2, step3, step4][n];
  if (target) target.classList.add("active");

  currentStep = n;
  updateProgress();
}

function goToStep(n){
  showStep(n);

  if (n === 2){
    currentQuestion = 0;
    answers = [];
    renderQuestion(0);
  }

  if (n === 3){
    computeProfile();
    renderResult();
  }
}

function updateProgress(){
  // 4 steps => 0..100
  const percent = Math.round(((currentStep - 1) / 3) * 100);
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `Étape ${currentStep}/4`;
}

// =========================================================================
// QUIZ
// =========================================================================

function renderQuestion(qIndex){
  const q = QUESTIONS[qIndex];
  if (!q) return;

  if (questionTitle) questionTitle.textContent = q.title;

  if (questionImage){
    questionImage.src = q.image;
    questionImage.alt = q.title;
  }

  if (optionsGrid){
    optionsGrid.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => selectOption(opt.value));
      optionsGrid.appendChild(btn);
    });
  }
}

function selectOption(value){
  answers.push(value);
  currentQuestion++;

  if (currentQuestion >= QUESTIONS.length){
    goToStep(3);
    return;
  }
  renderQuestion(currentQuestion);
}

// =========================================================================
// RESULT
// =========================================================================

function computeProfile(){
  // Exemple simple : majorité des réponses
  const counts = answers.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  let bestKey = "A";
  let bestVal = -1;
  Object.keys(counts).forEach(k => {
    if (counts[k] > bestVal){
      bestVal = counts[k];
      bestKey = k;
    }
  });

  profile = PROFILES[bestKey] || PROFILES.A;
}

function renderResult(){
  if (!profile) return;
  if (resultTitle) resultTitle.textContent = profile.title;
  if (resultDesc) resultDesc.textContent = profile.desc;
}

// =========================================================================
// MODAL / TOAST
// =========================================================================

function showToast(title, message){
  // Reuse modal for consistent UX
  showModal(title, message, {
    primaryText: "OK",
    onPrimary: closeModal,
    secondaryText: null
  });
}

function showModal(title, message, opts={}){
  if (modalTitle) modalTitle.textContent = title || "";
  if (modalMessage) modalMessage.textContent = message || "";

  // Reset wordgame area if present
  if (wordGameWrap) wordGameWrap.style.display = "none";

  const {
    primaryText = "OK",
    onPrimary = closeModal,
    secondaryText = "Fermer",
    onSecondary = closeModal
  } = opts;

  if (modalPrimary){
    modalPrimary.textContent = primaryText;
    modalPrimary.onclick = onPrimary;
    modalPrimary.style.display = primaryText ? "inline-flex" : "none";
  }

  if (modalSecondary){
    if (secondaryText){
      modalSecondary.textContent = secondaryText;
      modalSecondary.onclick = onSecondary;
      modalSecondary.style.display = "inline-flex";
    } else {
      modalSecondary.style.display = "none";
    }
  }

  if (modalOverlay) modalOverlay.classList.add("active");
}

function closeModal(){
  if (modalOverlay) modalOverlay.classList.remove("active");
}

// =========================================================================
// WORD GAME
// =========================================================================

function openWordGame(){
  showModal("Mini-jeu", "Recompose le mot pour débloquer ton cadeau.", {
    primaryText: null,
    secondaryText: "Fermer",
    onSecondary: closeModal
  });

  if (wordGameWrap) wordGameWrap.style.display = "block";

  if (wordHint) wordHint.textContent = WORD_GAME.hint;

  // Build scrambled letters
  const letters = WORD_GAME.target.split("");
  const shuffled = shuffleArray([...letters]);

  if (scrambledContainer){
    scrambledContainer.innerHTML = "";
    shuffled.forEach(letter => {
      const b = document.createElement("button");
      b.className = "word-btn";
      b.textContent = letter;
      b.addEventListener("click", () => {
        if (!wordInput) return;
        wordInput.value = (wordInput.value || "") + letter;
      });
      scrambledContainer.appendChild(b);
    });
  }

  if (wordInput) wordInput.value = "";
}

function checkWord(){
  const val = (wordInput?.value || "").trim().toUpperCase();
  if (val === WORD_GAME.target){
    closeModal();
    showToast("Bravo !", "Cadeau débloqué. Tu peux maintenant cliquer à nouveau sur le centre pour le récupérer.");
    // Ici tu peux déverrouiller node1/node2/node3 si tu veux
  } else {
    showToast("Presque !", "Ce n’est pas le bon mot. Réessaie.");
  }
}

// =========================================================================
// UTIL
// =========================================================================

function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
