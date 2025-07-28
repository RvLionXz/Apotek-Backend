const db = require('../config/db.config');
const { AppError } = require('../middleware/errorHandler');


const getDashboardData = async () => {
    try {
        const [penjualanHariIniRows] = await db.query(
            "SELECT COALESCE(SUM(total_belanja), 0) as total FROM tbl_transaksi WHERE DATE(tanggal_transaksi) = CURDATE()"
        );

        const [obatTerjualHariIniRows] = await db.query(
            "SELECT COALESCE(SUM(dt.jumlah_jual), 0) as total FROM tbl_detail_transaksi dt JOIN tbl_transaksi t ON dt.id_transaksi = t.id_transaksi WHERE DATE(t.tanggal_transaksi) = CURDATE()"
        );

        const [grafikDataRows] = await db.query(`
            SELECT CAST(tanggal_transaksi AS DATE) as tanggal, SUM(total_belanja) as total
            FROM tbl_transaksi WHERE tanggal_transaksi >= CURDATE() - INTERVAL 6 DAY
            GROUP BY CAST(tanggal_transaksi AS DATE) ORDER BY tanggal ASC
        `);

        const [lowStockItems] = await db.query(`
            SELECT o.nama_obat, SUM(bs.jumlah_sisa) as total_stok
            FROM tbl_obat o JOIN tbl_batch_stok bs ON o.id_obat = bs.id_obat
            GROUP BY o.id_obat HAVING total_stok BETWEEN 1 AND 9
            ORDER BY total_stok ASC LIMIT 5;
        `);

        const [expiringItems] = await db.query(`
            SELECT o.nama_obat, MIN(bs.expired_date) as nearest_ed, SUM(bs.jumlah_sisa) as total_stok
            FROM tbl_obat o JOIN tbl_batch_stok bs ON o.id_obat = bs.id_obat
            WHERE bs.jumlah_sisa > 0 AND bs.expired_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            GROUP BY o.id_obat ORDER BY nearest_ed ASC LIMIT 5;
        `);

        return {
            totalPenjualanHariIni: penjualanHariIniRows[0].total,
            totalObatTerjualHariIni: obatTerjualHariIniRows[0].total,
            grafikPenjualan: grafikDataRows,
            lowStockItems,
            expiringItems
        };
    } catch (error) {
        console.error("Error in getDashboardData service:", error);
        throw new AppError("Gagal mengambil data dashboard dari database.", 500);
    }
};

/**
 * @param {object} filters
 * @returns {Array} 
 */

const getLaporanPenjualan = async (filters) => {
    const { bulan, tahun } = filters;
    let whereClause = '';
    const params = [];

    if (bulan && tahun) {
        whereClause = 'WHERE MONTH(t.tanggal_transaksi) = ? AND YEAR(t.tanggal_transaksi) = ?';
        params.push(bulan, tahun);
    }

    const query = `
        SELECT
            t.id_transaksi,
            t.kode_transaksi,
            t.tanggal_transaksi,
            t.total_belanja,
            t.metode_pembayaran,
            u.username AS kasir,
            -- Menggabungkan detail obat untuk setiap transaksi menjadi satu string
            GROUP_CONCAT(CONCAT(o.nama_obat, ' (', dt.jumlah_jual, ')') SEPARATOR '; ') AS detail_obat,
            -- Menghitung total laba untuk setiap transaksi
            SUM((o.harga_jual - o.harga_beli) * dt.jumlah_jual) AS total_laba
            FROM 
                tbl_transaksi t
            JOIN tbl_users u ON t.id_user = u.id_user
            LEFT JOIN tbl_detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
            LEFT JOIN tbl_batch_stok bs ON dt.id_batch = bs.id_batch
            LEFT JOIN tbl_obat o ON bs.id_obat = o.id_obat -- <-- Join ke tbl_obat
            ${whereClause}
            GROUP BY t.id_transaksi
            ORDER BY t.tanggal_transaksi DESC;
        `;

    const [rows] = await db.query(query, params);
    return rows;
};


module.exports = {
    getLaporanPenjualan,
    getDashboardData
};