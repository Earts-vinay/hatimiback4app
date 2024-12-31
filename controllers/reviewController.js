const Review = require('../models/reviewModel');

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json({ status: true, message: "Fetched all reviews successfully", reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getReviewById = async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ status: false, message: 'Review not found' });
    }
    res.status(200).json({ status: true, message: 'Fetched Review successfully', review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createReview = async (req, res) => {
  const { property_uid, user_id, ratings, comment } = req.body;
  try {
    const newReview = new Review({ property_uid, user_id, ratings, comment });
    await newReview.save();
    res.status(201).json({ status: true, message: 'Review created successfully', review: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateReview = async (req, res) => {
  const { id } = req.params;
  const { ratings, comment } = req.body;
  try {
    const updatedReview = await Review.findByIdAndUpdate(id, { ratings, comment }, { new: true });
    if (!updatedReview) {
      return res.status(404).json({ status: false, message: 'Review not found' });
    }
    res.status(200).json({ status: true, message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedReview = await Review.findByIdAndDelete(id);
    if (!deletedReview) {
      return res.status(404).json({ status: false, message: 'Review not found' });
    }
    res.status(204).json({ status: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
