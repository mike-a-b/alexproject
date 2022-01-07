const nunjucks = require('nunjucks')
const express = require('express')
const path = require('path')
const app = express()
// const http = require('http')
// const server = http.createServer(app)
const router = express.Router()
const db = require('./models')
const helper = require('./helper/serialize')
const passport = require('passport')
const tokens = require('./auth/tokens')

app.set("views", path.join(__dirname, "src"))
app.set("view engine", "html")
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(express.static(path.join(process.cwd(), 'dist')))
app.use(express.static(path.join(process.cwd(), 'src')))

require('./models/connection')
require('./auth/passport')

const PATH_TO_TEMPLATES = './src/';
nunjucks.configure(PATH_TO_TEMPLATES, {
    autoescape: true,
    express: app
});

//
// app.get('/registration', function(req, res) {
//     console.log("get /registration")
//     return res.render('auth-register') ;
// });

app.get('/r', function (req, res, next) {
    return res.render('auth-register');
})


app.use((err, _, res, __) => {
    console.log(err.stack)
    res.status(500).json({
        code: 500,
        message: err.message,
    })
})



// const auth = (req, res, next) => {
//     passport.authenticate('jwt', { session: false }, (err, user) => {
//         if (!user || err) {
//             return res.status(401).json({
//                 code: 401,
//                 message: 'Unauthorized',
//             })
//         }
//         req.user = user
//         next()
//     })(req, res, next)
// }

// router.post('/registration', async (req, res) => {
//     res.send("test")
    // const { username } = req.body
    //
    // const user = await db.getUserByName(username)
    //
    // if (user) {
    //     return res.status(409).json({ message: 'Пользователь с таким ником уже существует!'})
    // }
    //
    // try {
    //     const newUser = await db.createUser(req.body)
    //
    //     res.status(201).json({
    //         ...helper.serializeUser(newUser),
    //     })
    // } catch (e) {
    //     console.log(e)
    //     res.status(500).json({ message: e.message })
    // }
// })

module.exports = app;