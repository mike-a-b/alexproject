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
const Joi = require('joi')
const nodemailer = require('nodemailer')
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
let globValidateMsg = "";
let user;

app.set("views", path.join(__dirname, "src"))
app.set("view engine", "html")
app.use(cookieParser('keyboard cat'))
app.use(
    session({
        secret: 'keyboard cat',
        key: 'sessionkey',
        cookie: {
            path: '/',
            httpOnly: true,
            maxAge: 10 * 60 * 1000
        },
        saveUninitialized: true,
        resave: false
    })
)
app.use(flash())
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



app.use((err, _, res, __) => {
    console.log(err.stack)
    res.status(500).json({
        code: 500,
        message: err.message,
    })
})
//middleware for auth tokens
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
/****************        ROUTES START          ********************* */
app.get('/main', auth, function (req,res, next) {
    return res.render('i', {title: 'Главная - '})
})

app.get('/login', function (req,res, next) {
    if(req.flash('msglogin')[0])
    {
        user = {
            username: req.flash('login')[0],
            password: req.flash('password')[0],
        }

        return res.render('auth-login', {title:'Вход на сайт',
            msglogin:req.flash('msglogin')[0], user, globValidateMsg});
    }
    else {
        return res.render('auth-login', {title:'Вход на сайт',
            globValidateMsg});
    }

})

app.post('/login', async (req, res, next) => {
    passport.authenticate(
        'local',
        { session: false },
        async (err, usr, info) => {
            if (err) {
                return next(err)
            }

            if (!usr) {
                globValidateMsg = 'Не верный логин/пароль';
                user = {
                    username: "",
                    password: "",
                }
                // return res.status(400).json({ message: 'Не верный логин/пароль'})
                return res.redirect('/login');
            }

            if (user) {
                console.log(user)
                const token = await tokens.createTokens(usr)
                console.log(token)
                if(req.body.savelogin)
                {
                    user = {
                        username: req.body.username,
                        password: req.body.password,
                        savelogin: true,
                    }
                } else{
                    user = {
                        username: req.body.username,
                        password: req.body.password,
                        savelogin: false,
                    }
                }
                
                res.redirect('/main');
                // res.json({
                //     ...helper.serializeUser(user),
                //     ...token,
                // })
            }
        },
    )(req, res, next)
})

app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.headers['authorization']

    const data = await tokens.refreshTokens(refreshToken)
    res.json({ ...data })
})

app.get('/registration', function (req, res, next) {
    console.log(globValidateMsg);
    res.render('auth-register', {title:'попробуйте еще раз!',
            globValidateMsg, user, message:req.flash('msgregistration')[0]}
        );

})

app.post('/registration', async (req, res) => {
    let { username, email, password, password2 } = req.body;
    
    globValidateMsg = "";
    user = {
        username: username,
        password: password,
        password2: password2,
        email: email,
    }
    
    try {
        let resultValidateUser = await validateUser(req.body);
        const newUser = await db.createUser(req.body);

        req.flash('msglogin', 'Пользователь успешно создан!')
        req.flash('login', user.username);
        req.flash('password', user.password);
        res.redirect('/login');
    }
    catch (e)
    {
        // console.log('самая последняя ошибка в теле app.get catch(E) => ' + e.message);
        // req.flash('msgregistration', e.message);
        if(globValidateMsg === "") globValidateMsg = e.message;
        res.redirect('/registration')
    }
})

app.get('/testAuth', auth, async (req, res) => {
    const user = req.user;

    res.json({
        ...helper.serializeUser(user),
    })
})

app.get('/', function (req, res, next) {
    res.redirect('/registration');
})

/************* VALIDATION INPUT DATA ************************/

const JoiSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).max(50).required(),

    password2: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).max(50).required(),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'ru'] } })
})

let validateUser = async ({ username, email, password, password2 }) => new Promise(async (resolve, reject) => {

        const { error } = JoiSchema.validate({username : username, email: email, password: password, password2: password2})
        if(error) {
            console.log(error)
            globValidateMsg = 'Введены некорректные данные '+ error.message;
            reject('Введены некорректные данные '+ error.message );
        }
        
    try {
        if(password !== password2) throw new Error('Пароли не совпадают');
        let emailInBase = await db.getUserByEmail(email);
        if(emailInBase) throw new Error('Такой email уже существует');
        let user = await db.getUserByName(username);
        if (user) throw new Error('Пользователь уже существует!');
        resolve("Пользователь успешно создан");
    }
    catch (err){
        globValidateMsg = "Пользователь или пароль уже существуют";
        reject(globValidateMsg);
    }

}).then(function(result) {
    globValidateMsg = result;
}).catch(function (err){
    if(globValidateMsg == "") globValidateMsg = err.message;
})

app.get('/forgotpassword', function (req, res, next) {
    console.log(globValidateMsg);
    res.render('auth-forgot-password', {title:'попробуйте еще раз!',
        globValidateMsg, user, message:req.flash('msgregistration')[0]}
    );

})
module.exports = app;