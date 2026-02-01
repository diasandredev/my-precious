import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const parseItauPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const transactions = [];
    const errors = [];
    const totalPages = pdf.numPages;

    let dueDate = null; // To help determine the year
    let currentCardInfo = "Itaú Card";

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items
        .map((item) => item.str)
        .filter((s) => s.trim().length > 0);

      // 1. Try to find Due Date (Vencimento) to fix the year
      // Format: "Vencimento: 25/01/2026" or similar
      // In the OCR: "Vencimento: 25/01/2026"
      if (!dueDate) {
        const fullText = textItems.join(" ");
        // Try finding due date in full text if sequential search fails
        let dueDateMatch = null;

        // Specific search for explicit "Vencimento: DD/MM/YYYY" first
        for (let k = 0; k < textItems.length; k++) {
          if (
            textItems[k].includes("Vencimento:") &&
            textItems[k + 1] &&
            /^\d{2}\/\d{2}\/\d{4}$/.test(textItems[k + 1])
          ) {
            const [d, m, y] = textItems[k + 1].split("/");
            dueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            break;
          }
          // Or sometimes it's joined "Vencimento: 25/01/2026"
          const match = textItems[k].match(
            /Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/,
          );
          if (match) {
            const [d, m, y] = match[1].split("/");
            dueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            break;
          }
        }

        // Fallback if loop didn't find it
        if (!dueDate) {
          dueDateMatch =
            fullText.match(/Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
            fullText.match(/(\d{2}\/\d{2}\/\d{4})\s*R\$/);
          if (dueDateMatch) {
            const [d, m, y] = dueDateMatch[1].split("/");
            dueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          }
        }
      }

      // 2. Iterate through items to find transactions
      // Looking for Date (DD/MM) followed by Description and Value

      for (let j = 0; j < textItems.length; j++) {
        const item = textItems[j].trim();

        if (item.includes("(final") && item.includes(")")) {
          currentCardInfo = item;
        }

        // Detect Transaction Date: DD/MM
        // regex: strict 2 digits slash 2 digits at start of string
        if (/^\d{2}\/\d{2}$/.test(item)) {
          const dateStr = item; // e.g. 26/12

          // Look ahead for Value
          // Value format: 649,00 or 1.234,56 (dots for thousands, comma decimal)
          // It should be within the next few items.

          let k = j + 1;
          let amountStr = null;
          let descriptionParts = [];

          // Scan forward to find a value-like string
          while (k < j + 15 && k < textItems.length) {
            // Increased window
            const candidate = textItems[k].trim();

            // Check if it looks like a value
            // Regex: optional minus, optional R$, digits/dots, comma, 2 digits
            // Itau PDF OCR shows "649,00" (no R$) usually in the columns, but let's be flexible
            if (/^-?[\d.]*,\d{2}$/.test(candidate)) {
              amountStr = candidate;
              break;
            }

            // Stop if we hit another date or specific keywords that indicate end of row
            // "Lançamentos" indicates a new section header usually
            if (
              /^\d{2}\/\d{2}$/.test(candidate) ||
              candidate.includes("Lançamentos")
            ) {
              break;
            }

            descriptionParts.push(candidate);
            k++;
          }

          if (amountStr && descriptionParts.length > 0) {
            const description = descriptionParts.join(" ");

            // Parse Amount
            let cleanAmount = amountStr.replace(/\./g, "").replace(",", ".");
            const amount = parseFloat(cleanAmount);

            if (!isNaN(amount)) {
              // Determine Year
              let year = new Date().getFullYear(); // Fallback
              if (dueDate) {
                const [, m] = dateStr.split("/");
                const transMonth = parseInt(m);
                const dueMonth = dueDate.getMonth() + 1;
                const dueYear = dueDate.getFullYear();

                // If transaction month is greater than due month + buffer, it's likely previous year
                // E.g. Due Jan 2026. Trans Dec (12) > Jan (1). Year = 2025.
                if (transMonth > dueMonth) {
                  year = dueYear - 1;
                } else {
                  year = dueYear;
                }
              }

              const [day, month] = dateStr.split("/");
              // ISO Date YYYY-MM-DD
              const finalDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

              // Only add if description doesn't look like a header or subtotal
              // "Total dos lançamentos" or "SALDO ANTERIOR" are not transactions
              if (
                !description.toUpperCase().includes("TOTAL") &&
                !description.toUpperCase().includes("SALDO")
              ) {
                transactions.push({
                  date: finalDate,
                  description: description,
                  categoryOriginal: "Itaú Import",
                  amount: Math.abs(amount), // Itaú expenses are positive in list
                  type: "EXPENSE", // Defaulting to Expense for Credit Card
                  originalLine: `Page ${i}`,
                  cardName: currentCardInfo,
                  installment: "Única", // Default unless we parse "01/10"
                });
              }

              // Move j to k to skip processed items
              j = k;
            }
          }
        }
      }
    }

    // Remove duplicates if any (headers sometimes repeat in parsing)
    const uniqueTransactions = transactions.filter(
      (t, index, self) =>
        index ===
        self.findIndex(
          (t2) =>
            t2.date === t.date &&
            t2.description === t.description &&
            t2.amount === t.amount,
        ),
    );

    return { transactions: uniqueTransactions, errors };
  } catch (e) {
    console.error("Itaú PDF Parse Error", e);
    return { transactions: [], errors: [e.message] };
  }
};
