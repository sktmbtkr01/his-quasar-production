import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Building, Clock, MapPin, AlertTriangle, ChevronRight, User } from 'lucide-react';
import incidentService from '../../services/incident.service';
import toast from 'react-hot-toast';

const DepartmentIncidents = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDepartmentIncidents();
    }, []);

    const fetchDepartmentIncidents = async () => {
        setLoading(true);
        try {
            const response = await incidentService.getDepartmentIncidents();
            setIncidents(response.data || []);
        } catch (error) {
            console.error('Error fetching incidents:', error);
            toast.error('Failed to load department incidents');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-amber-50 text-amber-600 border-amber-200',
            in_review: 'bg-blue-50 text-blue-600 border-blue-200',
            closed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        };
        return styles[status] || 'bg-slate-50 text-slate-600 border-slate-200';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getReporterName = (reporter) => {
        if (!reporter?.profile) return 'Unknown';
        return `${reporter.profile.firstName} ${reporter.profile.lastName}`;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Building size={22} />
                    </div>
                    Department Incidents
                </h1>
                <p className="text-slate-500 mt-2">
                    View all incident reports from your department
                    {user?.department?.name && <span className="font-medium text-slate-700"> ({user.department.name})</span>}
                </p>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading incidents...</p>
                </div>
            ) : !user?.department ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Building size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No department assigned</h3>
                    <p className="text-slate-500">You are not assigned to any department</p>
                </div>
            ) : incidents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Building size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No incidents</h3>
                    <p className="text-slate-500">No incident reports found for your department</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reporter</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Harm?</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {incidents.map(incident => (
                                <tr
                                    key={incident._id}
                                    onClick={() => navigate(`/dashboard/incidents/${incident._id}`)}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock size={14} className="text-slate-400" />
                                            {formatDate(incident.occurredAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <User size={14} className="text-slate-400" />
                                            {getReporterName(incident.reporterId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            {incident.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 max-w-xs truncate">
                                            {incident.whatHappened}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(incident.status)}`}>
                                            {incident.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {incident.wasHarm ? (
                                            <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold">
                                                <AlertTriangle size={12} /> Yes
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    );
};

export default DepartmentIncidents;
