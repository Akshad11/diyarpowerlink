import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolveImageUrl } from './resolveImage';

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
  price?: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  remarks?: string;
}

interface DocumentTotals {
  discountAmount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  notes?: string;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const generateCrmPdf = async (
  type: 'Quotation' | 'Sales Order' | 'Invoice' | 'Delivery Note',
  docNumber: string,
  dateStr: string,
  limitDateStr: string, // "Valid Until" or "Due Date"
  customer: Customer,
  items: ItemSnapshot[],
  totals: DocumentTotals,
  settings: any
): Promise<any> => {
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

  // Logo rendering if set in settings
  if (settings?.logo) {
    try {
      const logoUrl = resolveImageUrl(settings.logo);
      const img = await loadImage(logoUrl);
      const maxW = 35;
      const maxH = 15;
      let w = img.width;
      let h = img.height;
      const ratio = w / h;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      doc.addImage(img, 'PNG', 196 - w, 10, w, h);
    } catch (err) {
      console.warn('Failed to load logo in PDF:', err);
    }
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500

  let headerText = `${companyAddress} | Phone: ${companyPhone} | Email: ${companyEmail}`;
  if (settings?.companyGst || settings?.companyTaxNo) {
    const parts = [];
    if (settings.companyGst) parts.push(`GST: ${settings.companyGst}`);
    if (settings.companyTaxNo) parts.push(`Tax No: ${settings.companyTaxNo}`);
    headerText += ` | ${parts.join(' - ')}`;
  }
  doc.text(headerText, 14, 26);

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
  if (limitDateStr && type !== 'Delivery Note') {
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
  let headers: string[][] = [];
  let tableRows: any[][] = [];
  let columnStyles: any = {};

  if (type === 'Delivery Note') {
    headers = [['#', 'Item Details', 'SKU', 'Qty', 'UOM', 'Remarks']];
    tableRows = items.map((item, index) => [
      index + 1,
      item.name,
      item.sku,
      item.qty,
      item.uom,
      item.remarks || ''
    ]);
    columnStyles = {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20 },
      5: { cellWidth: 32 }
    };
  } else {
    headers = [['#', 'Item Details', 'SKU', 'Qty', 'UOM', 'Rate (INR)', 'Disc %', 'GST %', 'Total (INR)']];
    tableRows = items.map((item, index) => [
      index + 1,
      item.name,
      item.sku,
      item.qty,
      item.uom,
      `₹${(item.price || 0).toFixed(2)}`,
      `${item.discount || 0}%`,
      `${item.taxRate || 0}%`,
      `₹${(item.total || 0).toFixed(2)}`
    ]);
    columnStyles = {
      0: { cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 15 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 25, halign: 'right' }
    };
  }

  autoTable(doc, {
    startY: startY,
    head: headers,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: type === 'Delivery Note' ? [71, 85, 105] : [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: columnStyles
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // 5. Invoice QR Code generation
  let qrImg: HTMLImageElement | null = null;
  if (type === 'Invoice') {
    try {
      const qrData = [
        `Invoice: ${docNumber}`,
        `Date: ${dateStr}`,
        `Company: ${websiteName}`,
        settings?.companyGst ? `Company GST: ${settings.companyGst}` : '',
        settings?.companyTaxNo ? `Company Tax No: ${settings.companyTaxNo}` : '',
        `Customer: ${customer.name}`,
        customer.gstPan ? `Customer GST: ${customer.gstPan}` : '',
        `Total: ₹${(totals.totalAmount || 0).toFixed(2)}`
      ].filter(Boolean).join('\n');

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
      qrImg = await loadImage(qrUrl);
    } catch (qrErr) {
      console.error('Failed to generate QR code:', qrErr);
    }
  }

  // 6. Summary and Totals (or Signatures for Delivery Note)
  if (type === 'Delivery Note') {
    // Render Delivery Note Signatures
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const sigY = finalY + 15;
    doc.line(14, sigY, 74, sigY);
    doc.text('Received By (Name & Signature)', 14, sigY + 5);

    doc.line(130, sigY, 190, sigY);
    doc.text('Authorized Signatory', 130, sigY + 5);
  } else {
    // Render Financial Totals
    const subtotalSum = items.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0);

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
    writeTotalRow('Discount:', `-₹${(totals.discountAmount || 0).toFixed(2)}`, summaryY);
    summaryY += 5;
    writeTotalRow('Taxable Amount:', `₹${(totals.taxableAmount || 0).toFixed(2)}`, summaryY);
    summaryY += 5;
    writeTotalRow('GST Tax:', `₹${(totals.taxAmount || 0).toFixed(2)}`, summaryY);
    summaryY += 6;
    writeTotalRow('Grand Total:', `₹${(totals.totalAmount || 0).toFixed(2)}`, summaryY, true);
  }

  // 7. Notes & QR Code Positioning
  let notesX = 14;
  let notesWidth = 100;

  if (qrImg) {
    try {
      doc.addImage(qrImg, 'PNG', 14, finalY, 25, 25);
      notesX = 45;
      notesWidth = 75;
    } catch (err) {
      console.error('Error adding QR code image:', err);
    }
  }

  if (totals.notes) {
    const notesY = finalY;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Notes / Terms:', notesX, notesY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    const splitNotes = doc.splitTextToSize(totals.notes, notesWidth);
    doc.text(splitNotes, notesX, notesY + 5);
  }

  // 8. Standard Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(type === 'Delivery Note' ? 'Goods received in good condition.' : 'Thank you for your business!', 14, 287);
  }

  return doc;
};
