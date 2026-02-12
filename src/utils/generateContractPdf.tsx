import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

export async function generateContractPdf(data: any): Promise<Buffer> {
    const templatePath = process.env.TEMPLATE_PATH || path.resolve(__dirname, 'contract.template.html');

    const html = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(html);
    const content = template(data);

    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium-browser", // or /usr/bin/chromium
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true
    });

    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });

    const pdfBufferUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
}
