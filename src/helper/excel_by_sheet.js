// excelReportGenerator.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import formatNumberWithCommas from "./formatNumberWithComma";
import logoBase64 from "./logo"; // preconverted Base64 PNG

// Excel worksheet names can't contain * ? : \ / [ ] and must be <= 31 chars.
function sanitizeSheetName(name) {
  const safe = String(name || "Sheet").replace(/[*?:\\/[\]]/g, " ").trim();
  return (safe || "Sheet").substring(0, 31);
}

/**
 * sheets = [
 *   {
 *     sheetName: "9-15 Nov",
 *     records: [
 *       { matchId, date, time, rate, hours, total, fee, vat },
 *     ],
 *     total_hr,
 *     total_pr,
 *     companyName,
 *     timePeriod
 *   }
 * ]
 */
export default async function exportExcel(sheets, fileName) {
  const workbook = new ExcelJS.Workbook();

  for (const sheetData of sheets) {
    const sheet = workbook.addWorksheet(sanitizeSheetName(sheetData.sheetName));

    // ---------------------------------------------------
    // Add logo
    // ---------------------------------------------------

    const imageId = workbook.addImage({
        base64: logoBase64,
        extension: "png",
    });

   sheet.addImage(imageId, {
    tl: { col: 3.9999 , row: 0.2 },
    ext: { width: 98, height: 45 },
  });



    // ---------------------------------------------------
    // Title, company, billing period
    // ---------------------------------------------------
    
    sheet.mergeCells("A1:K1");
    sheet.getCell("A1").value = " ";
    styleCell(sheet.getCell("A1"), { bold: true });

    sheet.mergeCells("A2:K2");
    sheet.getCell("A2").value = ' ';
    styleCell(sheet.getCell("A2"), { bold: true });

    sheet.mergeCells("A3:K3");
    sheet.getCell("A3").value = ` `;
    styleCell(sheet.getCell("A3"));

    sheet.mergeCells("A4:K4");
    sheet.getCell("A4").value = "Matchday Booking Report";
    styleCell(sheet.getCell("A4"), { bold: true });

    sheet.mergeCells("A5:K5");
    sheet.getCell("A5").value = sheetData.companyName;
    styleCell(sheet.getCell("A5"));

    sheet.mergeCells("A6:K6");
    sheet.getCell("A6").value = `Billing Period: ${sheetData.timePeriod}`;
    styleCell(sheet.getCell("A6"));

    sheet.addRow([]); // empty row

    // ---------------------------------------------------
    // Table header
    // ---------------------------------------------------
    const header = [
      "No.",
      "Match ID",
      "Customer Name",
      "Sport Type",
      "Booking Date",
      "Booking Time",
      "Rate/hour (฿)",
      "Hr.",
      "Total",
      "Fee (10%)",
      "VAT",
    ];
    const headerRow = sheet.addRow(header);
    styleRow(headerRow, { bold: true });

    // ---------------------------------------------------
    // Table body
    // ---------------------------------------------------
    sheetData.records.forEach((item, index) => {
      const row = sheet.addRow([
        index + 1,
        item.matchId,
        item.Customer,
        item.Sport,
        item.date,
        item.time,
        formatNumberWithCommas(item.rate),
        item.hours,
        item.total,
        " ",
        " ",
      ]);
      styleRow(row);
    });

    // ---------------------------------------------------
    // Footer / Totals
    // ---------------------------------------------------

    const totalRow = sheet.addRow([
      "Total",
      "",
      "",
      "",
      "",
      "",
      "",
      sheetData.total_hr,
      sheetData.total_pr,
      "",
      "",
    ]);
    styleRow(totalRow, { bold: true });
    sheet.mergeCells(totalRow.number, 0, totalRow.number, 7);
    sheet.getCell(`A${totalRow.number}`).alignment = { horizontal: "right", vertical: "middle" };

    const balanceRow = sheet.addRow([
      "Total Balance (to transfer)",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    styleRow(balanceRow, { bold: true });
    sheet.mergeCells(balanceRow.number, 0, balanceRow.number, 7);
    sheet.mergeCells(balanceRow.number, 8, balanceRow.number, 11);
    sheet.getCell(`A${balanceRow.number}`).alignment = { horizontal: "right", vertical: "middle" };

    // End of Report
    sheet.addRow([]);
    const lastRow = sheet.addRow(["-End of Report-"]);
    sheet.mergeCells(`A${lastRow.number}:K${lastRow.number}`);
    styleCell(sheet.getCell(`A${lastRow.number}`));

    // ---------------------------------------------------
    // Column widths
    // ---------------------------------------------------
    sheet.columns = [
      { width: 6 },
      { width: 12 },
      { width: 25 }, // Customer Name
      { width: 15 }, // Sport Type
      { width: 15 },
      { width: 15 },
      { width: 14 },
      { width: 8 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
    ];
  }

  // ---------------------------------------------------
  // Export XLSX
  // ---------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
   `${fileName || 'Booking_Report'}.xlsx`
  );
}

// ---------------------------------------------------
// Utility: style a single row (center aligned + border)
// ---------------------------------------------------
function styleRow(row, options = {}) {
  const { bold = false } = options;
  row.eachCell((cell) => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
    if (bold) cell.font = { bold: true };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

// ---------------------------------------------------
// Utility: style single cell
// ---------------------------------------------------
function styleCell(cell, options = {}) {
  const { bold = false } = options;
  cell.alignment = { horizontal: "center", vertical: "middle" };
  if (bold) cell.font = { bold: true };
}



