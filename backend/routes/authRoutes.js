const express = require('express');
const router = express.Router();
const { login, logout, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);

module.exports = router;
