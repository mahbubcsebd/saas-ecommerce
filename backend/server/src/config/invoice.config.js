// Invoice Configuration
module.exports = {
    colors: {
        primary: '#1e3a8a', // Darker Blue (Blue-900) for better readability
        secondary: '#1f2937', // Darker Gray (Gray-800)
        success: '#10b981', // Green
        danger: '#dc2626', // Red-600
        text: '#000000',
        lightText: '#ffffff',
        border: '#cbd5e1', // Slate-300
        background: '#f1f5f9' // Slate-100
    },
    fonts: {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold'
    },
    layout: {
        margin: 50,
        pageSize: 'A4'
    },
    company: {
        defaultName: 'Mahbub Shop',
        defaultAddress: 'Dhaka, Bangladesh',
        defaultTerms: 'Payment is due within 30 days. Please include invoice number with payment.'
    }
};
