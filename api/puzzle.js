const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Load puzzle data
    const dataPath = path.join(process.cwd(), 'data', 'puzzles.json');
    const puzzleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Get date from query parameter (date is already in YYYY-MM-DD format from frontend)
    let targetDateStr;
    if (req.query.date) {
      targetDateStr = req.query.date;
    } else {
      // This shouldn't happen, but fallback to today in local timezone
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;
    }

    // Parse dates as UTC to avoid timezone issues
    const targetDate = new Date(targetDateStr + 'T00:00:00Z');
    const startDate = new Date(puzzleData.startDate + 'T00:00:00Z');

    const daysSinceStart = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));

    // Check if puzzle exists for the requested date
    if (daysSinceStart < 0 || daysSinceStart >= puzzleData.puzzles.length) {
      console.log('Puzzle not found. Days since start:', daysSinceStart);
      return res.status(404).json({
        error: 'No puzzle available for this date',
        message: 'Check back soon for a new puzzle!'
      });
    }

    const puzzle = puzzleData.puzzles[daysSinceStart];

    // Shuffle options (correct answer + wrong answers)
    const options = [puzzle.movieTitle, ...puzzle.wrongAnswers];
    shuffleArray(options);

    // Return puzzle
    res.status(200).json({
      puzzleId: puzzle.id,
      date: targetDateStr,
      imageUrl: `/images/${puzzle.imageFilename}`,
      options: options,
      correctAnswer: puzzle.movieTitle
    });

  } catch (error) {
    console.error('Error loading puzzle:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load puzzle'
    });
  }
};

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
