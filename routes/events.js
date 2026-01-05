import express from 'express';
import Event from '../models/Event.js';
import EventLog from '../models/Eventlog.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('profiles')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET events for specific profile
router.get('/profile/:profileId', async (req, res) => {
  try {
    const events = await Event.find({ profiles: req.params.profileId })
      .populate('profiles')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new event
router.post('/', async (req, res) => {
  try {
    const { title, description, profiles, timezone, startDate, endDate } = req.body;

    // Validate required fields
    if (!title || !profiles || profiles.length === 0) {
      return res.status(400).json({ error: 'Title and at least one profile are required' });
    }

    if (!timezone || !startDate || !endDate) {
      return res.status(400).json({ error: 'Timezone, start date, and end date are required' });
    }

    // Validate dates
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (end.isBefore(start)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const event = new Event({
      title,
      description: description || '',
      profiles,
      timezone,
      startDate: start.toDate(),
      endDate: end.toDate()
    });

    await event.save();
    const populatedEvent = await Event.findById(event._id).populate('profiles');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { title, description, profiles, timezone, startDate, endDate } = req.body;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = dayjs(startDate);
      const end = dayjs(endDate);

      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (end.isBefore(start)) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
      }
    }

    // Store previous values for logging
    const previousValues = {
      title: existingEvent.title,
      description: existingEvent.description,
      profiles: existingEvent.profiles,
      timezone: existingEvent.timezone,
      startDate: existingEvent.startDate,
      endDate: existingEvent.endDate
    };

    // Update event
    existingEvent.title = title || existingEvent.title;
    existingEvent.description = description !== undefined ? description : existingEvent.description;
    existingEvent.profiles = profiles || existingEvent.profiles;
    existingEvent.timezone = timezone || existingEvent.timezone;
    existingEvent.startDate = startDate ? dayjs(startDate).toDate() : existingEvent.startDate;
    existingEvent.endDate = endDate ? dayjs(endDate).toDate() : existingEvent.endDate;
    existingEvent.updatedAt = Date.now();

    await existingEvent.save();
    const updatedEvent = await Event.findById(existingEvent._id).populate('profiles');

    // Create log entry
    const newValues = {
      title: updatedEvent.title,
      description: updatedEvent.description,
      profiles: updatedEvent.profiles.map(p => p._id),
      timezone: updatedEvent.timezone,
      startDate: updatedEvent.startDate,
      endDate: updatedEvent.endDate
    };

    const changes = {};
    Object.keys(newValues).forEach(key => {
      if (JSON.stringify(previousValues[key]) !== JSON.stringify(newValues[key])) {
        changes[key] = {
          from: previousValues[key],
          to: newValues[key]
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      const eventLog = new EventLog({
        eventId: updatedEvent._id,
        changes,
        previousValues,
        newValues
      });
      await eventLog.save();
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;