import { LAYOUT, formatDate } from '../helpers';

const WATERMARK_TEXT = 'Champanand Motors Pvt Ltd';

export function decorateAllPages(
    doc: any,
    data: any,
) {
    trimTrailingBlankPages(doc);

    const range = doc.bufferedPageRange();
    const total = range.count;

    for (let i = 0; i < total; i++) {
        doc.switchToPage(range.start + i);
        doc.x = LAYOUT.MARGIN_X;
        doc.y = LAYOUT.MARGIN_TOP;
        drawWatermark(doc);
        doc.x = LAYOUT.MARGIN_X;
        doc.y = LAYOUT.MARGIN_TOP;
        drawPageHeader(doc, data, i + 1, total);
        doc.x = LAYOUT.MARGIN_X;
        doc.y = LAYOUT.MARGIN_TOP;
        drawFooterBand(doc, data, i + 1, total);
        doc.x = LAYOUT.MARGIN_X;
        doc.y = LAYOUT.MARGIN_TOP;
    }
}

function trimTrailingBlankPages(doc: any) {
    const buf = doc._pageBuffer;
    if (!Array.isArray(buf) || buf.length <= 1) return;

    const isBlank = (page: any): boolean => {
        try {
            const chunks: any[] = page?.content?.data ?? [];
            if (chunks.length === 0) return true;
            const text = chunks
                .map((c) => (typeof c === 'string' ? c : Buffer.isBuffer(c) ? c.toString('binary') : ''))
                .join('');
            return !/(Tj|TJ|\bre\b|\bl\b|\bm\b|\bc\b|\bf\b|\bS\b|\bs\b)/.test(text);
        } catch {
            return false;
        }
    };

    while (buf.length > 1 && isBlank(buf[buf.length - 1])) {
        buf.pop();
    }
}

function drawWatermark(doc: any) {
    const w = doc.page.width;
    const h = doc.page.height;
    doc.save();
    doc.rotate(-30, { origin: [w / 2, h / 2] });
    doc.font('Helvetica-Bold')
        .fontSize(48)
        .fillColor('#1a1a1a')
        .opacity(0.07)
        .text(WATERMARK_TEXT, 0, h / 2 - 30, {
            width: w,
            align: 'center',
            lineBreak: false,
        });
    doc.fontSize(20)
        .opacity(0.05)
        .text('CONFIDENTIAL · LOAN AGREEMENT', 0, h / 2 + 25, {
            width: w,
            align: 'center',
            lineBreak: false,
        });
    doc.restore();
    doc.opacity(1).fillColor('black');
}

// function drawPageHeader(doc: any, data: any, pageNumber: number, totalPages: number) {
//     const w = doc.page.width;
//     const x = LAYOUT.MARGIN_X;
//     const y = 24;
//     const innerW = w - LAYOUT.MARGIN_X * 2;

//     doc.save();
//     doc.rect(x, y, innerW, LAYOUT.HEADER_BAND_H).fill(LAYOUT.ACCENT);

//     doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
//         .text(WATERMARK_TEXT, x + 10, y + 6, {
//             width: innerW - 20,
//             lineBreak: false,
//         });

//     const contractNo = data?.contractNumber ? `Contract No: ${data.contractNumber}` : '';
//     const generated = data?.generatedAt
//         ? `Issued: ${formatDate(data.generatedAt)}`
//         : '';
//     const headerRight = [contractNo, generated].filter(Boolean).join('   |   ');
//     doc.font('Helvetica').fontSize(8.5).fillColor('white')
//         .text(headerRight, x + 10, y + 21, {
//             width: innerW - 20,
//             align: 'right',
//             lineBreak: false,
//         });

//     doc.restore();
//     doc.fillColor('black');
// }

// function drawFooterBand(doc: any, data: any, pageNumber: number, totalPages: number) {
//     const w = doc.page.width;
//     const h = doc.page.height;
//     const x = LAYOUT.MARGIN_X;
//     const innerW = w - LAYOUT.MARGIN_X * 2;
//     const bandTop = h - LAYOUT.MARGIN_BOTTOM + 8;

//     doc.save();
//     doc.lineWidth(0.6).strokeColor(LAYOUT.GRID_LINE);
//     doc.moveTo(x, bandTop).lineTo(x + innerW, bandTop).stroke();
//     doc.restore();

//     const sigW = (innerW - 20) / 2;
//     const sigY = bandTop + 38;

//     // Borrower
//     doc.save();
//     doc.lineWidth(0.8).strokeColor('#000000')
//         .moveTo(x, sigY).lineTo(x + sigW, sigY).stroke();
//     doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LAYOUT.MUTED)
//         .text('BORROWER SIGNATURE', x, sigY + 4, {
//             width: sigW,
//             lineBreak: false,
//         });
//     if (data?.customer?.applicantName) {
//         doc.font('Helvetica').fontSize(8).fillColor('black')
//             .text(`(${data.customer.applicantName})`, x, sigY + 16, {
//                 width: sigW,
//                 lineBreak: false,
//                 ellipsis: true,
//             });
//     }
//     doc.restore();

//     // Nominee
//     const nx = x + sigW + 20;
//     doc.save();
//     doc.lineWidth(0.8).strokeColor('#000000')
//         .moveTo(nx, sigY).lineTo(nx + sigW, sigY).stroke();
//     doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LAYOUT.MUTED)
//         .text('NOMINEE SIGNATURE', nx, sigY + 4, {
//             width: sigW,
//             lineBreak: false,
//         });
//     if (data?.nominee?.name) {
//         doc.font('Helvetica').fontSize(8).fillColor('black')
//             .text(`(${data.nominee.name})`, nx, sigY + 16, {
//                 width: sigW,
//                 lineBreak: false,
//                 ellipsis: true,
//             });
//     }
//     doc.restore();

//     // Page number
//     doc.save();
//     doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
//         .text(`Page ${pageNumber} of ${totalPages}`, x, h - 28, {
//             width: innerW,
//             align: 'center',
//             lineBreak: false,
//         });
//     doc.restore();
//     doc.fillColor('black');
// }

function drawPageHeader(doc: any, data: any, pageNumber: number, totalPages: number) {
    const w = doc.page.width;
    const x = LAYOUT.MARGIN_X;
    const y = 24;
    const innerW = w - LAYOUT.MARGIN_X * 2;

    // ▼ Allow writing above the content boundary
    const originalTop = doc.page.margins.top;
    doc.page.margins.top = 0;

    doc.save();
    doc.rect(x, y, innerW, LAYOUT.HEADER_BAND_H).fill(LAYOUT.ACCENT);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
        .text(WATERMARK_TEXT, x + 10, y + 6, {
            width: innerW - 20,
            lineBreak: false,
        });

    const contractNo = data?.contractNumber ? `Contract No: ${data.contractNumber}` : '';
    const generated = data?.generatedAt
        ? `Issued: ${formatDate(data.generatedAt)}`
        : '';
    const headerRight = [contractNo, generated].filter(Boolean).join('   |   ');
    doc.font('Helvetica').fontSize(8.5).fillColor('white')
        .text(headerRight, x + 10, y + 21, {
            width: innerW - 20,
            align: 'right',
            lineBreak: false,
        });

    doc.restore();

    // ▲ Restore original top margin
    doc.page.margins.top = originalTop;
    doc.fillColor('black');
}

function drawFooterBand(doc: any, data: any, pageNumber: number, totalPages: number) {
    const w = doc.page.width;
    const h = doc.page.height;
    const x = LAYOUT.MARGIN_X;
    const innerW = w - LAYOUT.MARGIN_X * 2;
    const bandTop = h - LAYOUT.MARGIN_BOTTOM + 8;

    // ▼ Allow writing below the content boundary
    const originalBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.save();
    doc.lineWidth(0.6).strokeColor(LAYOUT.GRID_LINE);
    doc.moveTo(x, bandTop).lineTo(x + innerW, bandTop).stroke();
    doc.restore();

    const sigW = (innerW - 20) / 2;
    const sigY = bandTop + 38;

    // Borrower
    doc.save();
    doc.lineWidth(0.8).strokeColor('#000000')
        .moveTo(x, sigY).lineTo(x + sigW, sigY).stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LAYOUT.MUTED)
        .text('BORROWER SIGNATURE', x, sigY + 4, {
            width: sigW,
            lineBreak: false,
        });
    if (data?.customer?.applicantName) {
        doc.font('Helvetica').fontSize(8).fillColor('black')
            .text(`(${data.customer.applicantName})`, x, sigY + 16, {
                width: sigW,
                lineBreak: false,
                ellipsis: true,
            });
    }
    doc.restore();

    // Nominee
    const nx = x + sigW + 20;
    doc.save();
    doc.lineWidth(0.8).strokeColor('#000000')
        .moveTo(nx, sigY).lineTo(nx + sigW, sigY).stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LAYOUT.MUTED)
        .text('NOMINEE SIGNATURE', nx, sigY + 4, {
            width: sigW,
            lineBreak: false,
        });
    if (data?.nominee?.name) {
        doc.font('Helvetica').fontSize(8).fillColor('black')
            .text(`(${data.nominee.name})`, nx, sigY + 16, {
                width: sigW,
                lineBreak: false,
                ellipsis: true,
            });
    }
    doc.restore();

    // Page number
    doc.save();
    doc.font('Helvetica').fontSize(8.5).fillColor(LAYOUT.MUTED)
        .text(`Page ${pageNumber} of ${totalPages}`, x, h - 28, {
            width: innerW,
            align: 'center',
            lineBreak: false,
        });
    doc.restore();

    // ▲ Restore original bottom margin
    doc.page.margins.bottom = originalBottom;
    doc.fillColor('black');
}