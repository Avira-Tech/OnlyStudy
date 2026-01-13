const express = require('express');
const router = express.Router();
const liveStreamController = require('../controllers/liveStreamController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, liveStreamController.getLiveStreams);
router.get('/my-streams', authenticate, liveStreamController.getCreatorStreams);
router.get('/:streamId', authenticate, liveStreamController.getStream);
router.post('/', authenticate, liveStreamController.createStream);
router.post('/:streamId/join', authenticate, liveStreamController.joinStream);
router.post('/:streamId/tip', authenticate, liveStreamController.sendTip);
router.post('/:streamId/end', authenticate, liveStreamController.endStream);

module.exports = router;

