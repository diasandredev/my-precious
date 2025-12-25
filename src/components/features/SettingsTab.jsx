import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Label, Input, Modal, IconPicker } from '../ui';
import { Save, Plus, Trash2, Edit2, Palette } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';

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
        alert('Settings saved!');
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
            color: '#3b82f6', // Default Blue
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
        if (window.confirm('Are you sure you want to delete this category? Items using this category will lose their association.')) {
            deleteCategory(id);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h2>

            {/* General Preferences */}
            <SettingsSection title="General Preferences" description="Manage your global application settings.">
                <div className="space-y-4 max-w-md">
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
                            Used for dashboard aggregations.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button onClick={handleSaveSettings} className="gap-2">
                            <Save size={16} />
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </SettingsSection>

            {/* Categories Management */}
            <SettingsSection
                title="Categories"
                description="Manage income and expense categories. Assign colors to visualize them in charts."
                action={
                    <Button onClick={handleAddCategory} size="sm" variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                        <Plus size={16} />
                        Add Category
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.categories?.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner"
                                    style={{ backgroundColor: `${cat.color}20` }}
                                >
                                    {(() => {
                                        const Icon = getIcon(cat.icon);
                                        return <Icon size={20} style={{ color: cat.color }} />;
                                    })()}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{cat.name}</h4>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        {cat.type}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-primary"
                                    onClick={() => handleEditCategory(cat)}
                                >
                                    <Edit2 size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(!data.categories || data.categories.length === 0) && (
                        <p className="text-sm text-gray-400 col-span-2 text-center py-8">
                            No categories found. Create one to get started!
                        </p>
                    )}
                </div>
            </SettingsSection>

            {/* Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title={editingCategory ? "Edit Category" : "New Category"}
            >
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                        <Label>Category Name</Label>
                        <Input
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="e.g. Groceries"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Type</Label>
                            <select
                                value={categoryForm.type}
                                onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="EXPENSE">Expense</option>
                                <option value="INCOME">Income</option>
                                <option value="BOTH">Both</option>
                            </select>
                        </div>
                        <div>
                            <Label>Color</Label>
                            <div className="flex items-center gap-2 h-10">
                                <input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    className="h-10 w-10 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
                                />
                                <span className="text-sm text-gray-500 font-mono uppercase">{categoryForm.color}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Icon</Label>
                        <div className="border rounded-md p-2 mt-2">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-500">Selected:</span>
                                {(() => {
                                    const SelectedIcon = getIcon(categoryForm.icon);
                                    return <SelectedIcon className="text-primary" />;
                                })()}
                            </div>
                            <IconPicker
                                selectedIcon={categoryForm.icon}
                                onSelect={(icon) => setCategoryForm({ ...categoryForm, icon })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function SettingsSection({ title, description, children, action }) {
    return (
        <Card className="p-6 bg-white shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                {action}
            </div>
            {children}
        </Card>
    );
}
