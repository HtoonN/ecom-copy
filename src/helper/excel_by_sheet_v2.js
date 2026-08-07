// excelReportGeneratorV2.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
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
 *     timePeriod,
 *     commission: { fee, fee_type, is_out_vat, is_extract_vat }
 *   }
 * ]
 */
export default async function exportExcelV2(sheets, fileName) {
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
    const feeRate = parseFloat(sheetData.commission?.fee) || 0;
    const feeType = sheetData.commission?.fee_type || 'percent';
    const isOutVat = sheetData.commission?.is_out_vat === 1 || sheetData.commission?.is_out_vat === true;
    const isExtractVat = sheetData.commission?.is_extract_vat === 1 || sheetData.commission?.is_extract_vat === true;
    const feeHeaderStr = feeType === 'percent' ? `${feeRate}%` : feeRate.toString();
    
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
      `Fee (${feeHeaderStr})`,
      "VAT",
    ];
    const headerRow = sheet.addRow(header);
    styleRow(headerRow, { bold: true });

    // ---------------------------------------------------
    // Table body
    // ---------------------------------------------------
    sheetData.records.forEach((item, index) => {
      const rateVal = parseFloat(item.rate) || 0;
      const hoursVal = parseFloat(item.hours) || 0;
      const totalVal = parseFloat(item.total) || 0;
      const feeVal = parseFloat(item.fee) || 0;
      const vatVal = parseFloat(item.vat) || 0;

      const row = sheet.addRow([
        index + 1,
        item.matchId,
        item.Customer,
        item.Sport,
        item.date,
        item.time,
        rateVal,  // G (Col 7)
        hoursVal, // H (Col 8)
        "",       // I (Col 9) - Total (formula)
        "",       // J (Col 10) - Fee (formula)
        "",       // K (Col 11) - VAT (formula)
      ]);

      const rowNum = row.number;

      // Set formats
      row.getCell(7).numFmt = '#,##0.00';
      row.getCell(8).numFmt = '#,##0.00';
      row.getCell(9).numFmt = '#,##0.00';
      row.getCell(10).numFmt = '#,##0.00';
      row.getCell(11).numFmt = '#,##0.00';

      // Set Total Formula: Rate * Hours
      row.getCell(9).value = {
        formula: `G${rowNum}*H${rowNum}`,
        result: totalVal
      };

      // Set Fee Formula
      let feeFormula = "";
      if (feeType === 'percent') {
        if (isExtractVat) {
          feeFormula = `ROUND((I${rowNum}/1.07)*${feeRate / 100}, 4)`;
        } else {
          feeFormula = `ROUND(I${rowNum}*${feeRate / 100}, 4)`;
        }
      } else {
        feeFormula = `ROUND(${feeRate}*H${rowNum}, 4)`;
      }
      row.getCell(10).value = {
        formula: feeFormula,
        result: feeVal
      };

      // Set VAT Formula
      if (isOutVat) {
        row.getCell(11).value = {
          formula: `ROUND(J${rowNum}*0.07, 4)`,
          result: vatVal
        };
      } else {
        row.getCell(11).value = 0;
      }

      styleRow(row);
    });

    // ---------------------------------------------------
    // Footer / Totals
    // ---------------------------------------------------
    const grand_total_fee = sheetData.records.reduce((sum, item) => sum + (parseFloat(item.fee) || 0), 0);
    const grand_total_vat = sheetData.records.reduce((sum, item) => sum + (parseFloat(item.vat) || 0), 0);

    const startRow = 9;
    const endRow = startRow + sheetData.records.length - 1;

    const totalRow = sheet.addRow([
      "Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "", // H (Hr) - SUM
      "", // I (Total) - SUM
      "", // J (Fee) - SUM
      "", // K (VAT) - SUM
    ]);

    totalRow.getCell(8).numFmt = '#,##0.00';
    totalRow.getCell(9).numFmt = '#,##0.00';
    totalRow.getCell(10).numFmt = '#,##0.00';
    totalRow.getCell(11).numFmt = '#,##0.00';

    if (sheetData.records.length > 0) {
      totalRow.getCell(8).value = {
        formula: `SUM(H${startRow}:H${endRow})`,
        result: parseFloat(sheetData.total_hr) || 0
      };
      totalRow.getCell(9).value = {
        formula: `SUM(I${startRow}:I${endRow})`,
        result: parseFloat(sheetData.total_pr?.replace(/,/g, '')) || 0
      };
      totalRow.getCell(10).value = {
        formula: `SUM(J${startRow}:J${endRow})`,
        result: grand_total_fee
      };
      totalRow.getCell(11).value = {
        formula: `SUM(K${startRow}:K${endRow})`,
        result: grand_total_vat
      };
    } else {
      totalRow.getCell(8).value = 0;
      totalRow.getCell(9).value = 0;
      totalRow.getCell(10).value = 0;
      totalRow.getCell(11).value = 0;
    }

    styleRow(totalRow, { bold: true });
    sheet.mergeCells(totalRow.number, 1, totalRow.number, 7);
    sheet.getCell(`A${totalRow.number}`).alignment = { horizontal: "right", vertical: "middle" };

    const grand_total_price = parseFloat(sheetData.total_pr?.replace(/,/g, '')) || 0;
    const balanceResult = grand_total_price - grand_total_fee - grand_total_vat;

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
    sheet.mergeCells(balanceRow.number, 1, balanceRow.number, 7);
    sheet.mergeCells(balanceRow.number, 8, balanceRow.number, 11);
    sheet.getCell(`A${balanceRow.number}`).alignment = { horizontal: "right", vertical: "middle" };

    balanceRow.getCell(8).numFmt = '#,##0.00';
    balanceRow.getCell(8).value = {
      formula: `I${totalRow.number}-J${totalRow.number}-K${totalRow.number}`,
      result: balanceResult
    };

    // End of Report
    sheet.addRow([]);
    const lastRow = sheet.addRow(["-End of Report-"]);
    sheet.mergeCells(`A${lastRow.number}:K${lastRow.number}`);
    styleCell(sheet.getCell(`A${lastRow.number}`));

    // ---------------------------------------------------
    // Daily Summary section below -End of Report-
    // ---------------------------------------------------
    sheet.addRow([]); // empty row after -End of Report-

    // Group records by date to compute daily summaries
    const dailyMap = {};
    sheetData.records.forEach((record) => {
      if (!record.start_raw || !record.end_raw) {
        // Fallback if raw date values are missing
        const dateKey = record.date;
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            date: dateKey,
            hours: 0,
            total: 0
          };
        }
        dailyMap[dateKey].hours += parseFloat(record.hours) || 0;
        dailyMap[dateKey].total += parseFloat(record.total) || 0;
        return;
      }

      const start = moment(record.start_raw);
      const end = moment(record.end_raw);

      if (start.isSame(end, 'day')) {
        const dateKey = start.format("D-MMM-YYYY");
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = {
            date: dateKey,
            hours: 0,
            total: 0
          };
        }
        dailyMap[dateKey].hours += parseFloat(record.hours) || 0;
        dailyMap[dateKey].total += parseFloat(record.total) || 0;
      } else {
        // Spans across multiple days, split proportionally
        const totalDurationMin = end.diff(start, 'minutes');
        if (totalDurationMin <= 0) return;

        let current = moment(start);
        const recordTotalVal = parseFloat(record.total) || 0;
        const recordHoursVal = parseFloat(record.hours) || 0;

        while (current.isBefore(end)) {
          const currentDay = current.clone().startOf('day');
          const nextDay = current.clone().add(1, 'day').startOf('day');
          const segmentEnd = moment.min(end, nextDay);
          const segmentDurationMin = segmentEnd.diff(current, 'minutes');

          if (segmentDurationMin > 0) {
            const fraction = segmentDurationMin / totalDurationMin;
            const segmentHours = recordHoursVal * fraction;
            const segmentTotal = recordTotalVal * fraction;
            const dateKey = currentDay.format("D-MMM-YYYY");

            if (!dailyMap[dateKey]) {
              dailyMap[dateKey] = {
                date: dateKey,
                hours: 0,
                total: 0
              };
            }
            dailyMap[dateKey].hours += segmentHours;
            dailyMap[dateKey].total += segmentTotal;
          }
          current = nextDay;
        }
      }
    });

    const dailySummaries = Object.values(dailyMap).sort((a, b) => {
      const dateA = moment(a.date, ["D-MMM-YYYY", "D-MMMM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]);
      const dateB = moment(b.date, ["D-MMM-YYYY", "D-MMMM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]);
      return dateA.valueOf() - dateB.valueOf();
    });



    dailySummaries.forEach((summary) => {
      const rateHour = summary.hours > 0 ? (summary.total / summary.hours) : 0;
      
      let dailyFee = 0;
      if (feeType === 'percent') {
        dailyFee = rateHour * (feeRate / 100);
      } else {
        dailyFee = rateHour * 0.1;
      }
      dailyFee = Math.round(dailyFee * 10000) / 10000;

      let dailyVat = 0;
      if (isOutVat) {
        dailyVat = Math.round((dailyFee / 1.07) * 10000) / 10000;
      }

      const summaryRow = sheet.addRow([
        `รวม ${summary.date}`, // Col A (1)
        summary.hours,         // Col B (2)
        "ชม.",                  // Col C (3)
        summary.total,         // Col D (4)
        "บาท",                  // Col E (5)
        "",                    // Col F (6) - Fee (formula)
        ""                     // Col G (7) - VAT (formula)
      ]);

      summaryRow.getCell(2).numFmt = '#,##0.00';
      summaryRow.getCell(4).numFmt = '#,##0.00';
      summaryRow.getCell(6).numFmt = '#,##0.0000';
      summaryRow.getCell(7).numFmt = '#,##0.0000';

      const sRowNum = summaryRow.number;

      // Fee Formula: (D/B) * %fee (or (D/B) * 0.1 if value)
      const multiplier = feeType === 'percent' ? (feeRate / 100) : 0.1;
      summaryRow.getCell(6).value = {
        formula: `ROUND((D${sRowNum}/B${sRowNum})*${multiplier}, 4)`,
        result: dailyFee
      };

      // VAT Formula: F / 1.07
      if (isOutVat) {
        summaryRow.getCell(7).value = {
          formula: `ROUND(F${sRowNum}/1.07, 4)`,
          result: dailyVat
        };
      } else {
        summaryRow.getCell(7).value = 0;
      }

      styleRow(summaryRow);
    });

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
