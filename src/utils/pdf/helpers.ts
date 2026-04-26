/**
 * Shared PDF helpers for the loan contract generator.
 * All functions are defensive: they accept `any`/`null`/`undefined` and produce
 * a safe string instead of "[object Object]" / "undefined" / "NaN".
 */

const DASH = '—'; // em-dash, used as fallback

/* =====================================================================
 * SAFE FORMATTERS
 * ===================================================================*/

export function safeStr(value: any, fallback = DASH): string {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return formatDate(value);
    // Avoid [object Object] / [object Array]
    try {
        const s = JSON.stringify(value);
        return s && s !== '{}' && s !== '[]' ? s : fallback;
    } catch {
        return fallback;
    }
}

export function formatDate(value: any): string {
    if (!value) return DASH;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return DASH;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTime(value: any): string {
    if (!value) return DASH;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return DASH;
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const inrFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatINR(n: any): string {
    const v = typeof n === 'number' ? n : Number(n);
    if (!Number.isFinite(v)) return DASH;
    return `₹ ${inrFmt.format(v)}`;
}

export function formatPercent(n: any): string {
    const v = typeof n === 'number' ? n : Number(n);
    if (!Number.isFinite(v)) return DASH;
    return `${v.toFixed(2)}%`;
}

/* =====================================================================
 * ENUM HUMANISERS
 * ===================================================================*/

const HUMAN_LABELS: Record<string, string> = {
    SO: 'S/o',
    WO: 'W/o',
    DO: 'D/o',

    HINDU: 'Hindu', MUSLIM: 'Muslim', CHRISTIAN: 'Christian',
    SIKH: 'Sikh', BUDDHIST: 'Buddhist', JAIN: 'Jain', OTHER: 'Other',

    MARRIED: 'Married', UNMARRIED: 'Unmarried',
    MALE: 'Male', FEMALE: 'Female',

    FATHER: 'Father', MOTHER: 'Mother', SPOUSE: 'Spouse',
    SON: 'Son', DAUGHTER: 'Daughter', BROTHER: 'Brother', SISTER: 'Sister',

    AADHAR: 'Aadhaar Card',
    VOTER_ID: 'Voter ID',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
    ELECTRICITY_BILL: 'Electricity Bill',
    GAS_BILL: 'Gas Bill',
    BANK_STATEMENT: 'Bank Statement',

    FLAT: 'Flat',
    REDUCING_BALANCE: 'Reducing Balance',

    WEEKLY: 'Weekly', BIWEEKLY: 'Bi-Weekly',
    MONTHLY: 'Monthly', QUARTERLY: 'Quarterly',

    ACTIVE: 'Active', INACTIVE: 'Inactive',

    SEPARATE: 'Paid Separately', DEDUCTED: 'Deducted from Disbursement',
    CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer',
};

export function humanize(value: any, fallback = DASH): string {
    if (value === null || value === undefined || value === '') return fallback;
    const s = String(value).toUpperCase();
    if (HUMAN_LABELS[s]) return HUMAN_LABELS[s];
    // Generic: SCREAMING_SNAKE_CASE -> Title Case
    if (/^[A-Z0-9_]+$/.test(s)) {
        return s
            .toLowerCase()
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }
    return safeStr(value, fallback);
}

/* =====================================================================
 * NUMBER TO WORDS (Indian numbering: Lakh / Crore)
 * ===================================================================*/

const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return TENS[t] + (o ? ' ' + ONES[o] : '');
}

function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const head = h ? ONES[h] + ' Hundred' : '';
    if (!r) return head;
    return (head ? head + ' ' : '') + twoDigits(r);
}

export function numberToWords(amount: any): string {
    const v = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(v)) return DASH;

    const isNeg = v < 0;
    const abs = Math.floor(Math.abs(v));
    const paise = Math.round((Math.abs(v) - abs) * 100);

    if (abs === 0 && paise === 0) return 'Zero Rupees Only';

    const crore = Math.floor(abs / 10000000);
    const lakh = Math.floor((abs % 10000000) / 100000);
    const thousand = Math.floor((abs % 100000) / 1000);
    const remainder = abs % 1000;

    const parts: string[] = [];
    if (crore) parts.push(twoDigits(crore) + ' Crore');
    if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
    if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
    if (remainder) parts.push(threeDigits(remainder));

    let out = parts.join(' ');
    if (isNeg) out = 'Minus ' + out;
    out += ' Rupees';
    if (paise) out += ` and ${twoDigits(paise)} Paise`;
    out += ' Only';
    return out;
}

/* =====================================================================
 * FEE RESOLUTION
 *   Schema FeeSnapshot = { amount, isPercentage, description }
 *   Resolve to absolute INR for a given principal.
 * ===================================================================*/

export interface FeeLike {
    amount?: number;
    isPercentage?: boolean;
    description?: string | null;
}

export function resolveFee(fee: FeeLike | null | undefined, principal: number): number {
    if (!fee) return 0;
    const amt = Number(fee.amount) || 0;
    if (fee.isPercentage) return (principal * amt) / 100;
    return amt;
}

export function feeLine(fee: FeeLike | null | undefined, principal: number): string {
    if (!fee) return formatINR(0);
    const resolved = resolveFee(fee, principal);
    if (fee.isPercentage) {
        return `${formatINR(resolved)} (${formatPercent(fee.amount)})`;
    }
    return formatINR(resolved);
}

/* =====================================================================
 * LAYOUT PRIMITIVES
 * ===================================================================*/

export const LAYOUT = {
    MARGIN_X: 50,
    MARGIN_TOP: 70,
    MARGIN_BOTTOM: 110, // reserved for footer signature band
    HEADER_BAND_H: 35,
    FOOTER_BAND_H: 90,
    BORDER_INSET: 24,
    ACCENT: '#0f3a82',
    ACCENT_LIGHT: '#e7eef9',
    GRID_LINE: '#cccccc',
    MUTED: '#666666',
};

export function contentBottom(doc: any): number {
    return doc.page.height - LAYOUT.MARGIN_BOTTOM;
}

export function ensureSpace(doc: any, needed: number) {
    if (doc.y + needed > contentBottom(doc)) {
        doc.addPage();
    }
}

export function sectionHeading(doc: any, title: string) {
    ensureSpace(doc, 30);
    const x = LAYOUT.MARGIN_X;
    const w = doc.page.width - LAYOUT.MARGIN_X * 2;
    const startY = doc.y;
    doc.save();
    doc.rect(x, startY, w, 22).fill(LAYOUT.ACCENT);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
        .text(title.toUpperCase(), x + 8, startY + 6, {
            width: w - 16,
            lineBreak: false,
        });
    doc.restore();
    doc.x = x;
    doc.y = startY + 22 + 6;
    doc.fillColor('black').font('Helvetica').fontSize(10);
}

export function subHeading(doc: any, title: string) {
    ensureSpace(doc, 18);
    const startY = doc.y;
    doc.save();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(LAYOUT.ACCENT)
        .text(title, LAYOUT.MARGIN_X, startY, { lineBreak: false });
    doc.restore();
    doc.x = LAYOUT.MARGIN_X;
    doc.y = startY + 14;
    doc.fillColor('black').font('Helvetica').fontSize(10);
}

/**
 * Draw a numbered bullet line: a left-aligned label (e.g. "17.3" or "A.")
 * followed by a justified body paragraph indented to the right of the label.
 *
 * Uses absolute positioning instead of pdfkit's `continued: true`, which
 * incorrectly inherits the label's narrow width and wraps the body to 1
 * character per line.
 */
export function numberedItem(
    doc: any,
    label: string,
    body: string,
    opts?: { labelWidth?: number; gap?: number; fontSize?: number },
) {
    const labelWidth = opts?.labelWidth ?? 28;
    const gap = opts?.gap ?? 6;
    const fontSize = opts?.fontSize ?? 10;

    ensureSpace(doc, fontSize * 2 + 6);
    const lineY = doc.y;
    const x = LAYOUT.MARGIN_X;
    const bodyX = x + labelWidth + gap;
    const bodyW = doc.page.width - LAYOUT.MARGIN_X - bodyX;

    // Label
    doc.save();
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(LAYOUT.MUTED)
        .text(label, x, lineY, { width: labelWidth, lineBreak: false });
    doc.restore();

    // Body — full remaining width, justified
    doc.x = bodyX;
    doc.y = lineY;
    doc.font('Helvetica').fontSize(fontSize).fillColor('black')
        .text(body, bodyX, lineY, {
            width: bodyW,
            align: 'justify',
        });

    doc.x = x;
    doc.moveDown(0.25);
}

/**
 * Two-column key/value table inside a bordered box.
 * Pairs are rendered in a grid: even index → left col, odd index → right col.
 */
export function kvTable(doc: any, pairs: Array<[string, string]>, opts?: {
    columns?: 1 | 2;
    rowHeight?: number;
}) {
    const columns = opts?.columns ?? 2;
    const rowH = opts?.rowHeight ?? 20;
    const x = LAYOUT.MARGIN_X;
    const totalW = doc.page.width - LAYOUT.MARGIN_X * 2;
    const colW = totalW / columns;
    const labelW = Math.min(110, colW * 0.40);
    const rowsNeeded = Math.ceil(pairs.length / columns);
    const tableH = rowsNeeded * rowH;

    ensureSpace(doc, tableH + 4);

    const startY = doc.y;

    // Outer border
    doc.save().lineWidth(0.6).strokeColor(LAYOUT.GRID_LINE)
        .rect(x, startY, totalW, tableH).stroke();

    // Vertical column dividers (only for >1 column)
    for (let c = 1; c < columns; c++) {
        doc.moveTo(x + colW * c, startY)
            .lineTo(x + colW * c, startY + tableH).stroke();
    }

    // Horizontal row separators
    for (let r = 1; r < rowsNeeded; r++) {
        doc.moveTo(x, startY + rowH * r)
            .lineTo(x + totalW, startY + rowH * r).stroke();
    }
    doc.restore();

    // Cells
    pairs.forEach((pair, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const cellX = x + col * colW;
        const cellY = startY + row * rowH;
        const labelX = cellX + 6;
        const valueX = cellX + labelW + 4;

        doc.save();
        doc.fillColor(LAYOUT.MUTED).font('Helvetica-Bold').fontSize(8.5);
        doc.text(pair[0].toUpperCase(), labelX, cellY + 5, {
            width: labelW - 8,
            lineBreak: false,
            ellipsis: true,
        });
        doc.fillColor('black').font('Helvetica').fontSize(10);
        doc.text(pair[1] ?? DASH, valueX, cellY + 4, {
            width: colW - labelW - 10,
            lineBreak: false,
            ellipsis: true,
        });
        doc.restore();
    });

    doc.y = startY + tableH + 6;
    doc.fillColor('black').font('Helvetica').fontSize(10);
}

/* =====================================================================
 * EMI / GENERIC TABLE
 * ===================================================================*/

export interface TableColumn {
    header: string;
    key?: string;          // when accessing row[key]
    width: number;         // in points
    align?: 'left' | 'right' | 'center';
    format?: (value: any, row?: any) => string;
}

export function drawTable(doc: any, columns: TableColumn[], rows: any[], opts?: {
    rowHeight?: number;
    headerHeight?: number;
    repeatHeaderOnNewPage?: boolean;
}) {
    const rowH = opts?.rowHeight ?? 18;
    const headH = opts?.headerHeight ?? 22;
    const x = LAYOUT.MARGIN_X;
    const totalW = columns.reduce((s, c) => s + c.width, 0);
    const repeatHeader = opts?.repeatHeaderOnNewPage ?? true;

    const drawHeader = () => {
        const y = doc.y;
        doc.save().rect(x, y, totalW, headH).fill(LAYOUT.ACCENT);
        let cx = x;
        for (const col of columns) {
            doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
                .text(col.header, cx + 4, y + 7, {
                    width: col.width - 8,
                    align: col.align ?? 'left',
                    lineBreak: false,
                    ellipsis: true,
                });
            cx += col.width;
        }
        doc.restore();
        doc.y = y + headH;
    };

    ensureSpace(doc, headH + rowH);
    drawHeader();

    rows.forEach((row, idx) => {
        if (doc.y + rowH > contentBottom(doc)) {
            doc.addPage();
            if (repeatHeader) drawHeader();
        }
        const y = doc.y;
        // zebra stripe
        if (idx % 2 === 0) {
            doc.save().fillColor(LAYOUT.ACCENT_LIGHT).rect(x, y, totalW, rowH).fill().restore();
        }

        // grid lines
        doc.save().lineWidth(0.4).strokeColor(LAYOUT.GRID_LINE);
        doc.rect(x, y, totalW, rowH).stroke();
        doc.restore();

        let cx = x;
        for (const col of columns) {
            const raw = col.key ? row[col.key] : row;
            const value = col.format ? col.format(raw, row) : safeStr(raw);
            doc.save().fillColor('black').font('Helvetica').fontSize(9);
            doc.text(value, cx + 4, y + 5, {
                width: col.width - 8,
                align: col.align ?? 'left',
                lineBreak: false,
                ellipsis: true,
            });
            doc.restore();
            cx += col.width;
        }
        doc.y = y + rowH;
    });

    doc.y += 6;
}

/* =====================================================================
 * IMAGE WITH BORDER
 * ===================================================================*/

export async function drawBoxedImage(
    doc: any,
    fetchImage: (url: string) => Promise<Buffer>,
    url: string | null | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    label?: string,
) {
    doc.save().lineWidth(0.6).strokeColor(LAYOUT.GRID_LINE)
        .rect(x, y, w, h).stroke().restore();
    if (label) {
        doc.save().font('Helvetica-Bold').fontSize(8).fillColor(LAYOUT.MUTED)
            .text(label.toUpperCase(), x, y - 11, { width: w, lineBreak: false }).restore();
    }
    if (!url) {
        doc.save().font('Helvetica-Oblique').fontSize(9).fillColor(LAYOUT.MUTED)
            .text('Not provided', x, y + h / 2 - 5, { width: w, align: 'center' }).restore();
        return;
    }
    try {
        const buf = await fetchImage(url);
        doc.image(buf, x + 2, y + 2, { fit: [w - 4, h - 4], align: 'center', valign: 'center' });
    } catch {
        doc.save().font('Helvetica-Oblique').fontSize(9).fillColor('#aa0000')
            .text('Image unavailable', x, y + h / 2 - 5, { width: w, align: 'center' }).restore();
    }
}
