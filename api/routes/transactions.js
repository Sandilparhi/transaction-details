const express = require('express');
const router = express.Router();
require('dotenv').config(); 
const Web3 = require('web3')
const Tx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545')

const privateKey = Buffer.from(process.env.privateKey, 'hex');
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const nodemailer = require('nodemailer')

router.post('/transaction', async (req, res, next) => {
   const {sender, receiver, value, email} = req.body;
    try {
        web3.eth.getTransactionCount(sender, (err, txCount) => {
    
            // Build the Transaction
            const txObject = {
                nonce : web3.utils.toHex(txCount),
                to : receiver,
                value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
                gasLimit : web3.utils.toHex(21000),
                gasPrice : web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
            }
        
            const common = Common.default.forCustomChain('mainnet', {
                name: 'bnb',
                networkId: 97,
                chainId: 97
              }, 'petersburg');

            //Sign the Transaction
            const tx = new Tx(txObject, {common})
            tx.sign(privateKey)
        
            const serializedTransaction =tx.serialize()
            const raw ='0x'+serializedTransaction.toString('hex')
        
             //Broadcast the Transaction
            web3.eth.sendSignedTransaction(raw, (err,txHash) => {
                console.log('err:', err)
                console.log('txHash:', txHash)
               
                const transaction = new Transaction({
                    _id : new mongoose.Types.ObjectId,
                    email : req.body.email,
                    sender : req.body.sender,
                    receiver : req.body.receiver,
                    value : req.body.value1,
                    gasLimit : txObject.gasLimit,
                    gasPrice : txObject.gasPrice,
                    Hash : txHash
                })

                const mail = nodemailer.createTransport({
                    service: 'gmail',
                    auth:{
                        user:process.env.USER,
                        pass:process.env.PASSWORD    
                    }
                });
                
                const mailOptions = {
                    from: process.env.USER,
                    to: email,
                    subject: `Your Binance Transaction success!`,
                    html: `<h3>Your Transaction details is :</h3>
                    <p><b>ID :</b> ${transaction._id}</p>
                    <p><b>Email :</b> ${email}</p>
                    <p><b>Sender Address :</b> ${sender}</p>
                    <p><b>Receiver Address :</b> ${receiver}</p>
                    <p><b>Value/Amount :</b> ${value}</p>
                    <p><b>GasLimit :</b> ${transaction.gasLimit}</p>
                    <p><b>GasPrice :</b> ${transaction.gasPrice}</p>
                    <p><b>Hash :</b> ${txHash}</p>`
                   
                };
            
                mail.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    }
                    else{
                        console.log('Email sent: ' + info.response);
                    }
                });

                try {
                    const t1 = transaction.save()
                    
                    res.status(200).json({
                        Message : 'Transaction save and successfully!',
                        transaction,
                    }) 
                } catch (error) {
                    res.status(404).json({
                        Message :'Unable to save transaction :',
                        error
                    })
                }
            })
        })
    } catch (error) {
        res.send(error)
    }
})

module.exports = router;
