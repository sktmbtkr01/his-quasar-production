/**
 * ItemMaster Page
 * CRUD operations for inventory items
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, RefreshCcw } from 'lucide-react';
import inventoryManagerService from '../../services/inventoryManager.service';
import './ItemMaster.css';

const ItemMaster = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        fetchCategories();
        fetchItems();
    }, [pagination.page, selectedCategory, searchTerm]);

    const fetchCategories = async () => {
        try {
            const response = await inventoryManagerService.getCategories();
            setCategories(response?.data || response || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                isActive: true
            };
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;

            const response = await inventoryManagerService.getItems(params);
            setItems(response?.data || response || []);
            setPagination(prev => ({ ...prev, total: response?.pagination?.total || 0 }));
            setError(null);
        } catch (err) {
            setError('Failed to load items');
            console.error('Items error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCategoryFilter = (e) => {
        setSelectedCategory(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleDeactivate = async (id, itemName) => {
        if (!window.confirm(`Are you sure you want to deactivate "${itemName}"?`)) return;

        const reason = prompt('Please provide a reason for deactivation:');
        if (!reason) return;

        try {
            await inventoryManagerService.deactivateItem(id, reason);
            fetchItems();
        } catch (err) {
            alert('Failed to deactivate item');
            console.error('Deactivate error:', err);
        }
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="item-master p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button className="text-textSecondary hover:text-primary transition" onClick={() => navigate('/inventory')}>
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-textPrimary">Inventory Master</h1>
                        <p className="text-textSecondary text-sm">Manage non-medicine inventory items</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="bg-surface dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-textSecondary px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-stone-700 transition shadow-sm flex items-center gap-2" onClick={fetchItems}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:brightness-110 transition shadow-sm" onClick={() => navigate('/inventory/items/new')}>
                        + Add New Item
                    </button>
                </div>
            </header>

            {/* External Audit Panel (Top Banner) */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-black dark:to-stone-900 rounded-xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 p-2">
                    <ShieldCheck size={100} />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-indigo-500/20 p-3 rounded-full">
                        <ShieldCheck size={24} className="text-indigo-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">External Compliance Audit</h3>
                        <p className="text-slate-300 text-sm">Audited by <span className="text-white font-medium">ABC Healthcare Audits Pvt. Ltd.</span></p>
                    </div>
                </div>
                <div className="flex gap-8 relative z-10">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Last Audit</p>
                        <div className="flex items-center gap-2 font-mono font-medium">
                            <Calendar size={14} className="text-emerald-400" />
                            12 Dec 2025
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Next Audit</p>
                        <div className="flex items-center gap-2 font-mono font-medium text-amber-300">
                            <Calendar size={14} />
                            12 Jun 2026
                        </div>
                    </div>
                    <div className="hidden md:block border-l border-white/10 pl-6">
                        <div className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 font-medium">
                            Status: Clean
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-surface dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="w-full pl-4 pr-4 py-2 border border-slate-200 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            placeholder="Search by item code or name..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <select
                        className="border border-slate-200 dark:border-stone-600 rounded-lg px-4 py-2 bg-slate-50 dark:bg-stone-800 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={selectedCategory}
                        onChange={handleCategoryFilter}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>
                                {cat.categoryName}
                            </option>
                        ))}
                    </select>
                </div>
                <span className="text-sm font-medium text-textSecondary">
                    {pagination.total} items found
                </span>
            </div>

            {/* Items Table */}
            {loading ? (
                <div className="bg-surface dark:bg-surface-highlight p-12 rounded-xl text-center text-textSecondary">Loading items...</div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl text-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">{error}</div>
            ) : (
                <>
                    <div className="bg-surface dark:bg-surface-highlight rounded-xl shadow-sm border border-slate-100 dark:border-stone-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-textSecondary">
                                <thead className="bg-slate-50 dark:bg-stone-800 text-textSecondary uppercase tracking-wider text-xs border-b border-slate-100 dark:border-stone-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Item Code</th>
                                        <th className="px-6 py-4 font-semibold">Item Name</th>
                                        <th className="px-6 py-4 font-semibold">Category</th>
                                        <th className="px-6 py-4 font-semibold text-center">UOM</th>
                                        <th className="px-6 py-4 font-semibold text-right">Available</th>
                                        <th className="px-6 py-4 font-semibold text-right">Reorder Level</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Last Updated</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-stone-700">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-8 text-center text-textSecondary">
                                                No items found
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-stone-800/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-textPrimary">{item.itemCode}</td>
                                                <td className="px-6 py-4 font-medium text-textPrimary">{item.itemName}</td>
                                                <td className="px-6 py-4">{item.category?.categoryName || '-'}</td>
                                                <td className="px-6 py-4 text-center">{item.uom}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${item.totalQuantity <= item.reorderLevel ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {item.totalQuantity}
                                                </td>
                                                <td className="px-6 py-4 text-right text-textSecondary">{item.reorderLevel}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${item.status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                            item.status === 'LOW_STOCK' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                                                item.status === 'OUT_OF_STOCK' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                                    'bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-400'}`}>
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-textSecondary">
                                                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded"
                                                            onClick={() => navigate(`/inventory/items/${item._id}`)}
                                                            title="View"
                                                        >
                                                            👁
                                                        </button>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-400 rounded"
                                                            onClick={() => navigate(`/inventory/items/${item._id}/edit`)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded"
                                                            onClick={() => handleDeactivate(item._id, item.itemName)}
                                                            title="Deactivate"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-surface dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-4 py-2 border border-slate-200 dark:border-stone-600 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-stone-700 transition text-textPrimary"
                            >
                                Previous
                            </button>
                            <span className="text-textSecondary">
                                Page {pagination.page} of {totalPages}
                            </span>
                            <button
                                disabled={pagination.page === totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-4 py-2 border border-slate-200 dark:border-stone-600 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-stone-700 transition text-textPrimary"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ItemMaster;
