const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: true,
        },

        pic: {
            type: String,
            default: "https://wallpapers-clan.com/wp-content/uploads/2023/10/jujutsu-kaisen-satoru-gojo-white-desktop-wallpaper-preview.jpg",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    //return await bcrypt.compare(enteredPassword, this.password);
    return enteredPassword == this.password;
};

/*userSchema.pre("save", async function (next) {
    if(!this.isModified) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.pasword = await bcrypt.hash(this.password, salt);
});*/

const User = mongoose.model("User", userSchema);
module.exports = User;