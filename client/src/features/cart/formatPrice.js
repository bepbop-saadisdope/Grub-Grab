export const formatPrice = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? `Rs. ${v.toFixed(0)}` : 'Rs. —';
};
