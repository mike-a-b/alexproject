const mongoose = require('mongoose')
require('dotenv').config()
let uri = process.env.uriDB

mongoose.Promise = global.Promise

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

mongoose.connection.on('connected', () => {
    console.log(`Mongoose connection open`)
})

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ' + err)
})

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected')
})

process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose connection disconnected app termination')
        process.exit(1)
    })
})