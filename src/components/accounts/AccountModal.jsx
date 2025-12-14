import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';

export function AccountModal({ isOpen, onClose, editingAccount, formData, setFormData, handleSubmit }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingAccount ? 'Edit Account' : 'Add New Account'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Account Name</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Nubank, Binance"
                        required
                    />
                </div>

                <div>
                    <Label>Type</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="Bank">Bank Account</option>
                        <option value="Investment">Investment Broker</option>
                        <option value="Crypto">Crypto Wallet</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <Label>Currency</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={formData.currency}
                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    >
                        <option value="BRL">BRL (R$)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="BTC">BTC (₿)</option>
                        <option value="ETH">ETH (Ξ)</option>
                        <option value="BNB">BNB (BNB)</option>
                        <option value="XRP">XRP (XRP)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {editingAccount ? 'Save Changes' : 'Create Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
