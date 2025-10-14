const express = require('express');
const router = express.Router();
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');
const Plan = require('../models/PlanSchema');
const Service = require('../models/Services');
const cookieParser = require('cookie-parser');
router.use(cookieParser());



router.post('/services', isAdmin, async (req, res) => {
    const { serviceName } = req.body;
  
    if (!serviceName) {
      return res.status(400).json({ message: 'Service name is required' });
    }
  
    try {
      const newService = new Service({ serviceName });
      await newService.save();
      res.status(201).json({ message: 'Service added successfully', service: newService });
    } catch (error) {
      res.status(500).json({ message: 'Error adding service', error: error.message });
    }
  });


  router.get('/services', isAdmin, async (req, res) => {
    try {
      const services = await Service.find();
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching services', error: error.message });
    }
  });


  
router.post('/plans', isAdmin, async (req, res) => {
  const { serviceId, name, pricePerMinute, range, isLast, scheduleTime } = req.body;

  console.log(`Received date and time: ${scheduleTime}`);

  if (!serviceId || !name || !pricePerMinute || !range || range.start == null) {
    return res.status(400).json({ message: 'All fields (serviceId, name, pricePerMinute, range.start) are required' });
  }

  if (!isLast && range.end == null) {
    return res.status(400).json({ message: 'range.end is required if isLast is false' });
  }

  if (!isLast && range.start >= range.end) {
    return res.status(400).json({ message: 'Invalid range: start must be less than end' });
  }

  if (isLast && range.end != null) {
    return res.status(400).json({ message: 'range.end must not be provided if isLast is true' });
  }

  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }


    const scheduleDate = new Date(scheduleTime);
    const currentTime = new Date();

    if (scheduleDate <= currentTime) {
      return res.status(400).json({ message: 'Schedule time must be in the future' });
    }

    const delay = scheduleDate - currentTime;
    res.status(200).json({ message: 'Plan scheduled successfully' });

    setTimeout(async () => {
      const newPlan = new Plan({
        service: service._id,
        name,
        pricePerMinute,
        range: { start: range.start, end: isLast ? null : range.end },
        isLast,
      });

      await newPlan.save();
      console.log(`Plan added successfully at scheduled time: ${scheduleTime}`);
    }, delay);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling plan', error: error.message });
  }
});


router.put('/eplans/:id', isAdmin, async (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const { serviceId, name, pricePerMinute, range, isLast, scheduleTime } = req.body;

  console.log(`Received date and time for update: ${scheduleTime}`);

  if (!serviceId || !name || !pricePerMinute || !range || range.start == null) {
    return res.status(400).json({ message: 'All fields (serviceId, name, pricePerMinute, range.start) are required' });
  }

  if (!isLast && range.end == null) {
    return res.status(400).json({ message: 'range.end is required if isLast is false' });
  }

  if (!isLast && range.start >= range.end) {
    return res.status(400).json({ message: 'Invalid range: start must be less than end' });
  }

  if (isLast && range.end != null) {
    return res.status(400).json({ message: 'range.end must not be provided if isLast is true' });
  }

  try {
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const scheduleDate = new Date(scheduleTime);
    const currentTime = new Date();

    if (scheduleDate <= currentTime) {
      return res.status(400).json({ message: 'Schedule time must be in the future' });
    }

    const delay = scheduleDate - currentTime;

    res.status(200).json({ message: 'Plan update is scheduled', scheduleTime });

    setTimeout(async () => {
      const freshPlan = await Plan.findById(id); // Fetch a fresh document instance
      if (!freshPlan) {
        console.error(`Plan with id ${id} not found for scheduled update.`);
        return;
      }

      freshPlan.service = serviceId;
      freshPlan.name = name;
      freshPlan.pricePerMinute = pricePerMinute;
      freshPlan.range = { start: range.start, end: isLast ? null : range.end };
      freshPlan.isLast = isLast;

      await freshPlan.save(); // Save the fresh instance
      console.log(`Plan updated successfully at scheduled time: ${scheduleTime}`);
    }, delay);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling plan update', error: error.message });
  }
});



router.get('/plans/:serviceId', isAdmin, async (req, res) => {
  const { serviceId } = req.params;

  try {
    // Find plans that do not have a user ID associated (user: null)
    const plans = await Plan.find({ service: serviceId, user: null }).populate('service');
    if (!plans.length) {
      return res.status(404).json({ message: 'No plans found for the given service without a user ID' });
    }

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});



router.get('/user-plans/:serviceId', isAdmin, async (req, res) => {
  const { serviceId } = req.params;
  const { userId } = req.query; // Required query parameter to fetch user-specific plans

  if (!userId) {
    return res.status(400).json({ message: 'userId is required to fetch user-specific plans' });
  }

  try {
    // Fetch user-specific plans
    const plans = await Plan.find({ service: serviceId, user: userId }).populate('service');

    if (!plans.length) {
      return res.status(404).json({ message: 'No user-specific plans found for the given service and user' });
    }

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user-specific plans', error: error.message });
  }
});



router.delete('/plans/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { scheduleTime } = req.body;

  try {
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    

    const scheduleDate = new Date(scheduleTime);
    const currentTime = new Date();

    if (scheduleDate <= currentTime) {
      return res.status(400).json({ message: 'Schedule time must be in the future' });
    }

    const delay = scheduleDate - currentTime;

    res.status(200).json({ message: 'Plan deletion is scheduled', scheduleTime });

    setTimeout(async () => {
      try {
        const deletedPlan = await Plan.findByIdAndDelete(id);
        if (!deletedPlan) {
          console.error(`Plan with id ${id} not found for scheduled deletion.`);
          return;
        }

        console.log(`Plan deleted successfully at scheduled time: ${scheduleTime}`);
      } catch (error) {
        console.error(`Error deleting plan at scheduled time: ${error.message}`);
      }
    }, delay);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling plan deletion', error: error.message });
  }
});



router.patch('/update-access/:userId', isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { isAccess } = req.body;

  if (typeof isAccess !== 'boolean') {
    return res.status(400).json({ message: 'Invalid request: isAccess must be a boolean' });
  }

  try {
    // Update the isAccess field for the specified user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isAccess: isAccess } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User access updated successfully',
      user: {
        email: updatedUser.email,
        isAccess: updatedUser.isAccess
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/user-specific-plans', isAdmin, async (req, res) => {
  const { userId, serviceId, name, pricePerMinute, range, isLast, scheduleTime } = req.body;

  if (!userId || !serviceId || !name || !pricePerMinute || !range || range.start == null) {
    return res.status(400).json({ message: 'All fields (userId, serviceId, name, pricePerMinute, range.start) are required' });
  }

  if (!isLast && range.end == null) {
    return res.status(400).json({ message: 'range.end is required if isLast is false' });
  }

  if (!isLast && range.start >= range.end) {
    return res.status(400).json({ message: 'Invalid range: start must be less than end' });
  }

  if (isLast && range.end != null) {
    return res.status(400).json({ message: 'range.end must not be provided if isLast is true' });
  }

  try {
    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate service existence
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Schedule validation
    const scheduleDate = new Date(scheduleTime);
    const currentTime = new Date();

    if (scheduleDate <= currentTime) {
      return res.status(400).json({ message: 'Schedule time must be in the future' });
    }

    const delay = scheduleDate - currentTime;

    res.status(200).json({ message: 'User-specific plan is scheduled', scheduleTime });

    setTimeout(async () => {
      // Create the plan and associate it with the user and service
      const newPlan = new Plan({
        user: userId,
        service: serviceId,
        name,
        pricePerMinute,
        range: { start: range.start, end: isLast ? null : range.end },
        isLast,
      });

      await newPlan.save();
      console.log(`User-specific plan added successfully at scheduled time: ${scheduleTime}`);
    }, delay);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling user-specific plan', error: error.message });
  }
});


module.exports = router;
