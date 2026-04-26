import PDFDocument from 'pdfkit';
import axios from 'axios';

import {
    LAYOUT,
    safeStr,
    formatDate,
    formatINR,
    formatPercent,
    humanize,
    numberToWords,
    feeLine,
    sectionHeading,
    subHeading,
    kvTable,
    drawTable,
    drawBoxedImage,
    ensureSpace,
    contentBottom,
    numberedItem,
    type FeeLike,
} from './helpers';
import { getClauseSections } from './clauses';
import { decorateAllPages } from './common/decorations';

/* =====================================================================
 * PUBLIC ENTRY
 * ===================================================================*/
export async function generateContractPdf(data: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: LAYOUT.MARGIN_TOP,
                    bottom: LAYOUT.MARGIN_BOTTOM,
                    left: LAYOUT.MARGIN_X,
                    right: LAYOUT.MARGIN_X,
                },
                bufferPages: true,
                info: {
                    Title: 'Loan Agreement',
                    Author: 'Champanand Motors Pvt Ltd',
                    Subject: `Loan Contract ${safeStr(data?.contractNumber, '')}`,
                },
            });

            const buffers: Buffer[] = [];
            doc.on('data', (b) => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ---- Sections ----
            await sectionTitlePage(doc, data);
            await sectionPartiesAndRecitals(doc, data);
            await sectionBorrowerDetails(doc, data, fetchImage);
            await sectionNomineeDetails(doc, data, fetchImage);
            await sectionLoanSummary(doc, data);
            await sectionFeesBreakdown(doc, data);
            await sectionRepaymentSchedule(doc, data);
            await sectionTermsAndConditions(doc, data);
            await sectionExecutionAndDeclaration(doc, data, fetchImage);
            await sectionKycAnnexure(doc, data, fetchImage);

            // ---- Decorate every buffered page (watermark + header + footer) ----
            decorateAllPages(doc, data);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/* =====================================================================
 * IMAGE FETCH
 * ===================================================================*/
async function fetchImage(url: string): Promise<Buffer> {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
    });
    return Buffer.from(res.data);
}

/* =====================================================================
 * SECTION 1 — TITLE PAGE
 * ===================================================================*/
async function sectionTitlePage(doc: any, data: any) {
    // Reset cursor below header band
    doc.x = LAYOUT.MARGIN_X;
    doc.y = LAYOUT.MARGIN_TOP + 20;

    doc.font('Helvetica-Bold').fontSize(22).fillColor(LAYOUT.ACCENT)
        .text('LOAN AGREEMENT CUM UNDERTAKING', {
            align: 'center',
            width: doc.page.width - LAYOUT.MARGIN_X * 2,
        });

    doc.moveDown(0.4);
    doc.font('Helvetica-Oblique').fontSize(11).fillColor(LAYOUT.MUTED)
        .text(
            'Executed under the Indian Contract Act, 1872 and applicable laws of India',
            { align: 'center' },
        );

    doc.moveDown(2);
    doc.fillColor('black');

    // Quick-fact card
    sectionHeading(doc, 'Agreement Snapshot');

    const company = data.company || {};
    const customer = data.customer || {};
    const loan = data.loan || {};

    kvTable(doc, [
        ['Contract No.', safeStr(data.contractNumber)],
        ['Agreement Date', formatDate(data.generatedAt)],
        ['Lender', safeStr(company.name)],
        ['Lender Address', safeStr(company.address)],
        ['Borrower', safeStr(customer.applicantName)],
        ['Borrower Mobile', safeStr(customer.mobileNumber)],
        ['Loan Type', safeStr(loan.loanType)],
        ['Loan Amount', formatINR(loan.amount)],
        ['Interest', `${formatPercent(loan.interestRate)} (${humanize(loan.interestType)})`],
        ['Tenure', `${safeStr(loan.duration)} ${humanize(loan.frequency, 'periods').toLowerCase()} period(s)`],
    ]);

    doc.moveDown(0.5);
    subHeading(doc, 'Amount in Words');
    doc.font('Helvetica').fontSize(11)
        .text(numberToWords(loan.amount), {
            width: doc.page.width - LAYOUT.MARGIN_X * 2,
            align: 'justify',
        });

    doc.moveDown(1);

    subHeading(doc, 'Important Notice');
    doc.font('Helvetica').fontSize(9.5).fillColor(LAYOUT.MUTED)
        .text(
            'This Agreement contains the complete legally-binding terms governing the Loan. ' +
            'The Borrower is strongly advised to read every page in entirety before signing. ' +
            'A signature in the footer of every page constitutes the Borrower\'s and Nominee\'s ' +
            'acknowledgement of having read and accepted that page. Failure to comply with the ' +
            'terms herein may result in penal consequences including reporting to credit bureaus, ' +
            'repossession of the hypothecated asset, and civil/criminal proceedings as applicable.',
            { align: 'justify' },
        );
    doc.fillColor('black');
}

/* =====================================================================
 * SECTION 2 — PARTIES & RECITALS
 * ===================================================================*/
async function sectionPartiesAndRecitals(doc: any, data: any) {
    doc.addPage();
    sectionHeading(doc, 'Parties to the Agreement');

    const c = data.company || {};
    const cust = data.customer || {};
    const addr = cust.address || {};

    doc.font('Helvetica').fontSize(10);

    doc.text(
        `THIS LOAN AGREEMENT (the "Agreement") is made and executed on ${formatDate(data.generatedAt)} at the registered office of ${safeStr(c.name)}, having its principal place of business at ${safeStr(c.address)}, India (hereinafter referred to as the "LENDER", which expression shall, unless repugnant to the context or meaning thereof, include its successors, assigns, nominees and permitted representatives).`,
        { align: 'justify' },
    );

    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').text('AND', { align: 'center' });
    doc.moveDown(0.6);
    doc.font('Helvetica');

    const guardian = cust.guardianName ? `${humanize(cust.relationType, 'S/o')} Shri/Smt. ${cust.guardianName}` : '';
    const fullAddr = [addr.village, addr.postOffice, addr.policeStation, addr.district, addr.pinCode]
        .filter(Boolean).join(', ');

    doc.text(
        `${safeStr(cust.applicantName)}${guardian ? ', ' + guardian : ''}, residing at ${fullAddr || '—'}, holding PAN ${safeStr(cust.panNumber)} and mobile number ${safeStr(cust.mobileNumber)} (hereinafter referred to as the "BORROWER", which expression shall, unless repugnant to the context, include the Borrower\'s legal heirs, executors, administrators and permitted assigns).`,
        { align: 'justify' },
    );

    doc.moveDown(1);
    sectionHeading(doc, 'Recitals (Whereas)');

    const recitals = [
        `The Borrower has approached the Lender with a request for a loan facility under the product "${safeStr(data.loan?.loanType)}" for legitimate personal/business purposes.`,
        `The Lender has, after evaluation of the Borrower's eligibility, credit standing and submitted documents, agreed to extend a loan of ${formatINR(data.loan?.amount)} (${numberToWords(data.loan?.amount)}) on the terms and conditions set forth in this Agreement and the schedules annexed hereto.`,
        `The Borrower has, of own free will and without any coercion or undue influence, accepted the said terms and conditions and undertaken to repay the loan together with interest, charges and other dues as scheduled.`,
        `In consideration of the Lender agreeing to disburse the said sum, the Borrower hereby executes this Agreement and the related security and authorisation documents.`,
    ];

    doc.font('Helvetica').fontSize(10);
    recitals.forEach((r, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C, D
        numberedItem(doc, `${label}.`, r, { labelWidth: 18, gap: 6, fontSize: 10 });
    });

    doc.moveDown(0.6);
    sectionHeading(doc, 'Witnesseth');
    doc.font('Helvetica').fontSize(10).text(
        'NOW THEREFORE, in consideration of the mutual covenants set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree to be bound by all the terms and conditions, schedules, annexures and undertakings contained in this Agreement.',
        { align: 'justify' },
    );
}

/* =====================================================================
 * SECTION 3 — BORROWER DETAILS
 * ===================================================================*/
async function sectionBorrowerDetails(doc: any, data: any, fetchImg: any) {
    doc.addPage();
    sectionHeading(doc, 'Borrower / Applicant Details');

    const cust = data.customer || {};
    const addr = cust.address || {};
    const docs = cust.documents || {};

    // Photo (right side); details (left)
    const startY = doc.y;
    const photoW = 100;
    const photoH = 120;
    const photoX = doc.page.width - LAYOUT.MARGIN_X - photoW;
    await drawBoxedImage(doc, fetchImg, cust.photo, photoX, startY, photoW, photoH, 'Photograph');

    // Reserve room: tight kv table on left
    doc.y = startY;
    const oldRight = doc.page.margins.right;
    doc.page.margins.right = oldRight + photoW + 16;

    kvTable(doc, [
        ['Member ID', safeStr(cust.memberId)],
        ['Account Status', humanize(cust.accountStatus)],
        ['Applicant Name', safeStr(cust.applicantName)],
        ['Guardian Name', safeStr(cust.guardianName)],
        ['Relation', humanize(cust.relationType)],
        ['Date of Birth', formatDate(cust.dob)],
        ['Gender', humanize(cust.gender)],
        ['Marital Status', humanize(cust.maritalStatus)],
        ['Religion', humanize(cust.religion)],
        ['Mobile', safeStr(cust.mobileNumber)],
    ], { columns: 1 });

    doc.page.margins.right = oldRight;

    // Push y past the photo so subsequent content starts cleanly
    if (doc.y < startY + photoH + 10) doc.y = startY + photoH + 10;

    subHeading(doc, 'Contact');
    kvTable(doc, [
        ['Email', safeStr(cust.email)],
    ], { columns: 1 });

    subHeading(doc, 'Residential Address');
    kvTable(doc, [
        ['Village', safeStr(addr.village)],
        ['Post Office', safeStr(addr.postOffice)],
        ['Police Station', safeStr(addr.policeStation)],
        ['District', safeStr(addr.district)],
        ['PIN Code', safeStr(addr.pinCode)],
    ]);

    subHeading(doc, 'Identity & Address Proof');
    kvTable(doc, [
        ['PAN Number', safeStr(cust.panNumber)],
        ['POI Document', humanize(docs.poiType)],
        ['POI Number', safeStr(docs.poiNumber)],
        ['POA Document', humanize(docs.poaType)],
        ['POA Number', safeStr(docs.poaNumber)],
    ]);
}

/* =====================================================================
 * SECTION 4 — NOMINEE DETAILS
 * ===================================================================*/
async function sectionNomineeDetails(doc: any, data: any, fetchImg: any) {
    doc.addPage();
    sectionHeading(doc, 'Nominee Details');

    const nom = data.nominee || {};
    const addr = nom.address || {};
    const docs = nom.documents || {};

    const startY = doc.y;
    const photoW = 100;
    const photoH = 120;
    const photoX = doc.page.width - LAYOUT.MARGIN_X - photoW;
    await drawBoxedImage(doc, fetchImg, nom.photo, photoX, startY, photoW, photoH, 'Photograph');

    doc.y = startY;
    const oldRight = doc.page.margins.right;
    doc.page.margins.right = oldRight + photoW + 16;

    kvTable(doc, [
        ['Nominee Name', safeStr(nom.name)],
        ['Relation', humanize(nom.relation)],
        ['Mobile', safeStr(nom.mobile)],
    ], { columns: 1 });

    doc.page.margins.right = oldRight;

    if (doc.y < startY + photoH + 10) doc.y = startY + photoH + 10;

    subHeading(doc, 'Nominee Address');
    kvTable(doc, [
        ['Village', safeStr(addr.village)],
        ['Post Office', safeStr(addr.postOffice)],
        ['Police Station', safeStr(addr.policeStation)],
        ['District', safeStr(addr.district)],
        ['PIN Code', safeStr(addr.pinCode)],
    ]);

    subHeading(doc, 'Nominee Identity & Address Proof');
    kvTable(doc, [
        ['PAN Number', safeStr(nom.panNumber)],
        ['POI Document', humanize(docs.poiType)],
        ['POI Number', safeStr(docs.poiNumber)],
        ['POA Document', humanize(docs.poaType)],
        ['POA Number', safeStr(docs.poaNumber)],
    ]);

    doc.moveDown(0.5);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(LAYOUT.MUTED).text(
        'The Nominee, by signing this Agreement, acknowledges his/her appointment and consents ' +
        'to the obligations and contact rights set out herein in case of inability of the ' +
        'Borrower to discharge dues for any reason, including death or incapacity, subject to ' +
        'applicable law.',
        { align: 'justify' },
    );
    doc.fillColor('black');
}

/* =====================================================================
 * SECTION 5 — LOAN SUMMARY
 * ===================================================================*/
async function sectionLoanSummary(doc: any, data: any) {
    doc.addPage();
    sectionHeading(doc, 'Loan Schedule');

    const loan = data.loan || {};

    kvTable(doc, [
        ['Loan Product', safeStr(loan.loanType)],
        ['Principal Amount', formatINR(loan.amount)],
        ['Interest Rate', formatPercent(loan.interestRate)],
        ['Interest Type', humanize(loan.interestType)],
        ['Loan Tenure', safeStr(loan.duration)],
        ['Collection Frequency', humanize(loan.frequency)],
        ['First EMI Date', formatDate(loan.firstEmiDate)],
        ['Total Interest', formatINR(loan.totalInterest)],
        ['Total Payable Amount', formatINR(loan.totalPayable)],
        ['Disbursed Amount', formatINR(loan.disbursedAmount)],
        ['Disbursement Method', humanize(loan.disbursementMethod)],
        ['Fees Payment Method', humanize(loan.feesPaymentMethod)],
    ]);

    doc.moveDown(0.5);
    subHeading(doc, 'Principal Amount in Words');
    doc.font('Helvetica').fontSize(11).text(numberToWords(loan.amount), {
        width: doc.page.width - LAYOUT.MARGIN_X * 2,
        align: 'justify',
    });

    doc.moveDown(0.5);
    subHeading(doc, 'Total Payable in Words');
    doc.font('Helvetica').fontSize(11).text(numberToWords(loan.totalPayable), {
        width: doc.page.width - LAYOUT.MARGIN_X * 2,
        align: 'justify',
    });
}

/* =====================================================================
 * SECTION 6 — FEES BREAKDOWN
 * ===================================================================*/
async function sectionFeesBreakdown(doc: any, data: any) {
    doc.addPage();
    sectionHeading(doc, 'Fees and Charges');

    const loan = data.loan || {};
    const principal = Number(loan.amount) || 0;
    const fees = loan.fees || {};

    interface FeeRow { description: string; basis: string; amount: string; }

    const rows: FeeRow[] = [];

    const proc: FeeLike | undefined = fees.processing;
    if (proc) {
        rows.push({
            description: safeStr(proc.description, 'Processing Fee'),
            basis: proc.isPercentage ? formatPercent(proc.amount) : 'Flat',
            amount: feeLine(proc, principal),
        });
    }

    const ins: FeeLike | undefined = fees.insurance;
    if (ins) {
        rows.push({
            description: safeStr(ins.description, 'Insurance Fee'),
            basis: ins.isPercentage ? formatPercent(ins.amount) : 'Flat',
            amount: feeLine(ins, principal),
        });
    }

    const others: FeeLike[] = Array.isArray(fees.others) ? fees.others : [];
    others.forEach((f, i) => {
        rows.push({
            description: safeStr(f.description, `Other Fee ${i + 1}`),
            basis: f.isPercentage ? formatPercent(f.amount) : 'Flat',
            amount: feeLine(f, principal),
        });
    });

    if (rows.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(LAYOUT.MUTED)
            .text('No additional fees applicable.', { align: 'left' });
        doc.fillColor('black');
        return;
    }

    drawTable(
        doc,
        [
            { header: 'Description', key: 'description', width: 260 },
            { header: 'Basis', key: 'basis', width: 80, align: 'center' },
            { header: 'Amount', key: 'amount', width: 155, align: 'right' },
        ],
        rows,
    );

    doc.moveDown(0.4);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(LAYOUT.MUTED)
        .text(
            'All fees and charges shown above are in addition to interest payable on the principal. ' +
            'Applicable taxes (including GST) shall be borne by the Borrower over and above these amounts.',
            { align: 'justify' },
        );
    doc.fillColor('black');
}

/* =====================================================================
 * SECTION 7 — REPAYMENT SCHEDULE
 * ===================================================================*/
async function sectionRepaymentSchedule(doc: any, data: any) {
    doc.addPage();
    sectionHeading(doc, 'Repayment Schedule (EMI)');

    const loan = data.loan || {};
    const repayments: any[] = Array.isArray(loan.repayments) ? loan.repayments : [];

    if (repayments.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(LAYOUT.MUTED)
            .text('No EMI schedule attached.', { align: 'left' });
        doc.fillColor('black');
        return;
    }

    drawTable(
        doc,
        [
            { header: '#', key: 'emiNumber', width: 32, align: 'center', format: (v) => safeStr(v) },
            { header: 'Due Date', key: 'dueDate', width: 90, align: 'center', format: (v) => formatDate(v) },
            { header: 'EMI Amount', key: 'emiAmount', width: 100, align: 'right', format: (v) => formatINR(v) },
            { header: 'Principal', key: 'principalAmount', width: 95, align: 'right', format: (v) => formatINR(v) },
            { header: 'Interest', key: 'interestAmount', width: 90, align: 'right', format: (v) => formatINR(v) },
            { header: 'Status', key: 'status', width: 88, align: 'center', format: (v) => humanize(v) },
        ],
        repayments,
        { rowHeight: 18 },
    );
}

/* =====================================================================
 * SECTION 8 — TERMS AND CONDITIONS (full legal text)
 * ===================================================================*/
async function sectionTermsAndConditions(doc: any, data: any) {
    doc.addPage();
    sectionHeading(doc, 'Terms and Conditions');

    const sections = getClauseSections();
    sections.forEach((sec, idx) => {
        ensureSpace(doc, 40);
        doc.x = LAYOUT.MARGIN_X;
        doc.font('Helvetica-Bold').fontSize(11).fillColor(LAYOUT.ACCENT)
            .text(`${idx + 1}. ${sec.heading}`, LAYOUT.MARGIN_X, doc.y, {
                width: doc.page.width - LAYOUT.MARGIN_X * 2,
            });
        doc.fillColor('black');
        doc.moveDown(0.3);

        sec.points.forEach((p, j) => {
            numberedItem(doc, `${idx + 1}.${j + 1}`, p, {
                labelWidth: 30,
                gap: 6,
                fontSize: 9.5,
            });
        });
        doc.moveDown(0.4);
    });
}

/* =====================================================================
 * SECTION 9 — EXECUTION & DECLARATION
 * ===================================================================*/
async function sectionExecutionAndDeclaration(doc: any, data: any, fetchImg: any) {
    doc.addPage();
    sectionHeading(doc, 'Borrower Declaration & Execution');

    const cust = data.customer || {};
    const nom = data.nominee || {};
    const c = data.company || {};

    doc.font('Helvetica').fontSize(10);
    doc.text(
        `I, ${safeStr(cust.applicantName)}, the Borrower above-named, do hereby solemnly declare and confirm as follows:`,
        { align: 'justify' },
    );

    const decls = [
        `I have read and fully understood every page of this Agreement, the schedules and the terms and conditions annexed hereto, and I voluntarily agree to be bound by the same.`,
        `All information furnished by me to the Lender in respect of this Loan, including KYC documents, financial particulars, employment details and contact information, is true, correct and complete to the best of my knowledge and belief.`,
        `I confirm that the Loan has been availed for a lawful purpose and shall be utilised solely for the purpose declared at the time of application.`,
        `I authorise the Lender to take such steps as may be necessary for verification, recovery and enforcement of dues, and to share my information with credit information companies, regulators, lawyers, recovery agents and other authorised parties.`,
        `I understand that any default in repayment may attract penal interest, repossession of the hypothecated asset, civil and criminal proceedings, reporting to credit bureaus, and other consequences as set out in this Agreement and applicable law.`,
        `I confirm that I have received a duly executed copy of this Agreement.`,
    ];

    decls.forEach((d, i) => {
        numberedItem(doc, `${i + 1}.`, d, { labelWidth: 18, gap: 6, fontSize: 10 });
    });

    doc.moveDown(1);

    sectionHeading(doc, 'Execution by the Borrower & Nominee');
    doc.font('Helvetica').fontSize(10).text(
        `IN WITNESS WHEREOF, the parties have set their hands on this ${formatDate(data.generatedAt)} at ${safeStr(c.address)}, in the presence of the undersigned witnesses.`,
        { align: 'justify' },
    );

    doc.moveDown(2);

    // Two signature blocks side-by-side, with stored signature image (if any)
    const x = LAYOUT.MARGIN_X;
    const innerW = doc.page.width - LAYOUT.MARGIN_X * 2;
    const blockW = (innerW - 20) / 2;
    const startY = doc.y;
    const sigBoxH = 70;

    // Borrower
    await drawBoxedImage(doc, fetchImg, cust.signature, x, startY, blockW, sigBoxH, 'Borrower Signature');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('black')
        .text(safeStr(cust.applicantName), x, startY + sigBoxH + 6, {
            width: blockW, lineBreak: false, ellipsis: true,
        });
    doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
        .text(`PAN: ${safeStr(cust.panNumber)}   Mobile: ${safeStr(cust.mobileNumber)}`,
            x, startY + sigBoxH + 20,
            { width: blockW, lineBreak: false, ellipsis: true });

    // Nominee
    const nx = x + blockW + 20;
    await drawBoxedImage(doc, fetchImg, nom.signature, nx, startY, blockW, sigBoxH, 'Nominee Signature');
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9)
        .text(safeStr(nom.name), nx, startY + sigBoxH + 6, {
            width: blockW, lineBreak: false, ellipsis: true,
        });
    doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
        .text(`Relation: ${humanize(nom.relation)}   Mobile: ${safeStr(nom.mobile)}`,
            nx, startY + sigBoxH + 20,
            { width: blockW, lineBreak: false, ellipsis: true });

    doc.fillColor('black');
    doc.y = startY + sigBoxH + 38;

    doc.moveDown(1);
    sectionHeading(doc, 'For and on behalf of the Lender');
    const lendY = doc.y;
    doc.lineWidth(0.6).strokeColor('#000000')
        .moveTo(x, lendY + 30).lineTo(x + 200, lendY + 30).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(LAYOUT.MUTED)
        .text('AUTHORISED SIGNATORY', x, lendY + 36, { width: 200, lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor('black')
        .text(safeStr(c.name), x, lendY + 50, { width: 220, lineBreak: false });

    if (data.manager?.name) {
        doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
            .text(`Originating Manager: ${safeStr(data.manager.name)}`,
                x + 240, lendY + 36, { width: 220, lineBreak: false });
    }
    if (data.agent?.name) {
        doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
            .text(`Field Agent: ${safeStr(data.agent.name)}`,
                x + 240, lendY + 50, { width: 220, lineBreak: false });
    }
    doc.fillColor('black');
}

/* =====================================================================
 * SECTION 10 — KYC ANNEXURE (one page per document)
 * ===================================================================*/
async function sectionKycAnnexure(doc: any, data: any, fetchImg: any) {
    const cust = data.customer || {};
    const nom = data.nominee || {};
    const cdocs = cust.documents || {};
    const ndocs = nom.documents || {};

    interface DocPage {
        owner: string;
        title: string;
        docType: string;
        docNumber?: string;
        front?: string;
        back?: string;
    }

    const pages: DocPage[] = [
        { owner: 'APPLICANT', title: 'Permanent Account Number (PAN)', docType: 'PAN Card', docNumber: cust.panNumber, front: cdocs.pan },
        { owner: 'APPLICANT', title: 'Proof of Identity', docType: humanize(cdocs.poiType, 'Identity Proof'), docNumber: cdocs.poiNumber, front: cdocs.poiFront, back: cdocs.poiBack },
        { owner: 'APPLICANT', title: 'Proof of Address', docType: humanize(cdocs.poaType, 'Address Proof'), docNumber: cdocs.poaNumber, front: cdocs.poaFront, back: cdocs.poaBack },
        { owner: 'NOMINEE', title: 'Permanent Account Number (PAN)', docType: 'PAN Card', docNumber: nom.panNumber, front: ndocs.pan },
        { owner: 'NOMINEE', title: 'Proof of Identity', docType: humanize(ndocs.poiType, 'Identity Proof'), docNumber: ndocs.poiNumber, front: ndocs.poiFront, back: ndocs.poiBack },
        { owner: 'NOMINEE', title: 'Proof of Address', docType: humanize(ndocs.poaType, 'Address Proof'), docNumber: ndocs.poaNumber, front: ndocs.poaFront, back: ndocs.poaBack },
    ];

    // Skip pages where no image at all is available — keeps the PDF clean.
    const eligible = pages.filter((p) => p.front || p.back);

    for (const page of eligible) {
        await drawDocumentPage(doc, fetchImg, page);
    }

    // Extra documents (uploaded later)
    const extras: any[] = Array.isArray(cust.extraDocuments) ? cust.extraDocuments : [];
    for (const ex of extras) {
        if (!ex?.url) continue;
        await drawDocumentPage(doc, fetchImg, {
            owner: 'APPLICANT',
            title: 'Additional Document',
            docType: safeStr(ex.name, 'Additional Document'),
            front: ex.url,
        });
    }
}

async function drawDocumentPage(doc: any, fetchImg: any, page: {
    owner: string;
    title: string;
    docType: string;
    docNumber?: string;
    front?: string;
    back?: string;
}) {
    doc.addPage();
    sectionHeading(doc, `${page.owner} — ${page.title}`);

    kvTable(doc, [
        ['Document Type', humanize(page.docType)],
        ['Document Number', safeStr(page.docNumber)],
    ]);

    doc.moveDown(0.4);

    const x = LAYOUT.MARGIN_X;
    const innerW = doc.page.width - LAYOUT.MARGIN_X * 2;
    const hasBack = !!page.back;
    const imgW = hasBack ? (innerW - 16) / 2 : innerW;
    const imgH = 320;
    const startY = doc.y + 14; // leave room for the "FRONT" label

    if (page.front) {
        await drawBoxedImage(doc, fetchImg, page.front, x, startY, imgW, imgH, 'Front');
    }
    if (hasBack) {
        await drawBoxedImage(doc, fetchImg, page.back, x + imgW + 16, startY, imgW, imgH, 'Back');
    }

    doc.y = startY + imgH + 18;

    doc.font('Helvetica-Oblique').fontSize(9).fillColor(LAYOUT.MUTED).text(
        'Declaration: I hereby confirm that the document image(s) reproduced above are true ' +
        'copies of the originals submitted by me, and authorise the Lender to verify the same ' +
        'with issuing authorities. I acknowledge that submission of forged or fabricated ' +
        'documents may attract civil and criminal liability.',
        { align: 'justify' },
    );
    doc.fillColor('black');
}
