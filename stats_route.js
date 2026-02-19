app.get('/api/banks/stats/:bankId', (req, res) => {
    const { bankId } = req.params;
    
    const qDeposits = 'SELECT SUM(amount) as total FROM bank_deposits WHERE bank_id = ? AND status = "active"';
    const qLoans = 'SELECT SUM(loan_debt) as total FROM bank_accounts WHERE bank_id = ?';

    db.query(qDeposits, [bankId], (err, depRes) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        db.query(qLoans, [bankId], (err, loanRes) => {
            if (err) return res.status(500).json({ success: false, error: err });
            
            res.json({
                success: true,
                totalDeposits: depRes[0].total || 0,
                totalLoans: loanRes[0].total || 0
            });
        });
