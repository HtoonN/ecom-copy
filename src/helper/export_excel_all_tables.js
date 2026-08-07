import * as XLSX from "xlsx-js-style";

export default function exportExcelAllTables({ tables, filename }) {
  // Example data: array of tables

  // Shared headers
  const headers = [
    "ลำดับ",
    "ID",
    "เวลาเริ่ม",
    "เวลาสิ้นสุด",
    "สร้างเมื่อ",
    "ชั่วโมง",
    "ราคารวม",
    "ส่วนลด",
    "ราคาสุทธิ",
    "ประกัน",
    "สรุป",
  ];

  // Build sheet data and merged ranges
  const sheetData = [];
  const merges = [];
  let rowCursor = 0;

  tables.forEach((table, index) => {
    // Title row
    const title = table.selectedWeekText;
    const total = table.totalText;

    sheetData.push([title]);
    merges.push({
      s: { r: rowCursor, c: 0 },
      e: { r: rowCursor, c: headers.length - 1 },
    });
    rowCursor++;

    sheetData.push([total]);
    merges.push({
      s: { r: rowCursor, c: 0 },
      e: { r: rowCursor, c: headers.length - 1 },
    });
    rowCursor++;

    // Header row
    sheetData.push(headers);
    rowCursor++;

    // Data rows
    table.items.forEach((item) => {
      sheetData.push([
        item.no,
        item.id,
        item.start_date,
        item.end_date,
        item.created_at,
        item.hr,
        item.sumary_price,
        item.discount,
        item.real_price,
        item.insurance,
        item.sumary_all,
      ]);
      rowCursor++;
    });

    // Empty row
    sheetData.push([]);

    rowCursor++;
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 6 }, // ลำดับ (No)
    { wch: 10 }, // ID
    { wch: 20 }, // เวลาเริ่ม (Start time)
    { wch: 20 }, // เวลาสิ้นสุด (End time)
    { wch: 20 }, // เวลาสิ้นสุด (End time)
    { wch: 8 }, // ชั่วโมง (Hours)
    { wch: 12 }, // ราคารวม (Total price)
    { wch: 25 }, // ส่วนลด (Discount)
    { wch: 12 }, // ราคาสุทธิ (Net price)
    { wch: 12 }, // ราคาสุทธิ (Net price)
    { wch: 25 }, // สรุป (Summary)
  ];

  // Style titles and headers
  rowCursor = 0;
  tables.forEach((table, i) => {
    // Title row style

    const titleCell = ws[XLSX.utils.encode_cell({ r: rowCursor, c: 0 })];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center" },
      };
    }
    const titleCell2 = ws[XLSX.utils.encode_cell({ r: rowCursor + 1, c: 0 })];
    if (titleCell2) {
      titleCell2.s = {
        font: { bold: true, sz: 14 },
      };
    }

    rowCursor++; // Move to header row
    // Move to header row

    // Header row style
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: rowCursor + 1,
        c: colIdx,
      });
      const cell = ws[cellAddress];
      if (cell) {
        cell.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D9D9D9" } }, // light grey background
          alignment: { horizontal: "center" },
        };
      }
    });

    rowCursor += table.items.length + 3; // skip data + empty row
  });

  // Export
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}