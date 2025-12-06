// calcule score moyen et résultat final selon le diagramme
const calculateScoreAndResult = ({ punctuality = 0, initiative = 0, workQuality = 0, otherCriteria = {} }) => {
    let sum = punctuality + initiative + workQuality;
    let count = 3;
    for (const v of Object.values(otherCriteria || {})) {
      sum += Number(v || 0);
      count++;
    }
    const score = count ? Math.round((sum / (count * 100)) * 100) : 0; // suppose notes 0-100 -> score moyenne 0-100
    let finalResult = "failed";
    if (score >= 80) finalResult = "excellent";
    else if (score >= 40) finalResult = "normal";
    else finalResult = "failed";
    return { score, finalResult };
  };
  
  module.exports = calculateScoreAndResult;
  