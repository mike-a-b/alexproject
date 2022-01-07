const express = require('express')
const router = express.Router()
const db = require('../models')
const helper = require('../helper/serialize')
const passport = require('passport')
const tokens = require('../auth/tokens')

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
// router.get('/', async (req, res) =>
// {
//     res.render('auth-register');
// })

router.post('/registration', async (req, res) => {
    const { username } = req.body

    const user = await db.getUserByName(username)

    if (user) {
        return res.status(409).json({ message: 'Пользователь с таким ником уже существует!'})
    }

    try {
        const newUser = await db.createUser(req.body)

        res.status(201).json({
            ...helper.serializeUser(newUser),
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: e.message })
    }
})

router.post('/login', async (req, res, next) => {
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
                res.json({
                    ...helper.serializeUser(user),
                    ...token,
                })
            }
        },
    )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.headers['authorization']

    const data = await tokens.refreshTokens(refreshToken)
    res.json({ ...data })
})


router.get('/profile', auth, async (req, res) => {
    const user = req.user

    res.json({
        ...helper.serializeUser(user),
    })
})

module.exports = router