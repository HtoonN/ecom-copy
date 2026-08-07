export default function formatNumberWithCommas(number, decimalPlaces = 2) {
  if (typeof number !== "number" || isNaN(number)) return "";

  const options =
    decimalPlaces !== null
      ? {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }
      : undefined;

  return number.toLocaleString("en-US", options);
}
