import express from 'express';
import EventLog from '../models/Eventlog.js';

const router = express.Router();

// GET logs for specific event
router.get('/event/:eventId', async (req, res) => {
  try {
    const logs = await EventLog.find({ eventId: req.params.eventId })
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all logs
router.get('/', async (req, res) => {
  try {
    const logs = await EventLog.find()
      .populate('eventId')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;