const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  submitFeedback,
  getAllFeedback,
  addAdminComment
} = require('../controllers/feedbackController');

router.post('/', auth, upload.single('image'), submitFeedback);
router.get('/', auth, roleCheck('admin'), getAllFeedback);
router.put('/:id/comment', auth, roleCheck('admin'), addAdminComment);

module.exports = router;
