function calculateTotalOnMatchday(item) {
  const total = Number(item?.total_price) || 0;
  const insurance =
    Number(item?.insurance_bundle_order?.total) || 0;

  // Always subtract insurance first
  let result = total - insurance;

  // No match discount → return after insurance deduction
  if (!item?.match_discount) {
    return result;
  }

  const discount =
    Number(item?.match_discount?.total_discount) || 0;

  const isMatchday =
    !!item?.match_discount?.promotion?.is_matchday;

  if (isMatchday) {
    return result + discount;
  }

  return result - discount;
}

export default calculateTotalOnMatchday;
