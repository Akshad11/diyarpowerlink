import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions to prevent typescript compilation errors
interface SupplierAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Supplier {
  name: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  crNumber?: string;
  address?: SupplierAddress;
}

interface ItemSnapshot {
  name: string;
  sku: string;
  qty: number;
  uom: string;
  price?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
}

interface DocumentTotals {
  taxableAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  notes?: string;
  currency?: string;
}

export const generateProcurementPdf = (
  type: 'RFQ' | 'Purchase Order',
  docNumber: string,
  dateStr: string,
  limitDateStr: string, // RFQ: Bid Submission Deadline, PO: Delivery Date
  supplier: Supplier,
  items: ItemSnapshot[],
  totals: DocumentTotals,
  settings: any
) => {
  const doc = new jsPDF() as any;

  const websiteName = settings?.websiteName || 'Diyar Power Link LLP';
  const companyPhone = settings?.contactPhone || '+966-XXXX-XXXX';
  const companyEmail = settings?.contactEmail || 'info@diyarpowerlink.com';
  const companyAddress = settings?.contactAddress || 'Riyadh, Saudi Arabia';

  const getCurrencySymbol = (code: string) => {
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    if (code === 'AED') return 'AED ';
    return '₹';
  };

  const currCode = totals.currency || 'INR';
  const currSymbol = getCurrencySymbol(currCode);

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
  doc.text(type === 'RFQ' ? 'REQUEST FOR QUOTATION' : 'PURCHASE ORDER', 14, 40);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`${type === 'RFQ' ? 'RFQ' : 'PO'} No: ${docNumber}`, 14, 46);
  doc.text(`Date: ${dateStr}`, 14, 52);
  if (limitDateStr) {
    const limitLabel = type === 'RFQ' ? 'Deadline' : 'Delivery Date';
    doc.text(`${limitLabel}: ${limitDateStr}`, 14, 58);
  }

  // 3. Supplier Address Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(type === 'RFQ' ? 'REQUESTED FROM (SUPPLIER):' : 'ORDERED FROM (SUPPLIER):', 14, 68);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const supAddr = supplier.address || {};
  const supplierLines = [
    supplier.name,
    supplier.email ? `Email: ${supplier.email}` : '',
    supplier.phone ? `Phone: ${supplier.phone}` : '',
    supplier.gst ? `GST: ${supplier.gst}` : '',
    supplier.pan ? `PAN: ${supplier.pan}` : '',
    supplier.crNumber ? `CR Number: ${supplier.crNumber}` : '',
    supAddr.street || '',
    `${supAddr.city || ''}, ${supAddr.state || ''} - ${supAddr.zip || ''}`,
    supAddr.country || ''
  ].filter(Boolean);

  let supY = 73;
  supplierLines.forEach(line => {
    doc.text(line, 14, supY);
    supY += 4.5;
  });

  const startY = supY + 4;

  // 4. Items Table
  let headers: string[][];
  let tableRows: any[][];
  let columnStyles: any;

  if (type === 'RFQ') {
    // Priceless RFQ Table
    headers = [['#', 'Item Details', 'SKU', 'Qty', 'UOM', `Bid Unit Rate (${currCode})`, 'Bid Tax %', `Bid Total (${currCode})`]];
    tableRows = items.map((item, index) => [
      index + 1,
      item.name,
      item.sku,
      item.qty,
      item.uom,
      '________________', // Empty line for writing rate
      '________________', // Empty line for writing tax
      '________________'  // Empty line for writing total
    ]);
    columnStyles = {
      0: { cellWidth: 8 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 15 },
      5: { cellWidth: 30, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 30, halign: 'center' }
    };
  } else {
    // Standard PO Table with Pricing
    headers = [['#', 'Item Details', 'SKU', 'Qty', 'UOM', `Rate (${currCode})`, 'Tax %', `Total (${currCode})`]];
    tableRows = items.map((item, index) => [
      index + 1,
      item.name,
      item.sku,
      item.qty,
      item.uom,
      `${currSymbol}${(item.price || 0).toFixed(2)}`,
      `${item.taxRate || 0}%`,
      `${currSymbol}${(item.total || 0).toFixed(2)}`
    ]);
    columnStyles = {
      0: { cellWidth: 8 },
      1: { cellWidth: 65 },
      2: { cellWidth: 25 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 15 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 30, halign: 'right' }
    };
  }

  autoTable(doc, {
    startY: startY,
    head: headers,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: type === 'RFQ' ? [79, 70, 229] : [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' }, // Indigo for RFQ, Emerald for PO
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: columnStyles
  });

  // 5. Summary and Totals (Only for PO)
  const finalY = doc.lastAutoTable.finalY + 10;
  
  if (type === 'Purchase Order') {
    const subtotalSum = items.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0);

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
    writeTotalRow('Gross Subtotal:', `${currSymbol}${subtotalSum.toFixed(2)}`, summaryY);
    summaryY += 5;
    writeTotalRow('Taxable Amount:', `${currSymbol}${(totals.taxableAmount || 0).toFixed(2)}`, summaryY);
    summaryY += 5;
    writeTotalRow('Tax Amount:', `${currSymbol}${(totals.taxAmount || 0).toFixed(2)}`, summaryY);
    summaryY += 6;
    writeTotalRow('Grand Total:', `${currSymbol}${(totals.totalAmount || 0).toFixed(2)}`, summaryY, true);
  }

  // 6. Notes
  const notesText = totals.notes || (type === 'RFQ' ? 'Please return the filled bid response on or before the deadline date.' : '');
  if (notesText) {
    const notesY = type === 'RFQ' ? finalY : finalY;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Instructions / Terms:', 14, notesY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    
    const splitNotes = doc.splitTextToSize(notesText, 100);
    doc.text(splitNotes, 14, notesY + 5);
  }

  // 7. Standard Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(type === 'RFQ' ? 'Request for Quotation - Diyar Power Link' : 'Purchase Order - Thank you for your cooperation!', 14, 287);
  }

  return doc;
};
