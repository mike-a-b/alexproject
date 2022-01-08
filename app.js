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

app.get('/registration', function (req, res, next) {

    return res.render('auth-register');
})

app.use((err, _, res, __) => {
    console.log(err.stack)
    res.status(500).json({
        code: 500,
        message: err.message,
    })
})

const auth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (!user || err) {
            return res.status(401).json({
                code: 401,
                message: 'Unauthorized',
            })
        }
        req.user = user
        next()
    })(req, res, next)
}

app.get('/login', function (req,res, next) {
    return res.render('auth-login');
})

app.post('/login', async (req, res, next) => {
    passport.authenticate(
        'local',
        { session: false },
        async (err, user, info) => {
            if (err) {
                return next(err)
            }

            if (!user) {
                return res.status(400).json({ message: 'Не верный логин/пароль'})
            }

            if (user) {
                console.log(user)
                const token = await tokens.createTokens(user)
                console.log(token)
                // res.render('i');
                res.json({
                    ...helper.serializeUser(user),
                    ...token,
                })
            }
        },
    )(req, res, next)
})

app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.headers['authorization']

    const data = await tokens.refreshTokens(refreshToken)
    res.json({ ...data })
})

app.post('/registration', async (req, res) => {

    const { username } = req.body;
    console.log(username);
    const user = await db.getUserByName(username)

    if (user) {
        return res.status(409).json({ message: 'Пользователь с таким ником уже существует!'})
    }

    try {
        console.log(req.body)
        const newUser = await db.createUser(req.body)

        res.status(201).json({
            ...helper.serializeUser(newUser),
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: e.message })
    }
})

app.get('/testAuth', auth, async (req, res) => {
    const user = req.user;

    res.json({
        ...helper.serializeUser(user),
    })

})

module.exports = app;