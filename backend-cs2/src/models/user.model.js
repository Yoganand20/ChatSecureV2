import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
    {
        // email: {
        //     type: String,
        //     required: true,
        //     unique: true,
        // },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: /^[a-zA-Z0-9_]+$/,
        },

        password: {
            type: String,
            required: true,
            minLength: 6,
        },

        profilePic: {
            type: String,
            default: "",
        },
        publicKey: { type: String },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(
            parseInt(process.env.BCRYPT_ROUNDS) || 12
        );
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
