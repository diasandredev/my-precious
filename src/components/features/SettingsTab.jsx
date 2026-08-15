import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Label, Input, Modal, IconPicker } from '../ui';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import { PageHeader } from '../layout/PageHeader';

export function SettingsTab() {
    const { data, updateSettings, addCategory, updateCategory, deleteCategory } = useData();
    const [currency, setCurrency] = useState(data.settings?.mainCurrency || 'BRL');

    // Category Management State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        color: '#3b82f6',
        type: 'EXPENSE',
        icon: 'Tag'
    });

    const handleSaveSettings = () => {
        updateSettings({ mainCurrency: currency });
        alert('Configurações salvas!');
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            color: category.color,
            type: category.type || 'EXPENSE',
            icon: category.icon || 'Tag'
        });
        setIsCategoryModalOpen(true);
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({
            name: '',
            color: '#3b82f6',
            type: 'EXPENSE',
            icon: 'Tag'
        });
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            updateCategory(editingCategory.id, categoryForm);
        } else {
            addCategory(categoryForm);
        }
        setIsCategoryModalOpen(false);
    };

    const handleDeleteCategory = (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            deleteCategory(id);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Helmet>
                <title>Settings - Precious</title>
                <meta name="description" content="Manage your application preferences, currencies, and transaction categories." />
                <link rel="canonical" href="https://my-precious-app.com/settings" />
            </Helmet>
            
            <PageHeader 
                title="Configurações" 
                description="Personalize moeda principal, preferências e categorias de transações."
            />

            {/* General Preferences */}
            <SettingsSection title="Preferências Gerais" description="Defina a moeda base para consolidação de patrimônio.">
                <div className="space-y-4 max-w-md">
                    <div>
                        <Label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider">Moeda Principal</Label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                        >
                            <option value="BRL">BRL (R$) - Real Brasileiro</option>
                            <option value="USD">USD ($) - Dólar Americano</option>
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="GBP">GBP (£) - Libra Esterlina</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1.5">
                            Utilizada para converter todos os saldos e relatórios consolidados.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button onClick={handleSaveSettings} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm">
                            <Save size={15} />
                            Salvar Preferências
                        </Button>
                    </div>
                </div>
            </SettingsSection>

            {/* Categories Management */}
            <SettingsSection
                title="Categorias"
                description="Personalize categorias de receitas e despesas com cores e ícones para gráficos."
                action={
                    <Button onClick={handleAddCategory} size="sm" className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-xs">
                        <Plus size={15} />
                        Nova Categoria
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.categories?.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 bg-white shadow-xs hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                                    style={{ backgroundColor: `${cat.color}15` }}
                                >
                                    {(() => {
                                        const Icon = getIcon(cat.icon);
                                        return <Icon size={18} style={{ color: cat.color }} />;
                                    })()}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        {cat.type}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                    onClick={() => handleEditCategory(cat)}
                                >
                                    <Edit2 size={13} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                >
                                    <Trash2 size={13} />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(!data.categories || data.categories.length === 0) && (
                        <p className="text-xs text-slate-400 col-span-2 text-center py-8">
                            Nenhuma categoria cadastrada. Crie uma para começar!
                        </p>
                    )}
                </div>
            </SettingsSection>

            {/* Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
            >
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome da Categoria</Label>
                        <Input
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="ex: Mercado, Moradia..."
                            className="rounded-xl border-slate-200 text-xs"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipo</Label>
                            <select
                                value={categoryForm.type}
                                onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}
                                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                            >
                                <option value="EXPENSE">Despesa</option>
                                <option value="INCOME">Receita</option>
                                <option value="BOTH">Ambos</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Cor</Label>
                            <div className="flex items-center gap-2 h-10">
                                <input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    className="h-10 w-12 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                                />
                                <span className="text-xs font-mono text-slate-500 uppercase font-semibold">{categoryForm.color}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Ícone</Label>
                        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                            <IconPicker
                                value={categoryForm.icon}
                                onChange={icon => setCategoryForm({ ...categoryForm, icon })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="rounded-xl text-xs">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm">
                            {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function SettingsSection({ title, description, children, action }) {
    return (
        <Card className="p-6 bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                    {description && (
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
            {children}
        </Card>
    );
}
