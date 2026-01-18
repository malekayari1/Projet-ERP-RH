/**
 * Calculate the final score and result based on evaluation criteria
 * @param {Object} params - Evaluation criteria
 * @param {number} params.punctuality - Punctuality score (0-100)
 * @param {number} params.initiative - Initiative score (0-100)
 * @param {number} params.workQuality - Work quality score (0-100)
 * @param {Object} params.otherCriteria - Additional criteria with their scores
 * @returns {Object} - Contains score and finalResult
 */
const calculateResult = ({ punctuality = 0, initiative = 0, workQuality = 0, otherCriteria = {} }) => {
  // Convert otherCriteria values to an array of scores
  const otherScores = Object.values(otherCriteria).filter(Number.isFinite);
  
  // Calculate the average of all scores
  const totalScores = [punctuality, initiative, workQuality, ...otherScores];
  const score = totalScores.reduce((sum, val) => sum + val, 0) / totalScores.length;
  
  // Determine final result based on score
  let finalResult;
  if (score < 40) {
    finalResult = 'failed';
  } else if (score > 80) {
    finalResult = 'excellent';
  } else {
    finalResult = 'normal';
  }
  
  return { score: parseFloat(score.toFixed(2)), finalResult };
};

module.exports = calculateResult;
