import { drawSignatureBlock } from "../common/signatureBlock";
export async function loanDetailsPages(doc: any, data: any, drawTable: any) {

    const margin = 40;
    const pageWidth = doc.page.width;

    const loan = data.loan;

    /* ---------------- PAGE BORDER ---------------- */
    doc.rect(
        margin / 2,
        margin / 2,
        pageWidth - margin,
        doc.page.height - margin
    ).stroke();

    /* ---------------- HEADER ---------------- */
    doc.font('Helvetica-Bold')
        .fontSize(16)
        .text('LOAN DETAILS', { align: 'center' });

    doc.moveDown(1);

    /* ---------------- SECTION LINE ---------------- */
    doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();

    doc.moveDown(1);

    /* ---------------- LOAN SUMMARY BOX ---------------- */
    const boxY = doc.y;

    doc.rect(margin, boxY, pageWidth - margin * 2, 160).stroke();

    doc.fontSize(12).font('Helvetica-Bold')
        .text('Loan Summary', margin + 10, boxY + 10);

    doc.font('Helvetica').fontSize(11);

    let y = boxY + 35;

    doc.text(`Loan Type: ${loan.loanType}`, margin + 10, y);
    doc.text(`Loan Amount: ₹${loan.amount}`, margin + 10, y + 20);
    doc.text(`Interest Rate: ${loan.interestRate}% (${loan.interestType})`, margin + 10, y + 40);
    doc.text(`Duration: ${loan.duration}`, margin + 10, y + 60);

    /* RIGHT COLUMN */
    const rightX = pageWidth / 2;

    doc.text(`Total Interest: ₹${loan.totalInterest}`, rightX, y);
    doc.text(`Total Payable: ₹${loan.totalPayable}`, rightX, y + 20);
    doc.text(`Disbursed Amount: ₹${loan.disbursedAmount}`, rightX, y + 40);
    doc.text(`First EMI Date: ${loan.firstEmiDate}`, rightX, y + 60);
    doc.text(`Frequency: ${loan.frequency}`, rightX, y + 80);

    doc.moveDown(9);

    /* ---------------- FEES BOX ---------------- */
    doc.font('Helvetica-Bold').text('Charges & Fees');

    doc.moveDown(0.5);

    doc.rect(margin, doc.y, pageWidth - margin * 2, 80).stroke();

    doc.font('Helvetica').fontSize(11);

    const feeY = doc.y + 10;

    doc.text(`Processing Fee: ₹${loan.fees.processing}`, margin + 10, feeY);
    doc.text(`Insurance Fee: ₹${loan.fees.insurance}`, margin + 10, feeY + 20);
    doc.text(`Other Charges: ₹${loan.fees.others}`, margin + 10, feeY + 40);

    doc.moveDown(5);

    /* ---------------- NOTE ---------------- */
    doc.fontSize(9)
        .fillColor('gray')
        .text(
            'Note: All charges, interest and repayment obligations are agreed upon by the borrower.',
            { align: 'center' }
        );

    doc.fillColor('black');

    /* -------- SIGNATURE BLOCK -------- */
    drawSignatureBlock(doc, data);

    /* ---------------- NEXT PAGE ---------------- */
    doc.addPage();

    /* ===================================================== */
    /* ================= EMI SCHEDULE PAGE ================= */
    /* ===================================================== */

    /* BORDER */
    doc.rect(
        margin / 2,
        margin / 2,
        pageWidth - margin,
        doc.page.height - margin
    ).stroke();

    /* HEADER */
    doc.font('Helvetica-Bold')
        .fontSize(16)
        .text('REPAYMENT SCHEDULE', { align: 'center' });

    doc.moveDown(1);

    doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();

    doc.moveDown(1);

    /* SUMMARY STRIP */
    doc.fontSize(11).font('Helvetica-Bold');

    doc.text(
        `Loan Amount: ₹${loan.amount}    |    Total Payable: ₹${loan.totalPayable}    |    Interest: ${loan.interestRate}%`,
        { align: 'center' }
    );

    doc.moveDown(1);

    /* TABLE CONTAINER BOX */
    const tableStartY = doc.y;

    doc.rect(
        margin,
        tableStartY,
        pageWidth - margin * 2,
        doc.page.height - tableStartY - 60
    ).stroke();

    doc.moveDown(0.5);

    /* ---------------- TABLE ---------------- */
    await drawTable(doc, loan.repayments);

    doc.moveDown(1);

    /* FOOTER */
    doc.fontSize(9)
        .fillColor('gray')
        .text(
            'This is a system generated repayment schedule and forms part of the agreement.',
            { align: 'center' }
        );

    doc.fillColor('black');

    /* -------- SIGNATURE BLOCK -------- */
    drawSignatureBlock(doc, data);

}