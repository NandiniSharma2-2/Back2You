const router = require('express').Router();
const foundItemController = require('../controllers/foundItem.controller');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth.middleware');
const { uploadImages } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { foundItemValidator } = require('../validators/item.validator');

router.get('/', optionalAuth, foundItemController.getAll);
router.get('/my', authenticate, foundItemController.getMyItems);
router.get('/:uuid', optionalAuth, foundItemController.getOne);
router.post('/', authenticate, uploadImages.array('images', 5), foundItemValidator, validate, foundItemController.create);
router.put('/:uuid', authenticate, foundItemController.update);
router.delete('/:uuid', authenticate, foundItemController.delete);
router.post('/:uuid/images', authenticate, uploadImages.array('images', 5), foundItemController.addImages);
router.put('/:uuid/verify', authenticate, authorize('admin', 'super_admin', 'moderator'), foundItemController.verify);

module.exports = router;
