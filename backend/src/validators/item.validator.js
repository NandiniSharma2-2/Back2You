const { body } = require('express-validator');

const lostItemValidator = [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('location').trim().isLength({ min: 2 }).withMessage('Location is required'),
  body('dateLost').isDate().withMessage('Valid date required'),
  body('categoryId').optional().isInt().withMessage('Invalid category'),
  body('reward').optional().isFloat({ min: 0 }).withMessage('Reward must be a positive number'),
];

const foundItemValidator = [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('location').trim().isLength({ min: 2 }).withMessage('Location is required'),
  body('dateFound').isDate().withMessage('Valid date required'),
  body('categoryId').optional().isInt().withMessage('Invalid category'),
];

const claimValidator = [
  body('foundItemUuid').isUUID().withMessage('Valid found item ID required'),
  body('ownershipDescription')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Ownership description must be at least 20 characters'),
];

module.exports = { lostItemValidator, foundItemValidator, claimValidator };
