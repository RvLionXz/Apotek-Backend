const express = require('express');
const router = express.Router();
const obatController = require('../controllers/obat.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.get('/', protect, obatController.getAllObat);
router.get('/:id', protect, obatController.getObatById);
router.post('/:id/stok', protect, obatController.addStokObat);
router.delete('/:id', protect, authorize('admin'), obatController.deleteObat);
router.post('/', protect, authorize('admin'), obatController.createJenisObat);
router.put('/:id', protect, authorize('admin'), obatController.updateObat);

module.exports = router;