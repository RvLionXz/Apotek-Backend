const db = require('../config/db.config');
const { AppError } = require('../middleware/errorHandler');

const createTransaksi = async (transaksiData, user) => {
  const { items, metode_pembayaran, jumlah_bayar } = transaksiData;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let calculatedTotalBelanja = 0;
    const detailTransaksiToInsert = [];

    console.log('--- MEMULAI PERHITUNGAN TRANSAKSI BARU ---');
    console.log('Item diterima dari frontend:', JSON.stringify(items, null, 2));

    for (const item of items) {
      let jumlahDibutuhkan = Number(item.jumlah_jual);
      if (!jumlahDibutuhkan || jumlahDibutuhkan <= 0) continue;

      const [batches] = await connection.execute(
        `SELECT bs.*, o.harga_jual 
         FROM tbl_batch_stok bs 
         JOIN tbl_obat o ON bs.id_obat = o.id_obat 
         WHERE bs.id_obat = ? AND bs.jumlah_sisa > 0 ORDER BY bs.expired_date ASC`,
        [item.id_obat]
      );

      const totalStokTersedia = batches.reduce((sum, b) => sum + b.jumlah_sisa, 0);
      if (totalStokTersedia < jumlahDibutuhkan) {
        throw new AppError(`Stok tidak cukup untuk obat dengan ID ${item.id_obat}`, 400);
      }

      for (const batch of batches) {
        if (jumlahDibutuhkan <= 0) break;

        const jumlahAmbil = Math.min(jumlahDibutuhkan, batch.jumlah_sisa);
        await connection.execute('UPDATE tbl_batch_stok SET jumlah_sisa = jumlah_sisa - ? WHERE id_batch = ?', [jumlahAmbil, batch.id_batch]);

        const hargaUnit = parseFloat(batch.harga_jual);
        if (isNaN(hargaUnit)) throw new AppError(`Harga tidak valid untuk batch ID ${batch.id_batch}`, 500);

        const subTotal = jumlahAmbil * hargaUnit;
        calculatedTotalBelanja += subTotal;

        console.log(`Menambah item ID: ${item.id_obat}, Jumlah: ${jumlahAmbil}, Subtotal: ${subTotal}, Total Sementara: ${calculatedTotalBelanja}`);

        detailTransaksiToInsert.push([batch.id_batch, jumlahAmbil, hargaUnit, subTotal]);
        jumlahDibutuhkan -= jumlahAmbil;
      }
    }

    console.log(`--- PERHITUNGAN SELESAI. Total Belanja Final: ${calculatedTotalBelanja} ---`);

    const totalBelanjaFinal = parseFloat(calculatedTotalBelanja.toFixed(2));
    const kembalian = metode_pembayaran === 'Tunai' ? (parseFloat(jumlah_bayar) || 0) - totalBelanjaFinal : 0;

    if (metode_pembayaran === 'Tunai' && kembalian < 0) {
      throw new AppError(`Uang bayar tidak cukup. Total belanja Rp. ${totalBelanjaFinal}`, 400);
    }

    const [transaksiResult] = await connection.execute(
      `INSERT INTO tbl_transaksi (kode_transaksi, total_belanja, metode_pembayaran, jumlah_bayar, kembalian, id_user) VALUES (?, ?, ?, ?, ?, ?)`,
      [`TRX-${Date.now()}`, totalBelanjaFinal, metode_pembayaran, jumlah_bayar || 0, kembalian < 0 ? 0 : kembalian, user.id]
    );
    const id_transaksi = transaksiResult.insertId;

    if (detailTransaksiToInsert.length > 0) {
      const detailWithTransaksiId = detailTransaksiToInsert.map(d => [id_transaksi, ...d]);
      await connection.query(
        'INSERT INTO tbl_detail_transaksi (id_transaksi, id_batch, jumlah_jual, harga_jual_saat_transaksi, sub_total) VALUES ?',
        [detailWithTransaksiId]
      );
    }

    await connection.commit();

    // Pastikan mengembalikan variabel yang benar
    return { id_transaksi, totalBelanja: totalBelanjaFinal, kembalian };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


const findTransaksiById = async (id) => {
  const [transaksiRows] = await db.query(
    'SELECT t.*, u.username AS nama_kasir FROM tbl_transaksi t JOIN tbl_users u ON t.id_user = u.id_user WHERE t.id_transaksi = ?',
    [id]
  );
  if (transaksiRows.length === 0) {
    throw new AppError("Transaksi tidak ditemukan.", 404);
  }

  const [detailRows] = await db.query(`
        SELECT dt.*, o.nama_obat 
        FROM tbl_detail_transaksi dt
        JOIN tbl_batch_stok bs ON dt.id_batch = bs.id_batch
        JOIN tbl_obat o ON bs.id_obat = o.id_obat
        WHERE dt.id_transaksi = ?
    `, [id]);

  return { ...transaksiRows[0], items: detailRows };
}


module.exports = { createTransaksi, findTransaksiById };