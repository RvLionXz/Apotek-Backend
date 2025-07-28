const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, transaksiController.createTransaksi);
router.get('/:id', protect, transaksiController.getTransaksiById);

module.exports = router;