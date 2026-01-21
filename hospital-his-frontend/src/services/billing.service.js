import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/billing';

const getConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return { headers: { Authorization: `Bearer ${user?.token}` } };
};

const generateBill = async (billData) => {
    const response = await axios.post(`${API_URL}/generate`, billData, getConfig());
    return response.data;
};

const getAllBills = async (params) => {
    // Pass params properly
    const config = getConfig();
    config.params = params;
    const response = await axios.get(`${API_URL}/bills`, config); // Fixed endpoint
    return response.data;
};

const getBillById = async (id) => {
    const response = await axios.get(`${API_URL}/bills/${id}`, getConfig()); // Fixed endpoint (added /bills/ if needed, but router says /bills/:id)
    return response.data;
};

const updateBill = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/bills/${id}`, updateData, getConfig()); // Fixed endpoint
    return response.data;
};

const getPatientBills = async (patientId) => {
    const response = await axios.get(`${API_URL}/patient/${patientId}`, getConfig());
    return response.data;
};

const getPendingBills = async () => {
    const response = await axios.get(`${API_URL}/pending`, getConfig());
    return response.data;
};

const getDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/dashboard`, getConfig());
    return response.data;
};

const cancelBill = async (id, reason) => {
    const response = await axios.post(`${API_URL}/bills/${id}/cancel`, { reason }, getConfig()); // Fixed endpoint
    return response.data;
};

const billingService = {
    generateBill,
    getAllBills,
    getBillById,
    updateBill,
    getPatientBills,
    getPendingBills,
    getDashboardStats,
    cancelBill
};

export default billingService;
