const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Load puzzle data
    const dataPath = path.join(process.cwd(), 'data', 'puzzles.json');
    const puzzleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Return metadata
    res.status(200).json({
      startDate: puzzleData.startDate,
      totalPuzzles: puzzleData.puzzles.length
    });

  } catch (error) {
    console.error('Error loading metadata:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load metadata'
    });
  }
};
