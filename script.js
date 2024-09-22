document.addEventListener('DOMContentLoaded', () => {
    let startWord = '';
    let endWord = '';
    let currentGuess = '';
    let previousWord = '';
    let guesses = [];
    let maxGuesses = 10;
    let currentRow = 0;
    let currentTile = 0;
    let wordList = [];
    let puzzles = [];
    let gameOver = false;
  
    const startWordSpan = document.getElementById('start-word');
    const endWordSpan = document.getElementById('end-word');
    const gridContainer = document.getElementById('grid-container');
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialButton = document.getElementById('tutorial-button');
    const closeButton = document.querySelector('.close-button');
    const dailyModeButton = document.getElementById('daily-mode');
    const unlimitedModeButton = document.getElementById('unlimited-mode');
    const keyboardContainer = document.getElementById('keyboard-container');
    const messageContainer = document.getElementById('message-container');
    const shareButton = document.getElementById('share-button');
  
    // Show tutorial on first load
    if (!localStorage.getItem('morphleFirstVisit')) {
      tutorialModal.style.display = 'block';
      localStorage.setItem('morphleFirstVisit', 'true');
    }
  
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
        const firstPuzzleDate = new Date('2024-09-22');
        const today = new Date();
        const timeDiff = today.getTime() - firstPuzzleDate.getTime();
        let dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
        if (dayDiff < 0) {
          dayDiff = 0; // Before first puzzle date, use the first puzzle
        }
  
        const idx = dayDiff % puzzles.length;
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
      previousWord = startWord;
      currentGuess = '';
      guesses = [];
      currentRow = 0;
      currentTile = 0;
      gameOver = false;
      gridContainer.innerHTML = '';
      messageContainer.textContent = '';
      shareButton.style.display = 'none';
      createGrid();
      createKeyboard();
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
  
    function createKeyboard() {
      keyboardContainer.innerHTML = '';
  
      const firstRowKeys = ['Q','W','E','R','T','Y','U','I','O','P'];
      const secondRowKeys = ['A','S','D','F','G','H','J','K','L'];
      const thirdRowKeys = ['Z','X','C','V','B','N','M'];
  
      const firstRow = document.createElement('div');
      firstRow.classList.add('keyboard-row');
  
      firstRowKeys.forEach(key => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = key;
        buttonElement.setAttribute('data-key', key);
        buttonElement.classList.add('key');
        buttonElement.addEventListener('click', () => handleKeyClick(key));
        firstRow.appendChild(buttonElement);
      });
  
      const secondRow = document.createElement('div');
      secondRow.classList.add('keyboard-row');
  
      // Spacer
      const spacer = document.createElement('div');
      spacer.style.width = '20px';
      spacer.style.height = '60px';
      spacer.style.margin = '2px';
      spacer.style.visibility = 'hidden';
      secondRow.appendChild(spacer);
  
      secondRowKeys.forEach(key => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = key;
        buttonElement.setAttribute('data-key', key);
        buttonElement.classList.add('key');
        buttonElement.addEventListener('click', () => handleKeyClick(key));
        secondRow.appendChild(buttonElement);
      });
  
      const thirdRow = document.createElement('div');
      thirdRow.classList.add('keyboard-row');
  
      const enterButton = document.createElement('button');
      enterButton.textContent = 'Enter';
      enterButton.setAttribute('data-key', 'Enter');
      enterButton.classList.add('key', 'wide');
      enterButton.addEventListener('click', () => handleKeyClick('Enter'));
      thirdRow.appendChild(enterButton);
  
      thirdRowKeys.forEach(key => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = key;
        buttonElement.setAttribute('data-key', key);
        buttonElement.classList.add('key');
        buttonElement.addEventListener('click', () => handleKeyClick(key));
        thirdRow.appendChild(buttonElement);
      });
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Del';
      deleteButton.setAttribute('data-key', 'Backspace');
      deleteButton.classList.add('key', 'wide');
      deleteButton.addEventListener('click', () => handleKeyClick('Backspace'));
      thirdRow.appendChild(deleteButton);
  
      keyboardContainer.appendChild(firstRow);
      keyboardContainer.appendChild(secondRow);
      keyboardContainer.appendChild(thirdRow);
    }
  
    function handleKeyClick(key) {
      if (gameOver) return;
  
      if (key === 'Enter') {
        submitGuess();
        return;
      }
      if (key === 'Backspace') {
        deleteLetter();
        return;
      }
      if (/^[A-Z]$/.test(key)) {
        addLetter(key);
      }
    }
  
    // Handle Keyboard Input
    document.addEventListener('keydown', (e) => {
      if (gameOver) return;
  
      if (e.key === 'Backspace' || e.key === 'Delete') {
        deleteLetter();
        return;
      }
      if (e.key === 'Enter') {
        submitGuess();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
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
        showInvalidGuess('Not enough letters');
        return;
      }
  
      if (!wordList.includes(currentGuess)) {
        showInvalidGuess('Word not in list');
        return;
      }
  
      if (!isOneLetterDifferent(currentGuess, previousWord)) {
        showInvalidGuess('Must change one letter from previous word');
        return;
      }
  
      guesses.push(currentGuess);
      updateGrid();
      checkWinOrLose();
      previousWord = currentGuess;
      currentGuess = '';
      currentTile = 0;
      currentRow++;
    }
  
    function showInvalidGuess(message) {
      const rowTiles = document.getElementById('row-' + currentRow).childNodes;
  
      rowTiles.forEach(tile => {
        tile.classList.add('invalid');
      });
  
      showMessage(message);
  
      setTimeout(() => {
        rowTiles.forEach(tile => {
          tile.classList.remove('invalid');
          tile.textContent = '';
          tile.classList.remove('filled');
        });
        currentGuess = '';
        currentTile = 0;
      }, 1000);
    }
  
    function isOneLetterDifferent(word1, word2) {
      let letterCounts1 = {};
      let letterCounts2 = {};
  
      for (let letter of word1) {
        letterCounts1[letter] = (letterCounts1[letter] || 0) + 1;
      }
  
      for (let letter of word2) {
        letterCounts2[letter] = (letterCounts2[letter] || 0) + 1;
      }
  
      let allLetters = new Set([...word1, ...word2]);
      let diffCount = 0;
  
      allLetters.forEach(letter => {
        diffCount += Math.abs((letterCounts1[letter] || 0) - (letterCounts2[letter] || 0));
      });
  
      return diffCount === 2; // Exactly one letter changed
    }
  
    function updateGrid() {
      const rowTiles = document.getElementById('row-' + currentRow).childNodes;
      const guessLetters = currentGuess.split('');
      const endWordLetters = endWord.split('');
  
      // Copy arrays to manipulate
      let endWordLettersCopy = endWordLetters.slice();
  
      // First pass: Check for correct letters in correct positions
      for (let i = 0; i < 5; i++) {
        const tile = rowTiles[i];
        const letter = guessLetters[i];
  
        if (letter === endWordLetters[i]) {
          tile.classList.add('correct');
          endWordLettersCopy[i] = null;
          guessLetters[i] = null;
          updateKeyboardKey(letter, 'correct');
        } else {
          tile.classList.add('absent');
          updateKeyboardKey(letter, 'absent');
        }
      }
  
      // Second pass: Check for correct letters in wrong positions
      for (let i = 0; i < 5; i++) {
        if (guessLetters[i]) {
          const index = endWordLettersCopy.indexOf(guessLetters[i]);
          if (index !== -1) {
            const tile = rowTiles[i];
            tile.classList.remove('absent');
            tile.classList.add('present');
            endWordLettersCopy[index] = null;
            guessLetters[i] = null;
            updateKeyboardKey(tile.textContent, 'present');
          }
        }
      }
    }
  
    function updateKeyboardKey(letter, status) {
      const keyElement = keyboardContainer.querySelector(`[data-key='${letter}']`);
      if (keyElement) {
        keyElement.classList.remove('correct', 'present', 'absent');
        keyElement.classList.add(status);
      }
    }
  
    function checkWinOrLose() {
      if (currentGuess === endWord) {
        showMessage('Congratulations! You solved it.');
        gameOver = true;
        shareButton.style.display = 'block';
      } else if (currentRow >= maxGuesses - 1) {
        showMessage('Game Over! The word was ' + endWord);
        gameOver = true;
        shareButton.style.display = 'block';
      }
    }
  
    function showMessage(message) {
      messageContainer.textContent = message;
      setTimeout(() => {
        messageContainer.textContent = '';
      }, 2000);
    }
  
    function shareResults() {
      const firstPuzzleDate = new Date('2024-09-22');
      const today = new Date();
      const timeDiff = today.getTime() - firstPuzzleDate.getTime();
      let dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
      if (dayDiff < 0) {
        dayDiff = 0;
      }
  
      const puzzleNumber = dayDiff;
      let resultText = `Morphle ${puzzleNumber} ${currentRow}/${maxGuesses}\n\n`;
  
      guesses.forEach((guess, index) => {
        const rowResult = generateRowResult(guess);
        resultText += rowResult + '\n';
      });
  
      // Copy to clipboard
      navigator.clipboard.writeText(resultText).then(() => {
        showMessage('Results copied to clipboard!');
      }, () => {
        showMessage('Failed to copy results.');
      });
    }
  
    function generateRowResult(guess) {
      const guessLetters = guess.split('');
      const endWordLetters = endWord.split('');
      let rowResult = '';
  
      // Copy arrays to manipulate
      let endWordLettersCopy = endWordLetters.slice();
  
      // First pass: Check for correct letters in correct positions
      for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === endWordLetters[i]) {
          rowResult += '🟩';
          endWordLettersCopy[i] = null;
          guessLetters[i] = null;
        } else {
          rowResult += '⬜';
        }
      }
  
      // Second pass: Check for correct letters in wrong positions
      for (let i = 0; i < 5; i++) {
        if (guessLetters[i] && endWordLettersCopy.includes(guessLetters[i])) {
          rowResult = replaceAt(rowResult, i, '🟨');
          endWordLettersCopy[endWordLettersCopy.indexOf(guessLetters[i])] = null;
          guessLetters[i] = null;
        }
      }
  
      return rowResult;
    }
  
    function replaceAt(str, index, replacement) {
      return str.substr(0, index) + replacement + str.substr(index + 1);
    }
  
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
  
    shareButton.addEventListener('click', shareResults);
  });
  