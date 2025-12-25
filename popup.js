document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const keyboardContainer = document.getElementById('keyboard-container');
    const messageContainer = document.getElementById('message-container');

    const MAX_GUESSES = 6;
    let WORD_LENGTH = 5;
    let christmasMode = false;

    // Filter out plurals (specifically words ending with 'S')
    // We allow words ending in 'SS' (e.g. GLASS) and a whitelist of singular words ending in 'S'
    const ALLOWED_S_WORDS = [
        "AEGIS", "ALIAS", "ATLAS", "BASIS", "BOGUS", "BONUS", "CHAOS", "CORPS",
        "ETHOS", "FOCUS", "HUMUS", "KUDOS", "LOCUS", "LOTUS", "LUPUS", "MINUS",
        "MUCUS", "NEXUS", "OASIS", "PENIS", "REBUS", "SINUS", "TORUS", "VIRUS",
        "ADIOS"
    ];

    let GAME_WORDS = WORDS.filter(word => !word.endsWith('S') || word.endsWith('SS') || ALLOWED_S_WORDS.includes(word));
    let GAME_WORDS_7 = typeof WORDS7 !== 'undefined' ? WORDS7 : [];

    function getCurrentWordList() {
        return christmasMode ? GAME_WORDS_7 : GAME_WORDS;
    }

    let targetWord;
    let guesses = [];
    let currentGuess = [];
    let isGameOver = false;

    // Initialize Game call moved to end of file

    // Accent Map
    const ACCENT_MAP = {
        'E': ['É', 'È', 'Ê', 'Ë'],
        'O': ['Ó', 'Ò', 'Ô', 'Ö'],
        'A': ['Á', 'À', 'Â', 'Ä', 'Æ'],
        'I': ['Í', 'Ì', 'Î', 'Ï'],
        'U': ['Ú', 'Ù', 'Û', 'Ü'],
        'N': ['Ñ'],
        'C': ['Ç']
    };

    let longPressTimer;
    let longPressTriggered = false;
    let activePopup = null;

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', (e) => {
        resetGame();
        e.target.blur(); // Remove focus so Enter doesn't trigger it again
    });

    const analyticsBtn = document.getElementById('analytics-btn');
    const dailyBtn = document.getElementById('daily-btn');
    const analyticsOverlay = document.getElementById('analytics-overlay');
    const closeAnalyticsBtn = document.getElementById('close-analytics-btn');

    analyticsBtn.addEventListener('click', () => {
        analyticsOverlay.classList.remove('hidden');
        loadAndRenderStats();
    });

    dailyBtn.addEventListener('click', () => {
        fetchWordOfTheDay();
        dailyBtn.blur();
    });

    closeAnalyticsBtn.addEventListener('click', () => {
        analyticsOverlay.classList.add('hidden');
    });

    const christmasBtn = document.getElementById('christmas-btn');
    christmasBtn.addEventListener('click', () => {
        toggleChristmasMode();
        christmasBtn.blur();
    });

    function toggleChristmasMode() {
        christmasMode = !christmasMode;
        WORD_LENGTH = christmasMode ? 7 : 5;
        document.body.classList.toggle('christmas-mode', christmasMode);
        christmasBtn.classList.toggle('active', christmasMode);
        rebuildBoard();
        resetGame();
        showMessage(christmasMode ? '🎄 Christmas Mode: 7 letters!' : 'Classic Mode: 5 letters');
    }

    function rebuildBoard() {
        board.innerHTML = '';
        for (let i = 0; i < MAX_GUESSES; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                row.appendChild(tile);
            }
            board.appendChild(row);
        }
    }

    async function fetchWordOfTheDay() {
        try {
            showMessage('Fetching Word of the Day...');
            const response = await fetch('https://www.tomsguide.com/news/what-is-todays-wordle-answer');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const cleanText = doc.body.textContent || "";
            const word = Logic.extractWordFromHTML(cleanText);

            if (word) {
                if (word.length !== 5) {
                    showMessage(`Error: Parsed word '${word}' is not 5 letters.`);
                    return;
                }
                startDailyGame(word);
            } else {
                console.error('Parsing failed.');
                const drumrollMatch = cleanText.match(/Drumroll/i);
                if (drumrollMatch) {
                    const start = Math.max(0, drumrollMatch.index - 50);
                    const end = Math.min(cleanText.length, drumrollMatch.index + 100);
                    console.error("Context around 'Drumroll':", cleanText.substring(start, end));
                } else {
                    console.error("'Drumroll' not found in clean text.");
                }
                showMessage("Error: Could not find today's word on Tom's Guide. The site format may have changed.");
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessage(`Network error: ${error.message}`);
        }
    }

    function startDailyGame(word) {
        targetWord = word;
        guesses = [];
        currentGuess = [];
        isGameOver = false;
        clearBoard();
        resetKeyboard();
        saveState();
        showMessage('Playing Word of the Day!');
        console.log('Word of the Day:', targetWord);
    }

    // Close popup on click outside
    document.addEventListener('click', (e) => {
        if (activePopup && !e.target.closest('.key')) {
            hideAccentPopup();
        }
    });

    function loadAndRenderStats() {
        chrome.storage.local.get(['stats'], (result) => {
            const stats = result.stats || {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
                history: []
            };

            renderSummary(stats);
            renderDistribution(stats);
            renderHistory(stats);
        });
    }

    function renderSummary(stats) {
        document.getElementById('games-played').textContent = stats.gamesPlayed;
        const winPct = stats.gamesPlayed > 0
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
            : 0;
        document.getElementById('win-percentage').textContent = winPct;
        document.getElementById('current-streak').textContent = stats.currentStreak;
        document.getElementById('max-streak').textContent = stats.maxStreak;
    }

    function renderDistribution(stats) {
        const container = document.getElementById('guess-distribution');
        container.innerHTML = ''; // Clear previous
        const maxVal = Math.max(...Object.values(stats.guessDistribution), 1);

        for (let i = 1; i <= 6; i++) {
            const count = stats.guessDistribution[i];
            const width = Math.max(7, Math.round((count / maxVal) * 100));

            const row = document.createElement('div');
            row.className = 'dist-row';
            row.innerHTML = `
                <div class="dist-label">${i}</div>
                <div class="dist-bar-container">
                    <div class="dist-bar ${count > 0 ? 'highlight' : ''}" style="width: ${width}%">${count}</div>
                </div>
            `;
            container.appendChild(row);
        }
    }

    function renderHistory(stats) {
        const tbody = document.getElementById('history-body');
        tbody.innerHTML = ''; // Clear previous
        const recentHistory = stats.history.slice().reverse().slice(0, 50);

        recentHistory.forEach(game => {
            const tr = document.createElement('tr');
            const date = new Date(game.timestamp).toLocaleDateString();
            tr.innerHTML = `
                <td>${date}</td>
                <td style="font-family: monospace; text-transform: uppercase;">${game.word}</td>
                <td class="result-${game.result}">${game.result.toUpperCase()}</td>
                <td>${game.attempts}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function initGame() {
        const savedState = loadState();
        if (savedState && savedState.targetWord) {
            // Check if saved word is still valid
            if (!getCurrentWordList().includes(savedState.targetWord)) {
                console.log('Saved target word is no longer valid, starting new game');
                startNewGame();
                return;
            }

            targetWord = savedState.targetWord;
            guesses = savedState.guesses || [];
            isGameOver = savedState.isGameOver || false;
            console.log('Restored State:', savedState);

            // Restore board
            guesses.forEach((guess, index) => {
                const row = board.children[index];
                const tiles = row.children;
                for (let i = 0; i < WORD_LENGTH; i++) {
                    tiles[i].textContent = guess[i];
                }
                // Re-calculate state for visual consistency
                restoreRowState(guess, index);
            });

            if (isGameOver) {
                if (guesses[guesses.length - 1] === targetWord) {
                    showMessage('Splendid!');
                } else if (guesses.length === MAX_GUESSES) {
                    showMessage(targetWord);
                }
            }
        } else {
            console.log('No saved state or invalid state, starting new game');
            startNewGame();
        }
        if (!targetWord) {
            console.error('Target word is missing after init!');
            startNewGame();
        }
        console.log('Target Word:', targetWord);
    }

    function startNewGame() {
        const wordList = getCurrentWordList();
        targetWord = wordList[Math.floor(Math.random() * wordList.length)];
        guesses = [];
        currentGuess = [];
        isGameOver = false;
        clearBoard();
        resetKeyboard();
        saveState();
    }

    function resetGame() {
        startNewGame();
        console.log('New Target Word:', targetWord);
    }

    function clearBoard() {
        Array.from(board.children).forEach(row => {
            Array.from(row.children).forEach(tile => {
                tile.textContent = '';
                tile.removeAttribute('data-state');
                tile.classList.remove('flip', 'shake');
                tile.style.animationDelay = '';
            });
        });
    }

    function resetKeyboard() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.removeAttribute('data-state');
        });
    }

    function saveState() {
        const state = {
            targetWord,
            guesses,
            isGameOver,
            timestamp: Date.now() // Optional: could be used to expire games
        };
        localStorage.setItem('wordleState', JSON.stringify(state));
    }

    function loadState() {
        const state = localStorage.getItem('wordleState');
        return state ? JSON.parse(state) : null;
    }

    function restoreRowState(guessWord, rowIndex) {
        const currentRow = board.children[rowIndex];
        const tiles = currentRow.children;
        const targetLetters = targetWord.split('');
        const guessLetters = guessWord.split('');

        // First pass: Correct
        guessLetters.forEach((letter, i) => {
            tiles[i].textContent = letter;
            if (letter === targetLetters[i]) {
                tiles[i].setAttribute('data-state', 'correct');
                updateKey(letter, 'correct');
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        });

        // Second pass: Present
        guessLetters.forEach((letter, i) => {
            if (letter && targetLetters.includes(letter)) {
                tiles[i].setAttribute('data-state', 'present');
                updateKey(letter, 'present');
                targetLetters[targetLetters.indexOf(letter)] = null;
            } else if (letter) {
                tiles[i].setAttribute('data-state', 'absent');
                updateKey(letter, 'absent');
            }
        });
    }

    // Initialize Board
    for (let i = 0; i < MAX_GUESSES; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            row.appendChild(tile);
        }
        board.appendChild(row);
    }

    // Initialize Keyboard
    const keys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    keys.forEach(rowKeys => {
        const row = document.createElement('div');
        row.className = 'keyboard-row';
        rowKeys.forEach(key => {
            const button = document.createElement('button');
            button.textContent = key === 'BACKSPACE' ? '⌫' : key;
            button.className = 'key';
            if (key === 'ENTER' || key === 'BACKSPACE') {
                button.classList.add('wide');
            }
            button.setAttribute('data-key', key);

            // Long press logic
            if (ACCENT_MAP[key]) {
                button.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return; // Only left click
                    longPressTriggered = false;
                    longPressTimer = setTimeout(() => {
                        longPressTriggered = true;
                        showAccentPopup(button, key);
                    }, 500);
                });

                button.addEventListener('mouseleave', () => {
                    clearTimeout(longPressTimer);
                });

                button.addEventListener('mouseup', () => {
                    clearTimeout(longPressTimer);
                });
            }

            button.addEventListener('click', (e) => {
                if (longPressTriggered) {
                    e.stopPropagation();
                    longPressTriggered = false;
                    return;
                }
                handleInput(key);
            });

            row.appendChild(button);
        });
        keyboardContainer.appendChild(row);
    });

    function showAccentPopup(button, key) {
        hideAccentPopup(); // Close existing
        const accents = ACCENT_MAP[key];
        const popup = document.createElement('div');
        popup.className = 'accent-popup';

        accents.forEach(accent => {
            const accentBtn = document.createElement('button');
            accentBtn.textContent = accent;
            accentBtn.className = 'accent-key';
            accentBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling
                handleInput(accent);
                hideAccentPopup();
            });
            popup.appendChild(accentBtn);
        });

        button.appendChild(popup);
        activePopup = popup;
    }

    function hideAccentPopup() {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
        }
    }

    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        const key = e.key.toUpperCase();
        if (key === 'ENTER' || key === 'BACKSPACE') {
            handleInput(key);
        } else if (/^[A-ZÉÈÊËÓÒÔÖÁÀÂÄÆÍÌÎÏÚÙÛÜÑÇ]$/.test(key)) {
            handleInput(key);
        }
    });

    function handleInput(key) {
        if (isGameOver) return;

        if (key === 'BACKSPACE') {
            if (currentGuess.length > 0) {
                currentGuess.pop();
                updateBoard();
            }
            return;
        }

        if (key === 'ENTER') {
            if (currentGuess.length !== WORD_LENGTH) {
                showMessage('Not enough letters');
                shakeRow();
                return;
            }
            const guessWord = currentGuess.join('');
            const wordList = getCurrentWordList();
            if (!wordList.includes(guessWord)) {
                showMessage('Not in word list');
                shakeRow();
                return;
            }

            if (guesses.includes(guessWord)) {
                showMessage('Already guessed');
                shakeRow();
                return;
            }
            submitGuess();
            return;
        }

        if (currentGuess.length < WORD_LENGTH) {
            currentGuess.push(key);
            updateBoard();
        }
    }

    function updateBoard() {
        const currentRow = board.children[guesses.length];
        const tiles = currentRow.children;

        // Clear current row first
        for (let i = 0; i < WORD_LENGTH; i++) {
            tiles[i].textContent = '';
            tiles[i].removeAttribute('data-state');
        }

        // Fill with current guess
        for (let i = 0; i < currentGuess.length; i++) {
            tiles[i].textContent = currentGuess[i];
            tiles[i].setAttribute('data-state', 'active');
        }
    }

    function submitGuess() {
        const guessWord = currentGuess.join('');
        const currentRow = board.children[guesses.length];
        const tiles = currentRow.children;

        if (!targetWord) {
            console.error('submitGuess: targetWord is undefined!');
            return;
        }

        const guessLetters = guessWord.split('');
        const results = Logic.evaluateGuess(guessWord, targetWord);

        results.forEach((state, i) => {
            tiles[i].setAttribute('data-state', state);
            updateKey(guessLetters[i], state);
        });

        // Animate flip
        for (let i = 0; i < WORD_LENGTH; i++) {
            tiles[i].classList.add('flip');
            tiles[i].style.animationDelay = `${i * 100}ms`;
        }

        guesses.push(guessWord);
        currentGuess = [];
        saveState();

        if (guessWord === targetWord) {
            showMessage('Splendid!');
            isGameOver = true;
            saveState();
            updateStats(true, guesses.length);
        } else if (guesses.length === MAX_GUESSES) {
            showMessage(targetWord);
            isGameOver = true;
            saveState();
            updateStats(false, guesses.length);
        }
    }

    function updateStats(won, attempts) {
        chrome.storage.local.get(['stats'], (result) => {
            const stats = result.stats || {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
                history: []
            };

            stats.gamesPlayed++;
            if (won) {
                stats.gamesWon++;
                stats.currentStreak++;
                if (stats.currentStreak > stats.maxStreak) {
                    stats.maxStreak = stats.currentStreak;
                }
                stats.guessDistribution[attempts]++;
            } else {
                stats.currentStreak = 0;
            }

            stats.history.push({
                word: targetWord,
                result: won ? 'won' : 'lost',
                attempts: attempts,
                timestamp: Date.now()
            });

            chrome.storage.local.set({ stats });
        });
    }

    function updateKey(key, state) {
        const button = document.querySelector(`button[data-key="${key}"]`);
        if (!button) return; // Handle accented keys that don't have main buttons
        const currentState = button.getAttribute('data-state');

        if (state === 'correct') {
            button.setAttribute('data-state', 'correct');
        } else if (state === 'present' && currentState !== 'correct') {
            button.setAttribute('data-state', 'present');
        } else if (state === 'absent' && currentState !== 'correct' && currentState !== 'present') {
            button.setAttribute('data-state', 'absent');
        }
    }

    function showMessage(msg) {
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = msg;
        messageContainer.appendChild(message);
        setTimeout(() => {
            messageContainer.removeChild(message);
        }, 3000);
    }

    function shakeRow() {
        const currentRow = board.children[guesses.length];
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
    }

    // Initialize Game
    initGame();
});