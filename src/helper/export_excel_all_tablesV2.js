import * as XLSX from "xlsx-js-style";

export default function exportExcelAllTablesV2({ tables, filename }) {
  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value).replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const extractBahtFromTotalText = (text) => {
    if (!text) return 0;
    // Extract number right before "บาท", e.g. "... 1,200.00 บาท"
    const match = String(text).match(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*บาท/);
    return match ? parseNumber(match[1]) : 0;
  };

  // Example data: array of tables

  // Shared headers
  const headers = [
    "ลำดับ",
    "ID",
    "ชื่อผู้จอง",
    "ประเภทกีฬา",
    "เวลาเริ่ม",
    "เวลาสิ้นสุด",
    "สร้างเมื่อ",
    "ชั่วโมง",
    "ราคารวม",
    "ค่าธรรมเนียม",
    "มัดจำ",
    "ค่าบริการ",
    "ส่วนลด",
    "มูลค่าส่วนลด",
    "ประเภทส่วนลด",
    "ราคาสุทธิ",
    "ประกัน",
    "สรุป",
  ];

  // Build sheet data and merged ranges
  const sheetData = [];
  const merges = [];
  const summaryRowIndexes = []; // Track summary row indexes for styling
  const metricValueRowIndexes = []; // Track GMV/booking value rows for alignment
  const metricLabelRowIndexes = []; // Track GMV/booking label rows for bold styling
  let rowCursor = 0;
  let grandTotalGmv = 0;
  let grandTotalBookings = 0;

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
    const regularItems = table.items.filter((item) => !item.isSummaryRow);
    const summaryItems = table.items.filter((item) => item.isSummaryRow);
    const tableGmv = extractBahtFromTotalText(table.totalText);
    const tableBookings = parseNumber(table.totalBooking ?? table.total_booking) || regularItems.length;

    grandTotalGmv += tableGmv;
    grandTotalBookings += tableBookings;

    regularItems.forEach((item) => {
      sheetData.push([
        item.no,
        item.id,
        item.user_fullname,
        item.sport_name,
        item.start_date,
        item.end_date,
        item.created_at,
        item.hr,
        item.sumary_price,
        item.fee,
        item.deposit_amount,
        item.service_price,
        item.discount_name,
        item.discount,
        item.is_matchday,
        item.net_price,
        item.insurance,
        item.sumary_all,
      ]);
      rowCursor++;
    });

    // Add one empty row before final summary row
    if (summaryItems.length) {
      sheetData.push([]);
      rowCursor++;
    }

    summaryItems.forEach((item) => {
      summaryRowIndexes.push(rowCursor);
      sheetData.push([
        item.no,
        item.id,
        item.user_fullname,
        item.sport_name,
        item.start_date,
        item.end_date,
        item.created_at,
        item.hr,
        item.sumary_price,
        item.fee,
        item.deposit_amount,
        item.service_price,
        item.discount_name,
        item.discount,
        item.is_matchday,
        item.net_price,
        item.insurance,
        item.sumary_all,
      ]);
      rowCursor++;
    });

    // Empty row
    sheetData.push([]);

    rowCursor++;
  });

  const makeMetricRow = (label, value) => {
    const row = new Array(headers.length).fill("");
    row[6] = label; // Column 7
    row[8] = value; // Column 9
    return row;
  };

  // Add one global GMV/booking summary (for all tables)
  sheetData.push(makeMetricRow("GMV", formatNumber(grandTotalGmv)));
  merges.push({
    s: { r: rowCursor, c: 6 }, // Col 7
    e: { r: rowCursor, c: 7 }, // Col 8
  });
  summaryRowIndexes.push(rowCursor);
  metricLabelRowIndexes.push(rowCursor);
  metricValueRowIndexes.push(rowCursor);
  rowCursor++;

  sheetData.push(
    makeMetricRow("No. of bookings", formatNumber(grandTotalBookings))
  );
  merges.push({
    s: { r: rowCursor, c: 6 }, // Col 7
    e: { r: rowCursor, c: 7 }, // Col 8
  });
  summaryRowIndexes.push(rowCursor);
  metricLabelRowIndexes.push(rowCursor);
  metricValueRowIndexes.push(rowCursor);
  rowCursor++;

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 6 }, // ลำดับ (No)
    { wch: 10 }, // ID
    { wch: 20 }, // ชื่อผู้จอง
    { wch: 20 }, // ประเภทกีฬา
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

    const summaryCount = table.items.filter((item) => item.isSummaryRow).length;
    rowCursor +=
      table.items.length + // all data rows
      (summaryCount ? 1 : 0) + // empty row before summary
      3; // header offset to next table + trailing empty row
  });

  // Style summary rows
  summaryRowIndexes.forEach(rowIdx => {
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = ws[cellAddress];
      if (cell) {
        cell.s = {
          font: { bold: true },
        };
      } else {
        // Create empty cell with style if it doesn't exist
        ws[cellAddress] = {
          v: "",
          s: {
            font: { bold: true },
          },
        };
      }
    });
  });

  // Ensure metric labels are bold/right-aligned on merged label column (col 7-8)
  metricLabelRowIndexes.forEach((rowIdx) => {
    const labelCellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: 6 });
    const labelCell = ws[labelCellAddress];
    if (labelCell) {
      labelCell.s = {
        ...(labelCell.s || {}),
        font: { bold: true },
        alignment: { horizontal: "right" },
      };
    }
  });

  // Ensure metric values are left aligned
  metricValueRowIndexes.forEach((rowIdx) => {
    const valueCellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: 8 }); // Col 9
    const valueCell = ws[valueCellAddress];
    if (valueCell) {
      valueCell.s = {
        ...(valueCell.s || {}),
        alignment: { horizontal: "left" },
      };
    }
  });

  // Export
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

