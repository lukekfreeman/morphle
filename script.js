document.addEventListener('DOMContentLoaded', () => {
    let startWord = '';
    let endWord = '';
    let currentGuess = '';
    let guesses = [];
    let maxGuesses = 10;
    let currentRow = 0;
    let currentTile = 0;
    let wordList = [];
    let puzzles = [];

    const startWordSpan = document.getElementById('start-word');
    const endWordSpan = document.getElementById('end-word');
    const gridContainer = document.getElementById('grid-container');
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialButton = document.getElementById('tutorial-button');
    const closeButton = document.querySelector('.close-button');
    const dailyModeButton = document.getElementById('daily-mode');
    const unlimitedModeButton = document.getElementById('unlimited-mode');

    // Load word list
    fetch('word_list.txt')
        .then(response => response.text())
        .then(data => {
            wordList = data.split('\n').map(word => word.trim().toUpperCase()).filter(word => word.length === 5);
        });

    // Fetch puzzles from puzzles.json
    fetch('puzzles.json')
        .then(response => response.json())
        .then(data => {
            puzzles = data;
            fetchPuzzle('daily');
        });

    function fetchPuzzle(mode = 'daily') {
        if (puzzles.length === 0) {
            console.error('No puzzles available');
            return;
        }

        let puzzle;
        if (mode === 'daily') {
            const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % puzzles.length;
            puzzle = puzzles[idx];
        } else {
            puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        }

        startWord = puzzle.start_word.toUpperCase();
        endWord = puzzle.end_word.toUpperCase();
        startGame();
    }

    function startGame() {
        startWordSpan.textContent = startWord;
        endWordSpan.textContent = endWord;
        currentGuess = '';
        guesses = [];
        currentRow = 0;
        currentTile = 0;
        gridContainer.innerHTML = '';
        createGrid();
        addStartWordToGrid();
    }

    function createGrid() {
        for (let i = 0; i < maxGuesses; i++) {
            const row = document.createElement('div');
            row.classList.add('tile-row');
            row.setAttribute('id', 'row-' + i);

            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.setAttribute('id', 'row-' + i + '-tile-' + j);
                row.appendChild(tile);
            }

            gridContainer.appendChild(row);
        }
    }

    function addStartWordToGrid() {
        const rowTiles = document.getElementById('row-0').childNodes;
        for (let i = 0; i < 5; i++) {
            rowTiles[i].textContent = startWord[i];
            rowTiles[i].classList.add('correct');
        }
        currentRow = 1;
        currentTile = 0;
    }

    // Handle Keyboard Input
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            deleteLetter();
            return;
        }
        if (e.key === 'Enter') {
            submitGuess();
            return;
        }
        if (e.key.match(/^[a-zA-Z]$/) && e.key.length === 1) {
            addLetter(e.key.toUpperCase());
        }
    });

    function addLetter(letter) {
        if (currentTile < 5 && currentRow < maxGuesses) {
            const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
            tile.textContent = letter;
            tile.classList.add('filled');
            currentGuess += letter;
            currentTile++;
        }
    }

    function deleteLetter() {
        if (currentTile > 0) {
            currentTile--;
            const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
            tile.textContent = '';
            tile.classList.remove('filled');
            currentGuess = currentGuess.slice(0, -1);
        }
    }

    function submitGuess() {
        if (currentGuess.length !== 5) {
            alert('Please enter a 5-letter word.');
            return;
        }

        if (!wordList.includes(currentGuess)) {
            alert('Word not in list.');
            return;
        }

        guesses.push(currentGuess);
        updateGrid();
        checkWinOrLose();
        currentGuess = '';
        currentTile = 0;
        currentRow++;
    }

    function updateGrid() {
        const rowTiles = document.getElementById('row-' + currentRow).childNodes;
        const guessLetters = currentGuess.split('');
        const endWordLetters = endWord.split('');

        // Color coding
        for (let i = 0; i < 5; i++) {
            const tile = rowTiles[i];
            const letter = guessLetters[i];

            if (letter === endWordLetters[i]) {
                tile.classList.add('correct');
            } else if (endWordLetters.includes(letter)) {
                tile.classList.add('present');
            } else {
                tile.classList.add('absent');
            }
        }
    }

    function checkWinOrLose() {
        if (currentGuess === endWord) {
            alert('Congratulations! You solved it.');
            // Implement streaks, stats, and shareable results here
        } else if (currentRow >= maxGuesses) {
            alert('Game Over! The word was ' + endWord);
            // Implement loss handling here
        }
    }

    // Event Listeners for Tutorial and Mode Buttons
    tutorialButton.addEventListener('click', () => {
        tutorialModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == tutorialModal) {
            tutorialModal.style.display = 'none';
        }
    });

    dailyModeButton.addEventListener('click', () => {
        fetchPuzzle('daily');
    });

    unlimitedModeButton.addEventListener('click', () => {
        fetchPuzzle('unlimited');
    });
});
