const db = require('../config/db.config');
const { AppError } = require('../middleware/errorHandler');

const findAllObatWithStok = async (searchQuery = '') => {
    const searchParam = `%${searchQuery}%`;
    const whereClauses = [];
    const params = [];

    if (searchQuery) {
        whereClauses.push(`(
            o.nama_obat LIKE ? OR 
            o.bentuk_sediaan LIKE ? OR 
            o.kandungan_obat LIKE ?
        )`);
        params.push(searchParam, searchParam, searchParam);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
        SELECT 
            o.id_obat,
            o.nama_obat,
            o.bentuk_sediaan,
            o.kandungan_obat,
            o.lead_time_hari,
            o.periode_pengadaan_hari,
            o.harga_jual AS harga, -- Harga diambil langsung dari tbl_obat
            o.harga_beli, -- Kita juga perlu harga beli untuk kalkulasi di masa depan
            COALESCE(stok.total_sisa, 0) AS total_stok,
            stok.ed_terdekat,

            COALESCE(konsumsi.total_terjual / 30, 0) AS konsumsi_rata_rata_per_hari,
            (2 * o.lead_time_hari * COALESCE(konsumsi.total_terjual / 30, 0)) AS stok_minimum,
            
            (CASE
                WHEN COALESCE(stok.total_sisa, 0) > 0 AND COALESCE(stok.total_sisa, 0) <= (2 * o.lead_time_hari * COALESCE(konsumsi.total_terjual / 30, 0))
                THEN 1
                ELSE 0
            END) AS is_low_stock,

            (CASE 
                WHEN stok.ed_terdekat IS NOT NULL AND DATEDIFF(stok.ed_terdekat, CURDATE()) <= 30
                THEN 1 
                ELSE 0 
            END) AS is_nearing_expiry

        FROM tbl_obat o

        LEFT JOIN (
            SELECT 
                id_obat,
                SUM(jumlah_sisa) as total_sisa,
                MIN(CASE WHEN jumlah_sisa > 0 THEN expired_date ELSE NULL END) as ed_terdekat
                -- Kolom 'harga_jual_per_unit' sudah dihapus dari subquery ini
            FROM tbl_batch_stok
            GROUP BY id_obat
        ) AS stok ON o.id_obat = stok.id_obat

        LEFT JOIN (
            SELECT 
                bs.id_obat, SUM(dt.jumlah_jual) as total_terjual
            FROM tbl_detail_transaksi dt
            JOIN tbl_batch_stok bs ON dt.id_batch = bs.id_batch
            JOIN tbl_transaksi t ON dt.id_transaksi = t.id_transaksi
            WHERE t.tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY bs.id_obat
        ) AS konsumsi ON o.id_obat = konsumsi.id_obat
        
        ${whereSQL}

        ORDER BY o.nama_obat;
    `;
    const [rows] = await db.query(query, params);
    return rows;
};


const createJenisObat = async (obatData) => {
    const { nama_obat, bentuk_sediaan, kandungan_obat, lead_time_hari, periode_pengadaan_hari, harga_beli, harga_jual } = obatData;
    const query = `
        INSERT INTO tbl_obat (nama_obat, bentuk_sediaan, kandungan_obat, lead_time_hari, periode_pengadaan_hari, harga_beli, harga_jual) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await db.query(query, [
        nama_obat, bentuk_sediaan, kandungan_obat, lead_time_hari || 7,
        periode_pengadaan_hari || 30, harga_beli || 0, harga_jual || 0
    ]);
    return { id: result.insertId, ...obatData };
};


const findObatDetailById = async (id) => {
    const obatQuery = 'SELECT * FROM tbl_obat WHERE id_obat = ?';
    const [obatRows] = await db.query(obatQuery, [id]);
    if (obatRows.length === 0) {
        throw new AppError("Obat tidak ditemukan", 404);
    }

    const historyQuery = `
        -- Ambil data STOK MASUK
        SELECT 
            bs.tanggal_masuk AS tanggal,
            bs.jumlah_masuk AS masuk,
            0 AS keluar,
            bs.no_batch,
            bs.expired_date,
            'SYSTEM' AS paraf,
            bs.jumlah_masuk AS perubahan
        FROM tbl_batch_stok bs
        WHERE bs.id_obat = ?
        
        UNION ALL
        
        -- Ambil data STOK KELUAR dari transaksi (dengan JOIN ke tabel users)
        SELECT
            t.tanggal_transaksi AS tanggal,
            0 AS masuk,
            dt.jumlah_jual AS keluar,
            bs.no_batch,
            bs.expired_date,
            u.username AS paraf, -- <-- DIGANTI dari t.nama_kasir menjadi u.username
            (dt.jumlah_jual * -1) AS perubahan
        FROM tbl_detail_transaksi dt
        JOIN tbl_transaksi t ON dt.id_transaksi = t.id_transaksi
        JOIN tbl_batch_stok bs ON dt.id_batch = bs.id_batch
        JOIN tbl_users u ON t.id_user = u.id_user -- <-- JOIN TAMBAHAN ke tbl_users
        WHERE bs.id_obat = ?
        
        ORDER BY tanggal ASC;
    `;

    const [historyRows] = await db.query(historyQuery, [id, id]);

    let saldoBerjalan = 0;
    const riwayatDenganSaldo = historyRows.map(row => {
        saldoBerjalan += row.perubahan;
        return {
            tanggal: row.tanggal,
            masuk: row.masuk,
            keluar: row.keluar,
            sisa: saldoBerjalan,
            expired_date: row.expired_date,
            no_batch: row.no_batch,
            paraf: row.paraf,
        };
    });

    return { ...obatRows[0], riwayatStok: riwayatDenganSaldo.reverse() };
};


const addStokToObat = async (id_obat, stokData) => {
    const { no_batch, jumlah_masuk, expired_date } = stokData;

    const jumlahMasukAngka = Number(jumlah_masuk);
    if (isNaN(jumlahMasukAngka) || jumlahMasukAngka <= 0) {
        throw new AppError("Jumlah masuk harus berupa angka dan lebih dari nol.", 400);
    }

    const query = `
        INSERT INTO tbl_batch_stok (id_obat, no_batch, jumlah_masuk, jumlah_sisa, expired_date) 
        VALUES (?, ?, ?, ?, ?);
    `;

    const [result] = await db.query(query, [
        id_obat,
        no_batch,
        jumlahMasukAngka,
        jumlahMasukAngka,
        expired_date
    ]);

    return { id_batch: result.insertId, ...stokData };
};



const deleteObatById = async (id_obat) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [stokRows] = await connection.query(
            'SELECT COALESCE(SUM(jumlah_sisa), 0) as total_sisa FROM tbl_batch_stok WHERE id_obat = ?',
            [id_obat]
        );
        const total_sisa = stokRows[0].total_sisa;

        if (total_sisa > 0) {
            throw new AppError(`Tidak bisa menghapus obat karena stok masih tersedia. Total sisa: ${total_sisa}`, 400);
        }

        await connection.query('DELETE FROM tbl_batch_stok WHERE id_obat = ?', [id_obat]);
        const [deleteResult] = await connection.query('DELETE FROM tbl_obat WHERE id_obat = ?', [id_obat]);

        if (deleteResult.affectedRows === 0) {
            throw new AppError('Obat tidak ditemukan.', 404);
        }

        await connection.commit();
        return { message: "Obat berhasil dihapus." };
    } catch (error) {
        await connection.rollback();
        if (error instanceof AppError) throw error;
        throw new Error('Gagal menghapus obat: ' + error.message);
    } finally {
        connection.release();
    }
};

const updateJenisObat = async (id_obat, obatData) => {
    const { nama_obat, bentuk_sediaan, kandungan_obat, lead_time_hari, periode_pengadaan_hari, harga_beli, harga_jual } = obatData;
    const query = `
        UPDATE tbl_obat SET 
        nama_obat = ?, bentuk_sediaan = ?, kandungan_obat = ?, lead_time_hari = ?,
        periode_pengadaan_hari = ?, harga_beli = ?, harga_jual = ? 
        WHERE id_obat = ?`;

    const [result] = await db.query(query, [
        nama_obat, bentuk_sediaan, kandungan_obat, lead_time_hari,
        periode_pengadaan_hari, harga_beli, harga_jual, id_obat
    ]);

    if (result.affectedRows === 0) {
        throw new AppError('Obat tidak ditemukan.', 404);
    }
    return { id: id_obat, ...obatData };
};



module.exports = {
    findAllObatWithStok,
    createJenisObat,
    findObatDetailById,
    addStokToObat,
    deleteObatById,
    updateJenisObat
};