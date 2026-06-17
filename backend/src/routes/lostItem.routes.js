const router = require('express').Router();
const lostItemController = require('../controllers/lostItem.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { uploadImages } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { lostItemValidator } = require('../validators/item.validator');

router.get('/', optionalAuth, lostItemController.getAll);
router.get('/my', authenticate, lostItemController.getMyItems);
router.get('/:uuid', optionalAuth, lostItemController.getOne);
router.post('/', authenticate, uploadImages.array('images', 5), lostItemValidator, validate, lostItemController.create);
router.put('/:uuid', authenticate, lostItemController.update);
router.delete('/:uuid', authenticate, lostItemController.delete);
router.post('/:uuid/images', authenticate, uploadImages.array('images', 5), lostItemController.addImages);
router.delete('/:uuid/images/:imageId', authenticate, lostItemController.deleteImage);
router.put('/:uuid/recovered', authenticate, lostItemController.markRecovered);

module.exports = router;
