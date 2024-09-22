document.addEventListener('DOMContentLoaded', () => {
  let startWord = '';
  let endWord = '';
  let currentGuess = '';
  let previousWord = '';
  let guesses = [];
  const maxGuesses = 10;
  let currentRow = 0;
  let currentTile = 0;
  let wordList = [];
  let puzzles = [];
  let gameOver = false;
  let mode = 'daily'; // Default mode

  const startWordSpan = document.getElementById('start-word');
  const endWordSpan = document.getElementById('end-word');
  const gridContainer = document.getElementById('grid-container');
  const tutorialModal = document.getElementById('tutorial-modal');
  const tutorialButton = document.getElementById('tutorial-button');
  const closeButton = document.querySelector('.close-button');
  const keyboardContainer = document.getElementById('keyboard-container');
  const messageContainer = document.getElementById('message-container');
  const shareButtonOverlay = document.getElementById('share-button-overlay');
  const statsOverlay = document.getElementById('stats-overlay');
  const closeOverlayButton = document.querySelector('.close-overlay');
  const statsButton = document.getElementById('stats-button');
  const modeButton = document.getElementById('mode-button');
  const gameTitle = document.getElementById('game-title'); // Added for header text updates

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
      fetchPuzzle(mode);
    });

  function fetchPuzzle(modeType = 'daily') {
    if (puzzles.length === 0) {
      console.error('No puzzles available');
      return;
    }

    let puzzle;
    if (modeType === 'daily') {
      const firstPuzzleDate = new Date('2024-09-22');
      const today = new Date();
      const timeDiff = today.getTime() - firstPuzzleDate.getTime();
      let dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (dayDiff < 0) {
        dayDiff = 0; // Before first puzzle date, use the first puzzle
      }

      const idx = dayDiff % puzzles.length;
      puzzle = puzzles[idx];

      // Check if puzzle already played
      const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};
      const todayStr = today.toISOString().split('T')[0];

      if (playedPuzzles[todayStr]) {
        // Puzzle already played today, retrieve from storage
        startWord = playedPuzzles[todayStr].startWord;
        endWord = playedPuzzles[todayStr].endWord;
        guesses = playedPuzzles[todayStr].guesses || [];
        startGame(true);
        return;
      } else {
        // Mark puzzle as not yet played
        playedPuzzles[todayStr] = { 
          startWord: puzzle.start_word.toUpperCase(), 
          endWord: puzzle.end_word.toUpperCase(), 
          played: false,
          guesses: []
        };
        localStorage.setItem('morphlePlayedPuzzles', JSON.stringify(playedPuzzles));
      }
    } else {
      // Unlimited mode: pick a random puzzle
      puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    }

    startWord = puzzle.start_word.toUpperCase();
    endWord = puzzle.end_word.toUpperCase();
    startGame();
  }

  function startGame(isReplay = false) {
    startWordSpan.textContent = startWord;
    endWordSpan.textContent = endWord;
    previousWord = startWord;
    currentGuess = '';
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    gridContainer.innerHTML = '';
    messageContainer.textContent = '';
    statsOverlay.style.display = 'none';
    createGrid();
    createKeyboard();

    if (isReplay) {
      // If replaying today's puzzle, retrieve past guesses
      const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};
      const todayStr = new Date().toISOString().split('T')[0];
      const puzzleData = playedPuzzles[todayStr];
      if (puzzleData && puzzleData.guesses) {
        puzzleData.guesses.forEach(guess => {
          submitGuess(guess, true);
        });
        // If game was already played (won or lost), set gameOver accordingly
        if (puzzleData.played) {
          gameOver = true;
          showStatsOverlay(puzzleData.won);
        }
      }
    }
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
      buttonElement.innerHTML = key;
      buttonElement.setAttribute('data-key', key);
      buttonElement.classList.add('key');
      buttonElement.addEventListener('click', () => handleKeyClick(key));
      firstRow.appendChild(buttonElement);
    });

    const secondRow = document.createElement('div');
    secondRow.classList.add('keyboard-row');

    // Spacer for alignment
    const spacer = document.createElement('div');
    spacer.style.width = '20px';
    spacer.style.height = '60px';
    spacer.style.margin = '2px';
    spacer.style.visibility = 'hidden';
    secondRow.appendChild(spacer);

    secondRowKeys.forEach(key => {
      const buttonElement = document.createElement('button');
      buttonElement.innerHTML = key;
      buttonElement.setAttribute('data-key', key);
      buttonElement.classList.add('key');
      buttonElement.addEventListener('click', () => handleKeyClick(key));
      secondRow.appendChild(buttonElement);
    });

    const thirdRow = document.createElement('div');
    thirdRow.classList.add('keyboard-row');

    const enterButton = document.createElement('button');
    enterButton.innerHTML = '<i class="fas fa-arrow-right"></i>'; // Using FontAwesome icon
    enterButton.setAttribute('data-key', 'Enter');
    enterButton.classList.add('key', 'wide');
    enterButton.addEventListener('click', () => handleKeyClick('Enter'));
    thirdRow.appendChild(enterButton);

    thirdRowKeys.forEach(key => {
      const buttonElement = document.createElement('button');
      buttonElement.innerHTML = key;
      buttonElement.setAttribute('data-key', key);
      buttonElement.classList.add('key');
      buttonElement.addEventListener('click', () => handleKeyClick(key));
      thirdRow.appendChild(buttonElement);
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-backspace"></i>'; // Using FontAwesome icon
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

  // Handle Physical Keyboard Input
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

  function submitGuess(externalGuess = null, isReplay = false) {
    let guess = externalGuess ? externalGuess : currentGuess;

    if (guess.length !== 5) {
      if (!isReplay) showInvalidGuess('Not enough letters');
      return;
    }

    if (!wordList.includes(guess)) {
      if (!isReplay) showInvalidGuess('Word not in list');
      return;
    }

    if (!isOneLetterDifferent(guess, previousWord)) {
      if (!isReplay) showInvalidGuess('Must change one letter from previous word');
      return;
    }

    if (!isReplay) {
      guesses.push(guess);
    }

    updateGrid(guess);
    if (!isReplay) {
      saveGuess(guess);
    }

    if (!isReplay) {
      checkWinOrLose(guess);
    }

    if (!isReplay) {
      previousWord = guess;
      currentGuess = '';
      currentTile = 0;
      currentRow++;
    }
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

  function updateGrid(guess) {
    const rowTiles = document.getElementById('row-' + currentRow).childNodes;
    const guessLetters = guess.split('');
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
      }
    }

    // Second pass: Check for correct letters in wrong positions
    for (let i = 0; i < 5; i++) {
      const tile = rowTiles[i];
      const letter = guessLetters[i];

      if (letter && endWordLettersCopy.includes(letter)) {
        tile.classList.add('present');
        endWordLettersCopy[endWordLettersCopy.indexOf(letter)] = null;
        guessLetters[i] = null;
        updateKeyboardKey(letter, 'present');
      } else if (letter) {
        tile.classList.add('absent');
        updateKeyboardKey(letter, 'absent');
      }
    }
  }

  function updateKeyboardKey(letter, status) {
    const keyElement = keyboardContainer.querySelector(`[data-key='${letter}']`);
    if (keyElement) {
      if (status === 'correct') {
        keyElement.classList.remove('present', 'absent');
        keyElement.classList.add('correct');
      } else if (status === 'present') {
        if (!keyElement.classList.contains('correct')) {
          keyElement.classList.remove('absent');
          keyElement.classList.add('present');
        }
      } else if (status === 'absent') {
        if (!keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
          keyElement.classList.add('absent');
        }
      }
    }
  }

  function checkWinOrLose(guess) {
    if (guess === endWord) {
      if (mode === 'daily') {
        showMessage('Well done! You solved it.');
        gameOver = true;
        showStatsOverlay(true);
        saveGameResult(true);
      } else {
        showMessage('Well done! Unlimited mode is for practice and does not count towards stats.');
        gameOver = true;
      }
    } else if (currentRow >= maxGuesses - 1) {
      if (mode === 'daily') {
        showMessage('Game Over! The word was ' + endWord);
        gameOver = true;
        showStatsOverlay(false);
        saveGameResult(false);
      } else {
        showMessage('Game Over! Unlimited mode is for practice and does not count towards stats.');
        gameOver = true;
      }
    }
  }

  function showMessage(message) {
    messageContainer.textContent = message;
    setTimeout(() => {
      messageContainer.textContent = '';
    }, 2000);
  }

  function showStatsOverlay(isWin) {
    populateOverlayStats(isWin);
    statsOverlay.style.display = 'flex';
  }

  function populateOverlayStats(isWin) {
    if (mode !== 'daily') {
      // In unlimited mode, do not show stats
      document.getElementById('overlay-heading').textContent = 'Well done!';
      const overlaySections = statsOverlay.querySelectorAll('.overlay-section');
      overlaySections.forEach(section => {
        if (!section.querySelector('h3')) {
          section.style.display = 'none';
        }
      });
      return;
    }

    document.getElementById('overlay-heading').textContent = 'Well done!';

    // Update statistics (played, win%, current streak, max streak)
    let played = parseInt(localStorage.getItem('morphlePlayed')) || 0;
    let wins = parseInt(localStorage.getItem('morphleWins')) || 0;
    let currentStreak = parseInt(localStorage.getItem('morphleCurrentStreak')) || 0;
    let maxStreak = parseInt(localStorage.getItem('morphleMaxStreak')) || 0;

    if (isWin) {
      wins += 1;
      currentStreak += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }

    played += 1;

    localStorage.setItem('morphlePlayed', played);
    localStorage.setItem('morphleWins', wins);
    localStorage.setItem('morphleCurrentStreak', currentStreak);
    localStorage.setItem('morphleMaxStreak', maxStreak);

    let winPercentage = played > 0 ? Math.round((wins / played) * 100) : 0;

    document.getElementById('stat-played').textContent = played;
    document.getElementById('stat-win').textContent = winPercentage + '%';
    document.getElementById('stat-current-streak').textContent = currentStreak;
    document.getElementById('stat-max-streak').textContent = maxStreak;

    // Populate Guess Distribution
    populateGuessDistribution(isWin);
  }

  function populateGuessDistribution(isWin) {
    if (mode !== 'daily') {
      // Do not show guess distribution in unlimited mode
      return;
    }

    const guessDistributionContainer = document.getElementById('guess-distribution');
    const distribution = {};

    // Initialize distribution from 1 to maxGuesses and failed
    for (let i = 1; i <= maxGuesses; i++) {
      distribution[i] = 0;
    }
    distribution['Failed'] = 0;

    // Calculate distribution based on guesses
    if (isWin) {
      const attempts = guesses.length;
      if (attempts >=1 && attempts <= maxGuesses) {
        distribution[attempts] += 1;
      }
    } else {
      distribution['Failed'] += 1;
    }

    // Retrieve previous distribution from localStorage
    let storedDistribution = JSON.parse(localStorage.getItem('morphleGuessDistribution')) || {};

    // Update with current game
    for (let key in distribution) {
      if (distribution[key] > 0) {
        storedDistribution[key] = (storedDistribution[key] || 0) + distribution[key];
      }
    }

    // Save updated distribution
    localStorage.setItem('morphleGuessDistribution', JSON.stringify(storedDistribution));

    // Calculate total games
    let totalGames = 0;
    for (let key in storedDistribution) {
      totalGames += storedDistribution[key];
    }

    // Clear previous distribution
    guessDistributionContainer.innerHTML = '';

    // Generate bars for 1 to maxGuesses
    for (let i = 1; i <= maxGuesses; i++) {
      const count = storedDistribution[i] || 0;
      const bar = document.createElement('div');
      bar.classList.add('guess-bar');

      const number = document.createElement('span');
      number.classList.add('guess-number');
      number.textContent = i;
      bar.appendChild(number);

      const progress = document.createElement('div');
      progress.classList.add('guess-progress', 'guess-bar-green');

      let percentage = totalGames > 0 ? (count / totalGames) * 100 : 0;
      progress.style.width = percentage + '%';
      progress.setAttribute('data-count', count);
      bar.appendChild(progress);

      guessDistributionContainer.appendChild(bar);
    }

    // Add Failed Bar
    const failedCount = storedDistribution['Failed'] || 0;
    const failedBar = document.createElement('div');
    failedBar.classList.add('guess-bar');

    const failedNumber = document.createElement('span');
    failedNumber.classList.add('guess-number');
    failedNumber.textContent = 'X';
    failedBar.appendChild(failedNumber);

    const failedProgress = document.createElement('div');
    failedProgress.classList.add('guess-progress', 'guess-bar-failed');
    let failedPercentage = totalGames > 0 ? (failedCount / totalGames) * 100 : 0;
    failedProgress.style.width = failedPercentage + '%';
    failedProgress.setAttribute('data-count', failedCount);
    failedBar.appendChild(failedProgress);

    guessDistributionContainer.appendChild(failedBar);
  }

  function shareResults() {
    const firstPuzzleDate = new Date('2024-09-22');
    const today = new Date();
    const timeDiff = today.getTime() - firstPuzzleDate.getTime();
    let dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (dayDiff < 0) {
      dayDiff = 0;
    }

    const puzzleNumber = dayDiff + 1; // Start at 1
    let resultText = `Morphle ${puzzleNumber} ${guesses.length}/${maxGuesses}\n\n`;

    guesses.forEach((guess, index) => {
      const rowResult = generateRowResult(guess);
      resultText += rowResult + '\n';
    });

    // Add failed guess if applicable
    if (guesses.length === maxGuesses && guesses[guesses.length - 1] !== endWord) {
      resultText += '❌';
    }

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

    // First pass: Check for correct letters in correct positions
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === endWordLetters[i]) {
        rowResult += '🟩';
        endWordLetters[i] = null;
        guessLetters[i] = null;
      } else {
        rowResult += '⬜';
      }
    }

    // Second pass: Check for correct letters in wrong positions
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] && endWordLetters.includes(guessLetters[i])) {
        rowResult = replaceAt(rowResult, i, '🟨');
        endWordLetters[endWordLetters.indexOf(guessLetters[i])] = null;
        guessLetters[i] = null;
      }
    }

    return rowResult;
  }

  function replaceAt(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + 1);
  }

  function saveGuess(guess) {
    if (mode !== 'daily') {
      // Do not save guesses in unlimited mode
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};

    if (playedPuzzles[todayStr]) {
      playedPuzzles[todayStr].guesses = playedPuzzles[todayStr].guesses || [];
      playedPuzzles[todayStr].guesses.push(guess);
      playedPuzzles[todayStr].played = true;
      localStorage.setItem('morphlePlayedPuzzles', JSON.stringify(playedPuzzles));
    }
  }

  function saveGameResult(won) {
    if (mode !== 'daily') {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};

    if (playedPuzzles[todayStr]) {
      playedPuzzles[todayStr].played = true;
      playedPuzzles[todayStr].won = won;
      localStorage.setItem('morphlePlayedPuzzles', JSON.stringify(playedPuzzles));
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
    if (event.target == statsOverlay) {
      statsOverlay.style.display = 'none';
    }
  });

  statsButton.addEventListener('click', () => {
    if (mode === 'daily') {
      populateOverlayStats(false); // Show current stats without game over
    } else {
      // In unlimited mode, no stats to show
      document.getElementById('overlay-heading').textContent = 'Well done!';
      const overlaySections = statsOverlay.querySelectorAll('.overlay-section');
      overlaySections.forEach(section => {
        if (!section.querySelector('h3')) {
          section.style.display = 'none';
        }
      });
    }
    statsOverlay.style.display = 'flex';
  });

  modeButton.addEventListener('click', () => {
    mode = (mode === 'daily') ? 'unlimited' : 'daily';
    
    // Update mode button icon
    const modeIcon = modeButton.querySelector('i');
    if (mode === 'daily') {
      modeIcon.classList.remove('fa-calendar-alt');
      modeIcon.classList.add('fa-infinity');
      modeButton.title = 'Switch to Daily Mode';
      // Update game title
      animateGameTitle('Morphle Daily');
    } else {
      modeIcon.classList.remove('fa-infinity');
      modeIcon.classList.add('fa-calendar-alt');
      modeButton.title = 'Switch to Unlimited Mode';
      // Update game title
      animateGameTitle('Morphle Unlimited');
    }

    // Fetch new puzzle based on mode
    fetchPuzzle(mode);
  });

  // Close Overlay on "X" Click
  closeOverlayButton.addEventListener('click', () => {
    statsOverlay.style.display = 'none';
  });

  // Share Button in Overlay
  shareButtonOverlay.addEventListener('click', shareResults);

  // Function to animate game title
  function animateGameTitle(newText) {
    gameTitle.classList.add('animate-title');
    setTimeout(() => {
      gameTitle.textContent = newText;
      gameTitle.classList.remove('animate-title');
    }, 300); // Duration should match CSS animation duration
  }

});
