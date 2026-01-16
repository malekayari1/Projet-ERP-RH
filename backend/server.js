require("dotenv").config();
require("express-async-errors"); // handles async errors
const express = require("express");
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

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

// Utiliser le port du .env ou 5001 par défaut
const PORT = process.env.PORT || 5001;

// Connexion à MongoDB (désormais uniquement locale pour éviter les erreurs Atlas)
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Gérer proprement l'erreur "EADDRINUSE" (port déjà utilisé)
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Le port ${PORT} est déjà utilisé. ` +
        `Soit un autre serveur tourne déjà, soit un ancien processus n'est pas fermé.`
      );
      process.exit(1);
    } else {
      throw err;
    }
  });
});
