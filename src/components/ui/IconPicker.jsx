import { useState } from 'react';
import { ICONS, getIconList, getIcon } from '../../lib/icons';
import { Button, Input, Modal } from '../ui';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function IconPicker({ selectedIcon, onSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const iconList = getIconList();

    const filteredIcons = iconList.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search icons..."
                    className="pl-9"
                />
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                {filteredIcons.map(name => {
                    const IconComponent = getIcon(name);
                    const isSelected = selectedIcon === name;

                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => onSelect(name)}
                            className={cn(
                                "flex items-center justify-center p-2 rounded-md transition-all",
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            )}
                            title={name}
                        >
                            <IconComponent size={20} />
                        </button>
                    );
                })}
            </div>
            {filteredIcons.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No icons found.</p>
            )}
        </div>
    );
}
