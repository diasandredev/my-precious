import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Upload, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { SyncStatus } from '../features/SyncStatus';
import { PageHeader } from '../layout/PageHeader';

export function CalendarHeader({ currentMonth, setCurrentMonth, handleFileUpload, onAdd, view, setView }) {
    return (
        <PageHeader
            title={format(currentMonth, 'MMMM yyyy')}
            description="Acompanhamento mensal de lançamentos, receitas e compromissos futuros."
            className="mb-6"
        >
            {/* Sync Status */}
            <SyncStatus />

            {/* Date Navigation */}
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs h-9">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Mês anterior"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="text-xs font-semibold px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                    Hoje
                </button>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Próximo mês"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Import Button */}
            <Button variant="outline" className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-xs px-3" onClick={handleFileUpload}>
                <Upload size={14} />
                <span>Importar Extrato</span>
            </Button>

            {/* View Toggles */}
            <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-xl h-9 border border-slate-200/60">
                <button
                    onClick={() => setView('calendar')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${view === 'calendar' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                    Calendário
                </button>
                <button
                    onClick={() => setView('rules')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${view === 'rules' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                    Regras Fixas
                </button>
            </div>

            {/* Main Action Button */}
            <Button onClick={onAdd} className="h-9 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm gap-1.5 px-3.5 whitespace-nowrap">
                <Plus size={15} />
                <span>{view === 'rules' ? 'Nova Regra' : 'Novo Lançamento'}</span>
            </Button>
        </PageHeader>
    );
}

