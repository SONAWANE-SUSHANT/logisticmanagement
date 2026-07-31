const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 28;
const BLACK = '0 0 0';
const RED = '0.55 0.12 0.08';

const safe = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pdfEscape = (value) => safe(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const fmtDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN');
};

const fmtMoney = (value) => {
  const number = Number(value || 0);
  return number ? number.toFixed(2) : '';
};

const address = (customer) =>
  [customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ');

const wrap = (value, width, fontSize) => {
  const text = safe(value);
  if (!text) return [''];
  const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.5)));
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach((word) => {
    if ((line + ' ' + word).trim().length <= maxChars) {
      line = (line + ' ' + word).trim();
      return;
    }
    if (line) lines.push(line);
    line = word;
    while (line.length > maxChars) {
      lines.push(line.slice(0, maxChars));
      line = line.slice(maxChars);
    }
  });
  if (line) lines.push(line);
  return lines;
};

const createPdf = (commands) => {
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return body;
};

const downloadBlob = (content, filename) => {
  const blob = new Blob([content], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadLRPdf = (lr) => {
  const commands = ['q', '1 w', `${BLACK} RG`, `${BLACK} rg`];
  const yPdf = (y) => PAGE_HEIGHT - y;
  const line = (x1, y1, x2, y2) => commands.push(`${x1} ${yPdf(y1)} m ${x2} ${yPdf(y2)} l S`);
  const rect = (x, y, w, h) => commands.push(`${x} ${yPdf(y + h)} ${w} ${h} re S`);
  const fillText = (text, x, y, size = 8, font = 'F1', color = BLACK) => {
    commands.push(`BT /${font} ${size} Tf ${color} rg ${x} ${yPdf(y)} Td (${pdfEscape(text)}) Tj ET`);
  };
  const cellText = (text, x, y, w, h, options = {}) => {
    const size = options.size || 7.4;
    const font = options.font || 'F1';
    const lines = wrap(text, w - 8, size).slice(0, Math.max(1, Math.floor((h - 5) / (size + 1.8))));
    const startY = y + (options.top || 10);
    lines.forEach((item, index) => fillText(item, x + 4, startY + index * (size + 1.8), size, font, options.color || BLACK));
  };
  const labelValue = (label, value, x, y, w, h, labelW = 62) => {
    rect(x, y, w, h);
    line(x + labelW, y, x + labelW, y + h);
    cellText(label, x, y, labelW, h, { size: 7.2, font: 'F2', top: 9 });
    cellText(value, x + labelW, y, w - labelW, h, { size: 7.2, top: 9 });
  };

  const left = MARGIN;
  const top = 28;
  const contentW = PAGE_WIDTH - MARGIN * 2;
  const rightX = 665;
  const rightW = PAGE_WIDTH - MARGIN - rightX;

  rect(left, top, contentW, 552);
  fillText('TANUSHREE LOGISTICS', 278, 38, 25, 'F2', RED);
  fillText('Branch Office :- BajajNagar, MIDC Waluj,', 325, 58, 11, 'F2');
  fillText('Chhatrapati Sambhajinagar-431136.    Mob. 9529384849, 9049152343', 248, 72, 11, 'F2');
  fillText('E-mail.: tanushreelogistics09@gmail.com', 338, 86, 11, 'F2');
  fillText('Date :', 665, 48, 12, 'F2');
  fillText(fmtDate(lr.bookingDate) || ' / /20', 715, 48, 11, 'F2');
  fillText('Sr. No. :', 665, 80, 12, 'F2');
  fillText(lr.lrNumber, 735, 80, 14, 'F2', RED);
  line(left, 98, PAGE_WIDTH - MARGIN, 98);

  const consigner = lr.consignerId || {};
  const consignee = lr.consigneeId || {};
  cellText(`Consignor : M/s ${consigner.companyName || ''}`, left + 8, 105, 565, 17, { size: 9, font: 'F2', top: 12 });
  cellText(`Add. ${address(consigner)}`, left + 8, 126, 565, 17, { size: 9, font: 'F2', top: 10 });
  cellText(`GSTIN : ${consigner.gstNumber || ''}`, left + 8, 145, 565, 17, { size: 9, font: 'F2', top: 10 });
  cellText(`Consignee : M/s ${consignee.companyName || ''}`, left + 8, 174, 565, 17, { size: 9, font: 'F2', top: 10 });
  cellText(`Add. ${address(consignee)}`, left + 8, 195, 565, 17, { size: 9, font: 'F2', top: 10 });
  cellText(`GSTIN : ${consignee.gstNumber || ''}`, left + 8, 218, 565, 17, { size: 9, font: 'F2', top: 10 });
  line(left, 238, PAGE_WIDTH - MARGIN, 238);

  const rightBoxH = 29.5;
  const rightGap = 4;
  let ry = 108;
  const rightBox = (label, value) => {
    rect(rightX, ry, rightW, rightBoxH);
    cellText(label, rightX + 4, ry, rightW - 8, 13, { size: 7.6, font: 'F2', top: 9 });
    cellText(value || '', rightX + 4, ry + 12, rightW - 8, rightBoxH - 12, { size: 8.4, top: 7 });
    ry += rightBoxH + rightGap;
  };
  rightBox('Booking Mode', lr.bookingMode);
  rightBox('Mode of Delivery :', lr.modeOfDelivery);
  rightBox('FROM :', lr.tripId?.from);
  rightBox('TO :', lr.tripId?.to);

  labelValue('Vehicle No.:', lr.tripId?.vehicleNumber || '', left, 238, contentW, 29, 90);

  const midX = 455;
  const freightX = 600;
  const rowY = 267;
  const rowH = 24;
  labelValue('Nos. of Pkgs:', lr.packageCount || '', left, rowY, 175, rowH, 88);
  labelValue('Types of Packing', lr.packageType || '', left + 175, rowY, midX - left - 175, rowH, 105);
  rect(midX, rowY, 145, rowH * 2);
  fillText('Dimensions', midX + 39, rowY + 12, 9, 'F2');
  fillText('(lxbxh in inches)', midX + 30, rowY + 23, 8, 'F2');
  cellText(lr.dimensions || '', midX + 4, rowY + 25, 137, 20, { size: 7 });
  rect(freightX, rowY, 213, rowH);
  fillText('FREIGHT DETAILS', freightX + 60, rowY + 16, 9, 'F2');

  const details = [
    ['In Words :', safe(lr.remarks)],
    ['PART NO.:', lr.partNumber],
    ['PART NAME :', lr.partName],
    ['QTY:', lr.quantity],
    ['E-WAY BILL NO:', lr.ewayBillNumber],
    ['E-WAY BILL DATE:', fmtDate(lr.ewayBillDate)],
    ['INVOICE NO.:', lr.invoiceNumber],
    ['INVOICE DATE:', fmtDate(lr.invoiceDate)],
    ['INVOICE VALUE:', fmtMoney(lr.goodsValue)],
  ];
  details.forEach((item, index) => labelValue(item[0], item[1], left, 291 + index * 24, midX - left, 24, 105));
  labelValue('PRIVATE MARK :', lr.privateMark || '', left + 250, 363, midX - left - 250, 24, 98);
  labelValue('VALID UPTO:', fmtDate(lr.ewayBillValidUpto), left + 250, 411, midX - left - 250, 24, 88);

  rect(midX, 315, 145, 48);
  line(midX + 72, 339, freightX, 339);
  line(midX + 72, 315, midX + 72, 363);
  fillText('Rate PER CFT', midX + 7, 332, 7.5, 'F2');
  fillText('Total CFT', midX + 82, 332, 7.5, 'F2');
  rect(midX, 363, 145, 48);
  fillText('WEIGHT', midX + 55, 377, 9, 'F2');
  line(midX, 386, freightX, 386);
  line(midX + 72, 386, midX + 72, 411);
  fillText('Actual (Kg)', midX + 8, 399, 8, 'F2');
  fillText('Charged (Kg)', midX + 80, 399, 8, 'F2');
  cellText(lr.actualWeight || '', midX + 4, 397, 64, 13, { size: 7, top: 12 });
  cellText(lr.chargeableWeight || '', midX + 76, 397, 64, 13, { size: 7, top: 12 });
  rect(midX, 411, 145, 48);
  fillText('PAYMENT MODE', midX + 34, 430, 10, 'F2');
  cellText(lr.paymentMode || '', midX + 5, 434, 135, 17, { size: 8 });
  rect(midX, 459, 145, 72);
  fillText('DELIVERY', midX + 8, 480, 10, 'F2');
  fillText('DATE:', midX + 8, 494, 10, 'F2');
  cellText(fmtDate(lr.deliveryDate), midX + 60, 475, 80, 28, { size: 8 });

  const freightRows = [
    ['Freight', lr.freight],
    ['Collection Charges', lr.collectionCharges],
    ['Door Del Charges', lr.doorDeliveryCharges],
    ['Hamali', lr.hamali],
    ['St. Charges', lr.stCharges],
    ['Other Charges', lr.otherCharges],
    [
      'Sub Total',
      lr.subTotal ||
        Number(lr.freight || 0) +
          Number(lr.collectionCharges || 0) +
          Number(lr.doorDeliveryCharges || 0) +
          Number(lr.hamali || 0) +
          Number(lr.stCharges || 0) +
          Number(lr.otherCharges || 0) +
          Number(lr.insurance || 0),
    ],
    ['SGST @     %', lr.sgst || lr.gst / 2],
    ['CGST @     %', lr.cgst || lr.gst / 2],
    ['IGST @     %', lr.igst],
    ['Grand Total', lr.totalAmount],
  ];
  freightRows.forEach((item, index) => {
    const y = 291 + index * 24;
    rect(freightX, y, 213, 24);
    line(745, y, 745, y + 24);
    cellText(item[0], freightX + 2, y, 144, 24, { size: 8, font: index === 10 ? 'F2' : 'F1', top: 10 });
    cellText(fmtMoney(item[1]), 748, y, 62, 24, { size: 8, top: 10 });
  });

  rect(left, 531, midX - left, 41);
  fillText('GSTIN NO. 27IDHPM2784P1ZK', left + 8, 548, 9, 'F2');
  fillText('Get to be paid by consignor/consignee/Transporter   * Packed Quantity Not Checked', left + 8, 563, 6.8, 'F2');
  fillText('Not Responsible any leakage & breakage   * Subject to Aurangabad Jurisdiction', left + 8, 573, 6.8, 'F2');
  rect(midX, 531, 280, 41);
  fillText('Consignment Acknowledgment by', midX + 8, 546, 8, 'F2');
  fillText('Consignee as per Details Contained here in', midX + 8, 558, 8, 'F2');
  fillText('Signature', midX + 8, 562, 10, 'F2');
  fillText('Seal of the Company with date', midX + 8, 570, 10, 'F2');
  rect(735, 531, 78, 41);
  fillText('Signature of Booking clerk', 741, 565, 7, 'F2');

  commands.push('Q');
  downloadBlob(createPdf(commands), `${safe(lr.lrNumber) || 'LR'}-receipt.pdf`);
};