const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadDocument, getPendingDocuments, verifyDocument } = require("../controllers/documentController");
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Employee: Upload - Now uses multer middleware
router.post("/upload", protect, permit("employee", "chef_equipe", "manager", "rh", "directeur"), upload.single('file'), uploadDocument);

// RH: View Pending
router.get("/pending", protect, permit("rh", "directeur"), getPendingDocuments);

// RH: Verify
router.post("/verify", protect, permit("rh", "directeur"), verifyDocument);

module.exports = router;
