const express = require('express');
const router = express.Router();
const Plan = require('../models/PlanSchema'); 
const cookieParser = require('cookie-parser');
router.use(cookieParser());

// Fetch plans for a specific service without a user ID
router.get('/plans/:serviceId', async (req, res) => {
  const { serviceId } = req.params;

  try {
    // Find plans with no associated user (user: null)
    const plans = await Plan.find({ service: serviceId, user: null }).populate('service');

    if (!plans.length) {
      return res.status(404).json({ message: 'No plans found for the given service without a user ID' });
    }

    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error.message);
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});

module.exports = router;
