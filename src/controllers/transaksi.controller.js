const transaksiService = require('../services/transaksi.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.createTransaksi = asyncHandler(async (req, res) => {
  const result = await transaksiService.createTransaksi(req.body, req.user);

  res.status(201).json({ success: true, data: result, message: "Transaksi berhasil dibuat." });
});

exports.getTransaksiById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaksi = await transaksiService.findTransaksiById(id);
  if (!transaksi) {
    throw new AppError("Transaksi tidak ditemukan.", 404);
  }
  res.status(200).json({ success: true, data: transaksi });
});