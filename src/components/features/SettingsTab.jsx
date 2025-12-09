import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Label } from '../ui';
import { Save } from 'lucide-react';

export function SettingsTab() {
    const { data, updateSettings } = useData();
    const [currency, setCurrency] = useState(data.settings?.mainCurrency || 'BRL');

    const handleSave = () => {
        updateSettings({ mainCurrency: currency });
        alert('Settings saved!');
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

            <Card className="p-6 bg-white shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>

                <div className="space-y-4">
                    <div>
                        <Label className="mb-2 block">Main Currency</Label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            <option value="BRL">BRL (R$)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            This currency will be used as the default for dashboard aggregations.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} className="gap-2">
                            <Save size={16} />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
