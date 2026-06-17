const { v4: uuidv4 } = require('uuid');
const foundItemRepository = require('../repositories/foundItem.repository');
const matchingService = require('../services/matching.service');
const { query } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/error.middleware');

class FoundItemController {
  async create(req, res, next) {
    try {
      const {
        title, description, categoryId, brand, color, location,
        latitude, longitude, dateFound, timeFound, storageLocation,
        contactEmail, contactPhone,
      } = req.body;

      const item = await foundItemRepository.create({
        uuid: uuidv4(),
        userId: req.user.id,
        title, description, categoryId, brand, color, location,
        latitude, longitude, dateFound, timeFound, storageLocation,
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || req.user.phone,
      });

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const result = await uploadToCloudinary(file.path, 'found-items');
          await query(
            `INSERT INTO item_images (item_type, item_id, url, public_id, is_primary, format, size)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['found', item.id, result.url, result.publicId, i === 0, result.format, result.size]
          );
        }
      }

      // Run matching in background
      matchingService.findMatchesForFoundItem(item.id)
        .catch(err => console.warn('Matching failed:', err.message));

      const fullItem = await foundItemRepository.findById(item.id);

      res.status(201).json({
        success: true,
        message: 'Found item report created successfully.',
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

      const { items, total } = await foundItemRepository.findAll({
        page, limit, search,
        category: category ? parseInt(category) : null,
        status: status || 'available',
        dateFrom, dateTo, location, sortBy, sortOrder,
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
      const item = await foundItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Found item not found.', 404);

      if (!req.user || req.user.id !== item.user_id) {
        foundItemRepository.incrementViews(item.id).catch(() => {});
      }

      const matches = await matchingService.getMatchesForItem('found', item.id);

      res.json({ success: true, data: { item, matches } });
    } catch (error) {
      next(error);
    }
  }

  async getMyItems(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { status } = req.query;

      const { items, total } = await foundItemRepository.findAll({
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
      const item = await foundItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Found item not found.', 404);

      const isOwner = item.user_id === req.user.id;
      const isAdmin = ['admin', 'super_admin', 'moderator'].includes(req.user.role_name);
      if (!isOwner && !isAdmin) throw new AppError('Not authorized.', 403);

      const updated = await foundItemRepository.update(item.id, req.body);
      res.json({ success: true, message: 'Found item updated.', data: { item: updated } });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const item = await foundItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Found item not found.', 404);

      const isOwner = item.user_id === req.user.id;
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role_name);
      if (!isOwner && !isAdmin) throw new AppError('Not authorized.', 403);

      for (const img of item.images || []) {
        if (img.public_id) await deleteFromCloudinary(img.public_id);
      }

      await foundItemRepository.softDelete(item.id);
      res.json({ success: true, message: 'Found item report deleted.' });
    } catch (error) {
      next(error);
    }
  }

  async addImages(req, res, next) {
    try {
      const item = await foundItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Item not found.', 404);
      if (item.user_id !== req.user.id) throw new AppError('Not authorized.', 403);

      const uploadedImages = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'found-items');
        await query(
          `INSERT INTO item_images (item_type, item_id, url, public_id, is_primary, format, size)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['found', item.id, result.url, result.publicId, false, result.format, result.size]
        );
        uploadedImages.push(result);
      }

      res.json({ success: true, data: { images: uploadedImages } });
    } catch (error) {
      next(error);
    }
  }

  async verify(req, res, next) {
    try {
      const item = await foundItemRepository.findByUuid(req.params.uuid);
      if (!item) throw new AppError('Item not found.', 404);

      await foundItemRepository.update(item.id, {
        isVerified: true,
        verifiedBy: req.user.id,
      });

      res.json({ success: true, message: 'Item verified.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FoundItemController();
