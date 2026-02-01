const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seed.controller');

// UNPROTECTED ROUTE - For initial seeding only when DB is empty
// Usage: POST /api/v1/admin/seed-db-init
router.post('/seed-db-init', seedController.runSeed);

module.exports = router;
