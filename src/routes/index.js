const express = require('express');
const router = express.Router();

const obatRoutes = require('./obat.routes');
const transaksiRoutes = require('./transaksi.routes');
const laporanRoutes = require('./laporan.routes');
const authRoutes = require('./auth.routes');
const amprahanRoutes = require('./amprahan.routes');

router.use('/obat', obatRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/laporan', laporanRoutes);
router.use('/auth', authRoutes);
router.use('/amprahan', amprahanRoutes);

module.exports = router;