import moment from "moment";

export function formatEndDate(date) {
  if (date) {
    return moment(date).format("YYYY-MM-DD 23:59:59");
  }
}

export function previewFormat(date) {
  if (date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
