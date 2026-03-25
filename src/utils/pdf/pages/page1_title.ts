import { drawSignatureBlock } from '../common/signatureBlock';
import { formatDate } from '../helpers';

export async function page1Title(doc: any, data: any) {

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    /* -------- WATERMARK -------- */
    // doc.save();
    // doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
    // doc.fontSize(60)
    //     .fillColor('#eeeeee')
    //     .opacity(0.3)
    //     .text(data.company.name, pageWidth / 6, pageHeight / 2, {
    //         align: 'center',
    //     });
    // doc.restore();

    // doc.opacity(1).fillColor('black');

    /* -------- BORDER -------- */
    doc
        .lineWidth(1)
        .rect(
            margin / 2,
            margin / 2,
            pageWidth - margin,
            pageHeight - margin
        )
        .stroke();

    /* -------- HEADER -------- */
    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('LOAN AGREEMENT CUM UNDERTAKING', {
            align: 'center',
        });

    doc.moveDown(0.5);

    doc
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text(
            '(Executed under applicable laws of India)',
            { align: 'center' }
        );

    doc.moveDown(1.5);

    /* -------- META INFO -------- */
    doc.fontSize(11).font('Helvetica');

    doc.text(`Agreement Date: ${formatDate(data.generatedAt)}`);
    doc.text(`Contract No: ${data.contractNumber}`);

    /* Divider */
    doc.moveDown(0.5);
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();

    doc.moveDown(1);

    /* -------- MAIN LEGAL DECLARATION -------- */
    doc.fontSize(11);

    doc.text(
        `THIS LOAN AGREEMENT ("Agreement") is made and executed at the registered office of ${data.company.name}, having its office at ${data.company.address} (hereinafter referred to as the "LENDER"), which expression shall include its successors and assigns.`,
        { align: 'justify' }
    );

    doc.moveDown();

    doc.text(`AND`, { align: 'center' });

    doc.moveDown();

    doc.text(
        `${data.customer.applicantName}, S/o/D/o ${data.customer.guardianName}, residing at ${data.customer.address.village}, ${data.customer.address.district}, ${data.customer.address.pinCode}, (hereinafter referred to as the "BORROWER"), which expression shall include legal heirs and representatives.`,
        { align: 'justify' }
    );

    doc.moveDown(1.5);

    /* -------- WHEREAS -------- */
    doc.font('Helvetica-Bold').text('WHEREAS:', { underline: true });

    doc.moveDown(0.5);
    doc.font('Helvetica');

    const clauses = [
        `A. The Borrower has approached the Lender for a loan under "${data.loan.loanType}".`,
        `B. The Lender agrees to grant ₹${data.loan.amount} (Rupees ${numberToWords(data.loan.amount)}).`,
        `C. All submitted documents are declared true and valid.`,
        `D. The Borrower agrees to repay with interest and charges as scheduled.`,
    ];

    clauses.forEach(c => {
        doc.text(c, { align: 'justify' });
        doc.moveDown(0.3);
    });

    doc.moveDown(1);

    /* Divider */
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();

    doc.moveDown(1);

    /* -------- TERMS -------- */
    doc.font('Helvetica-Bold').text(
        'NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:',
    );

    doc.moveDown(0.5);
    doc.font('Helvetica');

    doc.text(
        `The Borrower agrees to abide by all terms including repayment, interest, penalties, and verification.`,
        { align: 'justify' }
    );

    doc.moveDown(0.5);

    doc.text(
        `The Lender is authorized to verify information and initiate legal action in case of default.`,
        { align: 'justify' }
    );

    doc.moveDown(0.5);

    doc.text(
        `This Agreement is governed by laws of India and jurisdiction lies with courts of the Lender's location.`,
        { align: 'justify' }
    );

    doc.moveDown(1);

    /* Divider */
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();

    doc.moveDown(1);

    /* -------- DECLARATION -------- */
    doc.font('Helvetica-Bold').text('DECLARATION BY BORROWER:', {
        underline: true,
    });

    doc.moveDown(0.5);
    doc.font('Helvetica');

    doc.text(
        `I, ${data.customer.applicantName}, declare all information is true. I understand and accept all financial obligations and agree to repay the loan.`,
        { align: 'justify' }
    );

    doc.moveDown(3);

    /* -------- SIGNATURE BLOCK -------- */
    drawSignatureBlock(doc, data);
}

/* -------- HELPER -------- */
function numberToWords(num: number): string {
    return num.toString();
}