const STORAGE_KEY = 'movieColorGame';

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

let currentPuzzle = null;
let hasAnswered = false;

// Initialize game
async function init() {
    // Check if already played today
    if (hasPlayedToday()) {
        showElement(alreadyPlayed);
        hideElement(loading);
        return;
    }

    // Fetch today's puzzle
    try {
        const puzzle = await fetchPuzzle();
        currentPuzzle = puzzle;
        renderGame(puzzle);
        hideElement(loading);
        showElement(game);
    } catch (error) {
        hideElement(loading);
        if (error.status === 404) {
            showElement(noPuzzle);
        } else {
            showElement(errorElement);
        }
    }
}

// Fetch puzzle from API
async function fetchPuzzle() {
    const response = await fetch('/api/puzzle');

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
        buttons[index].onclick = () => handleAnswer(option);
    });
}

// Handle answer selection
function handleAnswer(selectedAnswer) {
    if (hasAnswered) return;

    hasAnswered = true;
    const isCorrect = selectedAnswer === currentPuzzle.correctAnswer;

    // Disable all buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;

        if (btn.dataset.answer === currentPuzzle.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === selectedAnswer) {
            btn.classList.add('wrong');
        } else {
            btn.classList.add('unselected');
        }
    });

    // Show result
    showResult(isCorrect);

    // Mark as played
    markAsPlayed();
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
function hasPlayedToday() {
    const data = getStorageData();
    const today = getTodayDate();
    return data.lastPlayedDate === today;
}

function markAsPlayed() {
    const data = getStorageData();
    data.lastPlayedDate = getTodayDate();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStorageData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
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
