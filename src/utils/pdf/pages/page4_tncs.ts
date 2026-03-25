import { drawSignatureBlock } from '../common/signatureBlock';

export async function termsAndConditionsPages(doc: any, data: any) {

    const margin = 40;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const clauses = getClauses();

    let y = margin;

    function drawBorder() {
        doc.rect(
            margin / 2,
            margin / 2,
            pageWidth - margin,
            pageHeight - margin
        ).stroke();
    }

    function addHeader() {
        doc.font('Helvetica-Bold')
            .fontSize(16)
            .text('TERMS & CONDITIONS', { align: 'center' });

        doc.moveDown(1);

        doc.moveTo(margin, doc.y)
            .lineTo(pageWidth - margin, doc.y)
            .stroke();

        doc.moveDown(1);

        y = doc.y;
    }

    function checkPageBreak() {
        if (y > pageHeight - 120) {
            drawSignatureBlock(doc, data);

            doc.addPage();
            drawBorder();
            addHeader();
        }
    }

    /* FIRST PAGE SETUP */
    drawBorder();
    addHeader();

    doc.font('Helvetica').fontSize(10);

    clauses.forEach((clause: string, index: number) => {

        const text = `${index + 1}. ${clause}`;

        const textHeight = doc.heightOfString(text, {
            width: pageWidth - margin * 2,
            align: 'justify'
        });

        if (y + textHeight > pageHeight - 120) {
            drawSignatureBlock(doc, data);

            doc.addPage();
            drawBorder();
            addHeader();
        }

        doc.text(text, margin, y, {
            width: pageWidth - margin * 2,
            align: 'justify'
        });

        y = doc.y + 8;
    });

    /* FINAL SIGNATURE */
    doc.moveDown(2);
    drawSignatureBlock(doc, data);

}


/* ================= MASSIVE LEGAL CLAUSES ================= */

function getClauses(): string[] {
    return [

        /* ---------------- BASIC AGREEMENT ---------------- */
        "This Loan Agreement constitutes a legally binding contract under the Indian Contract Act, 1872 between the Borrower and the Lender.",
        "The Borrower confirms that he/she is competent to contract as per applicable laws and is not disqualified under any statute.",
        "All obligations arising out of this Agreement shall be enforceable in a court of law.",

        /* ---------------- LOAN TERMS ---------------- */
        "The Borrower agrees to repay the loan amount along with applicable interest, charges, and penalties within the stipulated tenure.",
        "Interest shall be calculated on reducing or flat basis as agreed and communicated to the Borrower.",
        "Any delay in repayment shall attract penal interest and late payment charges as per company policy.",

        /* ---------------- DEFAULT ---------------- */
        "In case of default, the entire outstanding amount shall become immediately due and payable.",
        "The Lender shall have the right to initiate recovery proceedings including legal action.",
        "Default may also result in reporting to credit bureaus such as CIBIL and impact the Borrower's credit score.",

        /* ---------------- VERIFICATION ---------------- */
        "The Borrower authorizes the Lender to conduct field verification, employment checks, and residence visits.",
        "The Borrower consents to sharing information with third-party agencies for verification and collection purposes.",

        /* ---------------- DOCUMENT AUTHENTICITY ---------------- */
        "Submission of forged or misleading documents shall attract civil and criminal liability.",
        "Any misrepresentation shall render this Agreement voidable at the option of the Lender.",

        /* ---------------- LEGAL REFERENCES ---------------- */
        "This Agreement shall be governed by the provisions of the Indian Contract Act, 1872.",
        "Any electronic records shall be governed under the Information Technology Act, 2000.",
        "Recovery actions may be initiated under applicable provisions of the Code of Civil Procedure, 1908.",
        "In case of cheque dishonour, proceedings may be initiated under Section 138 of the Negotiable Instruments Act, 1881.",

        /* ---------------- FRAUD & IPC ---------------- */
        "Any fraudulent activity shall be dealt with under relevant sections of the Indian Penal Code, 1860 including cheating and forgery.",
        "Providing false information may attract penalties under IPC Sections 420, 468, and 471.",

        /* ---------------- RBI & NBFC ---------------- */
        "The Lender operates in compliance with applicable RBI guidelines for NBFCs wherever applicable.",
        "All interest rates and charges are in accordance with fair practice codes issued by the Reserve Bank of India.",

        /* ---------------- PREPAYMENT ---------------- */
        "Prepayment or foreclosure shall be subject to applicable charges and company policy.",
        "The Borrower must provide prior written notice for foreclosure.",

        /* ---------------- INSURANCE ---------------- */
        "Insurance, if applicable, shall be non-refundable.",
        "The Borrower agrees to terms of the insurance provider separately.",

        /* ---------------- DATA CONSENT ---------------- */
        "The Borrower consents to collection, storage, and processing of personal data.",
        "The Borrower authorizes sharing of information with credit bureaus and regulators.",

        /* ---------------- RECOVERY ---------------- */
        "The Lender may appoint recovery agents for collection of dues.",
        "The Borrower agrees not to obstruct lawful recovery proceedings.",

        /* ---------------- JURISDICTION ---------------- */
        "All disputes shall be subject to jurisdiction of courts where the Lender operates.",
        "Arbitration may be invoked as per Arbitration and Conciliation Act, 1996.",

        /* ---------------- LIABILITY ---------------- */
        "The Borrower shall remain liable until full repayment of dues.",
        "Any waiver by the Lender shall not constitute a permanent waiver.",

        /* ---------------- GENERAL ---------------- */
        "This Agreement constitutes the entire understanding between parties.",
        "Any amendment must be in writing and signed by both parties.",
        "If any clause is held invalid, the remaining clauses shall remain enforceable.",

        /* ---------------- EXTENDED LEGAL BULK ---------------- */
        "The Borrower agrees that the Lender may assign or transfer its rights without prior consent.",
        "The Borrower shall not assign obligations without written approval.",
        "All notices shall be deemed served if sent to registered address.",
        "Time shall be the essence of the contract.",
        "The Borrower agrees to indemnify the Lender against losses arising from breach.",
        "Force majeure events shall not absolve repayment obligations.",
        "The Borrower agrees to comply with all KYC norms and updates.",
        "The Lender reserves right to recall loan under adverse circumstances.",
        "The Borrower agrees to electronic communication as valid mode.",
        "Digital signatures shall be considered legally valid.",

        /* repeat-style clauses to extend pages */
        "The Borrower confirms understanding of all financial implications.",
        "The Borrower agrees to cooperate in audits and inspections.",
        "The Lender reserves the right to modify policies with notice.",
        "All charges are transparent and disclosed.",
        "The Borrower waives objections to jurisdiction.",
        "The Borrower agrees to repay without set-off.",
        "The Lender may consolidate dues across accounts.",
        "The Borrower agrees not to misuse loan funds.",
        "Any illegal use shall attract immediate recall.",
        "This Agreement survives termination until dues cleared.",

    ];
}