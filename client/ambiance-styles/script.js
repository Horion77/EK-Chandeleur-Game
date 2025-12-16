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
        showModal('⚠️', 'Accès refusé', "Complétez les 3 jeux avant d'accéder au formulaire final !");
        return;
    }
    showStep('step-4');
    updateProgress(4);
}

function resetGame() {
    gameState = { level1Done: false, level2Done: false, level3Done: false };
    document.querySelectorAll('.node').forEach(node => node.classList.remove('completed'));
    showStep('step-1');
    updateProgress(1);
}

/* === JEU 1 : MEMORY === */
const memoryImages = [
    { id: 'crepe', url: 'images/IMAGE_1_MEMORY_CREPE_CHOCO_BANANE.png' },
    { id: 'ustensiles', url: 'images/IMAGE_2_MEMORY_USTENSILES.png' },
    { id: 'ingredients', url: 'images/IMAGE_6_INGREDIENTS.png' },
    { id: 'beurre', url: 'images/IMAGE_3_BEURIER.png' },
    { id: 'shakeur', url: 'images/IMAGE_4_SHAKEUR_CREPE.png' },
    { id: 'socle', url: 'images/IMAGE_5_COUVERCLE_SOCLE.png' }
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

    gameCards.forEach(cardData => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.id = cardData.id;

        const img = document.createElement('img');
        img.src = cardData.url;
        img.className = 'memory-card-image';

        const back = document.createElement('div');
        back.className = 'memory-card-back';
        back.textContent = '?';

        card.append(img, back);
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (flippedCards.length === 2 || card.classList.contains('flipped')) return;
    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) setTimeout(checkForMatch, 600);
}

function checkForMatch() {
    const [a, b] = flippedCards;
    if (a.dataset.id === b.dataset.id) {
        a.classList.add('matched');
        b.classList.add('matched');
        matchedPairs++;
        if (matchedPairs === memoryImages.length) {
            gameState.level1Done = true;
            showModal('🎉', 'Bravo', 'Jeu 1 terminé', () => showStep('step-1'));
        }
    } else {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
    }
    flippedCards = [];
}

/* === JEU 2 : MOTS === */
const wordsDatabase = [
    { word: "CHANDELEUR", hint: "La fête célébrée aujourd’hui" },
    { word: "FROMENT", hint: "Autre nom du blé" },
    { word: "SPATULE", hint: "Ustensile pour retourner les crêpes" },
    { word: "CARAMEL", hint: "Sucre chauffé" },
    { word: "SARRASIN", hint: "Farine bretonne" },
    { word: "LEVURE", hint: "Fait gonfler la pâte" }
];

let currentWord = null;
let currentGuess = "";
let wordsCompleted = 0;
let usedWords = [];
const WORDS_TO_WIN = 3;

/* pile des lettres cliquées */
let selectedLetterButtons = [];

function initWordGame() {
    let available = wordsDatabase.filter(w => !usedWords.includes(w.word));
    if (!available.length) {
        usedWords = [];
        available = [...wordsDatabase];
    }

    currentWord = available[Math.floor(Math.random() * available.length)];
    usedWords.push(currentWord.word);

    const container = document.getElementById('scrambled-word');
    const answer = document.getElementById('user-answer');
    const hint = document.getElementById('wordGameHint');

    container.innerHTML = '';
    answer.innerText = '';
    hint.style.display = 'none';

    currentGuess = '';
    selectedLetterButtons = [];

    currentWord.word
        .split('')
        .sort(() => 0.5 - Math.random())
        .forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = letter;
            btn.onclick = () => {
                currentGuess += letter;
                answer.innerText = currentGuess;
                selectedLetterButtons.push(btn);
                btn.style.visibility = 'hidden';
            };
            container.appendChild(btn);
        });

    ensureBackspaceUI();
    startHintTimer();
}

/* === BACKSPACE === */
function ensureBackspaceUI() {
    let btn = document.getElementById('backspaceBtn');
    if (btn) return;

    btn = document.createElement('button');
    btn.id = 'backspaceBtn';
    btn.className = 'btn-secondary';
    btn.textContent = '⌫ Effacer';
    btn.onclick = removeLastLetter;

    document.getElementById('scrambled-word')
        .insertAdjacentElement('afterend', btn);
}

function removeLastLetter() {
    if (!currentGuess || !selectedLetterButtons.length) return;
    currentGuess = currentGuess.slice(0, -1);
    document.getElementById('user-answer').innerText = currentGuess;
    const btn = selectedLetterButtons.pop();
    btn.style.visibility = 'visible';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Backspace' &&
        document.getElementById('step-wordgame')?.classList.contains('active')) {
        e.preventDefault();
        removeLastLetter();
    }
});

function checkWord() {
    if (currentGuess === currentWord.word) {
        wordsCompleted++;
        if (wordsCompleted >= WORDS_TO_WIN) {
            gameState.level2Done = true;
            wordsCompleted = 0;
            usedWords = [];
            showModal('🎉', 'Bravo', 'Jeu 2 terminé', () => showStep('step-1'));
        } else {
            showModal('✓', 'Correct', 'Mot trouvé', initWordGame);
        }
    } else {
        showModal('❌', 'Erreur', 'Réessaie', initWordGame);
    }
}

/* === JEU 3 / QUIZ === */
/* (inchangé – volontairement conservé tel quel dans ton projet) */

/* === MODAL === */
let modalCallback = null;
function showModal(icon, title, message, callback = null) {
    document.getElementById('modalIcon').innerText = icon;
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    modalCallback = callback;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    if (modalCallback) modalCallback();
}
