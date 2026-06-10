import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type definitions to prevent typescript compilation errors
interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Customer {
  name: string;
  email?: string;
  phone?: string;
  gstPan?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
}

interface ItemSnapshot {
  name: string;
  sku: string;
  qty: number;
  uom: string;
  price: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface DocumentTotals {
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export const generateCrmPdf = (
  type: 'Quotation' | 'Sales Order' | 'Invoice',
  docNumber: string,
  dateStr: string,
  limitDateStr: string, // "Valid Until" or "Due Date"
  customer: Customer,
  items: ItemSnapshot[],
  totals: DocumentTotals,
  settings: any
) => {
  const doc = new jsPDF() as any;

  const websiteName = settings?.websiteName || 'Diyar Power Link LLP';
  const companyPhone = settings?.contactPhone || '+966-XXXX-XXXX';
  const companyEmail = settings?.contactEmail || 'info@diyarpowerlink.com';
  const companyAddress = settings?.contactAddress || 'Riyadh, Saudi Arabia';

  // 1. Header (Company Info)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(websiteName, 14, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`${companyAddress} | Phone: ${companyPhone} | Email: ${companyEmail}`, 14, 26);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);

  // 2. Document Title and Details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(type.toUpperCase(), 14, 40);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`${type} No: ${docNumber}`, 14, 46);
  doc.text(`Date: ${dateStr}`, 14, 52);
  if (limitDateStr) {
    const limitLabel = type === 'Quotation' ? 'Valid Until' : 'Due Date';
    doc.text(`${limitLabel}: ${limitDateStr}`, 14, 58);
  }

  // 3. Bill To / Ship To Columns
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('BILL TO:', 14, 68);
  doc.text('SHIP TO:', 110, 68);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Billing address text
  const billAddr = customer.billingAddress || {};
  const billingLines = [
    customer.name,
    customer.gstPan ? `GST/PAN: ${customer.gstPan}` : '',
    billAddr.street || '',
    `${billAddr.city || ''}, ${billAddr.state || ''} - ${billAddr.zip || ''}`,
    billAddr.country || '',
    customer.phone ? `Phone: ${customer.phone}` : ''
  ].filter(Boolean);

  let billY = 73;
  billingLines.forEach(line => {
    doc.text(line, 14, billY);
    billY += 4.5;
  });

  // Shipping address text
  const shipAddr = customer.shippingAddress || {};
  const shippingLines = [
    customer.name,
    shipAddr.street || '',
    `${shipAddr.city || ''}, ${shipAddr.state || ''} - ${shipAddr.zip || ''}`,
    shipAddr.country || '',
    customer.phone ? `Phone: ${customer.phone}` : ''
  ].filter(Boolean);

  let shipY = 73;
  shippingLines.forEach(line => {
    doc.text(line, 110, shipY);
    shipY += 4.5;
  });

  const startY = Math.max(billY, shipY) + 4;

  // 4. Items Table
  const headers = [['#', 'Item Details', 'SKU', 'Qty', 'UOM', 'Rate (INR)', 'Disc %', 'GST %', 'Total (INR)']];
  const tableRows = items.map((item, index) => [
    index + 1,
    item.name,
    item.sku,
    item.qty,
    item.uom,
    `₹${item.price.toFixed(2)}`,
    `${item.discount}%`,
    `${item.taxRate}%`,
    `₹${item.total.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: startY,
    head: headers,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { width: 8 },
      1: { width: 50 },
      2: { width: 20 },
      3: { width: 10, halign: 'center' },
      4: { width: 15 },
      5: { width: 22, halign: 'right' },
      6: { width: 14, halign: 'center' },
      7: { width: 14, halign: 'center' },
      8: { width: 25, halign: 'right' }
    }
  });

  // 5. Summary and Totals (align right)
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Calculate Subtotal (sum of line subtotals before tax and discount)
  const subtotalSum = items.reduce((acc, it) => acc + it.price * it.qty, 0);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const writeTotalRow = (label: string, value: string, y: number, isBold = false) => {
    if (isBold) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
    } else {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    }
    doc.text(label, 130, y);
    doc.text(value, 196, y, { align: 'right' });
  };

  let summaryY = finalY;
  writeTotalRow('Gross Subtotal:', `₹${subtotalSum.toFixed(2)}`, summaryY);
  summaryY += 5;
  writeTotalRow('Discount:', `-₹${totals.discountAmount.toFixed(2)}`, summaryY);
  summaryY += 5;
  writeTotalRow('Taxable Amount:', `₹${totals.taxableAmount.toFixed(2)}`, summaryY);
  summaryY += 5;
  writeTotalRow('GST Tax:', `₹${totals.taxAmount.toFixed(2)}`, summaryY);
  summaryY += 6;
  writeTotalRow('Grand Total:', `₹${totals.totalAmount.toFixed(2)}`, summaryY, true);

  // 6. Notes
  if (totals.notes) {
    const notesY = finalY;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Notes / Terms:', 14, notesY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    
    const splitNotes = doc.splitTextToSize(totals.notes, 100);
    doc.text(splitNotes, 14, notesY + 5);
  }

  // 7. Standard Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text('Thank you for your business!', 14, 287);
  }

  return doc;
};
