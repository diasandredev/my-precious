/**
 * Centralized logic for transaction categorization.
 * Handles parsing description keywords and mapping original CSV categories to internal IDs.
 */
export class Categorizer {
    constructor(categories) {
        this.categories = categories || [];
    }

    /**
     * Tries to find the best matching category for a transaction.
     * @param {string} description - The transaction description.
     * @param {string} originalCategory - The category from the CSV file (optional).
     * @returns {string} The ID of the matching category, or 'cat_other' if not found.
     */
    categorize(description, originalCategory = '') {
        const desc = description.toUpperCase();
        const catOriginal = originalCategory.toUpperCase();

        // 1. Keyword-based Rules (Description Priority)
        // Format: [Keyword, TargetCategoryName]
        const keywordRules = [
            // --- Assinaturas / Subscriptions ---
            ['GAMERS CLUB', 'Assinaturas'],
            ['NETFLIX', 'Assinaturas'],
            ['SMILES', 'Assinaturas'],
            ['APPLE', 'Assinaturas'],
            ['MELIMAIS', 'Assinaturas'],
            ['SPOTIFY', 'Assinaturas'],
            ['WELLHUB', 'Assinaturas'],
            ['HBOMAX', 'Assinaturas'],
            ['TV por assinatura', 'Assinaturas'],
            ['Entretenimento', 'Assinaturas'],

            // --- Compras / Shopping ---
            ['AMAZON', 'Compras'],
            ['MERCADOLIVRE', 'Compras'],
            ['STEAM', 'Compras'],
            ['ALIEXPRESS', 'Compras'],
            ['Departamento', 'Compras'],
            ['Desconto', 'Compras'],

            // --- Viagem / Travel ---
            ['AIR EUROPA', 'Viagem'],
            ['LATAM', 'Viagem'],
            ['TAP', 'Viagem'],
            ['JETSMART', 'Viagem'],
            ['T&E', 'Viagem'],

            // --- Restaurantes / Food ---
            ['RESTAURANTE', 'Restaurantes'],
            ['BAR', 'Restaurantes'], // Matches BAR but assumes restaurant context based on user patterns
            ['PIZZA', 'Restaurantes'],
            ['PADARIA', 'Restaurantes'],
            ['CERVEJEIRA', 'Restaurantes'],
            ['Lanchonete', 'Restaurantes'],
            ['NEMA', 'Restaurantes'],

            // --- Supermercado / Groceries ---
            ['SUPERMERCADO', 'Supermercado'],
            ['MERCEARIA', 'Supermercado'],
            ['SILVEIRA', 'Supermercado'],
            ['ANGELONI', 'Supermercado'],
            ['KRETZER', 'Supermercado'],

            // --- Saúde e Farmácia ---
            ['FARMACIA', 'Farmacia'],
            ['DROGASIL', 'Farmacia'],
            ['PANVEL', 'Farmacia'],
            ['FARMACIAS', 'Farmacia'],
            ['BIOLAB', 'Farmacia'],
            ['Health', 'Farmacia'],

            // --- Yoda / Pets ---
            ['AGROVETERINARIA SC PET', 'Yoda'],

            // --- Cuidados Pessoais / Personal Care ---
            ['BARBEARIA VIP', 'Cuidados pessoais'],

            // --- Vestuário / Clothing ---
            ['VESTUARIO', 'Vestuario'],
            ['ROUPAS', 'Vestuario'],
            ['HERING', 'Vestuario'],

            // --- Transporte / Transport ---
            ['TRANSPORTE', 'Transporte'],
            ['UBER', 'Transporte'],
            ['99POP', 'Transporte'],

            // --- Internet / Telecom ---
            ['TELECOMUNICA', 'Internet'],
            ['VIVO', 'Internet'],
            ['INTERNET', 'Internet']
        ];

        // Check Description first
        for (const [keyword, categoryName] of keywordRules) {
            if (desc.includes(keyword)) {
                const match = this.findCategoryByName(categoryName);
                if (match) return match.id;
            }
        }

        // Check Original Category second
        for (const [keyword, categoryName] of keywordRules) {
            if (catOriginal.includes(keyword)) {
                const match = this.findCategoryByName(categoryName);
                if (match) return match.id;
            }
        }

        return 'cat_other'; // Default
    }

    findCategoryByName(name) {
        // Normalize for comparison
        return this.categories.find(c =>
            c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ===
            name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        );
    }
}

export const categorizeTransaction = (description, originalCategory, categories) => {
    const categorizer = new Categorizer(categories);
    return categorizer.categorize(description, originalCategory);
};
