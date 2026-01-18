import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeePayroll from './payroll/EmployeePayroll';
import RHPayrollDashboard from './payroll/RHPayrollDashboard';
import { Box, Typography } from '@mui/material';

const PayrollPage = () => {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === 'rh' || user.role === 'directeur') {
        return <RHPayrollDashboard />;
    } else {
        return <EmployeePayroll />;
    }
};

export default PayrollPage;
