import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Upload, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { SyncStatus } from '../features/SyncStatus';
import { PageHeader } from '../layout/PageHeader';

export function CalendarHeader({ currentMonth, setCurrentMonth, handleFileUpload, onAdd, view, setView }) {
    return (
        <PageHeader
            title={format(currentMonth, 'MMMM yyyy')}
            className="mb-8"
        >
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                {/* Sync Status */}
                <SyncStatus />

                {/* Date Navigation */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="text-xs font-medium px-2 py-1 text-gray-500 hover:text-gray-900"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Import Button */}
                <Button variant="outline" className="gap-2" onClick={handleFileUpload}>
                    <Upload size={16} />
                    Import
                </Button>

                {/* View Toggles */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg h-9">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'calendar' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Calendar
                    </button>
                    <button
                        onClick={() => setView('rules')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'rules' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Rules
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2" />

                {/* Main Action Button */}
                <Button onClick={onAdd} className="bg-black text-white hover:bg-gray-800 gap-2">
                    <Plus size={16} />
                    {view === 'rules' ? 'New Rule' : 'Add Item'}
                </Button>
            </div>
        </PageHeader>
    );
}

