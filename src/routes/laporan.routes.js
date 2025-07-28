const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporan.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/penjualan', protect, authorize('admin'), laporanController.getLaporanPenjualan);

router.get('/dashboard', protect, laporanController.getDashboardData);

module.exports = router;