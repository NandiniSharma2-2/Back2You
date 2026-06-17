const { query } = require('../config/database');
const lostItemRepository = require('../repositories/lostItem.repository');
const foundItemRepository = require('../repositories/foundItem.repository');
const notificationRepository = require('../repositories/notification.repository');
const { calculateMatchScore } = require('../utils/helpers');
const logger = require('../utils/logger');

class MatchingService {
  async findMatchesForLostItem(lostItemId) {
    const lostItem = await lostItemRepository.findById(lostItemId);
    if (!lostItem) return [];

    const candidates = await foundItemRepository.findForMatching(lostItem);
    const matches = [];

    for (const foundItem of candidates) {
      const score = calculateMatchScore(lostItem, foundItem);
      if (score >= 30) {
        matches.push({
          foundItem,
          matchScore: score,
          matchFactors: this.getMatchFactors(lostItem, foundItem),
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Store top matches in DB
    for (const match of matches.slice(0, 10)) {
      await query(
        `INSERT INTO item_matches (lost_item_id, found_item_id, match_score, status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE match_score = VALUES(match_score)`,
        [lostItemId, match.foundItem.id, match.matchScore]
      );
    }

    // Notify user if high-confidence match found
    if (matches.length > 0 && matches[0].matchScore >= 70) {
      await notificationRepository.create({
        userId: lostItem.user_id,
        type: 'match_found',
        title: 'Potential Match Found!',
        message: `We found a possible match for your lost ${lostItem.title} with ${matches[0].matchScore}% confidence.`,
        data: {
          lostItemId,
          foundItemId: matches[0].foundItem.id,
          matchScore: matches[0].matchScore,
        },
        actionUrl: `/dashboard/lost/${lostItem.uuid}`,
      });
    }

    return matches;
  }

  async findMatchesForFoundItem(foundItemId) {
    const foundItem = await foundItemRepository.findById(foundItemId);
    if (!foundItem) return [];

    const candidates = await lostItemRepository.findForMatching(foundItem);
    const matches = [];

    for (const lostItem of candidates) {
      const score = calculateMatchScore(lostItem, foundItem);
      if (score >= 30) {
        matches.push({
          lostItem,
          matchScore: score,
          matchFactors: this.getMatchFactors(lostItem, foundItem),
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Store top matches
    for (const match of matches.slice(0, 10)) {
      await query(
        `INSERT INTO item_matches (lost_item_id, found_item_id, match_score, status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE match_score = VALUES(match_score)`,
        [match.lostItem.id, foundItemId, match.matchScore]
      );
    }

    // Notify finder of potential matches
    if (matches.length > 0) {
      await notificationRepository.create({
        userId: foundItem.user_id,
        type: 'matches_available',
        title: 'Matching Lost Items Found',
        message: `We found ${matches.length} potential lost item(s) that match what you reported.`,
        data: { foundItemId, matchCount: matches.length },
        actionUrl: `/dashboard/found/${foundItem.uuid}`,
      });
    }

    return matches;
  }

  getMatchFactors(lostItem, foundItem) {
    const factors = [];

    if (lostItem.category_id === foundItem.category_id) {
      factors.push({ factor: 'Category', weight: 'high', matched: true });
    }

    if (lostItem.location && foundItem.location) {
      const similarity = this.locationSimilarity(lostItem.location, foundItem.location);
      if (similarity > 0) {
        factors.push({ factor: 'Location', weight: 'high', matched: true, detail: `${Math.round(similarity * 100)}% match` });
      }
    }

    if (lostItem.brand && foundItem.brand &&
        lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
      factors.push({ factor: 'Brand', weight: 'medium', matched: true });
    }

    if (lostItem.color && foundItem.color &&
        lostItem.color.toLowerCase() === foundItem.color.toLowerCase()) {
      factors.push({ factor: 'Color', weight: 'medium', matched: true });
    }

    return factors;
  }

  locationSimilarity(loc1, loc2) {
    const l1 = loc1.toLowerCase();
    const l2 = loc2.toLowerCase();
    if (l1 === l2) return 1;
    if (l1.includes(l2) || l2.includes(l1)) return 0.6;
    const words1 = l1.split(/[\s,]+/);
    const words2 = l2.split(/[\s,]+/);
    const common = words1.filter(w => w.length > 2 && words2.includes(w));
    return common.length / Math.max(words1.length, words2.length);
  }

  async getMatchesForItem(itemType, itemId) {
    if (itemType === 'lost') {
      return query(
        `SELECT im.*, 
                fi.title, fi.description, fi.location, fi.date_found, fi.status,
                u.username as finder_username,
                (SELECT url FROM item_images WHERE item_type = 'found' AND item_id = fi.id AND is_primary = 1 LIMIT 1) as primary_image
         FROM item_matches im
         JOIN found_items fi ON im.found_item_id = fi.id
         JOIN users u ON fi.user_id = u.id
         WHERE im.lost_item_id = ?
         ORDER BY im.match_score DESC
         LIMIT 10`,
        [itemId]
      );
    } else {
      return query(
        `SELECT im.*,
                li.title, li.description, li.location, li.date_lost, li.status, li.reward,
                u.username as owner_username,
                (SELECT url FROM item_images WHERE item_type = 'lost' AND item_id = li.id AND is_primary = 1 LIMIT 1) as primary_image
         FROM item_matches im
         JOIN lost_items li ON im.lost_item_id = li.id
         JOIN users u ON li.user_id = u.id
         WHERE im.found_item_id = ?
         ORDER BY im.match_score DESC
         LIMIT 10`,
        [itemId]
      );
    }
  }
}

module.exports = new MatchingService();
