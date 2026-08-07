import XLSX from "xlsx-js-style/dist/xlsx.min.js";

const calculateColumnWidths = (data) => {
  // Iterate over the keys of the first object to calculate column widths
  return Object.keys(data[0]).map((key) => ({
    wch:
      Math.max(
        key.length, // Header length
        ...data.map((row) => (row[key] ? row[key].toString().length : 0)) // Data length
      ) + 2, // Add padding
  }));
};

export default function exportExcelFun({
  data,
  title,
  filename,
  sheetname = "sheet",
  merges = [],
  cellStyles = [],
}) {
  // Step 1: Create a new worksheet
  const worksheet = XLSX.utils.json_to_sheet([]);

  // Step 2: Add a title row
  const title_text = [[title]]; // Title row
  XLSX.utils.sheet_add_aoa(worksheet, title_text, { origin: "A1" });

  const columnCount = Object.keys(data[0]).length;

  // Step 3: Merge cells for the title
  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 }, // Start cell (row 0, column 0)
      e: { r: 0, c: columnCount - 1 }, // End cell (row 0, last column)
    },
    ...merges,
  ]; // Merge A1 to number of columns

  // Step 4: Apply styling to the title
  worksheet["A1"].s = {
    alignment: {
      horizontal: "center", // Center horizontally
      vertical: "center", // Center vertically
    },
    font: {
      bold: true,
      sz: 14, // Font size
    },
  };

  // Step 5: Shift the JSON data down to start after the title row
  XLSX.utils.sheet_add_json(worksheet, data, {
    origin: "A2", // JSON data starts from the second row
    skipHeader: false,
  });

  cellStyles.forEach(({ cell, style }) => {
    if (!cell || !style) return;
    if (!worksheet[cell]) {
      worksheet[cell] = { t: "s", v: "" };
    }
    worksheet[cell].s = {
      ...(worksheet[cell].s || {}),
      ...style,
    };
  });

  worksheet["!cols"] = calculateColumnWidths(data);

  // Step 6: Create a workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetname);

  // Step 7: Export the workbook to an Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
