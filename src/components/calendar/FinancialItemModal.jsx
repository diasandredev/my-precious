import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function FinancialItemModal({ isOpen, onClose, itemType, setItemType, formData, setFormData, handleSubmit, isConfirming, categories, editingItem }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isConfirming ? "Confirm Expense/Income" : (editingItem ? (itemType === 'one-time' ? "Edit Transaction" : "Edit Recurring Transaction") : (itemType === 'one-time' ? "Add Transaction" : "New Recurring Transaction"))}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isConfirming && (
                    <div className="flex items-center gap-4 p-1 bg-gray-100 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => setItemType('one-time')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                itemType === 'one-time' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            One-time
                        </button>
                        <button
                            type="button"
                            onClick={() => setItemType('recurring')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                itemType === 'recurring' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            Recurring
                        </button>
                    </div>
                )}

                {isConfirming && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-sm font-bold text-yellow-800">Confirm Amount</h4>
                            <p className="text-xs text-yellow-700 mt-1">
                                This is a variable recurring item. Please confirm the exact amount for this month.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Salary, Rent, Grocery"
                            required
                            disabled={isConfirming} // Read-only if confirming a child
                        />
                    </div>

                    {!isConfirming && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-8"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        disabled={isConfirming && !formData.isVariable}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Type</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={isConfirming}
                                        onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg border transition-all",
                                            formData.type === 'EXPENSE'
                                                ? "bg-red-50 border-red-200 text-red-700"
                                                : "border-gray-200 text-gray-500 hover:border-gray-300",
                                            isConfirming && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isConfirming}
                                        onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg border transition-all",
                                            formData.type === 'INCOME'
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "border-gray-200 text-gray-500 hover:border-gray-300",
                                            isConfirming && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                        </div>

                    )}

                    {!isConfirming && itemType !== 'recurring' && (
                        <div>
                            <Label>Status</Label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'CONFIRMED' })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all",
                                        formData.status === 'CONFIRMED'
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                                    )}
                                >
                                    Confirmed
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'PROJECTED' })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all",
                                        formData.status === 'PROJECTED'
                                            ? "bg-amber-50 border-amber-200 text-amber-700"
                                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                                    )}
                                >
                                    Projected
                                </button>
                            </div>
                        </div>
                    )}

                    {isConfirming && (
                        <div>
                            <Label>Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-8"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    disabled={!formData.isVariable}
                                />
                            </div>
                        </div>
                    )}

                    {/* Category Selection */}
                    {!isConfirming && (
                        <div>
                            <Label>Category</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {(categories || [])
                                    .filter(c => c.type === 'BOTH' || c.type === formData.type)
                                    .map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            disabled={isConfirming}
                                            onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                                                formData.categoryId === cat.id
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50",
                                                isConfirming && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="truncate">{cat.name}</span>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {itemType === 'one-time' ? (
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">Recurrence Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Frequency</Label>
                                    <select
                                        className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="LAST_BUSINESS_DAY_OF_MONTH">Último dia útil do mês</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>End Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isVariable"
                                    checked={formData.isVariable}
                                    onChange={e => setFormData({ ...formData, isVariable: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="isVariable" className="mb-0">Variable Price? (Confirm amount monthly)</Label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isConfirming ? 'Confirm & Save' : (editingItem ? 'Save Changes' : (itemType === 'one-time' ? 'Add Transaction' : 'Create Recurring Transaction'))}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal >
    );
}
