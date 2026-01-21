const express = require('express');
const { getInventory, addMedicine, dispenseMedicines } = require('../controllers/pharmacy.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get('/inventory', authorize(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.DOCTOR), getInventory);
router.post('/inventory', authorize(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST), addMedicine);
router.post('/dispense', authorize(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST), dispenseMedicines);

module.exports = router;
