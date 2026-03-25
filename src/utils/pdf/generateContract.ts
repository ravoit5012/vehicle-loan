import PDFDocument from 'pdfkit';
import axios from 'axios';
import { getClauses } from './clauses';
import { drawTable, formatDate } from './helpers';
import { page1Title } from './pages/page1_title';
import { borrowerDetailsPage } from './pages/page2_borrower';
import { loanDetailsPages } from './pages/page3_loanDetails';
import { termsAndConditionsPages } from './pages/page4_tncs';
import { documentPages } from './pages/page5_documents';

export async function generateContractPdf(data: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        /* ---------------- HEADER + FOOTER ---------------- */
        const addHeaderFooter = () => {
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);

                // Header
                doc.fontSize(10)
                    .text(data.company.name, 50, 20, { align: 'center' });

                // Footer
                doc.fontSize(8)
                    .text(
                        `Page ${i + 1} of ${pages.count}`,
                        50,
                        800,
                        { align: 'center' }
                    );
            }
        };

        /* ---------------- PAGE 1: TITLE ---------------- */
        await page1Title(doc, data);
        doc.addPage();

        /* ---------------- CUSTOMER DETAILS ---------------- */
        await borrowerDetailsPage(doc, data, fetchImage);
        doc.addPage();

        /* ---------------- LOAN DETAILS ---------------- */
        await loanDetailsPages(doc, data, drawTable);
        doc.addPage();

        /* ---------------- LEGAL CLAUSES ---------------- */
        await termsAndConditionsPages(doc, data);
        doc.addPage();

        /* ---------------- DOCUMENTS ---------------- */
        await documentPages(doc, data, fetchImage);
        /* ---------------- FINALIZE ---------------- */
        doc.end();
    });
}

/* ---------------- IMAGE FETCH ---------------- */
async function fetchImage(url: string): Promise<Buffer> {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}