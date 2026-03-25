export function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-IN');
}

export async function drawTable(doc: any, repayments: any[]) {
    const startY = doc.y;

    doc.fontSize(10).text(
        "EMI | Due Date | Amount | Principal | Interest | Status",
        { underline: true }
    );

    doc.moveDown();

    repayments.forEach((r, i) => {
        doc.text(
            `${r.emiNumber} | ${formatDate(r.dueDate)} | ₹${r.emiAmount} | ₹${r.principalAmount} | ₹${r.interestAmount} | ${r.status}`
        );

        if (doc.y > 750) {
            doc.addPage();
        }
    });
}