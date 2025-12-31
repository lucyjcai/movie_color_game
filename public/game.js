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

let currentPuzzle = null;
let hasAnswered = false;
let currentDate = null;

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
            renderGame(puzzle);
            renderCompletedState(savedResult);
        } else {
            // Render fresh puzzle
            hasAnswered = false;
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

    hasAnswered = true;
    const isCorrect = selectedAnswer === currentPuzzle.correctAnswer;

    // Save result
    const result = {
        selectedAnswer: selectedAnswer,
        correctAnswer: currentPuzzle.correctAnswer,
        isCorrect: isCorrect
    };

    // Render completed state
    renderCompletedState(result);

    // Mark as played and save result
    savePuzzleResult(currentDate, result);
}

// Render puzzle in completed state
function renderCompletedState(savedResult) {
    const { selectedAnswer, correctAnswer, isCorrect } = savedResult;

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
    showResult(isCorrect);
}

// Show result message
function showResult(isCorrect) {
    if (isCorrect) {
        resultMessage.textContent = 'Correct! Well done!';
        result.classList.add('correct-result');
    } else {
        resultMessage.textContent = `Wrong! The correct answer was "${currentPuzzle.correctAnswer}".`;
        result.classList.add('wrong-result');
    }

    showElement(result);
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

    // Calculate available dates
    for (let i = 0; i < NUM_PUZZLES; i++) {
        const puzzleDate = new Date(startDate);
        puzzleDate.setDate(startDate.getDate() + i);

        // Only show dates up to today
        if (puzzleDate > today) {
            break;
        }

        const dateStr = puzzleDate.toISOString().split('T')[0];
        const dayElement = document.createElement('button');
        dayElement.classList.add('calendar-day');

        // Format as "Dec 29"
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthAbbr = monthNames[puzzleDate.getMonth()];
        dayElement.textContent = `${monthAbbr} ${puzzleDate.getDate()}`;

        // Mark today
        if (dateStr === getTodayDate()) {
            dayElement.classList.add('today');
        }

        // Mark played dates
        if (hasPlayedDate(dateStr)) {
            dayElement.classList.add('played');
        }

        dayElement.addEventListener('click', () => {
            closeCalendarModal();
            loadPuzzle(dateStr);
        });

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
