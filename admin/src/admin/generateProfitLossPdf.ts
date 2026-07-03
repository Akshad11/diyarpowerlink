import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SectionTotal {
  productRevenue?: number;
  serviceRevenue?: number;
  totalRevenue?: number;
  productCogs?: number;
  serviceCogs?: number;
  totalCogs?: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
}

interface ProfitLossReport {
  revenue: SectionTotal;
  cogs: SectionTotal;
  grossProfit: number;
  expenses: ExpenseBreakdown[];
  totalExpenses: number;
  netProfit: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export const generateProfitLossPdf = (report: ProfitLossReport, settings: any) => {
  const doc = new jsPDF() as any;

  const websiteName = settings?.websiteName || 'Diyar Power Link LLP';
  const companyPhone = settings?.contactPhone || '+966-XXXX-XXXX';
  const companyEmail = settings?.contactEmail || 'info@diyarpowerlink.com';
  const companyAddress = settings?.contactAddress || 'Riyadh, Saudi Arabia';

  const dateRangeStr = `${new Date(report.period.startDate).toLocaleDateString()} to ${new Date(report.period.endDate).toLocaleDateString()}`;

  // 1. Header (Company Info)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
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
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('PROFIT & LOSS STATEMENT', 14, 42);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Reporting Period: ${dateRangeStr}`, 14, 48);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 54);
  doc.text('Currency: INR (₹)', 14, 60);

  // 3. Consolidated KPI summary block
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(14, 66, 182, 22, 3, 3, 'F');

  const drawKpi = (label: string, value: string, x: number) => {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, 74);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x, 81);
  };

  const formatCurrency = (val: number) => {
    return `Rs. ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  drawKpi('REVENUE', formatCurrency(report.revenue.totalRevenue || 0), 22);
  drawKpi('COST OF SALES', formatCurrency(report.cogs.totalCogs || 0), 62);
  drawKpi('GROSS PROFIT', formatCurrency(report.grossProfit), 102);
  drawKpi('EXPENSES', formatCurrency(report.totalExpenses), 142);

  // Draw Net Profit on a highlighted block
  doc.setFillColor(report.netProfit >= 0 ? 240 : 254, report.netProfit >= 0 ? 253 : 242, report.netProfit >= 0 ? 244 : 242); // green 50 or red 50
  doc.roundedRect(144, 94, 52, 12, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(report.netProfit >= 0 ? 22 : 220, report.netProfit >= 0 ? 101 : 38, report.netProfit >= 0 ? 52 : 38); // green 800 or red 800
  doc.text('NET PROFIT:', 148, 102);
  doc.text(formatCurrency(report.netProfit), 192, 102, { align: 'right' });

  // 4. Detailed Financial Statement Table
  const tableRows: any[][] = [];

  const addHeaderRow = (title: string) => {
    tableRows.push([[title, '']]);
  };

  const addLineRow = (label: string, val: number, indent = true) => {
    const labelText = indent ? `   ${label}` : label;
    tableRows.push([labelText, formatCurrency(val)]);
  };

  const addTotalRow = (label: string, val: number) => {
    tableRows.push([label, formatCurrency(val)]);
  };

  // Build the rows structure
  addHeaderRow('Operating Revenue');
  addLineRow('Product Sales Revenue', report.revenue.productRevenue || 0);
  addLineRow('Service Sales Revenue', report.revenue.serviceRevenue || 0);
  addTotalRow('Total Operating Revenue', report.revenue.totalRevenue || 0);

  addHeaderRow('Cost of Goods Sold (COGS) / Direct Costs');
  addLineRow('Product Purchases Cost', report.cogs.productCogs || 0);
  if (report.cogs.serviceCogs) {
    addLineRow('Service Procurement Cost', report.cogs.serviceCogs || 0);
  }
  addTotalRow('Total Cost of Goods Sold', report.cogs.totalCogs || 0);

  addTotalRow('GROSS PROFIT', report.grossProfit);

  addHeaderRow('Operating Expenses (OPEX)');
  report.expenses.forEach(exp => {
    addLineRow(exp.category, exp.amount);
  });
  if (report.expenses.length === 0) {
    addLineRow('No operational expenses logged', 0);
  }
  addTotalRow('Total Operating Expenses', report.totalExpenses);

  addTotalRow('NET PROFIT', report.netProfit);

  // Render Table
  autoTable(doc, {
    startY: 112,
    body: tableRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      const rowText = data.cell.text[0] || '';
      
      // Highlight Header Rows
      if (
        rowText === 'Operating Revenue' ||
        rowText === 'Cost of Goods Sold (COGS) / Direct Costs' ||
        rowText === 'Operating Expenses (OPEX)'
      ) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate 100
        data.cell.styles.textColor = [15, 23, 42];
      }

      // Highlight Total Rows
      if (
        rowText === 'Total Operating Revenue' ||
        rowText === 'Total Cost of Goods Sold' ||
        rowText === 'Total Operating Expenses'
      ) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [51, 65, 85]; // slate 700
      }

      // Highlight Gross Profit and Net Profit Rows
      if (rowText === 'GROSS PROFIT') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }

      if (rowText === 'NET PROFIT') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = report.netProfit >= 0 ? [220, 252, 231] : [254, 226, 226]; // green 100 or red 100
        // Correcting RGB for red 100: [254, 226, 226]
        if (report.netProfit < 0) {
          data.cell.styles.fillColor = [254, 226, 226];
        }
        data.cell.styles.textColor = report.netProfit >= 0 ? [21, 128, 61] : [185, 28, 28]; // green 700 or red 700
        data.cell.styles.fontSize = 10;
      }
    }
  });

  // Footer text
  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Report is prepared using double-entry matching calculations net of tax liabilities. Confident and private.', 14, finalY);

  // Pagination Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(websiteName, 14, 287);
  }

  return doc;
};
