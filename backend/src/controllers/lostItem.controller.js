const { v4: uuidv4 } = require('uuid');
const lostItemRepository = require('../repositories/lostItem.repository');
const matchingService = require('../services/matching.service');
const notificationRepository = require('../repositories/notification.repository');
const { query } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/error.middleware');

class LostItemController {
  async create(req, res, next) {
    try {
      const {
        title, description, categoryId, brand, color, location,
        latitude, longitude, dateLost, timeLost, reward,
        contactEmail, contactPhone,
      } = req.body;

      const item = await lostItemRepository.create({
        uuid: uuidv4(),
        userId: req.user.id,
        title, description, categoryId, brand, color, location,
        latitude, longitude, dateLost, timeLost,
        reward: parseFloat(reward) || 0,
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || req.user.phone,
      });

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const result = await uploadToCloudinary(file.path, 'lost-items');
          await query(
            `INSERT INTO item_images (item_type, item_id, url, public_id, is_primary, format, size)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['lost', item.id, result.url, result.publicId, i === 0, result.format, result.size]
          );
        }
      }

      // Run matching in background
      matchingService.findMatchesForLostItem(item.id)
        .catch(err => console.warn('Matching failed:', err.message));

      const fullItem = await lostItemRepository.findById(item.id);

      res.status(201).json({
        success: true,
        message: 'Lost item report created successfully.',
        data: { item: fullItem },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { search, category, status, dateFrom, dateTo, location, sortBy, sortOrder } = req.query;

      const { items, total } = await lostItemRepository.findAll({
        page, limit, search, category: category ? parseInt(category) : null,
        status: status || 'active', dateFrom, dateTo, location, sortBy, sortOrder,
      });

      res.json({
        success: true,
        ...paginateResponse(items, total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Lost item not found.', 404);

      // Increment views (non-blocking)
      if (!req.user || req.user.id !== item.user_id) {
        lostItemRepository.incrementViews(item.id).catch(() => {});
      }

      // Get matches
      const matches = await matchingService.getMatchesForItem('lost', item.id);

      res.json({
        success: true,
        data: { item, matches },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyItems(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { status } = req.query;

      const { items, total } = await lostItemRepository.findAll({
        page, limit,
        userId: req.user.id,
        status: status || null,
      });

      res.json({
        success: true,
        ...paginateResponse(items, total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Lost item not found.', 404);

      const isOwner = item.user_id === req.user.id;
      const isAdmin = ['admin', 'super_admin', 'moderator'].includes(req.user.role_name);

      if (!isOwner && !isAdmin) throw new AppError('Not authorized.', 403);

      const updated = await lostItemRepository.update(item.id, req.body);

      res.json({
        success: true,
        message: 'Lost item updated.',
        data: { item: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Lost item not found.', 404);

      const isOwner = item.user_id === req.user.id;
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role_name);

      if (!isOwner && !isAdmin) throw new AppError('Not authorized.', 403);

      // Delete images from cloudinary
      for (const img of item.images || []) {
        if (img.public_id) await deleteFromCloudinary(img.public_id);
      }

      await lostItemRepository.softDelete(item.id);

      res.json({ success: true, message: 'Lost item report deleted.' });
    } catch (error) {
      next(error);
    }
  }

  async addImages(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Item not found.', 404);
      if (item.user_id !== req.user.id) throw new AppError('Not authorized.', 403);

      const currentImages = await lostItemRepository.getImages(item.id);
      if (currentImages.length + req.files.length > 5) {
        throw new AppError('Maximum 5 images allowed per item.', 400);
      }

      const uploadedImages = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'lost-items');
        await query(
          `INSERT INTO item_images (item_type, item_id, url, public_id, is_primary, format, size)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['lost', item.id, result.url, result.publicId, currentImages.length === 0, result.format, result.size]
        );
        uploadedImages.push(result);
      }

      res.json({ success: true, data: { images: uploadedImages } });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Item not found.', 404);
      if (item.user_id !== req.user.id) throw new AppError('Not authorized.', 403);

      const images = await query(
        'SELECT * FROM item_images WHERE id = ? AND item_type = ? AND item_id = ?',
        [req.params.imageId, 'lost', item.id]
      );

      if (!images.length) throw new AppError('Image not found.', 404);

      if (images[0].public_id) await deleteFromCloudinary(images[0].public_id);
      await query('DELETE FROM item_images WHERE id = ?', [req.params.imageId]);

      res.json({ success: true, message: 'Image deleted.' });
    } catch (error) {
      next(error);
    }
  }

  async markRecovered(req, res, next) {
    try {
      const item = await lostItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Item not found.', 404);
      if (item.user_id !== req.user.id) throw new AppError('Not authorized.', 403);

      await lostItemRepository.update(item.id, { status: 'recovered' });

      res.json({ success: true, message: 'Item marked as recovered.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LostItemController();
