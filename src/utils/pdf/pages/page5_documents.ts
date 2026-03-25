import { drawSignatureBlock } from '../common/signatureBlock';

export async function documentPages(doc: any, data: any, fetchImage: any) {

    const margin = 40;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    function drawBorder() {
        doc.rect(
            margin / 2,
            margin / 2,
            pageWidth - margin,
            pageHeight - margin
        ).stroke();
    }

    async function drawDocumentPage(options: {
        title: string;
        person: string;
        docType: string;
        docNumber?: string;
        front?: string;
        back?: string;
    }) {

        doc.addPage();
        drawBorder();

        /* -------- HEADER -------- */
        doc.font('Helvetica-Bold')
            .fontSize(14)
            .text(`${options.person}: ${options.title}`, {
                align: 'center'
            });

        doc.moveDown(0.5);

        doc.moveTo(margin, doc.y)
            .lineTo(pageWidth - margin, doc.y)
            .stroke();

        doc.moveDown(1);

        /* -------- DOCUMENT INFO -------- */
        doc.font('Helvetica').fontSize(11);

        doc.text(`Document Type: ${options.docType}`);
        if (options.docNumber) {
            doc.text(`Document Number: ${options.docNumber}`);
        }

        doc.moveDown(0.5);

        doc.fontSize(9).fillColor('gray').text(
            'This document is submitted by the applicant/nominee for identity/address verification. The lender reserves the right to verify authenticity and take legal action in case of discrepancy.',
            { align: 'justify' }
        );

        doc.fillColor('black');
        doc.moveDown(1);

        /* -------- IMAGE SECTION -------- */
        const imageWidth = (pageWidth - margin * 3) / 2;

        let currentY = doc.y;

        // FRONT IMAGE
        if (options.front) {
            try {
                const img = await fetchImage(options.front);

                doc.fontSize(10).text('Front Side', margin, currentY - 5);

                doc.image(img, margin, currentY, {
                    width: imageWidth,
                    height: 200,
                });

                doc.rect(margin, currentY, imageWidth, 200).stroke();

            } catch (err) { }
        }

        // BACK IMAGE
        if (options.back) {
            try {
                const img = await fetchImage(options.back);

                doc.fontSize(10).text('Back Side', margin * 2 + imageWidth, currentY - 5);

                doc.image(img, margin * 2 + imageWidth, currentY, {
                    width: imageWidth,
                    height: 200,
                });

                doc.rect(margin * 2 + imageWidth, currentY, imageWidth, 200).stroke();

            } catch (err) { }
        }

        doc.moveDown(12);

        /* -------- DECLARATION -------- */
        doc.fontSize(10).text(
            'Declaration: I hereby confirm that the above document is valid and belongs to me. I authorize the lender to verify the same with issuing authorities.',
            { align: 'justify' }
        );

        doc.moveDown(2);

        /* -------- SIGNATURE BLOCK -------- */
        drawSignatureBlock(doc, data);
    }

    /* ===================================================== */
    /* ================= CUSTOMER DOCUMENTS ================= */
    /* ===================================================== */

    await drawDocumentPage({
        title: 'Proof of Identity',
        person: 'Applicant',
        docType: 'Identity Proof',
        front: data.customer.documents.poiFront,
        back: data.customer.documents.poiBack,
    });

    await drawDocumentPage({
        title: 'Proof of Address',
        person: 'Applicant',
        docType: 'Address Proof',
        front: data.customer.documents.poaFront,
        back: data.customer.documents.poaBack,
    });

    await drawDocumentPage({
        title: 'PAN Card',
        person: 'Applicant',
        docType: 'PAN',
        front: data.customer.documents.pan,
    });

    /* ===================================================== */
    /* ================= NOMINEE DOCUMENTS ================= */
    /* ===================================================== */

    await drawDocumentPage({
        title: 'Proof of Identity',
        person: 'Nominee',
        docType: 'Identity Proof',
        front: data.nominee.documents.poiFront,
        back: data.nominee.documents.poiBack,
    });

    await drawDocumentPage({
        title: 'Proof of Address',
        person: 'Nominee',
        docType: 'Address Proof',
        front: data.nominee.documents.poaFront,
        back: data.nominee.documents.poaBack,
    });

    await drawDocumentPage({
        title: 'PAN Card',
        person: 'Nominee',
        docType: 'PAN',
        front: data.nominee.documents.pan,
    });
}