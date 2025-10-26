const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel'); 
const generateToken = require('../utils/generateToken'); 
const { sendRegistrationWelcome, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

// @desc    Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
        sendRegistrationWelcome(user.email, user.name); 

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(401); 
        throw new Error('Invalid email or password');
    }
});

// @desc    Send password reset link
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.json({ message: 'If user exists, an email has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Use the frontend port (3000) for the reset link
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`; 
    
    try {
        await sendPasswordResetEmail(user.email, resetURL);
        res.json({ message: 'Password reset link sent to email.' });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500);
        throw new Error('Email could not be sent. Server error.');
    }
});

// @desc    Reset password 
const resetPassword = asyncHandler(async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }, 
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token.');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); 

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
});

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
};