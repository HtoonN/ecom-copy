import pdfMake from 'pdfmake/build/pdfmake';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import formatNumberWithCommas from "./formatNumberWithComma";
import logoBase64 from "./logo";
import vfsFonts from "./vfs_fonts";

// Try multiple ways to assign VFS due to module wrapping
const vfs = vfsFonts.default || vfsFonts || {};
console.log("pdfMake setting up VFS. Keys found:", Object.keys(vfs));

if (pdfMake.vfs) {
  Object.assign(pdfMake.vfs, vfs);
} else {
  pdfMake.vfs = vfs;
}

if (typeof window !== 'undefined') {
  window.pdfMake = window.pdfMake || {};
  if (window.pdfMake.vfs) {
    Object.assign(window.pdfMake.vfs, vfs);
  } else {
    window.pdfMake.vfs = vfs;
  }
}

pdfMake.fonts = {
  Sarabun: {
    normal: 'Sarabun-Regular.ttf',
    bold: 'Sarabun-Bold.ttf',
    italics: 'Sarabun-Regular.ttf',
    bolditalics: 'Sarabun-Bold.ttf'
  }
};

export default async function exportPdfVat(sheets, options, fileName) {
  const { isZip, columns } = options;
  const zip = new JSZip();

  for (const sheetData of sheets) {
    const feeRate = parseFloat(sheetData.commission?.fee) || 0;
    const feeType = sheetData.commission?.fee_type || 'percent';
    const isOutVat = sheetData.commission?.is_out_vat === 1 || sheetData.commission?.is_out_vat === true;
    const isExtractVat = sheetData.commission?.is_extract_vat === 1 || sheetData.commission?.is_extract_vat === true;
    const feeHeaderStr = feeType === 'percent' ? `${feeRate}%` : feeRate.toString();

    // Yield control to UI thread to prevent browser lockup
    if (options.onProgress) {
      options.onProgress(sheets.indexOf(sheetData) + 1, sheets.length);
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    // Determine which columns to show
    const showBooker = columns.includes('bookerName');
    const showSport = columns.includes('sport');

    const tableHeaders = ["No.", "Match ID"];
    if (showBooker) tableHeaders.push("Customer Name");
    if (showSport) tableHeaders.push("Sport Type");
    tableHeaders.push("Booking Date", "Booking Time", "Rate/hour (฿)", "Hr.", "Total", `Fee (${feeHeaderStr})`, "VAT");

    const tableBody = [];
    tableBody.push(tableHeaders.map(text => ({ text, bold: true, alignment: 'center', fillColor: '#eeeeee' })));

    let grandTotalHr = 0;
    let grandTotalPrice = 0;
    let grandTotalFee = 0;
    let grandTotalVat = 0;

    sheetData.records.forEach((item, index) => {
      const rateVal = parseFloat(item.rate) || 0;
      const hoursVal = parseFloat(item.hours) || 0;
      const totalVal = parseFloat(item.total) || 0;

      let feeVal = parseFloat(item.fee) || 0;
      let vatVal = parseFloat(item.vat) || 0;

      // Note: we can use the fee/vat already calculated from outside if they exist, 
      // but let's recalculate properly here to be safe and identical to excel_by_sheet_v2:
      if (feeType === 'percent') {
        if (isExtractVat) {
          feeVal = (totalVal / 1.07) * (feeRate / 100);
        } else {
          feeVal = totalVal * (feeRate / 100);
        }
      } else {
        feeVal = feeRate * hoursVal;
      }
      feeVal = Math.round(feeVal * 10000) / 10000;

      if (isOutVat) {
        vatVal = Math.round((feeVal * 0.07) * 10000) / 10000;
      } else {
        vatVal = 0;
      }

      grandTotalHr += hoursVal;
      grandTotalPrice += totalVal;
      grandTotalFee += feeVal;
      grandTotalVat += vatVal;

      const row = [
        { text: (index + 1).toString(), alignment: 'center' },
        { text: item.matchId, alignment: 'center' }
      ];
      if (showBooker) row.push({ text: item.Customer || '-', alignment: 'center' });
      if (showSport) row.push({ text: item.Sport || '-', alignment: 'center' });

      row.push(
        { text: item.date, alignment: 'center' },
        { text: item.time, alignment: 'center' },
        { text: formatNumberWithCommas(rateVal), alignment: 'center' },
        { text: formatNumberWithCommas(hoursVal), alignment: 'center' },
        { text: formatNumberWithCommas(totalVal), alignment: 'center' },
        { text: formatNumberWithCommas(feeVal), alignment: 'center' },
        { text: formatNumberWithCommas(vatVal), alignment: 'center' }
      );

      tableBody.push(row);
    });

    // Totals row
    const totalRowPrefixSpan = 2 + (showBooker ? 1 : 0) + (showSport ? 1 : 0) + 3; // spanning till Hr.
    const totalRow = [
      { text: "Total", bold: true, colSpan: totalRowPrefixSpan, alignment: 'right' }
    ];
    for(let i = 1; i < totalRowPrefixSpan; i++) {
        totalRow.push({});
    }
    
    totalRow.push(
      { text: formatNumberWithCommas(grandTotalHr), bold: true, alignment: 'center' },
      { text: formatNumberWithCommas(grandTotalPrice), bold: true, alignment: 'center' },
      { text: formatNumberWithCommas(grandTotalFee), bold: true, alignment: 'center' },
      { text: formatNumberWithCommas(grandTotalVat), bold: true, alignment: 'center' }
    );
    tableBody.push(totalRow);

    // Balance row
    // Wait, total balance in the original excel is (grandTotalPrice). 
    // Oh wait! The original Excel formula doesn't calculate Total Balance.
    // It's empty in the excel screenshot except for the Title... 
    // Wait, the image shows "Total Balance (to transfer) 937.65". 
    // The total is 1050, fee 105, vat 7.35. 
    // 1050 - 105 - 7.35 = 937.65.
    const totalBalance = grandTotalPrice - grandTotalFee - grandTotalVat;
    const balanceSpan = totalRowPrefixSpan; 
    const balanceRow = [
      { text: "Total Balance (to transfer)", bold: true, colSpan: balanceSpan, alignment: 'right' }
    ];
    for(let i = 1; i < balanceSpan; i++) {
        balanceRow.push({});
    }
    balanceRow.push(
      { text: formatNumberWithCommas(totalBalance), bold: true, colSpan: 4, alignment: 'center' },
      {}, {}, {}
    );
    tableBody.push(balanceRow);

    const isLandscape = showBooker || showSport;
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: isLandscape ? 'landscape' : 'portrait',
      pageMargins: isLandscape ? [30, 40, 30, 40] : [40, 60, 40, 60],
      defaultStyle: {
        font: 'Sarabun',
        fontSize: isLandscape ? 8.5 : 10
      },
      content: [
        {
          image: 'data:image/png;base64,' + logoBase64,
          width: 80,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Matchday Booking Report',
          style: 'header',
          alignment: 'center'
        },
        {
          text: sheetData.companyName || '-',
          style: 'subheader',
          alignment: 'center'
        },
        {
          text: `Billing Period: ${sheetData.timePeriod || '-'}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                headerRows: 1,
                widths: tableHeaders.map(() => 'auto'),
                body: tableBody
              },
              layout: {
                hLineWidth: function (i, node) { return 0.5; },
                vLineWidth: function (i, node) { return 0.5; },
                hLineColor: function (i, node) { return 'black'; },
                vLineColor: function (i, node) { return 'black'; },
              }
            },
            { width: '*', text: '' }
          ]
        },
        {
          text: 'หมายเหตุ: บางรายการอาจไม่มีการคำนวณ VAT เนื่องจากลูกค้าจองก่อนวันที่ 14 พฤศจิกายน 2568',
          fontSize: 8.5,
          alignment: 'center',
          margin: [0, 20, 0, 10]
        },
        {
          text: '-End of Report-',
          fontSize: 8.5,
          alignment: 'center'
        }
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true
        },
        subheader: {
          fontSize: 11,
          bold: true,
          margin: [0, 3, 0, 0]
        }
      }
    };

    if (isZip) {
      // Create pdf and add to zip
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      try {
        const blob = await pdfDocGenerator.getBlob();
        // Replace slashes or special chars in sheet name for valid file names
        const safeName = (sheetData.sheetName || 'Sheet').replace(/[^a-zA-Z0-9ก-๙ -]/g, "_");
        zip.file(`${safeName}.pdf`, blob);
      } catch (err) {
        console.error("Failed to generate PDF blob for sheet:", sheetData.sheetName, err);
        throw err;
      }
    } else {
      // Download directly
      const safeName = (sheetData.sheetName || 'Sheet').replace(/[^a-zA-Z0-9ก-๙ -]/g, "_");
      pdfMake.createPdf(docDefinition).download(`${safeName}.pdf`);
    }
  }

  if (isZip) {
    const content = await zip.generateAsync({ 
      type: "blob",
      compression: "STORE"
    });
    saveAs(content, `${fileName || 'Booking_Reports'}.zip`);
  }
}
