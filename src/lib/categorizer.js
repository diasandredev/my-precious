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
            // Assinaturas / Subscriptions
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

            // Shopping
            ['AMAZON', 'Compras'],
            ['Departamento', 'Compras'],
            ['Desconto', 'Compras'],

            // Travel
            ['AIR EUROPA', 'Viagem'],
            ['LATAM', 'Viagem'],
            ['T&E', 'Viagem'],

            // Food / Supermarket
            ['Supermercado', 'Supermercado'],
            ['Mercearia', 'Supermercado'],
            ['Padaria', 'Supermercado'],
            ['Restaurante', 'Restaurante'],
            ['Lanchonete', 'Restaurante'],
            ['Bar', 'Restaurante'],

            // Services / Utilities
            ['Telecomunica', 'Internet'], // Serviços de telecomunicações
            ['VIVO', 'Internet'],
            ['Farmacia', 'Health'],
            ['Transporte', 'Transporte'],
            ['UBER', 'Transporte'],
            ['99POP', 'Transporte'], // Added common alternative
            ['Vestuario', 'Vestuario'],
            ['Roupas', 'Vestuario']
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
