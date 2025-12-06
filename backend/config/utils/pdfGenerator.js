const PDFDocument = require("pdfkit");

const generatePDF = (campaign, evaluations, employeesMap) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", (err) => reject(err));

      // Title
      doc.fontSize(20).text(campaign.title || "Campaign Report", { align: "center" });
      doc.moveDown();

      // Campaign details
      doc.fontSize(14).text("Campaign Details", { underline: true });
      doc.fontSize(12);
      if (campaign.description) {
        doc.text(`Description: ${campaign.description}`);
      }
      if (campaign.startDate) {
        doc.text(`Start Date: ${new Date(campaign.startDate).toLocaleDateString()}`);
      }
      if (campaign.endDate) {
        doc.text(`End Date: ${new Date(campaign.endDate).toLocaleDateString()}`);
      }
      doc.moveDown();

      // Evaluations
      if (evaluations && evaluations.length > 0) {
        doc.fontSize(14).text("Evaluations", { underline: true });
        doc.fontSize(12);
        
        evaluations.forEach((evaluation, index) => {
          const employeeIdStr = evaluation.employeeId?.toString ? evaluation.employeeId.toString() : String(evaluation.employeeId);
          const employee = employeesMap[employeeIdStr];
          const employeeName = employee ? employee.fullName : "Unknown Employee";
          
          doc.text(`${index + 1}. ${employeeName}`);
          if (evaluation.score !== undefined && evaluation.score !== null) {
            doc.text(`   Score: ${evaluation.score}`);
          }
          if (evaluation.finalResult) {
            doc.text(`   Result: ${evaluation.finalResult}`);
          }
          if (evaluation.commentManager) {
            doc.text(`   Manager Comment: ${evaluation.commentManager}`);
          }
          if (evaluation.commentRH) {
            doc.text(`   RH Comment: ${evaluation.commentRH}`);
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(12).text("No evaluations found for this campaign.");
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generatePDF;
