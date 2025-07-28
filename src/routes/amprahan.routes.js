
const express = require('express');
const router = express.Router();
const amprahanController = require('../controllers/amprahan.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, amprahanController.createAmprahan);
router.get('/', protect, authorize('admin'), amprahanController.getLaporan);
router.post('/lunas', protect, authorize('admin'), amprahanController.tandaiLunas);

module.exports = router;