const STORAGE_KEY = 'movieColorGame';

// Metadata (will be fetched from API)
let START_DATE = null;
let NUM_PUZZLES = 0;

// DOM elements
const loading = document.getElementById('loading');
const alreadyPlayed = document.getElementById('already-played');
const noPuzzle = document.getElementById('no-puzzle');
const errorElement = document.getElementById('error');
const game = document.getElementById('game');
const colorStrip = document.getElementById('color-strip');
const optionsContainer = document.getElementById('options-container');
const result = document.getElementById('result');
const resultMessage = document.getElementById('result-message');
const calendarBtn = document.getElementById('calendar-btn');
const calendarModal = document.getElementById('calendar-modal');
const closeModal = document.getElementById('close-modal');
const calendarGrid = document.getElementById('calendar-grid');
const puzzleDateDisplay = document.getElementById('puzzle-date');
const shareButtons = document.getElementById('share-buttons');
const copyBtn = document.getElementById('copy-btn');
const shareBtn = document.getElementById('share-btn');

let currentPuzzle = null;
let hasAnswered = false;
let currentDate = null;
let guessCount = 0;

// Initialize game
async function init() {
    currentDate = getTodayDate();

    // Set up calendar event listeners
    calendarBtn.addEventListener('click', openCalendar);
    closeModal.addEventListener('click', closeCalendarModal);
    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            closeCalendarModal();
        }
    });

    // Set up share button listeners
    copyBtn.addEventListener('click', copyToClipboard);
    shareBtn.addEventListener('click', shareViaWebAPI);

    // Show Web Share button only if API is available
    if (navigator.share) {
        shareBtn.classList.remove('hidden');
    }

    // Fetch metadata first
    try {
        const metadata = await fetchMetadata();
        START_DATE = metadata.startDate;
        NUM_PUZZLES = metadata.totalPuzzles;
    } catch (error) {
        console.error('Failed to load metadata:', error);
        // Fallback to defaults if metadata fails
        START_DATE = '2025-12-29';
        NUM_PUZZLES = 3;
    }

    // Load today's puzzle (will show completed state if already played)
    await loadPuzzle();
}

// Fetch metadata from API
async function fetchMetadata() {
    const response = await fetch('/api/metadata');
    if (!response.ok) {
        throw new Error('Failed to fetch metadata');
    }
    return await response.json();
}

// Load puzzle for current date
async function loadPuzzle(date = null) {
    const puzzleDate = date || currentDate;

    try {
        const puzzle = await fetchPuzzle(puzzleDate);
        currentPuzzle = puzzle;
        currentDate = puzzleDate;

        // Hide all messages
        hideElement(alreadyPlayed);
        hideElement(noPuzzle);
        hideElement(errorElement);
        hideElement(loading);

        // Update date display
        updateDateDisplay(puzzleDate);

        // Check if this puzzle was already played
        const savedResult = getPuzzleResult(puzzleDate);
        if (savedResult) {
            // Render in completed state
            hasAnswered = true;
            guessCount = savedResult.guessCount || 1;
            renderGame(puzzle);
            renderCompletedState(savedResult);
        } else {
            // Render fresh puzzle
            hasAnswered = false;
            guessCount = 0;
            renderGame(puzzle);
            result.classList.remove('correct-result', 'wrong-result');
            hideElement(result);
        }

        showElement(game);

    } catch (error) {
        hideElement(loading);
        hideElement(game);
        if (error.status === 404) {
            showElement(noPuzzle);
        } else {
            showElement(errorElement);
        }
    }
}

// Fetch puzzle from API
async function fetchPuzzle(date = null) {
    const url = date ? `/api/puzzle?date=${date}` : '/api/puzzle';
    const response = await fetch(url);

    if (!response.ok) {
        const error = new Error('Failed to fetch puzzle');
        error.status = response.status;
        throw error;
    }

    return await response.json();
}

// Render game UI
function renderGame(puzzle) {
    // Set color strip image
    colorStrip.src = puzzle.imageUrl;
    colorStrip.alt = 'Movie color strip';

    // Render option buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    puzzle.options.forEach((option, index) => {
        buttons[index].textContent = option;
        buttons[index].dataset.answer = option;
        buttons[index].disabled = false;
        buttons[index].classList.remove('correct', 'wrong', 'unselected');
        buttons[index].onclick = () => handleAnswer(option);
    });
}

// Handle answer selection
function handleAnswer(selectedAnswer) {
    if (hasAnswered) return;

    guessCount++;
    const isCorrect = selectedAnswer === currentPuzzle.correctAnswer;

    if (isCorrect) {
        // Correct answer - end the game
        hasAnswered = true;
        const result = {
            selectedAnswer: selectedAnswer,
            correctAnswer: currentPuzzle.correctAnswer,
            isCorrect: isCorrect,
            guessCount: guessCount
        };

        // Render completed state
        renderCompletedState(result);

        // Mark as played and save result
        savePuzzleResult(currentDate, result);
    } else {
        // Wrong answer - show feedback but allow more guesses
        showIncorrectFeedback(selectedAnswer);
    }
}

// Render puzzle in completed state
function renderCompletedState(savedResult) {
    const { selectedAnswer, correctAnswer, isCorrect, guessCount } = savedResult;

    // Disable all buttons and apply styles
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;

        if (btn.dataset.answer === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === selectedAnswer) {
            btn.classList.add('wrong');
        } else {
            btn.classList.add('unselected');
        }
    });

    // Show result
    showResult(isCorrect, guessCount || 1);
}

// Show incorrect feedback (doesn't end the game)
function showIncorrectFeedback(selectedAnswer) {
    // Temporarily disable the wrong button and mark it
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        if (btn.dataset.answer === selectedAnswer) {
            btn.classList.add('wrong');
            btn.disabled = true;
        }
    });

    // Show temporary feedback message
    resultMessage.textContent = 'Incorrect! Try again.';
    result.classList.remove('correct-result');
    result.classList.add('wrong-result');
    hideElement(shareButtons);
    showElement(result);
}

// Show result message
function showResult(isCorrect, guessCount) {
    if (isCorrect) {
        const guessText = guessCount === 1 ? '1 guess' : `${guessCount} guesses`;
        resultMessage.textContent = `Correct! You got it in ${guessText}!`;
        result.classList.add('correct-result');
        showElement(shareButtons);
    } else {
        resultMessage.textContent = `Wrong! The correct answer was "${currentPuzzle.correctAnswer}".`;
        result.classList.add('wrong-result');
        hideElement(shareButtons);
    }

    showElement(result);
}

// Generate share text
function generateShareText() {
    const savedResult = getPuzzleResult(currentDate);
    if (!savedResult || !savedResult.isCorrect) return null;

    const { guessCount } = savedResult;

    // Calculate puzzle number
    const startDate = createLocalDate(START_DATE);
    const currentPuzzleDate = createLocalDate(currentDate);
    const daysDiff = Math.floor((currentPuzzleDate - startDate) / (1000 * 60 * 60 * 24));
    const puzzleNumber = daysDiff + 1;

    // Generate emoji pattern: red squares for wrong guesses, green for correct
    const wrongGuesses = guessCount - 1;
    const emojiPattern = '🟥'.repeat(wrongGuesses) + '🟩';

    // Format the date nicely
    const date = createLocalDate(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    const guessText = guessCount === 1 ? '1 guess' : `${guessCount} guesses`;
    return `Gradient #${puzzleNumber} - ${dateStr}\n🎬 Got it in ${guessText}!\n${emojiPattern}\n\nPlay at: ${window.location.origin}`;
}

// Copy to clipboard
async function copyToClipboard() {
    const shareText = generateShareText();
    if (!shareText) return;

    try {
        await navigator.clipboard.writeText(shareText);

        // Show visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.log('Clipboard write failed:', error);
        // Fallback: show alert with text to copy manually
        alert('Copy this:\n\n' + shareText);
    }
}

// Share via Web Share API
async function shareViaWebAPI() {
    const shareText = generateShareText();
    if (!shareText) return;

    try {
        await navigator.share({
            text: shareText
        });
    } catch (error) {
        // Silently fail if user cancels share
        console.log('Share cancelled:', error);
    }
}

// LocalStorage functions
function hasPlayedDate(date) {
    const data = getStorageData();
    return data.puzzleResults && data.puzzleResults[date] !== undefined;
}

function savePuzzleResult(date, result) {
    const data = getStorageData();
    if (!data.puzzleResults) {
        data.puzzleResults = {};
    }
    data.puzzleResults[date] = result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getPuzzleResult(date) {
    const data = getStorageData();
    return data.puzzleResults ? data.puzzleResults[date] : null;
}

function getStorageData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { puzzleResults: {} };
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Helper function to create date from YYYY-MM-DD string in local timezone
function createLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Update puzzle date display
function updateDateDisplay(dateStr) {
    const today = getTodayDate();
    if (dateStr === today) {
        puzzleDateDisplay.textContent = 'Today';
    } else {
        const date = createLocalDate(dateStr);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        puzzleDateDisplay.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

// Calendar functions
function openCalendar() {
    generateCalendar();
    showElement(calendarModal);
}

function closeCalendarModal() {
    hideElement(calendarModal);
}

function generateCalendar() {
    calendarGrid.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = createLocalDate(START_DATE);

    // Add day headers
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    dayNames.forEach(day => {
        const headerElement = document.createElement('div');
        headerElement.classList.add('calendar-header');
        headerElement.textContent = day;
        calendarGrid.appendChild(headerElement);
    });

    // Get the first puzzle date and find what day of the week it starts on
    const firstPuzzleDate = new Date(startDate);
    const firstDayOfWeek = firstPuzzleDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Add empty cells for days before the first puzzle
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Add puzzle days
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < NUM_PUZZLES; i++) {
        const puzzleDate = new Date(startDate);
        puzzleDate.setDate(startDate.getDate() + i);

        const dateStr = puzzleDate.toISOString().split('T')[0];
        const dayElement = document.createElement('button');
        dayElement.classList.add('calendar-day');

        // Check if this date is in the future
        if (puzzleDate > today) {
            dayElement.classList.add('future');
            dayElement.disabled = true;
        }

        // Create puzzle number
        const puzzleNumber = document.createElement('div');
        puzzleNumber.classList.add('puzzle-number');
        puzzleNumber.textContent = `#${i + 1}`;

        // Create date display
        const dateDisplay = document.createElement('div');
        dateDisplay.classList.add('date-display');
        const monthAbbr = monthNames[puzzleDate.getMonth()];
        dateDisplay.textContent = `${monthAbbr} ${puzzleDate.getDate()}`;

        dayElement.appendChild(puzzleNumber);
        dayElement.appendChild(dateDisplay);

        // Mark today
        if (dateStr === getTodayDate()) {
            dayElement.classList.add('today');
        }

        // Add status indicator
        if (puzzleDate <= today) {
            const indicator = document.createElement('div');
            indicator.classList.add('status-indicator');
            if (hasPlayedDate(dateStr)) {
                indicator.classList.add('played');
            }
            dayElement.appendChild(indicator);
        }

        if (puzzleDate <= today) {
            dayElement.addEventListener('click', () => {
                closeCalendarModal();
                loadPuzzle(dateStr);
            });
        }

        calendarGrid.appendChild(dayElement);
    }
}

// UI helper functions
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Start the game
init();
