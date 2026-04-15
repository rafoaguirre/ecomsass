/**
 * Minimal HTML email templates.
 *
 * Each template is a pure function: data in → HTML string out.
 * No external dependencies; styles are inlined for email-client compatibility.
 */

// ──────────────────────────────────────────────────
// Shared layout
// ──────────────────────────────────────────────────

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EcomSaaS</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="padding:32px 40px;background-color:#18181b;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">EcomSaaS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;text-align:center;font-size:12px;color:#71717a;">
              &copy; ${new Date().getFullYear()} EcomSaaS. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ──────────────────────────────────────────────────
// Order Confirmation
// ──────────────────────────────────────────────────

export interface OrderConfirmationData {
  customerName: string;
  orderRef: string;
  /** Pre-formatted total (e.g. "$129.99"). */
  totalFormatted: string;
  items: Array<{
    name: string;
    quantity: number;
    /** Pre-formatted unit price. */
    priceFormatted: string;
  }>;
  /** Optional link to order details page. */
  orderUrl?: string;
}

function orderConfirmation(data: OrderConfirmationData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:right;">${escapeHtml(item.priceFormatted)}</td>
      </tr>`
    )
    .join('');

  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;color:#18181b;">Order Confirmed</h1>
    <p style="margin:0 0 24px;color:#3f3f46;line-height:1.6;">
      Hi ${escapeHtml(data.customerName)}, thanks for your order!
      Your order <strong>${escapeHtml(data.orderRef)}</strong> has been confirmed.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr style="background-color:#fafafa;">
        <th style="padding:8px 0;text-align:left;font-size:13px;color:#71717a;border-bottom:2px solid #e4e4e7;">Item</th>
        <th style="padding:8px 0;text-align:center;font-size:13px;color:#71717a;border-bottom:2px solid #e4e4e7;">Qty</th>
        <th style="padding:8px 0;text-align:right;font-size:13px;color:#71717a;border-bottom:2px solid #e4e4e7;">Price</th>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:12px 0;text-align:right;font-weight:700;">Total</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;">${escapeHtml(data.totalFormatted)}</td>
      </tr>
    </table>
    ${
      data.orderUrl
        ? `<p style="text-align:center;"><a href="${escapeHtml(data.orderUrl)}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Order</a></p>`
        : ''
    }`;

  return baseLayout(content, `Order ${data.orderRef} confirmed — ${data.totalFormatted}`);
}

// ──────────────────────────────────────────────────
// Order Status Update
// ──────────────────────────────────────────────────

export interface OrderStatusUpdateData {
  customerName: string;
  orderRef: string;
  previousStatus: string;
  newStatus: string;
  /** Optional human-readable status message. */
  message?: string;
  orderUrl?: string;
}

function orderStatusUpdate(data: OrderStatusUpdateData): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;color:#18181b;">Order Update</h1>
    <p style="margin:0 0 16px;color:#3f3f46;line-height:1.6;">
      Hi ${escapeHtml(data.customerName)}, your order <strong>${escapeHtml(data.orderRef)}</strong> status has changed:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:16px;background-color:#fafafa;border-radius:6px;text-align:center;">
          <span style="color:#71717a;font-size:14px;">
            ${escapeHtml(data.previousStatus)}
          </span>
          <span style="margin:0 12px;color:#a1a1aa;">&rarr;</span>
          <span style="color:#18181b;font-weight:700;font-size:16px;">
            ${escapeHtml(data.newStatus)}
          </span>
        </td>
      </tr>
    </table>
    ${data.message ? `<p style="margin:0 0 24px;color:#3f3f46;line-height:1.6;">${escapeHtml(data.message)}</p>` : ''}
    ${
      data.orderUrl
        ? `<p style="text-align:center;"><a href="${escapeHtml(data.orderUrl)}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Order</a></p>`
        : ''
    }`;

  return baseLayout(content, `Order ${data.orderRef}: ${data.newStatus}`);
}

// ──────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────

export const emailTemplates = {
  orderConfirmation,
  orderStatusUpdate,
} as const;
