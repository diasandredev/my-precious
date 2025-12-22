import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ChevronRight } from 'lucide-react';

export function DashboardAssetsCard({ allocationData, totalValue, formatCurrency, getAccountColor }) {
    const [expandedGroups, setExpandedGroups] = useState({});

    // Group data by simpleName
    const groupedData = React.useMemo(() => {
        const groups = {};

        allocationData.forEach(item => {
            const name = item.simpleName;
            if (!groups[name]) {
                groups[name] = {
                    id: `group-${name}`,
                    simpleName: name,
                    value: 0,
                    items: [],
                    // Use the first item to determine color/type for the group primarily
                    primaryItem: item
                };
            }
            groups[name].value += item.value;
            groups[name].items.push(item);
        });

        // Convert to array and sort
        return Object.values(groups)
            .map(group => ({
                ...group,
                percent: totalValue > 0 ? (group.value / totalValue) * 100 : 0,
                // Sort internal items by value desc
                items: group.items.sort((a, b) => b.value - a.value).map(item => ({
                    ...item,
                    percent: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
                    // Relative percent within group for visual if needed, or global?
                    // Let's keep global percent for consistency with the main bar
                }))
            }))
            .sort((a, b) => b.value - a.value);
    }, [allocationData, totalValue]);

    const toggleGroup = (name) => {
        setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <Card className="p-6 bg-white h-full max-h-[600px] flex flex-col">
            <div className="flex items-baseline gap-2 mb-4 shrink-0">
                <h3 className="text-xl font-bold text-gray-900">Assets</h3>
                <span className="text-lg text-gray-500 font-medium">
                    · {formatCurrency(totalValue)}
                </span>
            </div>

            {/* Segmented Progress Bar - Uses Grouped Data */}
            <div className="flex h-2 w-full rounded-full overflow-hidden mb-4 shrink-0">
                {groupedData.map((group, index) => (
                    <div
                        key={group.id}
                        style={{
                            width: `${group.percent}%`,
                            backgroundColor: getAccountColor(group.primaryItem, index)
                        }}
                        className="h-full"
                        title={`${group.simpleName}: ${group.percent.toFixed(1)}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 shrink-0">
                {groupedData.map((group, index) => (
                    <div key={group.id} className="flex items-center gap-1.5 text-sm">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getAccountColor(group.primaryItem, index) }}
                        />
                        <span className="text-gray-600">{group.simpleName}</span>
                        <span className="font-bold text-gray-900">{Math.round(group.percent)}%</span>
                    </div>
                ))}
            </div>

            {/* List Header */}
            <div className="flex text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 shrink-0">
                <div className="flex-1">Name</div>
                <div className="w-32 text-right hidden sm:block">Weight</div>
                <div className="w-32 text-right">Value</div>
            </div>

            {/* List Items - Scrollable Area */}
            <div className="space-y-1 flex-1 overflow-y-auto min-h-0 pr-1 -mr-1 custom-scrollbar">
                {groupedData.map((group, index) => {
                    const isExpanded = expandedGroups[group.simpleName];
                    const hasMultiple = group.items.length > 1;
                    const groupColor = getAccountColor(group.primaryItem, index);

                    return (
                        <div key={group.id} className="rounded-lg transition-colors">
                            {/* Group Header Row */}
                            <div
                                className={`flex items-center py-4 px-2 hover:bg-gray-50 rounded-lg cursor-pointer ${hasMultiple ? 'hover:bg-gray-50' : ''}`}
                                onClick={() => hasMultiple && toggleGroup(group.simpleName)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''} ${hasMultiple ? '' : 'invisible'}`}>
                                        <ChevronRight size={16} />
                                    </span>
                                    <span className="font-semibold text-gray-900 truncate">
                                        {group.simpleName}
                                    </span>
                                </div>

                                {/* Weight Visual */}
                                <div className="w-32 flex items-center justify-end gap-3 hidden sm:flex">
                                    <div className="flex gap-[2px]">
                                        {[...Array(10)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-[2px] h-3 rounded-full ${i < (group.percent / 10) ? '' : 'bg-gray-100'}`}
                                                style={{ backgroundColor: i < (group.percent / 10) ? groupColor : undefined }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                        {group.percent.toFixed(2)}%
                                    </span>
                                </div>

                                <div className="w-32 text-right font-bold text-gray-900 font-mono">
                                    {formatCurrency(group.value)}
                                </div>
                            </div>

                            {/* Expanded Children */}
                            {isExpanded && hasMultiple && (
                                <div className="pl-4 pr-2 pb-2 space-y-1 bg-gray-50/50 rounded-b-lg -mt-2">
                                    {group.items.map((item, subIndex) => (
                                        <div key={item.id} className="flex items-center py-2 px-2 text-sm border-t border-gray-100 first:border-0">
                                            <div className="flex-1 pl-8 text-gray-600 flex items-center gap-2">
                                                <span>{item.name}</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono">
                                                    {item.currency || 'BRL'}
                                                </span>
                                            </div>

                                            {/* Sub-item weight (Global weight) */}
                                            <div className="w-32 text-right hidden sm:block text-gray-500 font-mono text-xs">
                                                {item.percent.toFixed(2)}%
                                            </div>

                                            <div className="w-32 text-right font-mono text-gray-700">
                                                {formatCurrency(item.value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
