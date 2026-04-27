import PDFDocument from 'pdfkit';
import axios from 'axios';
import {
    safeStr,
    formatDate,
    formatDateTime,
    formatINR,
    humanize,
    numberToWords,
    LAYOUT,
} from './helpers';

/* =====================================================================
 * TYPES
 * ===================================================================*/
export interface ReceiptData {
    type: 'FEE' | 'EMI';
    company: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logoUrl?: string | null;
    };
    customer: {
        name: string;
        mobileNumber: string;
        memberId?: string;
    };
    payment: {
        loanId: string;
        receiptNumber: string;      // unique ref e.g. "FEE-<shortId>" or "EMI-<loanShort>-<emiNo>"
        transactionId: string;      // UTR / Collected by
        paymentMethod: string;
        paidAt: Date;
        amount: number;
        emiNumber?: number;         // only for EMI receipts
    };
}

/* =====================================================================
 * PUBLIC ENTRY
 * ===================================================================*/
export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            // Margins are set to 0 because every element below is drawn with
            // explicit (x, y) coordinates. Non-zero bottom/top margins would
            // cause PDFKit's auto-page-break (triggered when text is positioned
            // past `pageHeight - margins.bottom`) to insert blank pages when
            // we draw the footer band near the page bottom.
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                info: {
                    Title: data.type === 'FEE' ? 'Fee Payment Receipt' : 'EMI Payment Receipt',
                    Author: data.company.name,
                },
            });

            const buffers: Buffer[] = [];
            doc.on('data', (b) => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            await buildReceipt(doc, data);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/* =====================================================================
 * RECEIPT BODY
 * ===================================================================*/
async function buildReceipt(doc: any, data: ReceiptData) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const mx = 50; // margin x
    const innerW = pageW - mx * 2;
    const ACCENT = '#1a3a6e';
    const GREEN = '#2e7d32';

    // ----------------------------------------------------------------
    // HEADER BAND
    // ----------------------------------------------------------------
    const headerH = 80;
    doc.save();
    doc.rect(0, 0, pageW, headerH).fill(ACCENT);
    doc.restore();

    // Logo (top-left)
    let logoLoaded = false;
    if (data.company.logoUrl) {
        try {
            const logoRes = await axios.get(data.company.logoUrl, {
                responseType: 'arraybuffer',
                timeout: 8000,
            });
            const logoBuf = Buffer.from(logoRes.data);
            doc.image(logoBuf, mx, 12, { height: 56, fit: [120, 56] });
            logoLoaded = true;
        } catch { /* fall through to text fallback */ }
    }

    // Company name & address (top-right of header)
    const textX = logoLoaded ? mx + 135 : mx;
    doc.fillColor('white')
        .font('Helvetica-Bold').fontSize(15)
        .text(safeStr(data.company.name).toUpperCase(), textX, 18, {
            width: innerW - (logoLoaded ? 135 : 0),
            lineBreak: false,
            ellipsis: true,
        });
    doc.font('Helvetica').fontSize(8).fillColor('#c8d8f0')
        .text(safeStr(data.company.address), textX, 37, {
            width: innerW - (logoLoaded ? 135 : 0),
            lineBreak: false,
            ellipsis: true,
        });
    doc.fillColor('black');

    // ----------------------------------------------------------------
    // TITLE BAR
    // ----------------------------------------------------------------
    const titleY = headerH + 14;
    doc.save();
    doc.lineWidth(1).strokeColor(ACCENT)
        .moveTo(mx, titleY + 14).lineTo(mx + innerW, titleY + 14).stroke();
    doc.restore();

    const titleText = data.type === 'FEE' ? 'Fee Payment Receipt' : 'EMI Payment Receipt';
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(14)
        .text(titleText, mx, titleY, { width: innerW, align: 'center' });

    // ----------------------------------------------------------------
    // RECEIPT FIELDS TABLE
    // ----------------------------------------------------------------
    const tableStartY = titleY + 30;
    const rowH = 30;
    const labelW = 190;
    const valW = innerW - labelW;

    const isCash = data.payment.paymentMethod === 'CASH';

    const rows: Array<[string, string]> = [
        ['Receipt No.', safeStr(data.payment.receiptNumber)],
        ['Loan Reference', `...${data.payment.loanId.toUpperCase()}`],
        ['Customer Name', safeStr(data.customer.name)],
        ['Mobile Number', safeStr(data.customer.mobileNumber)],
        ...(data.customer.memberId ? [['Member ID', safeStr(data.customer.memberId)] as [string, string]] : []),
        ...(data.type === 'EMI' && data.payment.emiNumber != null
            ? [['EMI Number', String(data.payment.emiNumber)] as [string, string]]
            : []),
        [isCash ? 'Collected by' : 'Transaction Reference No.', safeStr(data.payment.transactionId)],
        ['Payment Method', humanize(data.payment.paymentMethod)],
        ['Transaction Status', 'Success'],
        ['Transaction Date', formatDateTime(data.payment.paidAt)],
        ['Amount', formatINR(data.payment.amount)],
        ['Payment received by', safeStr(data.company.name)],
        ['Sum of Rupees', numberToWords(data.payment.amount)],
    ];

    let y = tableStartY;
    rows.forEach((row, idx) => {
        const isEven = idx % 2 === 0;

        // Zebra background
        if (isEven) {
            doc.save().fillColor('#eef2fa').rect(mx, y, innerW, rowH).fill().restore();
        }

        // Row border
        doc.save().lineWidth(0.4).strokeColor('#d0d8e8')
            .rect(mx, y, innerW, rowH).stroke()
            .moveTo(mx + labelW, y).lineTo(mx + labelW, y + rowH).stroke().restore();

        // Colon separator column
        doc.fillColor('#555').font('Helvetica-Bold').fontSize(9.5)
            .text(':', mx + labelW - 12, y + 9, { width: 12, lineBreak: false });

        // Label
        doc.fillColor('#333').font('Helvetica-Bold').fontSize(9.5)
            .text(row[0], mx + 8, y + 9, { width: labelW - 20, lineBreak: false, ellipsis: true });

        // Value — highlight amount row
        const isAmountRow = row[0] === 'Amount';
        const isWordsRow = row[0] === 'Sum of Rupees';
        doc.fillColor(isAmountRow ? GREEN : 'black')
            .font(isAmountRow ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(isAmountRow ? 10.5 : 9.5)
            .text(row[1], mx + labelW + 8, y + (isWordsRow ? 5 : 9), {
                width: valW - 16,
                lineBreak: isWordsRow,
            });

        // For "Sum of Rupees" row, extend height if text wraps
        y += rowH;
    });

    // ----------------------------------------------------------------
    // STAMP / SEAL AREA
    // ----------------------------------------------------------------
    const stampY = y + 20;
    doc.save().lineWidth(0.6).strokeColor(ACCENT)
        .moveTo(mx, stampY).lineTo(mx + innerW, stampY).stroke().restore();

    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9)
        .text('For ' + safeStr(data.company.name), mx, stampY + 10, {
            width: innerW / 2,
        });
    doc.fillColor('#555').font('Helvetica').fontSize(8)
        .text('Authorised Signatory', mx, stampY + 24, { width: innerW / 2 });

    // Stamp circle placeholder (right side)
    const stampCx = mx + innerW - 50;
    const stampCy = stampY + 35;
    doc.save().lineWidth(1).strokeColor(ACCENT).circle(stampCx, stampCy, 34).stroke().restore();
    doc.fillColor(ACCENT).font('Helvetica-Oblique').fontSize(7.5)
        .text('OFFICIAL SEAL', stampCx - 25, stampCy - 5, { width: 50, align: 'center' });

    // ----------------------------------------------------------------
    // FOOTER BAND
    // ----------------------------------------------------------------
    const footerH = 36;
    const footerY = pageH - footerH;
    doc.save().rect(0, footerY, pageW, footerH).fill(ACCENT).restore();

    const footerParts = [
        data.company.address,
        data.company.phone ? `Phone: ${data.company.phone}` : null,
        data.company.email ? `Email: ${data.company.email}` : null,
    ].filter(Boolean).join('   ·   ');

    doc.fillColor('white').font('Helvetica').fontSize(7.5)
        .text(footerParts, mx, footerY + 7, {
            width: innerW,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
        });
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#c8d8f0')
        .text('This is a system-generated receipt.', mx, footerY + 20, {
            width: innerW,
            align: 'center',
            lineBreak: false,
        });

    doc.fillColor('black');
}
