const Feedback = require('../models/Feedback');
const aiReplyGenerator = require('../utils/aiReplyGenerator');

exports.submitFeedback = async (req, res) => {
  try {
    const { text, rating } = req.body;
    const image = req.file ? req.file.filename : null;
    const feedback = await Feedback.create({
      user: req.user.id,
      text,
      rating,
      image
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const query = {};
    if (req.query.rating) query.rating = req.query.rating;

    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAdminComment = async (req, res) => {
  try {
    const comment = req.body.comment || aiReplyGenerator(req.body.text);
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { adminComment: comment },
      { new: true }
    );
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
