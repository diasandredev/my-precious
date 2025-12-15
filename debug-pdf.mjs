
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';

async function run() {
    try {
        const data = await fs.readFile('./src/assets/extrato-picpay.pdf');
        const pdf = await getDocument({ data: new Uint8Array(data) }).promise;
        console.log('PDF loaded, pages:', pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).filter(s => s.trim().length > 0).join(' | ');
            console.log(`--- Page ${i} ---`);
            console.log(text);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
