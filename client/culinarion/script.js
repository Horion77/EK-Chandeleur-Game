const SESSION_ID_KEY = "culinarion_chandeleur_session_id";

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

let produitsCliques = [];

/* === ÉTAT DU JEU === */
let gameState = {
  level1Done: false,
  level2Done: false,
  level3Done: false
};

let hintTimer = null;
let timerInterval = null;

/* === NAVIGATION === */
function showStep(stepId) {
  document.querySelectorAll('.step-container').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  const target = document.getElementById(stepId);
  if (target) {
    target.style.display = 'flex';
    setTimeout(() => target.classList.add('active'), 10);
  }

  if (stepId === 'step-1') updateMenuState();
}

function updateProgress(step) {
  let percentage = 0;
  if (step === 1) percentage = 10;
  if (step === 2) percentage = 30;
  if (step === 'wordgame') percentage = 60;
  if (step === 3) percentage = 85;
  if (step === 4 || step === 5) percentage = 100;
  document.getElementById('progressBar').style.width = percentage + '%';
}

function backToMenu() {
  if (hintTimer) clearTimeout(hintTimer);
  if (timerInterval) clearInterval(timerInterval);

  showStep('step-1');
  updateProgress(1);
}

/* === MISE À JOUR DU MENU === */
function updateMenuState() {
  const node1 = document.querySelector('.node-1');
  const node2 = document.querySelector('.node-2');
  const node3 = document.querySelector('.node-3');
  const centerBtn = document.getElementById('centerGiftBtn');

  if (gameState.level1Done) {
    node1.classList.add('completed');
    node1.querySelector('.node-lock')?.remove();
    node2.classList.remove('locked');
    node2.querySelector('.node-lock')?.remove();
  }

  if (gameState.level2Done) {
    node2.classList.add('completed');
    node3.classList.remove('locked');
    node3.querySelector('.node-lock')?.remove();
  }

  if (gameState.level3Done) {
    node3.classList.add('completed');
    centerBtn.classList.remove('locked');
    centerBtn.disabled = false;
  }
}

/* === LANCEURS DE JEUX === */
function launchLevel(level) {
  if (level === 2 && !gameState.level1Done) {
    showModal('⚠️', 'Jeu verrouillé', "Complétez d'abord le jeu 1 pour débloquer celui-ci !");
    return;
  }
  if (level === 3 && !gameState.level2Done) {
    showModal('⚠️', 'Jeu verrouillé', "Complétez d'abord le jeu 2 pour débloquer celui-ci !");
    return;
  }

  if (level === 1) {
    initMemoryGame();
    showStep('step-2');
    updateProgress(2);
  }
  if (level === 2) {
    initWordGame();
    showStep('step-wordgame');
    updateProgress('wordgame');
  }
  if (level === 3) {
    startQuiz();
    showStep('step-3');
    updateProgress(3);
  }
}

function launchFinalForm() {
  if (!gameState.level3Done) {
    showModal('⚠️', 'Accès refusé', 'Complétez les 3 jeux avant d\'accéder au formulaire final !');
    return;
  }
  showStep('step-4');
  updateProgress(4);
}

function resetGame() {
  gameState = {
    level1Done: false,
    level2Done: false,
    level3Done: false
  };

  produitsCliques = [];

  document.querySelectorAll('.node').forEach(node => {
    node.classList.remove('completed');
  });

  const node2 = document.querySelector('.node-2');
  const node3 = document.querySelector('.node-3');

  if (!node2.querySelector('.node-lock')) {
    node2.classList.add('locked');
    const lock2 = document.createElement('div');
    lock2.className = 'node-lock';
    lock2.textContent = '🔒';
    node2.appendChild(lock2);
  }

  if (!node3.querySelector('.node-lock')) {
    node3.classList.add('locked');
    const lock3 = document.createElement('div');
    lock3.className = 'node-lock';
    lock3.textContent = '🔒';
    node3.appendChild(lock3);
  }

  const centerBtn = document.getElementById('centerGiftBtn');
  centerBtn.classList.add('locked');
  centerBtn.disabled = true;

  showStep('step-1');
  updateProgress(1);
}

/* === JEU 1 : MEMORY AVEC IMAGES === */
const memoryImages = [
  { id: 'crepe', url: 'images/IMAGE_1_MEMORY_CREPE_CHOCO_BANANE.png', alt: 'Crêpe choco-banane' },
  { id: 'ustensiles', url: 'images/IMAGE_2_MEMORY_USTENSILES.png', alt: 'USTENSILES' },
  { id: 'ingredients', url: 'images/IMAGE_6_INGREDIENTS.png', alt: 'ingredients' },
  { id: 'beurre', url: 'images/IMAGE_3_BEURIER.png', alt: 'Beurre' },
  { id: 'shakeur', url: 'images/IMAGE_4_SHAKEUR CREPE.png', alt: 'shakeur' },
  { id: 'socle', url: 'images/IMAGE_5_COUVERCLE_SOCLE.png', alt: 'socle' }
];

let gameCards = [...memoryImages, ...memoryImages];
let flippedCards = [];
let matchedPairs = 0;

function initMemoryGame() {
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;

  grid.innerHTML = '';
  matchedPairs = 0;
  flippedCards = [];

  gameCards.sort(() => 0.5 - Math.random());

  gameCards.forEach((cardData, index) => {
    const card = document.createElement('div');
    card.classList.add('memory-card');
    card.dataset.id = cardData.id;
    card.dataset.index = index;

    const img = document.createElement('img');
    img.src = cardData.url;
    img.alt = cardData.alt;
    img.className = 'memory-card-image';

    const back = document.createElement('div');
    back.className = 'memory-card-back';
    back.textContent = '?';

    card.appendChild(img);
    card.appendChild(back);
    card.addEventListener('click', flipCard);
    grid.appendChild(card);
  });
}

function flipCard() {
  if (flippedCards.length === 2 || this.classList.contains('flipped') || this.classList.contains('matched')) return;

  this.classList.add('flipped');
  flippedCards.push(this);

  if (flippedCards.length === 2) {
    setTimeout(checkForMatch, 600);
  }
}

function checkForMatch() {
  const [card1, card2] = flippedCards;

  if (card1.dataset.id === card2.dataset.id) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    matchedPairs++;
    flippedCards = [];

    if (matchedPairs === memoryImages.length) {
      setTimeout(() => {
        showModal('🎉', 'Bravo !', 'Jeu 1 réussi ! Passez au jeu suivant.', () => {
          gameState.level1Done = true;
          showStep('step-1');
          updateProgress(1);
        });
      }, 500);
    }
  } else {
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      flippedCards = [];
    }, 1000);
  }
}

/* === JEU 2 : MOTS DIFFICILES === */
const wordsDatabase = [
  { word: "CHANDELEUR", hint: "Fête traditionnelle des crêpes (début février)" },
  { word: "FROMENT", hint: "Autre nom pour le blé, céréale de base" },
  { word: "SPATULE", hint: "Ustensile plat pour retourner les crêpes" },
  { word: "CARAMEL", hint: "Sucre chauffé jusqu'à brunir" },
  { word: "SARRASIN", hint: "Farine utilisée pour les galettes bretonnes" },
  { word: "LEVURE", hint: "Agent qui fait gonfler la pâte" },
  { word: "FLAMBEE", hint: "Technique de cuisson spectaculaire avec alcool" },
  { word: "BRETONNE", hint: "Personne originaire de la terre des crêpes et du cidre" },
  { word: "SUZETTE", hint: "Crêpes ___ : dessert flambé célèbre" },
  { word: "CANNELLE", hint: "Épice parfumée pour aromatiser" },
  { word: "CONFITURE", hint: "Garniture sucrée aux fruits" }
];

let currentWord = null;
let currentGuess = "";
let wordsCompleted = 0;
let timeRemaining = 10;
let usedWords = [];
const WORDS_TO_WIN = 3;

function initWordGame() {
    let availableWords = wordsDatabase.filter(w => !usedWords.includes(w.word));

    if (availableWords.length === 0) {
        usedWords = [];
        availableWords = [...wordsDatabase];
    }

    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWords.push(currentWord.word);

    const container = document.getElementById('scrambled-word');
    const answerDisplay = document.getElementById('user-answer');
    const titleEl = document.getElementById('wordGameTitle');
    const hintEl = document.getElementById('wordGameHint');
    const timerEl = document.getElementById('hintTimer');

    titleEl.innerText = `Mot ${wordsCompleted + 1}/${WORDS_TO_WIN} - Trouvez le mot mystère`;

    hintEl.innerText = '';
    hintEl.style.display = 'none';

    timeRemaining = 10;
    timerEl.style.display = 'inline-block';
    timerEl.classList.remove('clickable');
    timerEl.onclick = null;
    timerEl.innerHTML = `Indice dans <span id="timerSeconds">${timeRemaining}</span>s`;

    container.innerHTML = '';
    answerDisplay.innerText = '';
    currentGuess = "";

    const letters = currentWord.word.split('').sort(() => 0.5 - Math.random());

    letters.forEach(char => {
        const btn = document.createElement('button');
        btn.innerText = char;
        btn.className = 'word-btn';

        btn.onclick = function () {
            currentGuess += char;
            answerDisplay.innerText = currentGuess;
            this.style.visibility = "hidden";
        };

        container.appendChild(btn);
    });

    startHintTimer();
}

function startHintTimer() {
    if (hintTimer) clearTimeout(hintTimer);
    if (timerInterval) clearInterval(timerInterval);

    const hintEl = document.getElementById('wordGameHint');
    const timerEl = document.getElementById('hintTimer');

    timerInterval = setInterval(() => {
        timeRemaining--;

        const timerSecondsEl = document.getElementById('timerSeconds');
        if (timerSecondsEl) timerSecondsEl.innerText = timeRemaining;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);

            timerEl.innerHTML = '💡 Cliquez pour un indice';
            timerEl.classList.add('clickable');
            timerEl.onclick = function () {
                timerEl.style.display = 'none';
                hintEl.style.display = 'block';
                hintEl.innerText = `💡 Indice : ${currentWord.hint}`;
            };
        }
    }, 1000);
}

function resetWord() {
  currentGuess = "";
  document.getElementById('user-answer').innerText = '';
  document.querySelectorAll('.word-btn').forEach(btn => {
    btn.style.visibility = 'visible';
  });
}

function checkWord() {
  if (currentGuess === currentWord.word) {
    wordsCompleted++;

    if (hintTimer) clearTimeout(hintTimer);
    if (timerInterval) clearInterval(timerInterval);

    if (wordsCompleted >= WORDS_TO_WIN) {
      showModal('🎉', 'Félicitations !', `Vous avez trouvé les ${WORDS_TO_WIN} mots !`, () => {
        gameState.level2Done = true;
        wordsCompleted = 0;
        usedWords = [];
        showStep('step-1');
        updateProgress(1);
      });
    } else {
      showModal('✓', 'Correct !', `Bien joué ! Plus que ${WORDS_TO_WIN - wordsCompleted} mot(s) à trouver.`, () => {
        initWordGame();
      });
    }
  } else {
    showModal('❌', 'Oups !', 'Ce n\'est pas le bon mot. Réessayez !', () => {
      resetWord();
    });
  }
}

/* === JEU 3 : QUIZ AVEC IMAGES === */
const questionsData = [
    {
  id: 1,
  type: "profile",
  question: "Lorsque vous préparez votre pâte à crêpes, vous vous inspirez plutôt…",
  image: "images/Image inspi.png",
  reponses: [
    { 
      texte: "Des recettes de chefs et tutoriels YouTube détaillés", 
      points: { precision: 1, sarrasin: 0, creative: 2 } 
    },
    { 
      texte: "Du carnet de recettes familial ou des souvenirs d'enfance", 
      points: { precision: 0, sarrasin: 2, creative: 0 } 
    },
    { 
      texte: "De Pinterest, Instagram et des nouvelles tendances culinaires", 
      points: { precision: 0, sarrasin: 0, creative: 2 } 
    }
  ]
},
  {
  id: 2,
  type: "profile",
  question: "Votre plus grand plaisir lorsque vous cuisinez des crêpes est…",
  image: "images/IMAGE_SEPARE-EN_3.png",

  reponses: [
    { 
      texte: "D’atteindre une régularité parfaite, crêpe après crêpe", 
      points: { precision: 2, sarrasin: 0, creative: 0 } 
    },
    { 
      texte: "De perpétuer un goût et un geste intemporels", 
      points: { precision: 0, sarrasin: 2, creative: 0 } 
    },
    { 
      texte: "De surprendre avec une création inattendue", 
      points: { precision: 0, sarrasin: 0, creative: 2 } 
    }
  ]
},
  {
    id: 3,
    type: "trivia",
    question: "Selon la superstition, que faut-il tenir dans sa main gauche pour la première crêpe ?",
    image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=600&h=400&fit=crop",
    reponses: [
      { texte: "Une pièce de monnaie", isCorrect: true, feedback: "✓ Exact ! Une pièce d'or, idéalement !", points: { precision: 0, sarrasin: 0, creative: 0 } },
      { texte: "Un fer à cheval", isCorrect: false, feedback: "✗ Raté ! C'était une pièce de monnaie.", points: { precision: 0, sarrasin: 0, creative: 0 } },
      { texte: "La main de son voisin", isCorrect: false, feedback: "✗ Mignon, mais non ! C'est une pièce de monnaie.", points: { precision: 0, sarrasin: 0, creative: 0 } }
    ]
  },
  {
    id: 4,
    type: "profile",
    question: "Le petit truc en plus que vous glissez dans votre pâte ?",
    image: "images/aa.png",
    reponses: [
      { texte: "Un peu de bière ou de cidre.", points: { precision: 0, sarrasin: 2, creative: 0 } },
      { texte: "De la vanille ou fève tonka.", points: { precision: 0, sarrasin: 0, creative: 2 } },
      { texte: "Le bouchon de Rhum ou Fleur d'oranger.", points: { precision: 2, sarrasin: 0, creative: 0 } }
    ]
  },
  {
    id: 5,
    type: "trivia",
    question: "Pourquoi mange-t-on des crêpes à la Chandeleur ?",
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&h=400&fit=crop",
    reponses: [
      { texte: "Elles symbolisent le soleil", isCorrect: true, feedback: "✓ Bravo ! Leur forme ronde et dorée rappelle le soleil.", points: { precision: 0, sarrasin: 0, creative: 0 } },
      { texte: "C'est une tradition royale", isCorrect: false, feedback: "✗ Non, c'est une fête liée aux saisons !", points: { precision: 0, sarrasin: 0, creative: 0 } },
      { texte: "Pour bannir les mauvais esprits", isCorrect: false, feedback: "✗ Pas tout à fait, c'est pour fêter la fin de l'hiver.", points: { precision: 0, sarrasin: 0, creative: 0 } }
    ]
  },
  {
    id: 6,
    type: "profile",
    question: "Votre crêpe parfaite, elle est...",
    image: "images/crepe parfaite.png",
    reponses: [
      { texte: "Épaisse et moelleuse comme un pancake", points: { precision: 0, sarrasin: 0, creative: 2 } },
      { texte: "Fine et légère, dentelle de luxe", points: { precision: 2, sarrasin: 0, creative: 0 } },
      { texte: "Ni trop, ni trop peu, l'équilibre parfait", points: { precision: 0, sarrasin: 2, creative: 0 } }
    ]
  }
];

let currentQuestionIndex = 0;
let scoreUtilisateur = { precision: 0, sarrasin: 0, creative: 0 };

function startQuiz() {
  currentQuestionIndex = 0;
  scoreUtilisateur = { precision: 0, sarrasin: 0, creative: 0 };
  showQuestion();
}

function showQuestion() {
  const questionData = questionsData[currentQuestionIndex];

  const imgEl = document.getElementById('questionImage');
  imgEl.src = questionData.image;
  imgEl.style.display = 'block';

  document.getElementById('questionIndicateur').innerText = `Question ${currentQuestionIndex + 1}/${questionsData.length}`;
  document.getElementById('questionText').innerText = questionData.question;

  const optionDiv = document.getElementById('optionsContainer');
  optionDiv.innerHTML = '';

  questionData.reponses.forEach((reponse) => {
    const btn = document.createElement('button');
    btn.classList.add('btn-option');
    btn.innerText = reponse.texte;
    btn.onclick = () => handleQuizResponse(reponse, btn);
    optionDiv.appendChild(btn);
  });
}

function handleQuizResponse(reponseChoisie, boutonClique) {
  const questionData = questionsData[currentQuestionIndex];

  document.querySelectorAll('.btn-option').forEach(btn => btn.style.pointerEvents = 'none');

  if (questionData.type === "trivia") {
    if (reponseChoisie.isCorrect) {
      boutonClique.style.backgroundColor = '#E7F4EA';
      boutonClique.style.borderColor = '#2E8540';
    } else {
      boutonClique.style.backgroundColor = '#FCE8E6';
      boutonClique.style.borderColor = '#ff0000';
    }

    setTimeout(() => {
      showModal(
        reponseChoisie.isCorrect ? '✓' : '✗',
        reponseChoisie.isCorrect ? 'Bonne réponse !' : 'Dommage...',
        reponseChoisie.feedback,
        () => passerQuestionsSuivante()
      );
    }, 500);
  } else {
    scoreUtilisateur.precision += reponseChoisie.points.precision;
    scoreUtilisateur.sarrasin += reponseChoisie.points.sarrasin;
    scoreUtilisateur.creative += reponseChoisie.points.creative;

    boutonClique.style.backgroundColor = '#E7F4EA';
    boutonClique.style.borderColor = '#2E8540';

    setTimeout(() => {
      passerQuestionsSuivante();
    }, 400);
  }
}

function passerQuestionsSuivante() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questionsData.length) {
    showQuestion();
  } else {
    showModal('🎉', 'Quiz terminé !', 'Tous les jeux sont complétés ! Accédez maintenant au formulaire final.', () => {
      gameState.level3Done = true;
      showStep('step-1');
      updateProgress(1);
    });
  }
}

/* === PRODUITS PAR PROFIL === */
const produitsParProfil = {
  precision: [
    { 
      nom: "Balance électronique", 
      url: "https://www.culinarion.com/articles/cristel-balance-electronique-rechargeable-10kg.13486", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCRIST/TCBER10N/TCBET10N.jpg"
    },
    { 
      nom: "Fouet inox 30 cm", 
      url: "https://www.culinarion.com/articles/chefs-co-fouet-inox-30-cm.2623", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCHEFC/188317/FCHEFC-188317.jpg"
    },
    { 
      nom: "Tamis à farine 16 cm", 
      url: "https://www.culinarion.com/articles/de-buyer-tamis-a-farine-16-cm.3371", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FDEBUY/4604.16/FDEBUY-4604.16.jpg"
    },
    { 
      nom: "Bol à mixer antidérapant", 
      url: "https://www.culinarion.com/articles/chefs-co-bol-a-mixer-antiderapant-24cm.12883", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCHEFC/188381/188381.jpg"
    },
    { 
      nom: "Crêpière 28 cm", 
      url: "https://www.culinarion.com/articles/chefs-co-poele-a-crepes-28-cm.10291", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCHEFC/193802/Crepe%20Pfanne%20NEU.jpg"
    }
  ],
  sarrasin: [
    { 
      nom: "Crêpière en fonte 30cm", 
      url: "https://www.culinarion.com/articles/staub-crepiere-en-fonte-30cm.8504", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FZWILL/1004086/FZWILL-1004086.jpg"
    },
    { 
      nom: "Spatule à crêpes longue", 
      url: "https://www.culinarion.com/articles/oxo-spatule-a-crepes-et-omelettes.10803", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FOXO/OX11282700/spatule-a-crepes-et-omelettes%20(1).jpg"
    },
    { 
      nom: "Spray huile et vinaigre", 
      url: "https://www.culinarion.com/articles/cole-mason-spray-huile-et-vinaigre.3596", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCOLEM/CH103699/FCOLEM-CH103699.jpg"
    },
    { 
      nom: "Râteau plat à crêpes", 
      url: "https://www.culinarion.com/articles/ltellier-rateau-a-crepes-raclette.3988", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FTELLI/NRC02-1/rateau-crepes-raclette.jpg"
    }
  ],
  creative: [
    { 
      nom: "Crêpière en fonte 30cm", 
      url: "https://www.culinarion.com/articles/staub-crepiere-en-fonte-30cm.8504", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FZWILL/1004086/FZWILL-1004086.jpg"
    },
    { 
      nom: "Siphon aluminium 0.5L", 
      url: "https://www.culinarion.com/articles/gobel-siphon-aluminium-05-l.13041", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FGOBEL/YC80105/YC80105_packshot%20(gravure%20Gobel).jpg"
    },
    { 
      nom: "Zesteur vert sauge", 
      url: "https://www.culinarion.com/articles/microplane-zesteur-vert-sauge.9754", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FMICRO/46723E/FMICRO-46723%208.jpg"
    },
    { 
      nom: "Râteau à crêpes", 
      url: "https://www.culinarion.com/articles/ltellier-rateau-a-crepes-raclette.3988", 
      image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FTELLI/NRC02-1/rateau-crepes-raclette.jpg"
    }
  ]
};


/* === PROFIL & RENDU RÉSULTATS === */
function computeFinalProfile() {
  let maxScore = -Infinity;
  let finalProfile = "creative";

  for (const [profil, score] of Object.entries(scoreUtilisateur)) {
    if (score > maxScore) {
      maxScore = score;
      finalProfile = profil;
    }
  }
  return finalProfile;
}

function renderResults(finalProfile) {
  let titreProfil = "";
  let descProfil = "";

  if (finalProfile === "precision") {
    titreProfil = "🎯 Maître·sse de la pâte parfaite";
    descProfil = "Scientifique et méthodique, vous maîtrisez chaque détail technique de la préparation des crêpes.";
  }
  else if (finalProfile === "sarrasin") {
    titreProfil = "🥞 🌾 Spécialiste de la Tradition Bretonne";
    descProfil = "Passionné(e) de recettes authentiques, vous êtes gardien(ne) du savoir-faire ancestral des crêpes.";
  }
  else {
    titreProfil = "✨ L'Architecte de crêpes haute couture";
    descProfil = "Chef créatif dans l'âme, vous transformez chaque crêpe en œuvre d'art culinaire.";
  }

  document.getElementById('resultTitle').innerText = titreProfil;
  document.getElementById('resultDescription').innerText = descProfil;

  const produitsContainer = document.getElementById('produitsContainer');
  produitsContainer.innerHTML = '<h3 style="margin-bottom: 18px; font-size: 1.15rem; color: var(--primary); font-family: Lora, serif;">🛍️ Vos produits recommandés</h3>';

  const produits = produitsParProfil[finalProfile] || [];

  produits.forEach(produit => {
    const produitDiv = document.createElement('a');
    produitDiv.className = 'produit-item';
    produitDiv.href = produit.url;
    produitDiv.innerHTML = `
      <img src="${produit.image}" alt="${produit.nom}" class="produit-image">
      <div class="produit-info">
        <strong>${produit.nom}</strong>
        <span class="produit-cta">Voir le produit →</span>
      </div>
    `;

    produitDiv.addEventListener('click', (e) => {
  e.preventDefault(); // Empêche la navigation immédiate
  
  // 1. Ajout local dans l'array (backup pour formulaire)
  produitsCliques.push({
    nom: produit.nom,
    url: produit.url,
    ts: new Date().toISOString()
  });
  
  // 2. Tracking temps réel en base de données
  const trackingData = JSON.stringify({
    session_id: getOrCreateSessionId(),
    product_name: produit.nom,
    product_url: produit.url,
    profil: finalProfile,
    enseigne: window.APP_CONFIG?.ENSEIGNE || 'culinarion'
  });
  
  const apiUrl = `${window.APP_CONFIG.API_BASE_URL}/api/product-clicks`;
  
  // sendBeacon garantit l'envoi même si la page se ferme immédiatement
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      apiUrl, 
      new Blob([trackingData], { type: 'application/json' })
    );
  } else {
    // Fallback pour navigateurs anciens (< 2015)
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: trackingData,
      keepalive: true // Garantit que la requête continue même si page se ferme
    }).catch(err => console.warn('Tracking produit échoué:', err));
  }
  
  // 3. Navigation vers le produit dans le même onglet
  window.location.href = produit.url;
});


    produitsContainer.appendChild(produitDiv);
  });
}

/* === FORMULAIRE === */
async function submitForm(e) {
  e.preventDefault();

  if (!window.API || typeof window.API.createParticipant !== 'function') {
    showModal('⚠️', 'API non chargée', "Le fichier /shared/js/api.js n'est pas chargé.");
    return;
  }

  const prenom = document.getElementById('prenom').value?.trim();
  const nom = document.getElementById('nom').value?.trim();
  const email = document.getElementById('email').value?.trim();

  const magasin = document.getElementById('magasin')?.value?.trim();
  if (!magasin) {
    showModal('⚠️', 'Magasin manquant', 'Merci de sélectionner votre magasin.');
    return;
  }

  const optInEl = document.getElementById('opt_in');
  const opt_in = optInEl ? !!optInEl.checked : false;

  const finalProfile = computeFinalProfile();
  renderResults(finalProfile);

  const enseigne = "culinarion";

  const payload = {
    nom,
    prenom,
    email,
    enseigne,
    magasin,
    profil: finalProfile,
    session_id: getOrCreateSessionId(),
    opt_in,
    produits_cliques: produitsCliques,
    level1_done: gameState.level1Done,
    level2_done: gameState.level2Done,
    level3_done: gameState.level3Done
  };

  try {
    await window.API.createParticipant(payload);
    showStep('step-5');
    updateProgress(5);
  } catch (err) {
    console.error(err);
    showModal('⚠️', 'Envoi impossible', 'Une erreur est survenue lors de l\'enregistrement.');
  }
}

/* === SYSTÈME DE MODAL CUSTOM === */
let modalCallback = null;

function showModal(icon, title, message, callback = null) {
  const modal = document.getElementById('customModal');
  const modalIcon = document.getElementById('modalEmoji');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');

  modalIcon.innerText = icon;
  modalTitle.innerText = title;
  modalMessage.innerText = message;
  modalCallback = callback;

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('customModal');
  modal.classList.remove('active');

  if (modalCallback) {
    setTimeout(modalCallback, 200);
    modalCallback = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  const modalBtn = document.getElementById('modalBtn');
  if (modalBtn) {
    modalBtn.addEventListener('click', closeModal);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const goto = params.get("goto");
  if (!goto) return;

  const allowed = new Set(["menu","level1","level2","level3","form","all_done_form"]);
  if (!allowed.has(goto)) return;

  const openMenu = () => { showStep("step-1"); updateProgress(1); };
  const openLevel1 = () => { launchLevel(1); };
  const openLevel2 = () => { gameState.level1Done = true; updateMenuState(); launchLevel(2); };
  const openLevel3 = () => { gameState.level1Done = true; gameState.level2Done = true; updateMenuState(); launchLevel(3); };
  const openForm = () => { showStep("step-4"); updateProgress(4); };

  switch (goto) {
    case "menu": openMenu(); break;
    case "level1": openLevel1(); break;
    case "level2": openLevel2(); break;
    case "level3": openLevel3(); break;
    case "form": openForm(); break;
    case "all_done_form":
      gameState.level1Done = true;
      gameState.level2Done = true;
      gameState.level3Done = true;
      updateMenuState();
      openForm();
      break;
    default:
      openMenu();
  }
});
