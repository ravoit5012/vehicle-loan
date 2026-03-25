import { formatDate } from '../helpers';
import { drawSignatureBlock } from '../common/signatureBlock';

export async function borrowerDetailsPage(doc: any, data: any, fetchImage: any) {

    const margin = 40;
    const pageWidth = doc.page.width;
    const usableWidth = pageWidth - margin * 2;

    /* -------- BORDER -------- */
    doc
        .lineWidth(1)
        .rect(
            margin / 2,
            margin / 2,
            pageWidth - margin,
            doc.page.height - margin
        )
        .stroke();

    /* -------- HEADER -------- */
    doc.font('Helvetica-Bold')
        .fontSize(16)
        .text('BORROWER & NOMINEE DETAILS', {
            align: 'center',
        });

    doc.moveDown(1);

    /* -------- CUSTOMER SECTION -------- */
    const startY = doc.y;

    doc.fontSize(13).font('Helvetica-Bold')
        .text('BORROWER DETAILS', margin, doc.y);

    doc.moveDown(0.5);

    doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();

    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica');

    /* LEFT COLUMN TEXT */
    const leftX = margin;
    let y = doc.y;

    doc.text(`Name: ${data.customer.applicantName}`, leftX, y);
    doc.text(`Guardian: ${data.customer.guardianName}`);
    doc.text(`Relation: ${data.customer.relationType}`);
    doc.text(`Mobile: ${data.customer.mobileNumber}`);
    doc.text(`Email: ${data.customer.email}`);
    doc.text(`Gender: ${data.customer.gender}`);
    doc.text(`DOB: ${formatDate(data.customer.dob)}`);

    doc.text(
        `Address: ${data.customer.address.village}, ${data.customer.address.district}, ${data.customer.address.pinCode}`
    );

    /* -------- PHOTO (TOP RIGHT) -------- */
    if (data.customer.photo) {
        try {
            const img = await fetchImage(data.customer.photo);

            doc.image(img, pageWidth - margin - 110, startY + 10, {
                width: 100,
                height: 120,
            });

            // Border for photo
            doc.rect(pageWidth - margin - 110, startY + 10, 100, 120).stroke();

        } catch (err) { }
    }

    doc.moveDown(2);

    /* -------- SIGNATURE -------- */
    if (data.customer.signature) {
        try {
            const sign = await fetchImage(data.customer.signature);

            doc.text('Customer Signature:', margin);
            doc.moveDown(0.3);

            doc.image(sign, {
                width: 120,
            });

        } catch (err) { }
    }

    doc.moveDown(2);

    /* -------- NOMINEE SECTION -------- */
    doc.font('Helvetica-Bold')
        .fontSize(13)
        .text('NOMINEE DETAILS');

    doc.moveDown(0.5);

    doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();

    doc.moveDown(1);

    doc.font('Helvetica').fontSize(11);

    doc.text(`Name: ${data.nominee.name}`);
    doc.text(`Relation: ${data.nominee.relation}`);
    doc.text(`Mobile: ${data.nominee.mobile}`);

    doc.text(
        `Address: ${data.nominee.address.village}, ${data.nominee.address.district}, ${data.nominee.address.pinCode}`
    );

    doc.moveDown(1);

    /* -------- NOMINEE PHOTO -------- */
    if (data.nominee.photo) {
        try {
            const img = await fetchImage(data.nominee.photo);

            doc.text('Nominee Photo:');
            doc.moveDown(0.5);

            doc.image(img, {
                width: 100,
                height: 120,
            });

        } catch (err) { }
    }

    doc.moveDown(1);

    /* -------- NOMINEE SIGNATURE -------- */
    if (data.nominee.signature) {
        try {
            const sign = await fetchImage(data.nominee.signature);

            doc.text('Nominee Signature:');
            doc.moveDown(0.5);

            doc.image(sign, {
                width: 120,
            });

        } catch (err) { }
    }

    doc.moveDown(2);

    /* -------- FOOTER LINE -------- */
    doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .dash(2, { space: 2 })
        .stroke()
        .undash();

    doc.moveDown(1);

    doc.fontSize(9)
        .fillColor('gray')
        .text(
            'This document is part of the Loan Agreement and KYC verification.',
            { align: 'center' }
        );

    doc.fillColor('black');

    /* -------- SIGNATURE BLOCK -------- */
    drawSignatureBlock(doc, data);
}