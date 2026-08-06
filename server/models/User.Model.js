import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
    type: String,
    required: function () {
      return this.provider === 'email'; // Required only for email signups
    },
  },
    phoneNumber: {
        type: String,
    },
    profilePicture: {
        type: String,
        required: false
    },
    virtualBalance: {
        type: Number,
        default: 100000
    },
    provider: {
        type: String,
        enum: ['google',  'email'],
        default: 'email'
    },
},
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;