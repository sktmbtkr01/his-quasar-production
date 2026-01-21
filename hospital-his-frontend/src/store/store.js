import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import patientsReducer from '../features/patients/patientsSlice';
import opdReducer from '../features/opd/opdSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        analytics: analyticsReducer,
        patients: patientsReducer,
        opd: opdReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
});
