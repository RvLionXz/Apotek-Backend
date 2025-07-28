const ExcelJS = require('exceljs');
const path = require('path');
const fs = 'fs'


// KOP Surat

function addLetterhead(worksheet, workbook) {
  const FONT_FAMILY = 'Times New Roman';

  const imagePath = path.join(__dirname, '..', '..', 'public', 'images', 'logo_klinik.png');
  const imageId = workbook.addImage({ filename: imagePath, extension: 'png' });
  worksheet.addImage(imageId, {
    tl: { col: 0.5, row: 0.5 },
    br: { col: 2.2, row: 4.5 }
  });

  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = 'YAYASAN PUJA BERSAUDARA PAS';
  worksheet.getCell('A1').font = { name: FONT_FAMILY, size: 14, bold: true };
  worksheet.getCell('A1').alignment = { vertical: 'bottom', horizontal: 'center' };

  worksheet.mergeCells('A2:G2');
  const richText = {
    richText: [
      { font: { name: 'Calibri', size: 26, color: { argb: 'FF154A63' } }, text: 'Klinik Utama ' },
      { font: { name: 'Calibri', size: 26, color: { argb: 'FFF07A9A' }, bold: true }, text: 'PUJA BERSAUDARA' }
    ]
  };
  worksheet.getCell('A2').value = richText;
  worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A3:G3');
  worksheet.getCell('A3').value = 'Jl. Nasional Meulaboh-Tapaktuan, Desa Tengah Baru, Kec. Labuhanhaji, Kab. Aceh Selatan';
  worksheet.getCell('A3').font = { name: FONT_FAMILY, size: 9 };
  worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A4:G4');
  const contactText = {
    richText: [
      { text: 'Telp: 0822-8627-6705 E-mail: ' },
      { text: 'klinikutamapujabersaudara@gmail.com', hyperlink: 'mailto:klinikutamapujabersaudara@gmail.com', font: { underline: true, color: { argb: 'FF0563C1' } } }
    ]
  };
  worksheet.getCell('A4').value = contactText;
  worksheet.getCell('A4').font = { name: FONT_FAMILY, size: 9 };
  worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('C5:F5');
  worksheet.getCell('C5').border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };
}

async function generateAmprahanExcel(data, filters) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Puja's Apotek System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Laporan Amprahan', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  const FONT_FAMILY = 'Times New Roman';

  const imagePath = path.join(__dirname, '..', '..', 'public', 'images', 'logo_klinik.png');
  const imageId = workbook.addImage({
    filename: imagePath,
    extension: 'png',
  });
  worksheet.addImage(imageId, {
    tl: { col: 0.5, row: 0.5 },
    br: { col: 2.2, row: 4.5 }
  });

  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = 'YAYASAN PUJA BERSAUDARA PAS';
  worksheet.getCell('A1').font = { name: FONT_FAMILY, size: 14, bold: true };
  worksheet.getCell('A1').alignment = { vertical: 'bottom', horizontal: 'center' };

  worksheet.mergeCells('A2:G2');
  const richText = {
    richText: [
      { font: { name: 'Calibri', size: 26, color: { argb: 'FF154A63' } }, text: 'Klinik Utama ' },
      { font: { name: 'Calibri', size: 26, color: { argb: 'FFF07A9A' }, bold: true }, text: 'PUJA BERSAUDARA' }
    ]
  };
  worksheet.getCell('A2').value = richText;
  worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A3:G3');
  worksheet.getCell('A3').value = 'Jl. Nasional Meulaboh-Tapaktuan, Desa Tengah Baru, Kec. Labuhanhaji, Kab. Aceh Selatan';
  worksheet.getCell('A3').font = { name: FONT_FAMILY, size: 9 };
  worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A4:G4');
  const contactText = {
    richText: [
      { text: 'Telp: 0822-8627-6705 E-mail: ' },
      { text: 'klinikutamapujabersaudara@gmail.com', hyperlink: 'mailto:klinikutamapujabersaudara@gmail.com', font: { underline: true, color: { argb: 'FF0563C1' } } }
    ]
  };
  worksheet.getCell('A4').value = contactText;
  worksheet.getCell('A4').font = { name: FONT_FAMILY, size: 9 };
  worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('C5:F5');
  worksheet.getCell('C5').border = { bottom: { style: 'thick', color: { argb: 'FF000000' } } };

  const namaBulan = new Date(filters.tahun, filters.bulan - 1).toLocaleString('id-ID', { month: 'long' });
  worksheet.mergeCells('A7:G7');
  worksheet.getCell('A7').value = 'LAPORAN AMPRAHAN';
  worksheet.getCell('A7').font = { name: FONT_FAMILY, size: 12, bold: true };
  worksheet.getCell('A7').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A8:G8');
  worksheet.getCell('A8').value = `Periode : ${namaBulan} ${filters.tahun}`;
  worksheet.getCell('A8').font = { name: FONT_FAMILY, size: 11 };
  worksheet.getCell('A8').alignment = { horizontal: 'center' };

  worksheet.addRow([]);

  const headerRow = worksheet.getRow(10);
  headerRow.values = ['Tanggal', 'Petugas Pengambil', 'Petugas Apotek', 'Ruangan', 'Detail Obat', 'Keterangan', 'Total Nilai'];

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } };
  });

  data.forEach(item => {
    const rowData = [
      new Date(item.tanggal_amprahan),
      item.nama_petugas_pengambil,
      item.nama_apoteker,
      item.ruangan_tujuan,
      item.detail_obat ? item.detail_obat.replaceAll('; ', '\n') : '',
      item.keterangan,
      parseFloat(item.total_nilai)
    ];
    const row = worksheet.addRow(rowData);

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_FAMILY };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    row.getCell(1).alignment.horizontal = 'center';
    row.getCell(2).alignment.horizontal = 'center';
    row.getCell(3).alignment.horizontal = 'center';
    row.getCell(4).alignment.horizontal = 'center';

    row.getCell(1).numFmt = 'DD/MM/YYYY';
    row.getCell(7).numFmt = '"Rp"#,##0;';
    row.getCell(7).alignment.horizontal = 'right'; 
  });

  worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
    if (rowNumber > headerRow.number) {
      const maxLines = Math.max(
        (row.getCell(5).value || '').toString().split('\n').length,
        (row.getCell(6).value || '').toString().split('\n').length
      );
      row.height = maxLines * 15 + 10;
    }
  });

  worksheet.getColumn('A').width = 15;
  worksheet.getColumn('B').width = 25;
  worksheet.getColumn('C').width = 20;
  worksheet.getColumn('D').width = 15;
  worksheet.getColumn('E').width = 45;
  worksheet.getColumn('F').width = 35;
  worksheet.getColumn('G').width = 18;

  return await workbook.xlsx.writeBuffer();
}

async function generatePenjualanExcel(data, filters) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Puja's Apotek System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Laporan Penjualan', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  const FONT_FAMILY = 'Times New Roman';

  addLetterhead(worksheet, workbook);

  const namaBulan = new Date(filters.tahun, filters.bulan - 1).toLocaleString('id-ID', { month: 'long' });
  worksheet.mergeCells('A7:G7');
  worksheet.getCell('A7').value = 'LAPORAN PENJUALAN';
  worksheet.getCell('A7').font = { name: FONT_FAMILY, size: 12, bold: true };
  worksheet.getCell('A7').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A8:G8');
  worksheet.getCell('A8').value = `Periode : ${namaBulan} ${filters.tahun}`;
  worksheet.getCell('A8').font = { name: FONT_FAMILY, size: 11 };
  worksheet.getCell('A8').alignment = { horizontal: 'center' };

  worksheet.addRow([]);

  const headerRow = worksheet.getRow(10);
  headerRow.values = ['Tanggal', 'Kode Struk', 'Detail Obat', 'Total Belanja', 'Total Laba', 'Metode Bayar', 'Kasir'];

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } };
  });

  data.forEach(item => {
    const rowData = [
      new Date(item.tanggal_transaksi),
      item.kode_transaksi,
      item.detail_obat ? item.detail_obat.replaceAll('; ', '\n') : (item.metode_pembayaran === 'Amprahan' ? 'PELUNASAN AMPRAHAN' : '-'),
      parseFloat(item.total_belanja),
      parseFloat(item.total_laba || 0),
      item.metode_pembayaran,
      item.kasir
    ];
    const row = worksheet.addRow(rowData);

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_FAMILY };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    row.getCell(1).numFmt = 'DD/MM/YYYY, hh:mm';
    row.getCell(4).numFmt = '"Rp"#,##0;';
    row.getCell(4).alignment.horizontal = 'right';
    row.getCell(5).numFmt = '"Rp"#,##0;';
    row.getCell(5).alignment.horizontal = 'right';
    row.getCell(6).alignment.horizontal = 'center';
    row.getCell(7).alignment.horizontal = 'center';
  });

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > headerRow.number && row.values.length > 1) {
      const maxLines = (row.getCell(3).value || '').toString().split('\n').length;
      row.height = maxLines * 15 + 10;
    }
  });

  worksheet.addRow([]);
  const firstTotalRow = worksheet.rowCount + 1;
  worksheet.mergeCells(`A${firstTotalRow}:C${firstTotalRow}`);
  worksheet.getCell(`C${firstTotalRow}`).value = 'Total Keseluruhan:';
  worksheet.getCell(`C${firstTotalRow}`).font = { name: FONT_FAMILY, bold: true, size: 12 };
  worksheet.getCell(`C${firstTotalRow}`).alignment = { horizontal: 'right' };

  const totalBelanjaCell = worksheet.getCell(`D${firstTotalRow}`);
  totalBelanjaCell.value = { formula: `SUM(D11:D${firstTotalRow - 2})` }; 
  totalBelanjaCell.numFmt = '"Rp"#,##0';
  totalBelanjaCell.font = { name: FONT_FAMILY, bold: true, size: 12 };
  totalBelanjaCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

  const totalLabaCell = worksheet.getCell(`E${firstTotalRow}`);
  totalLabaCell.value = { formula: `SUM(E11:E${firstTotalRow - 2})` };
  totalLabaCell.numFmt = '"Rp"#,##0';
  totalLabaCell.font = { name: FONT_FAMILY, bold: true, size: 12 };
  totalLabaCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

  worksheet.getColumn('A').width = 20;
  worksheet.getColumn('B').width = 22;
  worksheet.getColumn('C').width = 45;
  worksheet.getColumn('D').width = 18;
  worksheet.getColumn('E').width = 18;
  worksheet.getColumn('F').width = 15;
  worksheet.getColumn('G').width = 15;

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  generateAmprahanExcel,
  generatePenjualanExcel
};