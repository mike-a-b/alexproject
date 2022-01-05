const nunjucks = require('nunjucks') ;
const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(express.static(path.join(process.cwd(), 'dist')))
app.use(express.static(path.join(process.cwd(), 'src')))

var PATH_TO_TEMPLATES = './dist/' ;
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

app.get('/', function(req, res) {
    return res.render('index.html') ;
});

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
    console.log(`Server running. Use our API on port: ${PORT}`)
})