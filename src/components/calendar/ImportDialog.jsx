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
        if (source === 'c6') return '.csv';
        if (source === 'picpay') return '.pdf';
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
                <div className="grid grid-cols-2 gap-4 py-4">
                    <button
                        onClick={() => setSource('c6')}
                        className="flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 hover:border-primary hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <div className="rounded-full bg-primary/10 p-4">
                            <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-gray-900">C6 Bank</h3>
                            <p className="text-sm text-gray-500">Import CSV</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSource('picpay')}
                        className="flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 hover:border-primary hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <div className="rounded-full bg-green-500/10 p-4">
                            <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-gray-900">PicPay</h3>
                            <p className="text-sm text-gray-500">Import PDF</p>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="space-y-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                        <button onClick={() => { setSource(null); setFile(null); }} className="hover:text-primary transition-colors">
                            Select Source
                        </button>
                        <span>/</span>
                        <span className="font-medium text-foreground">{source === 'c6' ? 'C6 Bank' : 'PicPay'}</span>
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
                            <div className="space-y-2 animate-in fade-in zoom-in-95">
                                <FileText className="mx-auto h-12 w-12 text-primary" />
                                <p className="text-sm font-medium text-primary">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Click to change file
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="text-sm font-medium text-gray-900">
                                    Click to upload {source === 'c6' ? 'CSV' : 'PDF'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    or drag and drop
                                </p>
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
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isProcessing ? 'Importing...' : 'Import'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
