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
    gameState = { level1Done: false, level2Done: false, level3Done: false };
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
    if (flippedCards.length === 2 || this.classList.contains('flipped') || this.classList.contains('matched'))
        return;

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
    { word: "MIELLAT", hint: "Mélange de miel fondu" },
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
    timerEl.innerHTML = `Indice dans ${timeRemaining}s`;

    container.innerHTML = '';
    answerDisplay.innerText = '';
    currentGuess = "";

    const letters = currentWord.word.split('').sort(() => 0.5 - Math.random());
    letters.forEach(char => {
        const btn = document.createElement('button');
        btn.innerText = char;
        btn.className = 'word-btn';
        btn.onclick = function() {
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
            timerEl.onclick = function() {
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
        question: "Ce soir c'est Chandeleur ! Autour de la table, il y a...",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop",
        reponses: [
            { texte: "Toute la tribu, les voisins... plus on est de fous, plus on rit !", points: { precision: 0, sarrasin: 0, creative: 2 } },
            { texte: "Juste ma moitié ou mon meilleur ami, pour une soirée détendue.", points: { precision: 2, sarrasin: 0, creative: 0 } },
            { texte: "La famille proche, comme quand j'étais petit(e).", points: { precision: 0, sarrasin: 2, creative: 0 } }
        ]
    },
    {
        id: 2,
        type: "profile",
        question: "Niveau garniture, votre crêpe idéale ressemble à quoi ?",
        image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=400&fit=crop",
        reponses: [
            { texte: "Une montagne ! Chantilly, chocolat... je ne vois plus la crêpe.", points: { precision: 0, sarrasin: 0, creative: 2 } },
            { texte: "Créative et Chic : J'adore les associations salées-sucrées.", points: { precision: 0, sarrasin: 0, creative: 2 } },
            { texte: "La Classique : Beurre-sucre et un filet de citron.", points: { precision: 0, sarrasin: 2, creative: 0 } }
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
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
        reponses: [
            { texte: "Un peu de bière ou de cidre.", points: { precision: 0, sarrasin: 2, creative: 0 } },
            { texte: "De la vanille ou fève tonka.", points: { precision: 0, sarrasin: 0, creative: 2 } },
            { texte: "Le bouchon de Rhum ou Fleur d'oranger.", points: { precision: 0, sarrasin: 2, creative: 0 } }
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
        image: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600&h=400&fit=crop",
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
            boutonClique.style.borderColor = '#C62828';
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
        { nom: "Poêle à crêpes", url: "https://ambianceetstyles.com/articles/mastrad-crepiere-antiadhesive-28-cm.15963", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FMASTR/F63388/FMASTR-F63388.jpg" },
        { nom: "Plat de présentation", url: "https://ambianceetstyles.com/articles/pasabhace-plat-a-tarte-cloche-d-32-cm.23449", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FBASTI/362649/362649.jpg" },
        { nom: "Spatules colorées", url: "https://ambianceetstyles.com/articles/mastrad-spatule-en-silicone-flipper-gris-33cm.21545", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FMASTR/F10014/3485990100140_2.jpg" },
        { nom: "Verres colorés", url: "https://ambianceetstyles.com/articles/leonardo-lot-de-6-verres-bas-peps-multicolore.19343", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FGLASK/025922/OPTIC_WH_Becher_215ml_025915-21_mood.jpg" },
        { nom: "Verres enfant", url: "https://ambianceetstyles.com/articles/leonardo-verre-bambini-licorne-215-cl.8510", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FGLASK/017902/FGLASK-017902.jpg" },
        { nom: "Beurrier", url: "https://ambianceetstyles.com/articles/guzzini-beurrier-feeling-transparent.4774", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FFRATE/22420000/FFRATE-22420000.jpg" }
    ],
    sarrasin: [
        { nom: "Poêle à crêpes", url: "https://ambianceetstyles.com/articles/chefs-co-poele-a-crepes-28-cm.21088", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop" },
        { nom: "Vaisselle", url: "https://ambianceetstyles.com/articles/medard-de-noblat-assiette-dessert-shadow-nacre-205cm.5950", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCOUZO/AI06CCB0001AD/FCOUZO-AI06CCB0001AD.jpg" },
        { nom: "Mini ramequins", url: "https://ambianceetstyles.com/articles/medard-de-noblat-coupelle-shadow-nacre-15cm.10729", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCOUZO/AI06CCB0001CG/FCOUZO-AI06CCB0001CG.jpg" },
        { nom: "Shaker", url: "https://www.culinarion.com/articles/cookut-shaker-a-crepes-et-a-pancakes.2742", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCOOKU/MIAM/FCOOKU-MIAM@5.jpg" },
        { nom: "Tartineur", url: "https://ambianceetstyles.com/articles/guzzini-tartineur-feeling-rouge.4751", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FFRATE/23000665/FFRATE-23000665.jpg" },
        { nom: "Moule 7 mini blinis", url: "https://ambianceetstyles.com/articles/patisse-moule-a-7-mini-blinis-pancakes.6850", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FPATIS/19233/FPATIS-19233.jpg" }
    ],
    creative: [
        { nom: "Poêle à crêpes", url: "https://ambianceetstyles.com/articles/mastrad-crepiere-ceramique.25920", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop" },
        { nom: "Louche", url: "https://ambianceetstyles.com/articles/chefs-co-louche-inox-30-cm.3602", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCHEFC/188320/FCHEFC-188320.jpg" },
        { nom: "Bol à mixer", url: "https://ambianceetstyles.com/articles/chefs-co-bol-inox-antideparant-20cm.23660", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCHEFC/188380/188380.jpg" },
        { nom: "Râteau à crêpes", url: "https://ambianceetstyles.com/articles/ltellier-rateau-a-crepes-raclette.17135", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FTELLI/NRC02-1/rateau-crepes-raclette.jpg" },
        { nom: "Plat à gâteau", url: "https://ambianceetstyles.com/articles/pasabhace-plat-a-gateau-cloche-h-28-cm.23447", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FBASTI/362645/Presentoir-a-gateau-sur-pied-32-cm-et-sa-cloche-en-verre-Pasabahce-Transparent-Verre.jpg" },
        { nom: "Cuillère à miel", url: "https://ambianceetstyles.com/articles/cilio-cuillere-a-miel-toscana-16-cm.25265", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FCILIO/182095/182095.jpg" },
        { nom: "Spatule", url: "https://ambianceetstyles.com/articles/ltellier-spatule-a-crepes-en-hetre.18232", image: "https://d28dhv3a4w5vgt.cloudfront.net/fit-in/1400x1400/filters:fill(ffffff)/produits/FTELLI/NRC03-1/spatulr-crepe.jpg" }
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
        titreProfil = "🎯 Le/La maître de la pâte parfaite";
        descProfil = "Scientifique et méthodique, vous maîtrisez chaque détail technique de la préparation des crêpes. Dosage précis, température contrôlée, repos de la pâte... rien n'est laissé au hasard.";
    } else if (finalProfile === "sarrasin") {
        titreProfil = "🥞 L'expert(e) du sarrasin";
        descProfil = "Passionné(e) par la tradition bretonne, vous êtes un(e) puriste de la galette au sarrasin. Le bilig, le rozell et la cuisson parfaite n'ont plus de secrets pour vous.";
    } else {
        titreProfil = "✨ L'inventeur(se) de crêpes haute couture";
        descProfil = "Chef créatif dans l'âme, vous transformez chaque crêpe en œuvre d'art culinaire. Associations audacieuses, dressage soigné, garnitures gastronomiques... votre cuisine est une signature.";
    }

    document.getElementById('resultTitle').innerText = titreProfil;
    document.getElementById('resultDescription').innerText = descProfil;

    const produitsContainer = document.getElementById('produitsContainer');
    produitsContainer.innerHTML = '';

    const listeProduits = produitsParProfil[finalProfile] || [];
    listeProduits.forEach((prod, idx) => {
        const item = document.createElement('a');
        item.className = 'produit-item';
        item.href = prod.url;
        item.target = '_blank';
        item.dataset.index = idx;

        item.innerHTML = `
            <img src="${prod.image}" alt="${prod.nom}" class="produit-image">
            <div class="produit-info">
                <strong>${prod.nom}</strong>
                <span class="produit-cta">Voir le produit →</span>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (!produitsCliques.includes(idx)) {
                produitsCliques.push(idx);
            }
        });

        produitsContainer.appendChild(item);
    });
}

/* === SOUMISSION FORMULAIRE === */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('finalForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const finalProfile = computeFinalProfile();

            const formData = {
                nom: document.getElementById('nom').value.trim(),
                prenom: document.getElementById('prenom').value.trim(),
                email: document.getElementById('email').value.trim(),
                enseigne: document.getElementById('enseigne').value,
                magasin: document.getElementById('magasin').value.trim(),
                profil: finalProfile,
                session_id: getOrCreateSessionId(),
                score_total: Object.values(scoreUtilisateur).reduce((a, b) => a + b, 0),
                details_answers: JSON.stringify(scoreUtilisateur),
                opt_in: document.getElementById('optin').checked,
                ip_address: null,
                user_agent: navigator.userAgent
            };

            try {
                const API_URL = window.APP_CONFIG?.API_BASE_URL || 'https://ek-chandeleur-game-production.up.railway.app';
                const response = await fetch(`${API_URL}/api/participants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    renderResults(finalProfile);
                    showStep('step-5');
                    updateProgress(5);
                } else {
                    const errorData = await response.json();
                    showModal('❌', 'Erreur', errorData.error || 'Impossible d\'enregistrer vos informations.');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showModal('❌', 'Erreur', 'Problème de connexion au serveur.');
            }
        });
    }
});

/* === MODAL === */
function showModal(emoji, title, message, callback) {
    const overlay = document.getElementById('customModal');
    const emojiEl = document.getElementById('modalEmoji');
    const titleEl = document.getElementById('modalTitle');
    const messageEl = document.getElementById('modalMessage');
    const btnEl = document.getElementById('modalBtn');

    emojiEl.innerText = emoji;
    titleEl.innerText = title;
    messageEl.innerText = message;

    overlay.classList.add('active');

    btnEl.onclick = () => {
        overlay.classList.remove('active');
        if (callback) callback();
    };
}
