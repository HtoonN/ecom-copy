import moment from "moment";

/**
 * Format date or time range smartly
 * 
 * startStr: string → start date/time
 * endStr: string | null → end date/time
 * options:
 *   - longMonth: boolean (default false)
 *   - isTime: boolean (default false)
 */
export default function (startStr, endStr = null, options = {}) {
  const { longMonth = false, isTime = false } = options;
  const start = moment(startStr);
  const end = endStr ? moment(endStr) : null;

  // ----------------------------
  // TIME MODE
  // ----------------------------
  if (isTime) {
    if (end) return `${start.format("HH:mm")}-${end.format("HH:mm")}`;
    return start.format("HH:mm");
  }

  const monthFormat = longMonth ? "MMMM" : "MMM";

  // SINGLE DATE
  if (!end || start.isSame(end, 'day')) {
    return start.format(`D-${monthFormat}-YYYY`);
  }

  // ----------------------------
  // DATE RANGE
  // ----------------------------
  const startDay = start.format("D");
  const endDay = end.format("D");
  const startMonth = start.format(monthFormat);
  const endMonth = end.format(monthFormat);
  const startYear = start.format("YYYY");
  const endYear = end.format("YYYY");

  // SAME MONTH & SAME YEAR
  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }

  // SAME YEAR BUT DIFFERENT MONTH
  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
  }

  // DIFFERENT YEAR
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}
