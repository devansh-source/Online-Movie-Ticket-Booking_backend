const express = require('express');
const { 
    registerUser, 
    loginUser, 
    forgotPassword, // <-- NEW IMPORT
    resetPassword   // <-- NEW IMPORT
} = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// --- NEW PASSWORD RESET ROUTES ---
router.post('/forgotpassword', forgotPassword); 
router.put('/resetpassword/:token', resetPassword);
// ---------------------------------

module.exports = router;