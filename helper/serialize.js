module.exports.serializeUser = (user) => {
    return {
        firstName: user.firstName,
        id: user._id,
        image: user.image,
        middleName: user.middleName,
        permission: user.permission,
        surName: user.surName,
        username: user.userName,
    }
}