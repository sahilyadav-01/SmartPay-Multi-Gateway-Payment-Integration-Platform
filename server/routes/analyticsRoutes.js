const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Secure analytics aggregation endpoints to Admin access only

router.get('/', getAnalytics);

module.exports = router;
