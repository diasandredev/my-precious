export const parseC6CSV = (csvContent) => {
    const lines = csvContent.split('\n');
    const transactions = [];
    const errors = [];

    const ignorePhrases = [
        'Inclusao de Pagamento',
        'Anuidade Diferenciada',
        'Estorno Tarifa'
    ];

    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by semicolon as per example
        const columns = line.split(';');

        // Expected columns:
        // 0: Data de Compra
        // 1: Nome no Cartão
        // 2: Final do Cartão
        // 3: Categoria
        // 4: Descrição
        // 5: Parcela
        // 6: Valor (em US$)
        // 7: Cotação (em R$)
        // 8: Valor (em R$)

        if (columns.length < 9) {
            errors.push(`Line ${i + 1}: Insufficient columns`);
            continue;
        }

        try {
            const dateStr = columns[0].trim();
            const cardName = columns[1].trim();
            const cardLastDigits = columns[2].trim();
            const category = columns[3].trim();
            const description = columns[4].trim();
            const installmentStr = columns[5]?.trim() || 'Única';
            const amountStr = columns[8].trim(); // Valor em R$

            // Filter out ignored phrases
            if (ignorePhrases.some(phrase => description.includes(phrase) || description.includes(phrase.trim()))) {
                continue;
            }

            // Parse Date (DD/MM/YYYY)
            const [day, month, year] = dateStr.split('/');
            let dateObj = new Date(year, month - 1, day);

            // Parse Amount
            const amount = parseFloat(amountStr);

            if (isNaN(amount)) {
                errors.push(`Line ${i + 1}: Invalid amount`);
                continue;
            }

            // Filter out payments/credits (negative values)
            if (amount <= 0) {
                continue;
            }

            // Installment Logic
            // Format: "4/4" or "Única"
            if (installmentStr.includes('/')) {
                const [current, total] = installmentStr.split('/').map(Number);
                if (!isNaN(current) && current > 1) {
                    // Add (current - 1) months to the date
                    dateObj.setMonth(dateObj.getMonth() + (current - 1));
                }
            }

            const finalDate = dateObj.toISOString().split('T')[0];

            transactions.push({
                date: finalDate,
                description,
                categoryOriginal: category,
                amount,
                type: 'EXPENSE',
                originalLine: i + 1,
                installment: installmentStr,
                cardName,
                cardLastDigits
            });

        } catch (e) {
            errors.push(`Line ${i + 1}: Parsing error - ${e.message}`);
        }
    }

    return { transactions, errors };
};

export const parseXpCSV = (csvContent) => {
    const lines = csvContent.split('\n');
    const transactions = [];
    const errors = [];

    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(';');

        // Expected columns (XP):
        // 0: Data (03/10/2025)
        // 1: Estabelecimento (COTTON ON SHOPPING VIL)
        // 2: Portador (LAURA)
        // 3: Valor (R$ 33,71)
        // 4: Parcela (2 de 4) or (-)

        if (columns.length < 4) { // Parcela might be optional or empty? Provided example has 5 cols
            // But let's be safe, at least 4 for amount.
            errors.push(`Line ${i + 1}: Insufficient columns`);
            continue;
        }

        try {
            const dateStr = columns[0].trim();
            const description = columns[1].trim();
            const cardName = columns[2].trim();
            const amountStr = columns[3].trim();
            const installmentStr = columns[4]?.trim() || '-';

            // Parse Date (DD/MM/YYYY)
            const [day, month, year] = dateStr.split('/');
            let dateObj = new Date(year, month - 1, day);

            // Parse Amount
            // Remove 'R$', '.', replace ',' with '.'
            // Example: "R$ 33,71" -> "33.71"
            // Example: "R$ -3.253,12" -> "-3253.12"
            let cleanAmount = amountStr.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
            const amount = parseFloat(cleanAmount);

            if (isNaN(amount)) {
                errors.push(`Line ${i + 1}: Invalid amount: ${amountStr}`);
                continue;
            }

            // Filter out payments (negative values)
            if (amount <= 0) {
                continue;
            }

            // Handle Installments
            // "2 de 4" -> current=2, total=4
            // User request: "parcelas está no formato 1 de 6".
            // Logic: Append (X/Y) to description? 
            // In C6 parser: "if current > 1, add months".
            // BUT user said: "considerar isso" (consider it).
            // Usually for Calendar import, we want the Date to be the date of *that* installment.
            // If the CSV contains *future* installments as separate rows, we just import them.
            // If the CSV contains *only the purchase date* and says "2 de 4", it means this is the 2nd installment which was billed on `dateStr`? 
            // OR does it mean the purchase was on `dateStr`?
            // "03/10/2025;COTTON ON...;...;2 de 4"
            // If this is a Monthly Statement (Fatura), it lists the labeled installments for *that month*.
            // So the date provided (03/10/2025) IS the billing date for that installment (or close to it).
            // C6 parser logic: `dateObj.setMonth(dateObj.getMonth() + (current - 1));` suggests C6 gives the *purchase* date for all installments?
            // "Data de Compra" is column 0 in C6.
            // In XP: "Data" is column 0. If it's a statement export, it likely shows the date of the transaction *posting* or effective date.
            // If it shows "03/10/2025" and "2 de 4", and today is Dec 2025...
            // 03/10/2025 was October. 
            // If this CSV is the "Fatura Current", it lists items *for this fatura*.
            // If I look at the example: 
            // "03/10/2025 ... 2 de 4"
            // "03/11/2025 ... 1 de 6" (November 3rd)
            // "05/09/2025 ... 3 de 3" (September 5th)
            // It seems 'Data' is the *purchase date*?
            // If "3 de 3" is on 05/09/2025, and this is a *recent* fatura (Dec 5th), then 3/3 was probably billed in Nov or Dec? 
            // Wait. 05/09/2025 + 2 months = Nov 05.
            // If 'Data' is purchase date:
            // 2 de 4 on 03/10/2025. 
            // 1st: 10/2025? Or 11/2025?
            // If it's 2 of 4 *in this fatura*, it means this line represents the specific installment.
            // C6 parser adds `current - 1` months.
            // If XP CSV works like C6 (Purchase Date), then we need to shift.
            // If XP CSV works like NuBank (Billing Date), we don't shift.
            // Given "Fatura2025-12-05-lau.csv" filename, it's a statement for Dec 2025.
            // "05/09/2025 ... 3 de 3". Purchase Sept 5th. 3rd installment.
            // Sept (1/3), Oct (2/3), Nov (3/3).
            // If this file is Dec 5th, maybe it contains previous items?
            // Or maybe "05/09/2025" is the date of *this* installment?? No, "3 de 3" matches Sept->Nov timeline roughly.
            // If "03/11/2025 ... 1 de 6". Purchase Nov 3rd. 1st installment.
            // If this file is for Dec... 
            // Actually, let's assume 'Data' is PURCHASE DATE.
            // And if we are importing *expenses* to the calendar, we want them on the *Billing Date*? Alternatively, the *Transaction Date*?
            // The C6 parser shifts date: `dateObj.setMonth(dateObj.getMonth() + (current - 1));`
            // usage: `transactions.push({ date: finalDate })`.
            // So C6 parser *projects* the installment date.
            // I should likely do the same for XP if the date column is Purchase Date.
            // "03/10/2025 ... 2 de 4". Purchase Oct 3rd. 
            // 1/4: Oct? (or Nov depending on cut-off). 
            // 2/4: Nov? (or Dec).
            // If I shift by `current - 1`: 
            // 2-1 = 1 month. Oct 3 + 1 month = Nov 3.
            // If this file is Dec, then maybe my shift logic is simpler than reality (card close date etc).
            // BUT consistent with C6 parser is the safest bet.
            // I will implement the shift logic: `dateObj.setMonth(dateObj.getMonth() + (current - 1));`

            let finalDescription = description.trim();

            if (installmentStr.includes(' de ')) {
                const [current, total] = installmentStr.split(' de ').map(Number);
                if (!isNaN(current) && !isNaN(total)) {
                    // Add to description
                    finalDescription += ` (${current}/${total})`;

                    if (current > 1) {
                        dateObj.setMonth(dateObj.getMonth() + (current - 1));
                    }
                }
            }

            const finalDate = dateObj.toISOString().split('T')[0];

            transactions.push({
                date: finalDate,
                description: finalDescription,
                categoryOriginal: description, // XP puts establishment in description col essentially
                amount,
                type: 'EXPENSE',
                originalLine: i + 1,
                installment: installmentStr,
                cardName,
                // cardLastDigits: '' // Not present in XP example rows provided
            });

        } catch (e) {
            errors.push(`Line ${i + 1}: Parsing error - ${e.message}`);
        }
    }

    return { transactions, errors };
};

// Legacy/Default export alias
export const parseTransactionsCSV = parseC6CSV;
