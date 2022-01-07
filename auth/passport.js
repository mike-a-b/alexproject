const passport = require('passport')
const passportJWT = require('passport-jwt')
const LocalStrategy = require('passport-local').Strategy
const db = require('../models')
require('dotenv').config()

// LocalStrategy
passport.use(
    new LocalStrategy(async function (username, password, done) {
        try {
            const user = await db.getUserByName(username)

            if (!user) {
                return done(null, false)
            }

            if (!user.validPassword(password)) {
                return done(null, false)
            }

            return done(null, user)
        } catch (error) {
            done(err)
        }
    })
)

// JWT Strategy
const params = {
    secretOrKey: process.env.SECRET,
    jwtFromRequest: function (req) {
        let token = null

        if (req && req.headers) {
            token = req.headers['authorization'] // req.get('authorization')
        }

        return token
    },
}

passport.use(
    new passportJWT.Strategy(params, async function (payload, done) {
        try {
            const user = await db.getUserById(payload.user.id)

            if (!user) {
                return done(new Error('User not found'))
            }

            return done(null, user)

        } catch (error) {
            done(err)
        }
    })
)