const PDFDocument = require("pdfkit");

const generatePDF = (campaign, evaluations, employeesMap) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(24).fillColor('#1976d2').text("Rapport d'Évaluation", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(18).fillColor('#333').text(campaign.title || "Campagne", { align: "center" });
      doc.moveDown();

      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ddd');
      doc.moveDown();

      // Campaign details
      doc.fontSize(14).fillColor('#1976d2').text("Détails de la campagne", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#333');
      
      if (campaign.description) {
        doc.text(`Description: ${campaign.description}`);
      }
      if (campaign.department) {
        doc.text(`Département: ${campaign.department}`);
      }
      if (campaign.startDate) {
        doc.text(`Date de début: ${new Date(campaign.startDate).toLocaleDateString('fr-FR')}`);
      }
      if (campaign.endDate) {
        doc.text(`Date de fin: ${new Date(campaign.endDate).toLocaleDateString('fr-FR')}`);
      }
      doc.text(`Statut: ${campaign.status === 'completed' ? 'Terminée' : 'En cours'}`);
      doc.moveDown();

      // Statistics
      if (evaluations && evaluations.length > 0) {
        const stats = {
          total: evaluations.length,
          excellent: evaluations.filter(e => e.finalResult === 'excellent').length,
          normal: evaluations.filter(e => e.finalResult === 'normal').length,
          failed: evaluations.filter(e => e.finalResult === 'failed').length,
          avgScore: Math.round(evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / evaluations.length)
        };

        doc.fontSize(14).fillColor('#1976d2').text("Statistiques", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        doc.text(`Total des évaluations: ${stats.total}`);
        doc.text(`Score moyen: ${stats.avgScore}/100`);
        doc.text(`Excellents (≥80%): ${stats.excellent}`);
        doc.text(`Satisfaisants (40-80%): ${stats.normal}`);
        doc.text(`Insuffisants (<40%): ${stats.failed}`);
        doc.moveDown();

        // Evaluations list
        doc.fontSize(14).fillColor('#1976d2').text("Détail des évaluations", { underline: true });
        doc.moveDown(0.5);
        
        evaluations.forEach((evaluation, index) => {
          const employee = evaluation.employeeId;
          const employeeName = employee?.fullName || "Employé inconnu";
          const department = employee?.department || "N/A";
          
          // Résultat avec couleur
          let resultColor = '#666';
          let resultText = 'En attente';
          if (evaluation.finalResult === 'excellent') {
            resultColor = '#2e7d32';
            resultText = 'Excellent';
          } else if (evaluation.finalResult === 'normal') {
            resultColor = '#ed6c02';
            resultText = 'Satisfaisant';
          } else if (evaluation.finalResult === 'failed') {
            resultColor = '#d32f2f';
            resultText = 'Insuffisant';
          }

          doc.fontSize(11).fillColor('#333');
          doc.text(`${index + 1}. ${employeeName}`, { continued: true });
          doc.fillColor('#666').text(` (${department})`);
          
          if (evaluation.score !== undefined && evaluation.score !== null) {
            doc.fillColor('#333').text(`   Score: ${evaluation.score}/100`, { continued: true });
            doc.fillColor(resultColor).text(` - ${resultText}`);
          }

          // Critères détaillés
          if (evaluation.punctuality != null) {
            doc.fontSize(10).fillColor('#666');
            doc.text(`   Critères: Ponctualité: ${evaluation.punctuality}/20, Qualité: ${evaluation.workQuality}/20, Initiative: ${evaluation.initiative}/20, Équipe: ${evaluation.teamwork}/20, Communication: ${evaluation.communication}/20`);
          }

          // Décision RH
          if (evaluation.hrDecision && evaluation.hrDecision !== 'aucune') {
            const decisionLabels = {
              prime: 'Prime',
              formation: 'Formation',
              sanction: 'Sanction'
            };
            doc.fontSize(10).fillColor('#9c27b0');
            doc.text(`   Décision RH: ${decisionLabels[evaluation.hrDecision] || evaluation.hrDecision}`);
            if (evaluation.hrDecisionDetails) {
              doc.fillColor('#666').text(`   Détails: ${evaluation.hrDecisionDetails}`);
            }
          }

          // Commentaires
          if (evaluation.commentChefEquipe) {
            doc.fontSize(9).fillColor('#666').text(`   Commentaire chef d'équipe: ${evaluation.commentChefEquipe}`);
          }
          if (evaluation.commentManager) {
            doc.fontSize(9).fillColor('#666').text(`   Commentaire manager: ${evaluation.commentManager}`);
          }
          if (evaluation.commentRH) {
            doc.fontSize(9).fillColor('#666').text(`   Commentaire RH: ${evaluation.commentRH}`);
          }

          doc.moveDown(0.5);
          
          // Nouvelle page si nécessaire
          if (doc.y > 700) {
            doc.addPage();
          }
        });
      } else {
        doc.fontSize(12).fillColor('#666').text("Aucune évaluation trouvée pour cette campagne.");
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#999');
      doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generatePDF;
