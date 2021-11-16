const express = require('express')
const app = express()
const PORT = 5000
const TransactionRouter = require('./api/routes/transactions')
const BalanceRouter = require('./api/routes/balances');
require('dotenv').config();
require('./database/config').connect() 


app.use(express.json())

app.use('/api', TransactionRouter);
app.use('/api', BalanceRouter);


app.listen(PORT, () => {
    console.log(`Server running on PORT : ${PORT}`);
});