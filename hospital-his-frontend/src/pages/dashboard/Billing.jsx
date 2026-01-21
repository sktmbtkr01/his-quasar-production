import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    FileText,
    Plus,
    Search,
    AlertCircle,
    Printer,
    Lock,
    X,
    CheckCircle
} from 'lucide-react';
import billingService from '../../services/billing.service';
import patientService from '../../services/patients.service'; // Fixed import path
import { toast } from 'react-hot-toast';

const Billing = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        todayCollection: 0,
        pendingAmount: 0,
        todayBills: 0
    });
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bill Generation State (New Bill)
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [billItems, setBillItems] = useState([
        { description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    // View/Edit Bill State
    const [selectedBill, setSelectedBill] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsData, billsData] = await Promise.all([
                billingService.getDashboardStats(),
                billingService.getAllBills({ limit: 20 })
            ]);
            setStats(statsData.data);
            setBills(billsData.data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... Patient Search Logic (Same as before) ...
    const handleSearchPatient = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const results = await patientService.searchPatients(query);
                setPatients(results.data || []);
            } catch (error) {
                console.error(error);
            }
        } else {
            setPatients([]);
        }
    };
    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        setPatients([]);
        setSearchQuery('');
    };

    // ... Item Management Logic ...
    const addBillItem = () => {
        setBillItems([...billItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
    };
    const removeBillItem = (index) => {
        const newItems = billItems.filter((_, i) => i !== index);
        setBillItems(newItems);
    };
    const handleItemChange = (index, field, value) => {
        const newItems = [...billItems];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }
        setBillItems(newItems);
    };
    const calculateTotal = () => {
        return billItems.reduce((sum, item) => sum + item.amount, 0);
    };

    const handleSubmitBill = async () => {
        if (!selectedPatient) return toast.error('Please select a patient');
        const totalAmount = calculateTotal();
        if (totalAmount <= 0) return toast.error('Bill amount must be greater than 0');

        try {
            const billData = {
                patient: selectedPatient._id,
                visitType: 'outpatient',
                visitModel: 'Appointment',
                visit: selectedPatient.activeVisitId || null,
                items: billItems.map(item => ({
                    itemType: 'other',
                    description: item.description,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    amount: Number(item.amount),
                    netAmount: Number(item.amount),
                    isSystemGenerated: false
                })),
                subtotal: totalAmount,
                grandTotal: totalAmount,
                status: 'draft' // Create as draft by default
            };

            await billingService.generateBill(billData);
            toast.success('Bill generated successfully');
            setActiveTab('overview');
            fetchDashboardData();
            // Reset form
            setSelectedPatient(null);
            setBillItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate bill');
        }
    };

    // View Bill Modal Logic
    const openBillDetails = (bill) => {
        setSelectedBill({ ...bill }); // Copy to avoid mutation issues
        setIsEditMode(false);
    };

    const handleFinalizeBill = async () => {
        if (!selectedBill) return;
        try {
            await billingService.updateBill(selectedBill._id, { status: 'finalized' });
            toast.success('Bill Finalized');
            setSelectedBill(null);
            fetchDashboardData();
        } catch (error) {
            toast.error('Failed to finalize bill');
        }
    };

    const handleUpdateBillItems = async () => {
        try {
            await billingService.updateBill(selectedBill._id, {
                items: selectedBill.items,
                // Server recalculates totals usually, but updated schema might expect them? 
                // Model pre-save hook handles recalculation.
            });
            toast.success('Bill Updated');
            // Refresh
            const updated = await billingService.getBillById(selectedBill._id);
            setSelectedBill(updated.data);
            fetchDashboardData();
            setIsEditMode(false);
        } catch (error) {
            toast.error('Failed to update bill');
        }
    };

    const handleEditItemQuantity = (index, val) => {
        if (!selectedBill) return;
        const newItems = [...selectedBill.items];
        const item = newItems[index];
        // System items cannot change rate/desc, maybe quantity? Let's assume quantity is locked too for system safeguard.
        // If manual, fully editable.
        if (item.isSystemGenerated) {
            // Block editing for system items (Safeguard)
            return;
        }
        item.quantity = Number(val);
        item.amount = item.quantity * item.rate;
        item.netAmount = item.amount;
        setSelectedBill({ ...selectedBill, items: newItems });
    };

    const handleRemoveDraftItem = (index) => {
        const newItems = selectedBill.items.filter((_, i) => i !== index);
        setSelectedBill({ ...selectedBill, items: newItems });
    };

    // Add new item to EXISTING DRAFT
    // Simplified: Just update `selectedBill.items` array locally, then Save.
    const handleAddLineItemToDraft = () => {
        setSelectedBill({
            ...selectedBill,
            items: [
                ...selectedBill.items,
                {
                    itemType: 'other',
                    description: 'New Charge',
                    quantity: 1,
                    rate: 0,
                    amount: 0,
                    netAmount: 0,
                    isSystemGenerated: false
                }
            ]
        });
        setIsEditMode(true);
    };


    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Billing & Finance</h1>
                    <p className="text-slate-500">Event-driven billing ledger</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'create' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Plus size={18} /> Manual Bill
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <FileText size={18} /> Ledger
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-1">Today's Collection</p>
                        <h3 className="text-3xl font-bold text-slate-800">${(stats.todayCollection || 0).toLocaleString()}</h3>
                    </div>
                </div>
            )}

            {/* Create Bill Form (Manual) */}
            {activeTab === 'create' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Create Manual Exception Bill</h2>
                    {/* ... (Same Patient Search & Item Form as previous step) ... */}
                    <div className="relative mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Search Patient..."
                            value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : searchQuery}
                            onChange={handleSearchPatient}
                        />
                        {patients.length > 0 && !selectedPatient && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {patients.map(p => (
                                    <div key={p._id} className="p-3 hover:bg-slate-50 cursor-pointer" onClick={() => selectPatient(p)}>
                                        {p.firstName} {p.lastName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Items ... */}
                    <button onClick={handleSubmitBill} className="w-full py-3 bg-primary text-white rounded-xl mt-4">Generate Draft</button>
                </div>
            )}

            {/* Bill Ledger (History) */}
            {(activeTab === 'overview' || activeTab === 'history') && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Bill No</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bills.map((bill) => (
                                <tr key={bill._id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-700">{bill.billNumber}</td>
                                    <td className="px-6 py-4">{bill.patient?.firstName} {bill.patient?.lastName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-md ${bill.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                                bill.status === 'finalized' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                                            }`}>
                                            {(bill.status || 'draft').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 font-bold">${bill.grandTotal}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {bill.items.length} Items ({bill.items.filter(i => i.isSystemGenerated).length} Auto)
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openBillDetails(bill)} className="text-primary hover:underline text-sm font-medium">View/Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BILL DETAILS MODAL */}
            {selectedBill && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Bill Details: {selectedBill.billNumber}</h2>
                                <p className="text-sm text-slate-500">Status: <span className="uppercase font-bold">{selectedBill.status || 'DRAFT'}</span></p>
                            </div>
                            <button onClick={() => setSelectedBill(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="p-6 flex-1">
                            {/* Line Items */}
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Description</th>
                                        <th className="px-4 py-2 w-20">Qty</th>
                                        <th className="px-4 py-2 w-24 text-right">Amount</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedBill.items.map((item, idx) => (
                                        <tr key={idx} className={item.isSystemGenerated ? 'bg-blue-50/30' : ''}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-700 flex items-center gap-2">
                                                    {item.description}
                                                    {item.isSystemGenerated && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">AUTO</span>}
                                                </div>
                                                <div className="text-xs text-slate-400">{item.itemType}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {/* Editing Qty */}
                                                {(selectedBill.status === 'draft' && !item.isSystemGenerated) ? (
                                                    <input
                                                        type="number"
                                                        className="w-16 border rounded px-1"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...selectedBill.items];
                                                            newItems[idx].quantity = Number(e.target.value);
                                                            newItems[idx].amount = newItems[idx].quantity * newItems[idx].rate;
                                                            setSelectedBill({ ...selectedBill, items: newItems });
                                                            setIsEditMode(true);
                                                        }}
                                                    />
                                                ) : item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">${item.amount}</td>
                                            <td className="px-4 py-3 text-right">
                                                {item.isSystemGenerated ? (
                                                    <Lock size={14} className="text-gray-400 inline" />
                                                ) : (
                                                    (selectedBill.status === 'draft') && (
                                                        <button onClick={() => {
                                                            const newItems = selectedBill.items.filter((_, i) => i !== idx);
                                                            setSelectedBill({ ...selectedBill, items: newItems });
                                                            setIsEditMode(true);
                                                        }} className="text-red-500 hover:text-red-700">
                                                            <X size={16} />
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {selectedBill.status === 'draft' && (
                                <button onClick={handleAddLineItemToDraft} className="mt-4 text-sm text-primary flex items-center gap-1 hover:underline">
                                    <Plus size={16} /> Add Exception Charge
                                </button>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            {selectedBill.status === 'draft' ? (
                                <>
                                    {isEditMode ? (
                                        <button onClick={handleUpdateBillItems} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                                            Save Changes
                                        </button>
                                    ) : (
                                        <button onClick={handleFinalizeBill} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
                                            <CheckCircle size={18} /> Finalize Bill
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                                    <Printer size={18} /> Print Invoice
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
