const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/reply', aiController.getAIReply);

module.exports = router;
