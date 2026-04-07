export function formatPrice(price: { amount: string; currency: string }): string {
  const cents = Number(price.amount);
  if (isNaN(cents)) return `${price.amount} ${price.currency}`;

  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}
