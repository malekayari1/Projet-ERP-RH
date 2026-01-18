const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const leaveController = require("../controllers/leaveController");
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");

// Multer Storage Configuration (Same as documents.js)
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

// Routes
router.post("/", protect, upload.single('file'), leaveController.createRequest);
router.get("/my-leaves", protect, leaveController.getMyLeaves);

// Manager
router.get("/manager", protect, permit("manager", "rh", "directeur"), leaveController.getManagerLeaves);
router.post("/manager-validate", protect, permit("manager", "rh", "directeur"), leaveController.validateManager);

// RH
router.get("/rh", protect, permit("rh", "directeur"), leaveController.getRHLeaves);
router.post("/rh-validate", protect, permit("rh", "directeur"), leaveController.validateRH);

module.exports = router;
