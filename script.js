document.addEventListener('DOMContentLoaded', () => {
    let startWord = '';
    let endWord = '';
    let currentGuess = '';
    let guesses = [];
    let maxGuesses = 10;
    let puzzles = [];

    const startWordSpan = document.getElementById('start-word');
    const endWordSpan = document.getElementById('end-word');
    const gridContainer = document.getElementById('grid-container');
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialButton = document.getElementById('tutorial-button');
    const closeButton = document.querySelector('.close-button');
    const dailyModeButton = document.getElementById('daily-mode');
    const unlimitedModeButton = document.getElementById('unlimited-mode');

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
        currentGuess = startWord;
        guesses = [];
        gridContainer.innerHTML = '';
        createGrid();
        // Implement additional game logic here
    }

    function createGrid() {
        for (let i = 0; i < maxGuesses; i++) {
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                const content = document.createElement('div');
                content.classList.add('tile-content');
                tile.appendChild(content);
                gridContainer.appendChild(tile);
            }
        }
    }

    // Implement updateGrid, handle user input, and other game functions

    // Event Listeners
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
