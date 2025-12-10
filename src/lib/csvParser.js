export const parseTransactionsCSV = (csvContent) => {
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
                installment: installmentStr
            });

        } catch (e) {
            errors.push(`Line ${i + 1}: Parsing error - ${e.message}`);
        }
    }

    return { transactions, errors };
};
