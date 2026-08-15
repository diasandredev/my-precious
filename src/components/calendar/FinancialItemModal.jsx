import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export function FinancialItemModal({ isOpen, onClose, itemType, setItemType, formData, setFormData, handleSubmit, isConfirming, categories, editingItem }) {
    const isEditing = !!editingItem;
    const modalTitle = isConfirming
        ? "Confirmar Lançamento"
        : (isEditing
            ? (itemType === 'one-time' ? "Editar Lançamento" : "Editar Regra Recorrente")
            : (itemType === 'one-time' ? "Novo Lançamento" : "Nova Regra Recorrente"));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {!isConfirming && !isEditing && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/60">
                        <button
                            type="button"
                            onClick={() => setItemType('one-time')}
                            className={cn(
                                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                                itemType === 'one-time' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            Único
                        </button>
                        <button
                            type="button"
                            onClick={() => setItemType('recurring')}
                            className={cn(
                                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                                itemType === 'recurring' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            Recorrente
                        </button>
                    </div>
                )}

                {isConfirming && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-xs font-bold text-amber-900">Confirmar Lançamento</h4>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                                Ajuste os valores ou detalhes conforme necessário antes de salvar.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Título</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="ex: Salário, Aluguel, Mercado"
                            className="rounded-xl border-slate-200 text-xs"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Valor (R$)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">R$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-9 rounded-xl border-slate-200 text-xs font-mono font-semibold"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipo</Label>
                            <div className="flex gap-1.5 h-10">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                        formData.type === 'EXPENSE'
                                            ? "bg-rose-50 border-rose-200 text-rose-700 shadow-xs"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    Despesa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                        formData.type === 'INCOME'
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    Receita
                                </button>
                            </div>
                        </div>
                    </div>

                    {itemType !== 'recurring' && (
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</Label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'CONFIRMED' })}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                        formData.status === 'CONFIRMED'
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    Confirmado
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'PROJECTED' })}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                        formData.status === 'PROJECTED'
                                            ? "bg-amber-50 border-amber-200 text-amber-700 shadow-xs"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    Projetado
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Categoria</Label>
                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1 border border-slate-200/80 rounded-xl bg-slate-50/40">
                            {(categories || [])
                                .filter(c => c.type === 'BOTH' || c.type === formData.type)
                                .map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                        className={cn(
                                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left cursor-pointer",
                                            formData.categoryId === cat.id
                                                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                                : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300"
                                        )}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="truncate">{cat.name}</span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>

                    {itemType === 'one-time' ? (
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Data</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="rounded-xl border-slate-200 text-xs"
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                            <h4 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">Configurações de Recorrência</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Frequência</Label>
                                    <select
                                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="LAST_BUSINESS_DAY_OF_MONTH">Último dia útil do mês</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Data de Início</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="rounded-xl border-slate-200 text-xs"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Data Fim (Opcional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="rounded-xl border-slate-200 text-xs"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isVariable"
                                    checked={formData.isVariable}
                                    onChange={e => setFormData({ ...formData, isVariable: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                                <Label htmlFor="isVariable" className="text-xs text-slate-700 font-medium mb-0 cursor-pointer">
                                    Valor Variável? (Confirmar valor todo mês)
                                </Label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-xs">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm px-4">
                            {isConfirming ? 'Confirmar & Salvar' : (isEditing ? 'Salvar Alterações' : (itemType === 'one-time' ? 'Adicionar Lançamento' : 'Criar Regra Recorrente'))}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
