import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getClinicalStats } from '../../features/analytics/analyticsSlice';
import {
    Users, Calendar, Clock, Activity, TrendingUp, RefreshCw,
    AlertTriangle, FileText, Stethoscope, ChevronRight, Bell,
    BedDouble, ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';
const POLLING_INTERVAL = 60000; // 1 minute

// Animated CountUp
const CountUp = ({ value, duration = 800 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        let startValue = count;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            setCount(Math.floor(startValue + (value - startValue) * easeOut));
            if (progress < duration) requestAnimationFrame(animate);
            else setCount(value);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span>{count}</span>;
};

// Enhanced StatCard with click-through behavior
const StatCard = ({ title, value, subtext, icon: Icon, color, onClick, isLoading, delay = 0, highlight }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -4, boxShadow: "0 12px 30px -8px rgba(0, 0, 0, 0.15)" }}
        onClick={onClick}
        className={`bg-white p-6 rounded-2xl border shadow-sm transition-all relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''} ${highlight ? 'border-amber-200 ring-2 ring-amber-100' : 'border-gray-100'}`}
    >
        {highlight && (
            <div className="absolute top-3 right-3">
                <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
            </div>
        )}
        <div className={`absolute top-0 right-0 w-28 h-28 ${color} bg-opacity-5 rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500`} />

        <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-gray-500 text-xs font-semibold tracking-wider uppercase mb-2">{title}</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {isLoading ? <div className="h-9 w-16 bg-gray-100 animate-pulse rounded"></div> : <CountUp value={value} />}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon size={22} className={color.replace('bg-', 'text-')} />
                </div>
            </div>
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{subtext}</span>
                {onClick && <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />}
            </div>
        </div>
    </motion.div>
);

// Priority Badge
const PriorityBadge = ({ priority }) => {
    const styles = {
        critical: 'bg-red-100 text-red-700 border-red-200',
        important: 'bg-amber-100 text-amber-700 border-amber-200',
        normal: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    const labels = {
        critical: 'Critical',
        important: 'Important',
        normal: 'Normal'
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[priority]}`}>
            {labels[priority]}
        </span>
    );
};

// Needs Attention Item
const AttentionItem = ({ item, onClick }) => {
    const icons = {
        critical_lab: <AlertTriangle size={16} className="text-red-500" />,
        abnormal_lab: <FileText size={16} className="text-amber-500" />,
        waiting_patient: <Users size={16} className="text-blue-500" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onClick}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md cursor-pointer transition-all group"
        >
            <div className={`p-2 rounded-lg ${item.priority === 'critical' ? 'bg-red-50' : item.priority === 'important' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                {icons[item.type]}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-800 truncate">{item.title}</span>
                    <PriorityBadge priority={item.priority} />
                </div>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
                {item.time && <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</p>}
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 mt-1 transition-colors" />
        </motion.div>
    );
};

const ClinicalDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { data: stats, isLoading, isError, message } = useSelector((state) => state.analytics);
    const { user } = useSelector((state) => state.auth);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Greeting
    const greeting = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, [currentTime]);

    // Fetch data
    const fetchStats = useCallback(() => {
        setIsRefreshing(true);
        dispatch(getClinicalStats())
            .finally(() => {
                setIsRefreshing(false);
                setLastRefresh(new Date());
            });
    }, [dispatch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Polling
    useEffect(() => {
        const interval = setInterval(fetchStats, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Socket for real-time updates
    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('lab-completed', () => fetchStats());
        socket.on('appointment-updated', () => fetchStats());

        return () => socket.disconnect();
    }, [fetchStats]);

    // Custom Chart Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl text-xs">
                    <p className="font-bold mb-1">{data.name}</p>
                    <p>{data.patients} patient{data.patients !== 1 ? 's' : ''} scheduled</p>
                    {data.isCurrentHour && <p className="text-blue-300 mt-1">← Current hour</p>}
                </div>
            );
        }
        return null;
    };

    if (isError) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-2xl border border-red-100 m-8">
                <AlertTriangle size={40} className="text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Failed to load dashboard</h3>
                <p className="text-red-600 mb-6">{message}</p>
                <button onClick={fetchStats} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                    Retry
                </button>
            </div>
        );
    }

    if (isLoading && !stats) {
        return (
            <div className="p-8 max-w-7xl mx-auto animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 h-96 bg-gray-100 rounded-2xl"></div>
                    <div className="h-96 bg-gray-100 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const trafficData = stats?.trafficData || [];
    const needsAttention = stats?.needsAttention || [];
    const currentHourIndex = trafficData.findIndex(d => d.isCurrentHour);

    return (
        <div className="min-h-screen pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
                        <span>{format(currentTime, 'EEEE, d MMMM yyyy')}</span>
                        <span>•</span>
                        <Clock size={14} />
                        <span>{format(currentTime, 'h:mm a')}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        {greeting}, <span className="text-blue-600">Dr. {user?.name?.split(' ')[0] || 'Doctor'}</span> 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Here's what needs your attention today.</p>
                </div>

                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <div className="hidden md:block text-right mr-2">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Last Updated</p>
                            <p className="text-xs font-medium text-gray-600">{format(lastRefresh, 'h:mm:ss a')}</p>
                        </div>
                    )}
                    <button
                        onClick={fetchStats}
                        disabled={isRefreshing}
                        className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    delay={0}
                    title="My Appointments"
                    value={stats?.appointments?.total || 0}
                    subtext={`${stats?.appointments?.checkedIn || 0} waiting`}
                    icon={Calendar}
                    color="bg-blue-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/opd')}
                />
                <StatCard
                    delay={0.1}
                    title="Admitted Patients"
                    value={stats?.admittedPatients || 0}
                    subtext="In your care"
                    icon={BedDouble}
                    color="bg-purple-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/ipd')}
                />
                <StatCard
                    delay={0.2}
                    title="Lab Reports"
                    value={stats?.pendingLabReports || 0}
                    subtext={stats?.recentLabUploads > 0 ? `${stats.recentLabUploads} new in last 2 hrs` : "Pending review"}
                    icon={FileText}
                    color="bg-orange-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/dashboard/lab')}
                    highlight={stats?.recentLabUploads > 0}
                />
                <StatCard
                    delay={0.3}
                    title="Critical Alerts"
                    value={stats?.criticalAlerts || 0}
                    subtext="Require immediate attention"
                    icon={AlertTriangle}
                    color="bg-red-500"
                    isLoading={isRefreshing}
                    highlight={stats?.criticalAlerts > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Needs Attention Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1 order-2 lg:order-1"
                >
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Needs Attention</h3>
                                <p className="text-xs text-gray-500">Sorted by urgency</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Bell size={12} />
                                <span>{needsAttention.length} items</span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            <AnimatePresence>
                                {needsAttention.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl"
                                    >
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Activity size={20} className="text-emerald-500" />
                                        </div>
                                        <p className="text-slate-600 font-medium text-sm">You're all caught up! ✨</p>
                                        <p className="text-slate-400 text-xs mt-1">No pending items require your attention.</p>
                                    </motion.div>
                                ) : (
                                    needsAttention.map((item, idx) => (
                                        <AttentionItem
                                            key={item.id}
                                            item={item}
                                            onClick={() => navigate(item.actionUrl)}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* OPD Traffic Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 order-1 lg:order-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/50"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">My OPD Schedule</h3>
                            <p className="text-sm text-gray-500">Today's patient load by hour</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Scheduled
                            </div>
                        </div>
                    </div>

                    <div className="h-[320px] w-full">
                        {trafficData.length > 0 && trafficData.some(d => d.patients > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trafficData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                                    {currentHourIndex >= 0 && (
                                        <ReferenceLine
                                            x={trafficData[currentHourIndex]?.name}
                                            stroke="#3B82F6"
                                            strokeDasharray="4 4"
                                            strokeWidth={2}
                                        />
                                    )}
                                    <Bar dataKey="patients" radius={[6, 6, 6, 6]} barSize={20} animationDuration={1200}>
                                        {trafficData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.isCurrentHour ? '#3B82F6' : '#CBD5E1'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <Calendar size={48} className="mb-4 opacity-30" />
                                <p className="text-slate-500 font-medium">No OPD activity yet today</p>
                                <p className="text-slate-400 text-sm mt-1">You're all caught up! 🎉</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Lists Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Upcoming Appointments */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800">Upcoming Appointments</h4>
                        <button onClick={() => navigate('/opd')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View all <ExternalLink size={12} />
                        </button>
                    </div>

                    {stats?.upcomingAppointments?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.upcomingAppointments.map(appt => (
                                <div
                                    key={appt.id}
                                    onClick={() => navigate(`/opd/${appt.id}`)}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-sm text-slate-700">{appt.patientName}</p>
                                        <p className="text-xs text-slate-500">{appt.patientId} • {appt.complaint || 'General'}</p>
                                    </div>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        {appt.time || 'Scheduled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No upcoming appointments</p>
                    )}
                </motion.div>

                {/* My Admissions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800">My Admitted Patients</h4>
                        <button onClick={() => navigate('/ipd')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View all <ExternalLink size={12} />
                        </button>
                    </div>

                    {stats?.admissions?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.admissions.map(adm => (
                                <div
                                    key={adm.id}
                                    onClick={() => navigate(`/ipd/${adm.id}`)}
                                    className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-sm text-slate-700">{adm.patientName}</p>
                                        <p className="text-xs text-slate-500">{adm.patientId}</p>
                                    </div>
                                    <BedDouble size={16} className="text-purple-400" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No admitted patients</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ClinicalDashboard;
