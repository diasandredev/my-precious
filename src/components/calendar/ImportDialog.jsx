import { useState, useRef } from 'react';
import { Button, Modal } from '@/components/ui';
import { Upload, FileText, CreditCard } from 'lucide-react';

export function ImportDialog({ isOpen, onClose, onImport }) {
    const [source, setSource] = useState(null); // 'c6' or 'picpay'
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file || !source) return;

        setIsProcessing(true);
        try {
            await onImport(file, source);
            handleClose();
        } catch (error) {
            console.error('Import failed', error);
            // Handle error (maybe show a toast or alert)
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setSource(null);
        setFile(null);
        setIsProcessing(false);
        onClose();
    };

    const getAcceptType = () => {
        if (source === 'c6' || source === 'xp') return '.csv';
        if (source === 'picpay' || source === 'itau') return '.pdf';
        return '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Transactions"
            className="sm:max-w-[425px]"
        >
            {!source ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    <button
                        onClick={() => setSource('c6')}
                        className="group flex items-center p-4 rounded-xl border border-gray-200 bg-white hover:border-black hover:shadow-md transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                            <CreditCard size={20} className="text-gray-600 group-hover:text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="font-semibold text-gray-900">C6 Bank</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                                CSV
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setSource('xp')}
                        className="group flex items-center p-4 rounded-xl border border-gray-200 bg-white hover:border-yellow-500 hover:shadow-md transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                            <CreditCard size={20} className="text-yellow-600 group-hover:text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="font-semibold text-gray-900">XP Inv.</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                                CSV
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setSource('picpay')}
                        className="group flex items-center p-4 rounded-xl border border-gray-200 bg-white hover:border-green-500 hover:shadow-md transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <FileText size={20} className="text-green-600 group-hover:text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="font-semibold text-gray-900">PicPay</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase tracking-wide">
                                PDF
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setSource('itau')}
                        className="group flex items-center p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-500 hover:shadow-md transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <FileText size={20} className="text-orange-600 group-hover:text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="font-semibold text-gray-900">Itaú</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase tracking-wide">
                                PDF
                            </span>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="space-y-6 py-2">
                    {/* Breadcrumb Navigation */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <button 
                            onClick={() => { setSource(null); setFile(null); }} 
                            className="hover:text-gray-900 font-medium transition-colors flex items-center gap-1"
                        >
                            Import
                        </button>
                        <span className="text-gray-300">/</span>
                        <div className="flex items-center gap-2">
                            {source === 'c6' && <CreditCard size={14} className="text-gray-600" />}
                            {source === 'xp' && <CreditCard size={14} className="text-yellow-600" />}
                            {source === 'picpay' && <FileText size={14} className="text-green-600" />}
                            {source === 'itau' && <FileText size={14} className="text-orange-600" />}
                            <span className="font-semibold text-gray-900">
                                {source === 'c6' ? 'C6 Bank' : 
                                 source === 'xp' ? 'XP Investimentos' : 
                                 source === 'picpay' ? 'PicPay' : 'Itaú'}
                            </span>
                        </div>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed 
                            ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'} 
                            p-10 transition-all cursor-pointer text-center
                        `}
                    >
                        <input
                            type="file"
                            className="hidden"
                            accept={getAcceptType()}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="space-y-3 animate-in fade-in zoom-in-95">
                                <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-gray-900 break-all px-4">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(file.size / 1024).toFixed(1)} KB • Click to change
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Upload className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Click to upload {source === 'picpay' || source === 'itau' ? 'PDF' : 'CSV'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        or drag and drop your file here
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!file || isProcessing}
                            className="bg-black hover:bg-gray-800 text-white"
                        >
                            {isProcessing ? 'Importing...' : 'Start Import'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
