const { v4: uuidv4 } = require('uuid');
const claimRepository = require('../repositories/claim.repository');
const foundItemRepository = require('../repositories/foundItem.repository');
const notificationRepository = require('../repositories/notification.repository');
const { query } = require('../config/database');
const { uploadToCloudinary } = require('../middleware/upload.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/error.middleware');

class ClaimController {
  async create(req, res, next) {
    try {
      const { foundItemUuid, lostItemId, ownershipDescription, securityAnswer, additionalInfo } = req.body;

      const foundItem = await foundItemRepository.findByUuid(foundItemUuid);
      if (!foundItem) throw new AppError('Found item not found.', 404);

      if (foundItem.user_id === req.user.id) {
        throw new AppError('You cannot claim your own found item.', 400);
      }

      if (!['available', 'verification_pending'].includes(foundItem.status)) {
        throw new AppError('This item is no longer available for claims.', 400);
      }

      // Check duplicate claim
      const isDuplicate = await claimRepository.checkDuplicate(req.user.id, foundItem.id);
      if (isDuplicate) throw new AppError('You already have an active claim for this item.', 409);

      const claim = await claimRepository.create({
        uuid: uuidv4(),
        claimantId: req.user.id,
        foundItemId: foundItem.id,
        lostItemId: lostItemId || null,
        ownershipDescription,
        securityAnswer,
        additionalInfo,
      });

      // Handle evidence uploads
      if (req.files && req.files.length > 0) {
        const evidenceList = [];
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.path, 'evidence');
          evidenceList.push({
            url: result.url,
            publicId: result.publicId,
            fileType: result.format,
          });
        }
        await claimRepository.addEvidence(claim.id, evidenceList);
      }

      // Update found item status
      await foundItemRepository.update(foundItem.id, { status: 'verification_pending' });

      // Notify finder
      await notificationRepository.create({
        userId: foundItem.user_id,
        type: 'new_claim',
        title: 'New Claim Submitted',
        message: `Someone has submitted a claim for your found item: ${foundItem.title}`,
        data: { claimId: claim.id, foundItemId: foundItem.id },
        actionUrl: `/dashboard/claims/${claim.uuid}`,
      });

      res.status(201).json({
        success: true,
        message: 'Claim submitted successfully.',
        data: { claim },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyClaims(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { status } = req.query;

      const { claims, total } = await claimRepository.findAll({
        page, limit,
        claimantId: req.user.id,
        status: status || null,
      });

      res.json({ success: true, ...paginateResponse(claims, total, page, limit) });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const claim = await claimRepository.findByUuid(req.params.uuid);
      if (!claim) throw new AppError('Claim not found.', 404);

      const isClaimant = claim.claimant_id === req.user.id;
      const isFinder = claim.finder_id === req.user.id;
      const isStaff = ['admin', 'super_admin', 'moderator'].includes(req.user.role_name);

      if (!isClaimant && !isFinder && !isStaff) {
        throw new AppError('Not authorized.', 403);
      }

      res.json({ success: true, data: { claim } });
    } catch (error) {
      next(error);
    }
  }

  async getClaimsForMyFoundItems(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);

      // Get found items owned by this user
      const myFoundItems = await query(
        'SELECT id FROM found_items WHERE user_id = ? AND deleted_at IS NULL',
        [req.user.id]
      );

      if (!myFoundItems.length) {
        return res.json({ success: true, data: [], pagination: { total: 0 } });
      }

      const itemIds = myFoundItems.map(i => i.id);
      const offset = (page - 1) * limit;

      const [claims, countResult] = await Promise.all([
        query(
          `SELECT c.*, 
                  u.username as claimant_username, u.first_name as claimant_first_name, u.avatar_url as claimant_avatar,
                  fi.title as found_item_title
           FROM claims c
           LEFT JOIN users u ON c.claimant_id = u.id
           LEFT JOIN found_items fi ON c.found_item_id = fi.id
           WHERE c.found_item_id IN (${itemIds.map(() => '?').join(',')})
           ORDER BY c.created_at DESC
           LIMIT ? OFFSET ?`,
          [...itemIds, limit, offset]
        ),
        query(
          `SELECT COUNT(*) as total FROM claims WHERE found_item_id IN (${itemIds.map(() => '?').join(',')})`,
          itemIds
        ),
      ]);

      res.json({ success: true, ...paginateResponse(claims, countResult[0].total, page, limit) });
    } catch (error) {
      next(error);
    }
  }

  // Moderator/Admin: Review claim
  async review(req, res, next) {
    try {
      const { status, reviewNotes } = req.body;
      const validStatuses = ['under_review', 'approved', 'rejected'];

      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status.', 400);
      }

      const claim = await claimRepository.findByUuid(req.params.uuid);
      if (!claim) throw new AppError('Claim not found.', 404);

      const updateData = {
        status,
        reviewedBy: req.user.id,
        reviewNotes,
        reviewedAt: new Date(),
      };

      if (status === 'approved') {
        updateData.completedAt = new Date();
      }

      await claimRepository.update(claim.id, updateData);

      // If approved, update found item status
      if (status === 'approved') {
        await foundItemRepository.update(claim.found_item_id, { status: 'claimed' });

        // If there's a linked lost item, mark it recovered
        if (claim.lost_item_id) {
          const { query: dbQuery } = require('../config/database');
          await dbQuery(
            "UPDATE lost_items SET status = 'recovered' WHERE id = ?",
            [claim.lost_item_id]
          );
        }
      }

      // Notify claimant
      await notificationRepository.create({
        userId: claim.claimant_id,
        type: 'claim_update',
        title: `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your claim for ${claim.found_item_title} has been ${status}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
        data: { claimId: claim.id, status },
        actionUrl: `/dashboard/claims/${claim.uuid}`,
      });

      // Send email notification
      sendEmail(claim.claimant_email, 'claimUpdate', [
        `${claim.claimant_first_name} ${claim.claimant_last_name}`,
        status,
        claim.found_item_title,
      ]).catch(() => {});

      // Audit log
      await query(
        'INSERT INTO audit_logs (admin_id, action, target_type, target_id, notes) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, `claim_${status}`, 'claim', claim.id, reviewNotes]
      );

      const updated = await claimRepository.findById(claim.id);
      res.json({ success: true, message: `Claim ${status}.`, data: { claim: updated } });
    } catch (error) {
      next(error);
    }
  }

  // Moderator/Admin: Get all claims
  async getAll(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const { status } = req.query;

      const { claims, total } = await claimRepository.findAll({
        page, limit, status: status || null,
      });

      res.json({ success: true, ...paginateResponse(claims, total, page, limit) });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClaimController();
