const laporanService = require('../services/laporan.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePenjualanExcel } = require('../utils/excelGenerator');

exports.getLaporanPenjualan = asyncHandler(async (req, res) => {
    const { format = 'json', ...filters } = req.query;
    
    const dataLaporan = await laporanService.getLaporanPenjualan(filters);

    if (format.toLowerCase() === 'excel') {
        const buffer = await generatePenjualanExcel(dataLaporan, filters);
        const filename = `Laporan_Penjualan_${filters.bulan}-${filters.tahun}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        return res.send(buffer);
    }
    
    res.status(200).json({ success: true, data: dataLaporan });
});

exports.getDashboardData = asyncHandler(async(req, res) => {
    const data = await laporanService.getDashboardData();
    res.status(200).json({ success: true, data: data });
});