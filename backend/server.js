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

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
