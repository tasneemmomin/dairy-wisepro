import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a formatted Invoice PDF for a given order.
 * @param {Object} order - The order object from the API
 * @param {Object} user  - The logged-in user object
 */
export function downloadInvoicePDF(order, user) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const green = [34, 139, 34];
  const dark  = [30, 30, 30];
  const gray  = [100, 100, 100];
  const light = [240, 248, 240];

  // ── Header banner ─────────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Vasantdada Dairy Agency', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fresh Dairy Products | Sangli, Maharashtra', 14, 21);
  doc.text('Phone: 8766997752 / 9975882125', 14, 27);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageW - 14, 18, { align: 'right' });

  // ── Invoice meta ──────────────────────────────────────────────────
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let y = 42;
  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${order._id?.slice(-8).toUpperCase() || 'N/A'}`, 42, y);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageW - 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(orderDate, pageW - 58, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text('PAID ✓', 42, y);
  doc.setTextColor(...green);
  doc.setFont('helvetica', 'bold');
  doc.text('● PAID', 44, y);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'normal');

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Method:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code', 42, y);

  // ── Customer info box ─────────────────────────────────────────────
  y += 12;
  doc.setFillColor(...light);
  doc.setDrawColor(200, 230, 200);
  doc.roundedRect(14, y, pageW - 28, 28, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  doc.text('Bill To:', 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.text(`Name  : ${user?.name || order.user?.name || 'Customer'}`, 18, y + 16);
  doc.text(`Phone : ${user?.phone || order.user?.phone || 'N/A'}`, 18, y + 22);

  if (order.deliveryAddress?.street) {
    const addr = [
      order.deliveryAddress.street,
      order.deliveryAddress.city,
      order.deliveryAddress.state,
      order.deliveryAddress.pincode
    ].filter(Boolean).join(', ');
    doc.text(`Address: ${addr}`, 18, y + 28, { maxWidth: pageW - 36 });
    y += 6;
  }

  // ── Items table header ────────────────────────────────────────────
  y += 36;
  doc.setFillColor(...green);
  doc.rect(14, y, pageW - 28, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('#',    18, y + 6);
  doc.text('Product',    28, y + 6);
  doc.text('Qty',       120, y + 6, { align: 'center' });
  doc.text('Unit Price', 145, y + 6, { align: 'center' });
  doc.text('Amount',    pageW - 18, y + 6, { align: 'right' });

  // ── Items rows ────────────────────────────────────────────────────
  y += 9;
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'normal');

  const items = order.items || [];
  items.forEach((item, idx) => {
    const rowColor = idx % 2 === 0 ? [255, 255, 255] : [247, 252, 247];
    doc.setFillColor(...rowColor);
    doc.rect(14, y, pageW - 28, 9, 'F');

    doc.text(`${idx + 1}`,                   18, y + 6);
    doc.text(item.name || 'Product',          28, y + 6);
    doc.text(`${item.quantity}`,             120, y + 6, { align: 'center' });
    doc.text(`Rs.${item.price?.toFixed(0)}`, 145, y + 6, { align: 'center' });
    doc.text(`Rs.${(item.price * item.quantity).toFixed(0)}`, pageW - 18, y + 6, { align: 'right' });

    // Light separator
    doc.setDrawColor(220, 240, 220);
    doc.line(14, y + 9, pageW - 14, y + 9);
    y += 9;
  });

  // ── Totals ───────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(...green);
  doc.line(pageW - 80, y, pageW - 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', pageW - 80, y);
  doc.text(`Rs.${order.totalAmount?.toFixed(0)}`, pageW - 18, y, { align: 'right' });
  y += 7;
  doc.text('Tax (GST):', pageW - 80, y);
  doc.text('Included', pageW - 18, y, { align: 'right' });
  y += 7;

  doc.setFillColor(...green);
  doc.rect(pageW - 82, y - 1, 68, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', pageW - 80, y + 6);
  doc.text(`Rs.${order.totalAmount?.toFixed(0)}`, pageW - 18, y + 6, { align: 'right' });

  // ── Footer ───────────────────────────────────────────────────────
  y += 24;
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Thank you for choosing Vasantdada Dairy Agency!', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text('For queries, WhatsApp: 8766997752 | UPI: 9975882125@okbizaxis', pageW / 2, y, { align: 'center' });

  // ── Watermark (paid) ─────────────────────────────────────────────
  doc.setTextColor(34, 139, 34, 0.08);
  doc.setFontSize(72);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageW / 2, 160, { align: 'center', angle: 45 });

  // ── Save ─────────────────────────────────────────────────────────
  const filename = `Invoice_${order._id?.slice(-8).toUpperCase()}_VasantDairy.pdf`;
  doc.save(filename);
}
