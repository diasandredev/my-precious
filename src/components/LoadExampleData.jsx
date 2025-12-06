import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { v4 as uuidv4 } from 'uuid';

export function LoadExampleData() {
    const { data, addAccount, addSnapshot } = useData();
    const [status, setStatus] = useState('idle');

    const loadData = async () => {
        setStatus('loading');

        try {
            // Dynamic import to avoid build errors if file is missing
            const module = await import('../example-data.json');
            const { accounts: accountsData, rows } = module.default;

            const accountIds = {};

            // 1. Create or find accounts
            accountsData.forEach(accData => {
                const existing = data.accounts.find(a => a.name === accData.name);
                if (existing) {
                    accountIds[accData.name] = existing.id;
                } else {
                    const newId = uuidv4();
                    addAccount({ ...accData, id: newId });
                    accountIds[accData.name] = newId;
                }
            });

            // 2. Create snapshots
            // We need to map the values array to the account IDs
            // Order: ITAU, Nubank, C6, XP, Criptos, Dólar/Euro, Extras
            // We assume the order in 'rows.values' matches the order in 'accountsData'
            // Let's verify this assumption or make it robust.
            // The JSON structure I created has 'accounts' as a list.
            // The 'rows' values correspond to these accounts in order.

            const accountOrder = accountsData.map(a => a.name);

            rows.forEach(row => {
                const balances = {};
                row.values.forEach((val, index) => {
                    const accName = accountOrder[index];
                    const accId = accountIds[accName];
                    if (accId) {
                        balances[accId] = val;
                    }
                });

                addSnapshot({
                    date: row.date,
                    balances: balances
                });
            });

            setStatus('done');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to load example data:', error);
            setStatus('error');
            alert('Failed to load example data. Make sure src/example-data.json exists.');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={loadData}
                disabled={status === 'loading'}
                className={`px-4 py-2 rounded shadow text-white transition-colors ${status === 'error' ? 'bg-red-600 hover:bg-red-700' :
                        status === 'done' ? 'bg-green-600 hover:bg-green-700' :
                            'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50`}
            >
                {status === 'loading' ? 'Loading...' :
                    status === 'done' ? 'Done!' :
                        status === 'error' ? 'Error!' :
                            'Load Example Data'}
            </button>
        </div>
    );
}
