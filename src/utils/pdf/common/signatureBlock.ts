export function drawSignatureBlock(doc: any, data: any) {
    const y = 750;

    doc.fontSize(10);

    doc.text('Borrower Signature', 50, y);
    doc.text('Nominee Signature', 300, y);

    // Lines
    doc.moveTo(50, y + 20).lineTo(200, y + 20).stroke();
    doc.moveTo(300, y + 20).lineTo(450, y + 20).stroke();

    // Optional images
    if (data.customer?.signature) {
        try {
            doc.image(data.customer.signature, 50, y - 40, { width: 100 });
        } catch { }
    }

    if (data.nominee?.signature) {
        try {
            doc.image(data.nominee.signature, 300, y - 40, { width: 100 });
        } catch { }
    }
}