require("dotenv").config();
require("express-async-errors"); // handles async errors
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const employeeRoutes = require("./routes/employees");
const evaluationRoutes = require("./routes/evaluations");
const notificationRoutes = require("./routes/notifications");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const emailRoutes = require("./routes/emails");
const documentRoutes = require("./routes/documents");
const contractRoutes = require("./routes/contracts");
const leaveRoutes = require("./routes/leaves");
const jobOfferRoutes = require("./routes/jobOffers");
const candidateRoutes = require("./routes/candidates");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/job-offers", jobOfferRoutes);
app.use("/api/candidates", candidateRoutes);
const payrollRoutes = require("./routes/payroll");
app.use("/api/payroll", payrollRoutes);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

// Forcer le port à 5001 pour correspondre à la configuration frontend
const PORT = 5001;

// Connexion à MongoDB
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Gérer proprement l'erreur "EADDRINUSE"
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Le port ${PORT} est déjà utilisé.`
      );
      process.exit(1);
    } else {
      throw err;
    }
  });
});
