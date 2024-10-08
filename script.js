document.addEventListener('DOMContentLoaded', () => {
  // Game Variables
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
  
  // DOM Elements (ensure all are present)
  const startWordRow = document.getElementById('starting-word-row');
  const gridContainer = document.getElementById('grid-container');
  const tutorialModal = document.getElementById('tutorial-modal');
  const tutorialButton = document.getElementById('tutorial-button');
  const closeButton = document.querySelector('.close-button');
  const keyboardContainer = document.getElementById('keyboard-container');
  const messageContainer = document.getElementById('message-container'); // Now present
  const errorMessage = document.getElementById('error-message'); // Fixed error message container
  const shareButtonOverlay = document.getElementById('share-button-overlay');
  const statsOverlay = document.getElementById('stats-overlay');
  const closeOverlayButton = document.querySelector('.close-overlay');
  const statsButton = document.getElementById('stats-button');
  const modeButton = document.getElementById('mode-button');
  const gameTitle = document.getElementById('game-title'); // For header text updates
  const targetWordBox = document.getElementById('target-word-box'); // For target word display
  const overlayHeading = document.getElementById('overlay-heading');
  
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
    })
    .catch(error => {
      console.error('Error loading word list:', error);
    });
  
  // Fetch puzzles from puzzles.json
  fetch('puzzles.json')
    .then(response => response.json())
    .then(data => {
      puzzles = data;
      fetchPuzzle(mode);
    })
    .catch(error => {
      console.error('Error loading puzzles:', error);
    });
  
  // Fetch Puzzle based on mode
  function fetchPuzzle(modeType = 'daily') {
    if (puzzles.length === 0) {
      console.error('No puzzles available');
      return;
    }
  
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
    if (modeType === 'daily') {
      const firstPuzzleDate = new Date('2024-09-22'); // Starting date
      const timeDiff = today.getTime() - firstPuzzleDate.getTime();
      let dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
      if (dayDiff < 0) {
        dayDiff = 0; // Before first puzzle date, use the first puzzle
      }
  
      const idx = dayDiff % puzzles.length;
      const puzzle = puzzles[idx];
  
      // Retrieve Daily Puzzle State
      const dailyPuzzle = getStoredPuzzle('daily');
  
      if (dailyPuzzle && dailyPuzzle.date === todayStr) {
        // Load existing Daily puzzle
        startWord = dailyPuzzle.startWord;
        endWord = dailyPuzzle.endWord;
        guesses = dailyPuzzle.guesses || [];
        previousWord = dailyPuzzle.previousWord || startWord;
        gameOver = dailyPuzzle.played || false;
        mode = 'daily';
  
        // Update game title and mode button
        gameTitle.textContent = 'Morphle Daily';
        updateModeButtonIcon();
  
        startGame(true, dailyPuzzle.won || false);
        
        // **Initialize Starting Word Row for Daily Mode**
        initializeStartingWordRow(); // Add this line
      } else {
        // Initialize new Daily puzzle
        startWord = puzzle.start_word.toUpperCase();
        endWord = puzzle.end_word.toUpperCase();
        previousWord = startWord;
        guesses = [];
        gameOver = false;
        mode = 'daily';
  
        // Save new Daily puzzle to localStorage
        const newDailyPuzzle = {
          date: todayStr,
          startWord: startWord,
          endWord: endWord,
          guesses: [],
          played: false,
          won: false,
          previousWord: startWord
        };
        savePuzzle('daily', newDailyPuzzle);
  
        // Update game title and mode button
        gameTitle.textContent = 'Morphle Daily';
        updateModeButtonIcon();
  
        startGame();
        
        // **Initialize Starting Word Row for Daily Mode**
        initializeStartingWordRow(); // Add this line
      }  
    } else if (modeType === 'unlimited') {
      // Retrieve Unlimited Puzzle State
      const unlimitedPuzzle = getStoredPuzzle('unlimited');

      if (unlimitedPuzzle) {
        // Load existing Unlimited puzzle
        startWord = unlimitedPuzzle.startWord;
        endWord = unlimitedPuzzle.endWord;
        guesses = unlimitedPuzzle.guesses || [];
        previousWord = unlimitedPuzzle.previousWord || startWord;
        gameOver = unlimitedPuzzle.played || false;
        mode = 'unlimited';
  
        // Update game title and mode button
        gameTitle.textContent = 'Morphle Unlimited';
        updateModeButtonIcon();
  
        startGame(true, unlimitedPuzzle.won || false);
      } else {
        // Initialize new Unlimited puzzle
        const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        startWord = puzzle.start_word.toUpperCase();
        endWord = puzzle.end_word.toUpperCase();
        previousWord = startWord;
        guesses = [];
        gameOver = false;
        mode = 'unlimited';
  
        // Save new Unlimited puzzle to localStorage
        const newUnlimitedPuzzle = {
          startWord: startWord,
          endWord: endWord,
          guesses: [],
          played: false,
          won: false,
          previousWord: startWord
        };
        savePuzzle('unlimited', newUnlimitedPuzzle);
  
        // Update game title and mode button
        gameTitle.textContent = 'Morphle Unlimited';
        updateModeButtonIcon();
  
        startGame();
      }
  
      // Update the target word display
      targetWordBox.innerHTML = `Morph to: <span id="end-word">${endWord}</span>`;
  
      // Initialize Starting Word Row
      initializeStartingWordRow();
    }
  }  
  
  // Initialize Starting Word Row
  function initializeStartingWordRow() {
    startWordRow.innerHTML = ''; // Clear existing tiles

    const guessLetters = startWord.split('');

    for (let i = 0; i < 5; i++) {
      const tile = document.createElement('div');
      tile.classList.add('tile', 'filled');
      tile.textContent = guessLetters[i] || '';
      startWordRow.appendChild(tile);
    }
  }
  
  // Start or Resume Game
  modeButton.addEventListener('click', () => {
    mode = (mode === 'daily') ? 'unlimited' : 'daily';
  
    // Update mode button icon and tooltip
    updateModeButtonIcon();
  
    // Toggle game title with animation
    if (mode === 'daily') {
      animateGameTitle('Morphle Daily');
    } else {
      animateGameTitle('Morphle Unlimited');
    }
  
    // Fetch new puzzle based on mode
    fetchPuzzle(mode);
  });
  
  function startGame(isReplay = false, hasWon = false) {
    gridContainer.innerHTML = ''; // Clear existing grid
    messageContainer.textContent = '';
    statsOverlay.style.display = 'none';
    createGrid();
    createKeyboard();

    if (isReplay) {
      // Load existing guesses
      guesses.forEach((guess, index) => {
        submitGuess(guess, true);
      });

      // If the game was completed, show stats overlay
      if (hasWon || guesses.length >= maxGuesses) {
        gameOver = true;
        showStatsOverlay(hasWon);
      }
    }
  }

  // Create Grid
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
  
  // Create Keyboard
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
  
    // Update Enter Key Color Based on Guess Length
    updateEnterKeyState();
  }  
  
  // Handle Key Click
  function handleKeyClick(key) {
    if (gameOver) return;
  
    console.log(`On-screen key clicked: ${key}`);
  
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
  
    // Update Enter Key State
    updateEnterKeyState();
  }  
  
  // Handle Physical Keyboard Input
  document.addEventListener('keydown', (e) => {
    if (gameOver) return;
  
    if (['Backspace', 'Delete', 'Enter'].includes(e.key) || /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault(); // Prevent default actions like navigating back
    }
  
    if (e.key === 'Backspace' || e.key === 'Delete') {
      deleteLetter();
      updateEnterKeyState();
      return;
    }
    if (e.key === 'Enter') {
      submitGuess();
      return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) {
      addLetter(e.key.toUpperCase());
      updateEnterKeyState();
    }
  });
    
  // Add Letter to Current Guess
  function addLetter(letter) {
    if (currentTile < 5 && currentRow < maxGuesses) {
      const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
      tile.textContent = letter;
      tile.classList.add('filled');
      currentGuess += letter;
      currentTile++;
      console.log(`Added letter: ${letter}. Current guess: ${currentGuess}`);
    }
  }  
  
  // Delete Last Letter from Current Guess
  function deleteLetter() {
    if (currentTile > 0) {
      currentTile--;
      const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
      tile.textContent = '';
      tile.classList.remove('filled');
      currentGuess = currentGuess.slice(0, -1);
      console.log(`Deleted last letter. Current guess: ${currentGuess}`);
    }
  }  
  
  // Submit Guess
  function submitGuess(externalGuess = null, isReplay = false) {
    let guess = externalGuess ? externalGuess : currentGuess;
  
    console.log(`Submitting guess: "${guess}" | Length: ${guess.length} | Mode: ${mode} | Previous Word: "${previousWord}"`);
  
    if (guess.length !== 5) {
      if (!isReplay) showErrorMessage('Not enough letters');
      return;
    }
  
    if (!wordList.includes(guess)) {
      if (!isReplay) showErrorMessage('Word not in list');
      return;
    }
  
    // Apply letter change validation
    if (!isValidLetterChange(guess, previousWord)) {
      if (!isReplay) showErrorMessage('Must change up to one letter from previous word');
      return;
    }
  
    if (!isReplay) {
      guesses.push(guess);
      saveGuess(guess);
    }
  
    updateGrid(guess);
  
    if (!isReplay) {
      checkWinOrLose(guess);
    }
  
    if (!isReplay) {
      previousWord = guess;
      currentGuess = '';
      currentTile = 0;
      currentRow++;
      console.log(`Updated previousWord to "${previousWord}"`);
    } else {
      // Update previousWord during replay
      previousWord = guess;
      console.log(`During replay, updated previousWord to "${previousWord}"`);
    }  
  
    // Update Enter Key State
    updateEnterKeyState();
  }  
    
  // Display Error Message
  function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 2000);
  }
  
  // Validate Letter Change: Allow up to 1 letter change with rearrangements
  function isValidLetterChange(newWord, oldWord) {
    // Create frequency maps for both words
    const freqNew = {};
    const freqOld = {};
  
    for (let char of newWord) {
      freqNew[char] = (freqNew[char] || 0) + 1;
    }
  
    for (let char of oldWord) {
      freqOld[char] = (freqOld[char] || 0) + 1;
    }
  
    // Calculate the number of letters added and removed
    let lettersAdded = 0;
    let lettersRemoved = 0;
  
    for (let char in freqNew) {
      if (!freqOld[char]) {
        lettersAdded += freqNew[char];
      } else if (freqNew[char] > freqOld[char]) {
        lettersAdded += freqNew[char] - freqOld[char];
      }
    }
  
    for (let char in freqOld) {
      if (!freqNew[char]) {
        lettersRemoved += freqOld[char];
      } else if (freqOld[char] > freqNew[char]) {
        lettersRemoved += freqOld[char] - freqNew[char];
      }
    }
  
    // Each letter change involves one addition and one removal
    // Thus, actualChanges = min(lettersAdded, lettersRemoved)
    let actualChanges = Math.min(lettersAdded, lettersRemoved);
  
    console.log(`isValidLetterChange: Added ${lettersAdded}, Removed ${lettersRemoved}, Actual Changes: ${actualChanges}`);
  
    return actualChanges <= 1;
  }  
  
  // Update Grid with Guess Feedback
  function updateGrid(guess) {
    const rowTiles = document.getElementById('row-' + (currentRow - 1)).childNodes; // Adjusted row index
    const guessLetters = guess.split('');
    const endWordLetters = endWord.split('');
  
    console.log(`Updating grid for row ${currentRow - 1}: ${guess}`);
  
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
        console.log(`Letter ${letter} is correct at position ${i + 1}`);
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
        console.log(`Letter ${letter} is present in the word but wrong position at position ${i + 1}`);
      } else if (letter) {
        tile.classList.add('absent');
        updateKeyboardKey(letter, 'absent');
        console.log(`Letter ${letter} is absent from the word at position ${i + 1}`);
      }
    }
  }  
  
  // Update Keyboard Key Status
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
  
  // Check Win or Lose Condition
  function checkWinOrLose(guess) {
    if (guess === endWord) {
      if (mode === 'daily') {
        showMessage('Well done! You solved it.');
        gameOver = true;
        saveGameResult(true);
        showStatsOverlay(true);
      } else {
        showMessage('Well done! Unlimited mode is for practice and does not count towards stats.');
        gameOver = true;
      }
    } else if (currentRow >= maxGuesses - 1) {
      if (mode === 'daily') {
        showMessage('Game Over! The word was ' + endWord);
        gameOver = true;
        saveGameResult(false);
        showStatsOverlay(false);
      } else {
        showMessage('Game Over! Unlimited mode is for practice and does not count towards stats.');
        gameOver = true;
      }
    }
  }
  
  // Display Temporary Message
  function showMessage(message) {
    messageContainer.textContent = message;
    setTimeout(() => {
      messageContainer.textContent = '';
    }, 2000);
  }
  
  // Display Stats Overlay
  function showStatsOverlay(isWin) {
    populateOverlayStats(isWin);
    statsOverlay.style.display = 'flex';
  }
  
  // Populate Stats Overlay
  function populateOverlayStats(isWin) {
    if (mode !== 'daily') {
      // In unlimited mode, do not show stats
      overlayHeading.textContent = 'Well done!';
      const overlaySections = statsOverlay.querySelectorAll('.overlay-section');
      overlaySections.forEach(section => {
        if (!section.querySelector('h3')) {
          section.style.display = 'none';
        }
      });
      return;
    }
  
    overlayHeading.textContent = 'Well done!';
  
    // Recalculate statistics based on stored game history
    const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};
    let played = 0;
    let wins = 0;
    let currentStreak = 0;
    let maxStreak = 0;
  
    // Iterate through all daily games
    Object.keys(playedPuzzles).forEach(date => {
      const puzzle = playedPuzzles[date];
      if (puzzle.played) {
        played += 1;
        if (puzzle.won) {
          wins += 1;
          currentStreak += 1;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else {
          currentStreak = 0;
        }
      }
    });
  
    let winPercentage = played > 0 ? Math.round((wins / played) * 100) : 0;
  
    document.getElementById('stat-played').textContent = played;
    document.getElementById('stat-win').textContent = winPercentage + '%';
    document.getElementById('stat-current-streak').textContent = currentStreak;
    document.getElementById('stat-max-streak').textContent = maxStreak;
  
    // Populate Guess Distribution
    populateGuessDistribution();
  }
  
  // Populate Guess Distribution
  function populateGuessDistribution() {
    if (mode !== 'daily') {
      // Do not show guess distribution in unlimited mode
      return;
    }
  
    const guessDistributionContainer = document.getElementById('guess-distribution');
    const distribution = {};
  
    // Initialize distribution from 5 to maxGuesses and failed
    for (let i = 5; i <= maxGuesses; i++) {
      distribution[i] = 0;
    }
    distribution['Failed'] = 0;
  
    // Iterate through all daily games to calculate distribution
    const playedPuzzles = JSON.parse(localStorage.getItem('morphlePlayedPuzzles')) || {};
    Object.values(playedPuzzles).forEach(puzzle => {
      if (puzzle.played) {
        if (puzzle.won && puzzle.guesses.length >= 5 && puzzle.guesses.length <= maxGuesses) {
          distribution[puzzle.guesses.length] = (distribution[puzzle.guesses.length] || 0) + 1;
        } else if (!puzzle.won) {
          distribution['Failed'] = (distribution['Failed'] || 0) + 1;
        }
      }
    });
  
    // Retrieve previous distribution from localStorage
    let storedDistribution = JSON.parse(localStorage.getItem('morphleGuessDistribution')) || {};
  
    // Update storedDistribution based on current games
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
  
    // Generate bars for 5 to maxGuesses
    for (let i = 5; i <= maxGuesses; i++) {
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
      percentage = percentage > 100 ? 100 : percentage; // Prevent overflow
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
    failedPercentage = failedPercentage > 100 ? 100 : failedPercentage; // Prevent overflow
    failedProgress.style.width = failedPercentage + '%';
    failedProgress.setAttribute('data-count', failedCount);
    failedBar.appendChild(failedProgress);
  
    guessDistributionContainer.appendChild(failedBar);
  }
  
  // Share Results Function
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
  
    guesses.forEach((guess) => {
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
  
  // Generate Row Result for Sharing
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
  
  // Replace Character at Specific Index in String
  function replaceAt(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + 1);
  }
  
  // Save Puzzle State to Local Storage
  function savePuzzle(modeType, puzzleData) {
    const storedPuzzles = JSON.parse(localStorage.getItem('morphlePuzzles')) || {};
    storedPuzzles[modeType] = puzzleData;
    localStorage.setItem('morphlePuzzles', JSON.stringify(storedPuzzles));
  }  
  
  // Retrieve Puzzle State from Local Storage
  function getStoredPuzzle(modeType) {
    const storedPuzzles = JSON.parse(localStorage.getItem('morphlePuzzles')) || {};
    return storedPuzzles[modeType] || null;
  }
  
  // Save Guess to Puzzle State
  function saveGuess(guess) {
    if (mode !== 'daily' && mode !== 'unlimited') {
      return;
    }
  
    const puzzleData = getStoredPuzzle(mode);
  
    if (puzzleData) {
      puzzleData.guesses.push(guess);
      puzzleData.previousWord = guess; // Update previous word
      savePuzzle(mode, puzzleData);
    }
  }
  
  // Save Game Result (Win/Loss) to Puzzle State
  function saveGameResult(won) {
    if (mode !== 'daily' && mode !== 'unlimited') {
      return;
    }
  
    const puzzleData = getStoredPuzzle(mode);
  
    if (puzzleData) {
      puzzleData.played = true;
      puzzleData.won = won;
      savePuzzle(mode, puzzleData);
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
    if (mode === 'daily' || mode === 'unlimited') {
      populateOverlayStats(false); // Show current stats without game over
    }
    statsOverlay.style.display = 'flex';
  });
  
  modeButton.addEventListener('click', () => {
    mode = (mode === 'daily') ? 'unlimited' : 'daily';
  
    // Update mode button icon and tooltip
    updateModeButtonIcon();
  
    // Toggle game title with animation
    if (mode === 'daily') {
      animateGameTitle('Morphle Daily');
    } else {
      animateGameTitle('Morphle Unlimited');
    }
  
    // Fetch new puzzle based on mode
    fetchPuzzle(mode);
  
    console.log(`Switched to ${mode} mode.`);
  });  
  
  // Close Overlay on "X" Click
  closeOverlayButton.addEventListener('click', () => {
    statsOverlay.style.display = 'none';
  });
  
  // Share Button in Overlay
  shareButtonOverlay.addEventListener('click', shareResults);
  
  // Function to Update Mode Button Icon and Tooltip
  function updateModeButtonIcon() {
    const modeIcon = modeButton.querySelector('i');
    if (mode === 'daily') {
      modeIcon.classList.remove('fa-infinity');
      modeIcon.classList.add('fa-calendar-alt');
      modeButton.title = 'Switch to Unlimited Mode';
    } else {
      modeIcon.classList.remove('fa-calendar-alt');
      modeIcon.classList.add('fa-infinity');
      modeButton.title = 'Switch to Daily Mode';
    }
  }
  
  // Function to Animate Game Title
  function animateGameTitle(newText) {
    gameTitle.classList.add('animate-title');
    setTimeout(() => {
      gameTitle.textContent = newText;
      gameTitle.classList.remove('animate-title');
    }, 300); // Duration matches CSS animation duration
  }
  
  // Update Enter Key State Based on Guess Length
  function updateEnterKeyState() {
    const enterKey = keyboardContainer.querySelector(`[data-key='Enter']`);
    if (currentGuess.length === 5) {
      enterKey.classList.add('active-submit');
    } else {
      enterKey.classList.remove('active-submit');
    }
  }
  
});