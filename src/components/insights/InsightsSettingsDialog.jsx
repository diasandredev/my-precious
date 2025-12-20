import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Label } from '../ui/Input';
import { useInsightsSettings } from '../../contexts/InsightsSettingsContext';
import { RefreshCcw, Save } from 'lucide-react';

export function InsightsSettingsDialog({ isOpen, onClose }) {
    const { insightsConfig, updateConfig, resetConfig } = useInsightsSettings();
    const [localConfig, setLocalConfig] = useState(insightsConfig.thresholds);

    // Sync local state when config changes or dialog opens
    useEffect(() => {
        setLocalConfig(insightsConfig.thresholds);
    }, [insightsConfig, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({
            ...prev,
            [name]: Number(value)
        }));
    };

    const handleSave = () => {
        updateConfig(localConfig);
        onClose();
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all insights settings to default?')) {
            resetConfig();
            // local config will update via effect
        }
    };

    // Helper for rendering input fields
    const renderField = (key, label, description, suffix = '%') => (
        <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-semibold text-gray-700">{label}</Label>
            <div className="relative">
                <Input
                    id={key}
                    name={key}
                    type="number"
                    value={localConfig[key] || 0}
                    onChange={handleChange}
                    className="pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 pointer-events-none">{suffix}</span>
            </div>
            {description && <p className="text-[10px] text-gray-500">{description}</p>}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configure Insights" className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="space-y-6 py-2">

                {/* Section 1: Sensitivity & Detection */}
                <section className="space-y-3 border-b border-gray-100 pb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>🛡️ Change Detection</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField('minChangePercent', 'Min Change % (Noise Filter)', 'Ignore changes smaller than this', '%')}
                        {renderField('minChangeAmount', 'Min Change Amount', 'Ignore small % changes if value < this', 'R$')}
                        {renderField('criticalChangePercent', 'Critical Alert %', 'Threshold for high severity alerts', '%')}
                        {renderField('criticalChangeAmount', 'Critical Alert Amount', 'Always alert if increase > this', 'R$')}
                    </div>
                </section>

                {/* Section 2: Income Analysis */}
                <section className="space-y-3 border-b border-gray-100 pb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>💰 Income Analysis</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField('incomeDropPercent', 'Income Drop Warning %', 'Warn if income drops > this', '%')}
                        {renderField('incomeDropAmount', 'Income Drop Min Amount', 'And drop amount > this', 'R$')}
                        {renderField('incomeGrowthPercent', 'Income Growth %', 'Celebrate if income grows > this', '%')}
                        {renderField('incomeGrowthAmount', 'Income Growth Min Amount', 'And growth amount > this', 'R$')}
                    </div>
                </section>

                {/* Section 3: Spending & Ratios */}
                <section className="space-y-3 border-b border-gray-100 pb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>📉 Spending Metrics</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField('spendingRatioAlert', 'Expense Ratio Alert', 'Alert if Expenses > % of Income', '%')}
                        {renderField('spendingRatioWarning', 'Expense Ratio Warning', 'Warn if Expenses > % of Income', '%')}
                        {renderField('dominantCategoryPercent', 'Dominant Category %', 'Warn if one category > % of total', '%')}
                        {renderField('fixedCostRatio', 'High Fixed Costs %', 'Warn if fixed costs > % of total', '%')}
                    </div>
                </section>

                {/* Section 4: Specific Patterns */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>🔍 Specific Patterns</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField('weekendSpikePercent', 'Weekend Spike %', 'Flag if weekend spend > % of total', '%')}
                        {renderField('bigTicketPercent', 'Big Ticket Item %', 'Flag single txn > % of total', '%')}
                        {renderField('underBudgetPercent', 'Under Budget %', 'Celebrate total drop > %', '%')}
                        {renderField('newCategoryMinAmount', 'New Category Min Amount', 'Flag new category if > this', 'R$')}
                    </div>
                </section>


                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Reset Defaults
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
