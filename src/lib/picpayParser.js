import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for Vite using ?url import
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'; // Use ?url to get the path
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const parsePicPayPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const transactions = [];
        const errors = [];
        let totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Filter empty strings and join
            const textItems = textContent.items.map(item => item.str).filter(s => s.trim().length > 0);

            // The PicPay PDF structure seems to be:
            // Date | Time | Description | Amount | Balance | ...
            // Based on debug output:
            // 07/12/2025 | 19:26:50 | Pix Enviado | - R$ 10,00 | - | - |
            // 07/12/2025 | 07:22:52 | Pix Recebido | R$ 200,00 | - | - |

            // We can iterate through items and look for date patterns "DD/MM/YYYY"
            for (let j = 0; j < textItems.length; j++) {
                const item = textItems[j].trim();

                // Check if item matches Date format DD/MM/YYYY
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(item)) {
                    // Potential start of a row
                    // Look ahead for Description (Pix Enviado / Pix Recebido)
                    // The structure varies slightly but Time usually follows Date

                    const dateStr = item;
                    const timeStr = textItems[j + 1]; // Assuming time is next

                    // Keep looking forward for "Pix Enviado" or "Pix Recebido" nearby
                    let description = "";
                    let amountStr = "";
                    let type = "";

                    // Simple lookahead heuristic
                    // We expect Description to be within next few items
                    // We expect Amount to be shortly after Description

                    let k = j + 2;
                    let foundDescription = false;

                    // Scan next few items for description
                    while (k < j + 10 && k < textItems.length) {
                        const currentText = textItems[k].trim();

                        if (currentText === "Pix Enviado" || currentText === "Pix Recebido") {
                            description = currentText;
                            type = currentText === "Pix Enviado" ? "EXPENSE" : "INCOME";
                            foundDescription = true;

                            // Amount is usually the next item or the one after?
                            // From debug: "Pix Enviado | - R$ 10,00"
                            // "Pix Recebido | R$ 200,00"
                            // So amount seems to be immediately after description
                            if (k + 1 < textItems.length) {
                                amountStr = textItems[k + 1];
                            }
                            break;
                        }
                        k++;
                    }

                    if (foundDescription && amountStr) {
                        // Parse Amount
                        // Remove "R$", "." (thousands), replace "," with "."
                        // Handle negative sign if present (though "Pix Enviado" implies expense, the string might have "- R$")

                        let cleanAmountStr = amountStr.replace('R$', '').trim();
                        // Remove negative sign if strictly parsing absolute value, but let's see
                        if (cleanAmountStr.startsWith('-')) {
                            cleanAmountStr = cleanAmountStr.substring(1).trim();
                        }

                        cleanAmountStr = cleanAmountStr.replace(/\./g, '').replace(',', '.');
                        const amount = parseFloat(cleanAmountStr);

                        if (!isNaN(amount)) {
                            // Parse Date
                            const [day, month, year] = dateStr.split('/');
                            const dateObj = new Date(year, month - 1, day);
                            const isoDate = dateObj.toISOString().split('T')[0];

                            transactions.push({
                                date: isoDate,
                                description: `PicPay - ${description}`,
                                categoryOriginal: description, // Use description as category for now
                                amount: amount,
                                type: type,
                                originalLine: `Page ${i}`,
                                installment: 'Única'
                            });
                        }
                    }
                }
            }
        }

        return { transactions, errors };

    } catch (e) {
        console.error("PDF Parse Error", e);
        return { transactions: [], errors: [e.message] };
    }
};
