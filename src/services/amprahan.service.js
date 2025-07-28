const db = require('../config/db.config');
const { AppError } = require('../middleware/errorHandler');

/**
 * @param {object} dataAmprahan 
 * @param {object} user
 * @returns {object}
 */
const createAmprahan = async (dataAmprahan, user) => {
    const { items, nama_petugas_pengambil, ruangan_tujuan, keterangan } = dataAmprahan;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let totalNilai = 0;
        const detailAmprahanToInsert = [];

        for (const item of items) {
            let jumlahDibutuhkan = item.jumlah_diambil;
            if (jumlahDibutuhkan <= 0) continue;

            const [batches] = await connection.execute(
                'SELECT * FROM tbl_batch_stok WHERE id_obat = ? AND jumlah_sisa > 0 ORDER BY expired_date ASC',
                [item.id_obat]
            );

            const totalStokTersedia = batches.reduce((sum, b) => sum + b.jumlah_sisa, 0);
            if (totalStokTersedia < jumlahDibutuhkan) {
                throw new AppError(`Stok tidak cukup untuk obat dengan ID ${item.id_obat}`, 400);
            }

            for (const batch of batches) {
                if (jumlahDibutuhkan <= 0) break;
                const jumlahAmbil = Math.min(jumlahDibutuhkan, batch.jumlah_sisa);

                await connection.execute(
                    'UPDATE tbl_batch_stok SET jumlah_sisa = jumlah_sisa - ? WHERE id_batch = ?',
                    [jumlahAmbil, batch.id_batch]
                );

                const subTotal = jumlahAmbil * parseFloat(batch.harga_jual_per_unit);
                totalNilai += subTotal;

                detailAmprahanToInsert.push([
                    batch.id_batch,
                    jumlahAmbil,
                    batch.harga_jual_per_unit,
                    subTotal
                ]);

                jumlahDibutuhkan -= jumlahAmbil;
            }
        }

        const kode_amprahan = `AMP-${Date.now()}`;
        const [headerResult] = await connection.execute(
            `INSERT INTO tbl_amprahan (kode_amprahan, nama_petugas_pengambil, ruangan_tujuan, keterangan, total_nilai, id_user_apoteker) 
           VALUES (?, ?, ?, ?, ?, ?)`,
            [kode_amprahan, nama_petugas_pengambil, ruangan_tujuan, keterangan, totalNilai, user.id]
        );
        const id_amprahan = headerResult.insertId;

        const detailWithAmprahanId = detailAmprahanToInsert.map(d => [id_amprahan, ...d]);
        await connection.query(
            'INSERT INTO tbl_amprahan_detail (id_amprahan, id_batch, jumlah_diambil, harga_saat_diambil, sub_total) VALUES ?',
            [detailWithAmprahanId]
        );

        await connection.commit();
        return { id_amprahan, kode_amprahan, total_nilai: totalNilai };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};


/**
 * @param {object} filters
 * @returns {Array}
 */
const getLaporanAmprahan = async (filters) => {
    const { bulan, tahun } = filters;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (bulan && tahun) {
        whereClause += ' AND MONTH(a.tanggal_amprahan) = ? AND YEAR(a.tanggal_amprahan) = ?';
        params.push(bulan, tahun);
    }

    const query = `
        SELECT 
            a.*,
            u.username AS nama_apoteker,
            GROUP_CONCAT(CONCAT(o.nama_obat, ' (', ad.jumlah_diambil, ')') SEPARATOR '; ') as detail_obat
        FROM tbl_amprahan a
        LEFT JOIN tbl_users u ON a.id_user_apoteker = u.id_user
        LEFT JOIN tbl_amprahan_detail ad ON a.id_amprahan = ad.id_amprahan
        LEFT JOIN tbl_batch_stok bs ON ad.id_batch = bs.id_batch
        LEFT JOIN tbl_obat o ON bs.id_obat = o.id_obat
        ${whereClause}
        GROUP BY a.id_amprahan
        ORDER BY a.tanggal_amprahan DESC;
    `;

    const [rows] = await db.query(query, params);

    let statusPeriode = 'Lunas';

    if (rows.length > 0) {
        const adaYangBelumLunas = rows.some(item => item.status === 'Belum Lunas');
        if (adaYangBelumLunas) {
            statusPeriode = 'Belum Lunas';
        }
    } else {
        statusPeriode = 'Tidak Ada Data';
    }
    return {
        daftarAmprahan: rows,
        statusPeriode: statusPeriode
    };
};
/**
 * @param {Array<number>} daftarIdAmprahan
 * @param {object} user
 */

const tandaiLunas = async (filterPelunasan, user) => {
    const { bulan, tahun } = filterPelunasan;
    if (!bulan || !tahun) {
        throw new AppError('Bulan dan tahun diperlukan untuk proses pelunasan.', 400);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ambil ID dan total nilai dari amprahan yang akan dilunasi
        // Ganti kutip ganda menjadi kutip tunggal
        const [rowsToProcess] = await connection.query(
            `SELECT id_amprahan, total_nilai
             FROM tbl_amprahan 
             WHERE MONTH(tanggal_amprahan) = ? AND YEAR(tanggal_amprahan) = ? AND status = 'Belum Lunas'`, // <-- PERBAIKAN 1
            [bulan, tahun]
        );

        if (rowsToProcess.length === 0) {
            throw new AppError('Tidak ada amprahan yang belum lunas untuk dilunasi pada periode ini.', 400);
        }

        const idsToUpdate = rowsToProcess.map(r => r.id_amprahan);
        const total_pelunasan = rowsToProcess.reduce((sum, row) => sum + parseFloat(row.total_nilai), 0);

        // 2. Update status semua amprahan menjadi 'Lunas'
        // Ganti kutip ganda menjadi kutip tunggal
        await connection.query(
            `UPDATE tbl_amprahan SET status = 'Lunas' WHERE id_amprahan IN (?)`, // <-- PERBAIKAN 2
            [idsToUpdate]
        );

        // 3. Buat transaksi ringkasan (kode ini sudah benar)
        const kode_transaksi = `LNS-AMP-${tahun}-${bulan}-${Date.now()}`;
        await connection.execute(
            `INSERT INTO tbl_transaksi (kode_transaksi, total_belanja, metode_pembayaran, jumlah_bayar, kembalian, id_user) 
           VALUES (?, ?, 'Amprahan', ?, 0, ?)`,
            [kode_transaksi, total_pelunasan, total_pelunasan, user.id]
        );

        await connection.commit();
        return { message: `${idsToUpdate.length} amprahan berhasil dilunasi dengan total nilai ${total_pelunasan}.` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createAmprahan,
    getLaporanAmprahan,
    tandaiLunas,
};