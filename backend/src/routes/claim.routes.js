const router = require('express').Router();
const claimController = require('../controllers/claim.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadEvidence } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { claimValidator } = require('../validators/item.validator');

router.get('/my', authenticate, claimController.getMyClaims);
router.get('/for-my-items', authenticate, claimController.getClaimsForMyFoundItems);
router.get('/all', authenticate, authorize('admin', 'super_admin', 'moderator'), claimController.getAll);
router.get('/:uuid', authenticate, claimController.getOne);
router.post('/', authenticate, uploadEvidence.array('evidence', 5), claimValidator, validate, claimController.create);
router.put('/:uuid/review', authenticate, authorize('admin', 'super_admin', 'moderator'), claimController.review);

module.exports = router;
