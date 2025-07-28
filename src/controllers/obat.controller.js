const obatService = require('../services/obat.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.getAllObat = asyncHandler(async (req, res) => {
  const searchQuery = req.query.search || ''; 
  const allObat = await obatService.findAllObatWithStok(searchQuery);
  res.status(200).json({ success: true, data: allObat });
});

exports.createJenisObat = asyncHandler(async (req, res) => {
  const newObat = await obatService.createJenisObat(req.body);
  res.status(201).json({ success: true, data: newObat, message: "Jenis obat baru berhasil ditambahkan." });
});

exports.getObatById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const obatDetail = await obatService.findObatDetailById(id);
  if (!obatDetail) {
    throw new AppError("Obat tidak ditemukan", 404);
  }
  res.status(200).json({ success: true, data: obatDetail });
});

exports.addStokObat = asyncHandler(async (req, res) => {
  const { id: id_obat } = req.params;
  const newStok = await obatService.addStokToObat(id_obat, req.body);
  res.status(201).json({ success: true, data: newStok, message: "Stok berhasil ditambahkan." });
});


exports.deleteObat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await obatService.deleteObatById(id);
  res.status(200).json({ success: true, message: result.message });
});

exports.updateObat = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedObat = await obatService.updateJenisObat(id, req.body);
    res.status(200).json({ success: true, data: updatedObat, message: 'Data obat berhasil diperbarui.' });
});