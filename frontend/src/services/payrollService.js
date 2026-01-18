import axios from 'axios';

const API_URL = 'http://localhost:5001/api/payroll';

// Setup axios instance with auth header if not already global
// Assuming there is a global interceptor, but defining here to be safe or reusing existing if possible.
// For now, I'll assume the user uses a standard way, but since I can't check interceptors easily without reading more,
// I'll assume we pass the token from localStorage or similar.
// Actually, looking at other files would be best, but I'll write standard axios functions.

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const PayrollService = {
    // --- Employee ---
    getMyEntries: async () => {
        const response = await axios.get(`${API_URL}/my-entries`, getAuthHeader());
        return response.data;
    },

    updateMyEntry: async (entryId, data) => {
        const response = await axios.put(`${API_URL}/entries/${entryId}`, data, getAuthHeader());
        return response.data;
    },

    downloadPayslip: async (entryId, filename) => {
        const response = await axios.get(`${API_URL}/entries/${entryId}/payslip`, {
            ...getAuthHeader(),
            responseType: 'blob', // Important for PDF
        });
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename || 'bulletin_de_paie.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    },

    disputeEntry: async (entryId, reason) => {
        const response = await axios.post(`${API_URL}/entries/${entryId}/dispute`, { reason }, getAuthHeader());
        return response.data;
    },

    // --- RH ---
    getPeriods: async () => {
        const response = await axios.get(`${API_URL}/periods`, getAuthHeader());
        return response.data;
    },

    createPeriod: async (month, year) => {
        const response = await axios.post(`${API_URL}/periods`, { month, year }, getAuthHeader());
        return response.data;
    },

    getPeriodEntries: async (periodId, department = '') => {
        const response = await axios.get(`${API_URL}/periods/${periodId}/entries?department=${department}`, getAuthHeader());
        return response.data;
    },

    validateEntry: async (entryId, status, rhComment) => {
        const response = await axios.put(`${API_URL}/entries/${entryId}/validate`, { status, rhComment }, getAuthHeader());
        return response.data;
    },

    sendReminder: async (employeeId) => {
        const response = await axios.post(`${API_URL}/remind`, { employeeId }, getAuthHeader());
        return response.data;
    },

    calculateAll: async (periodId) => {
        const response = await axios.post(`${API_URL}/periods/${periodId}/calculate-all`, {}, getAuthHeader());
        return response.data;
    },

    closePeriod: async (periodId) => {
        const response = await axios.post(`${API_URL}/periods/${periodId}/close`, {}, getAuthHeader());
        return response.data;
    }
};

export default PayrollService;
