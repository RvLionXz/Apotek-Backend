const amprahanService = require('../services/amprahan.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateAmprahanExcel } = require('../utils/excelGenerator');

exports.createAmprahan = asyncHandler(async (req, res, next) => {
    const result = await amprahanService.createAmprahan(req.body, req.user);
    res.status(201).json({ success: true, data: result, message: 'Data amprahan berhasil dicatat.' });
});

exports.getLaporan = asyncHandler(async (req, res, next) => {
    const { format = 'json', ...filters } = req.query;

    const serviceResponse = await amprahanService.getLaporanAmprahan(filters);

    if (format.toLowerCase() === 'excel') {
        const buffer = await generateAmprahanExcel(serviceResponse.daftarAmprahan, filters);

        const bulan = filters.bulan || new Date().getMonth() + 1;
        const tahun = filters.tahun || new Date().getFullYear();
        const filename = `Laporan_Amprahan_${bulan}-${tahun}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } else {
        res.status(200).json({ success: true, data: serviceResponse });
    }
});

exports.tandaiLunas = asyncHandler(async (req, res, next) => {
    const result = await amprahanService.tandaiLunas(req.body, req.user);
    res.status(200).json({ success: true, message: result.message });
});