const User = require('./schemas/user')

module.exports.getUserByName = async (userName) => {
    return User.findOne({ userName })
}

module.exports.getUserById = async (id) => {
    return User.findById({ _id: id })
}

module.exports.getUserByEmail = async (email) => {
    return User.findOne({ email })
}


module.exports.createUser = async (data) => {
    const { email, username, password } = data
    const newUser = new User({
        userName: username,
        email: email,
        password: password,
        permission: {
            settings: { C: true, R: true, U: true, D: true },
        },
    })
    newUser.setPassword(password)

    const user = await newUser.save()

    return user
}