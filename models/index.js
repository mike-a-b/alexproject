const User = require('./schemas/user')

module.exports.getUserByName = async (userName) => {
    return User.findOne({ userName })
}

module.exports.getUserById = async (id) => {
    return User.findById({ _id: id })
}

module.exports.createUser = async (data) => {
    const { username, surName, firstName, middleName, password } = data
    const newUser = new User({
        userName: username,
        surName,
        firstName,
        middleName,
        image: '',
        permission: {
            chat: { C: true, R: true, U: true, D: true },
            news: { C: true, R: true, U: true, D: true },
            settings: { C: true, R: true, U: true, D: true },
        },
    })
    newUser.setPassword(password)

    const user = await newUser.save()

    return user
}