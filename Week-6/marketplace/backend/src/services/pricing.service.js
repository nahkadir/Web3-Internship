export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const lineSubtotal = (unitPrice, quantity) =>
  round2(unitPrice * quantity);

// lines: [{ unitPrice, quantity }], always built from DB prices
export const calculateTotals = (lines) => {
  const subtotal = round2(
    lines.reduce((sum, l) => sum + lineSubtotal(l.unitPrice, l.quantity), 0),
  );

  // placeholders, ready for later days
  const shippingAmount = 0;
  const discountAmount = 0;
  const taxAmount = 0;

  const totalAmount = round2(
    subtotal + shippingAmount + taxAmount - discountAmount,
  );
  return { subtotal, shippingAmount, discountAmount, taxAmount, totalAmount };
};

// payment providers work in integer minor units (paisa), never floats
export const toMinorUnits = (amount) => Math.round(amount * 100);
