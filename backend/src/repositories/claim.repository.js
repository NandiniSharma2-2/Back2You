const { query } = require('../config/database');

class ClaimRepository {
  async create(data) {
    const result = await query(
      `INSERT INTO claims (uuid, claimant_id, found_item_id, lost_item_id, ownership_description, security_answer, additional_info)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.uuid, data.claimantId, data.foundItemId,
        data.lostItemId || null, data.ownershipDescription,
        data.securityAnswer || null, data.additionalInfo || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const rows = await query(
      `SELECT c.*,
              u.username as claimant_username, u.first_name as claimant_first_name, 
              u.last_name as claimant_last_name, u.avatar_url as claimant_avatar, u.email as claimant_email,
              fi.title as found_item_title, fi.description as found_item_desc, fi.location as found_item_location,
              fi.user_id as finder_id,
              fu.username as finder_username, fu.email as finder_email,
              li.title as lost_item_title,
              r.username as reviewer_username
       FROM claims c
       LEFT JOIN users u ON c.claimant_id = u.id
       LEFT JOIN found_items fi ON c.found_item_id = fi.id
       LEFT JOIN users fu ON fi.user_id = fu.id
       LEFT JOIN lost_items li ON c.lost_item_id = li.id
       LEFT JOIN users r ON c.reviewed_by = r.id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    
    const claim = rows[0];
    claim.evidence = await this.getEvidence(id);
    return claim;
  }

  async findByUuid(uuid) {
    const rows = await query('SELECT id FROM claims WHERE uuid = ?', [uuid]);
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  }

  async getEvidence(claimId) {
    return query('SELECT * FROM claim_evidence WHERE claim_id = ?', [claimId]);
  }

  async addEvidence(claimId, evidenceList) {
    for (const ev of evidenceList) {
      await query(
        'INSERT INTO claim_evidence (claim_id, url, public_id, file_type, description) VALUES (?, ?, ?, ?, ?)',
        [claimId, ev.url, ev.publicId || null, ev.fileType || 'image', ev.description || null]
      );
    }
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMap = {
      status: data.status,
      reviewed_by: data.reviewedBy,
      review_notes: data.reviewNotes,
      reviewed_at: data.reviewedAt,
      completed_at: data.completedAt,
    };

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await query(`UPDATE claims SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async findAll({ page = 1, limit = 10, status, claimantId, foundItemId, reviewedBy }) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (claimantId) {
      whereClause += ' AND c.claimant_id = ?';
      params.push(parseInt(claimantId));
    }

    if (foundItemId) {
      whereClause += ' AND c.found_item_id = ?';
      params.push(parseInt(foundItemId));
    }

    if (reviewedBy) {
      whereClause += ' AND c.reviewed_by = ?';
      params.push(parseInt(reviewedBy));
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      const claims = await query(
        `SELECT c.*, 
                u.username as claimant_username, u.first_name as claimant_first_name, u.last_name as claimant_last_name,
                fi.title as found_item_title, fi.location as found_item_location,
                (SELECT url FROM item_images WHERE item_type = 'found' AND item_id = fi.id AND is_primary = 1 LIMIT 1) as item_image
         FROM claims c
         LEFT JOIN users u ON c.claimant_id = u.id
         LEFT JOIN found_items fi ON c.found_item_id = fi.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      const countResult = await query(`SELECT COUNT(*) as total FROM claims c ${whereClause}`, params);

      return { claims, total: countResult[0].total };
    } catch (error) {
      console.error('Claims Repository error:', error);
      throw error;
    }
  }

  async checkDuplicate(claimantId, foundItemId) {
    const rows = await query(
      'SELECT id FROM claims WHERE claimant_id = ? AND found_item_id = ? AND status NOT IN (?, ?)',
      [claimantId, foundItemId, 'rejected', 'completed']
    );
    return rows.length > 0;
  }

  async getStats() {
    const rows = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'submitted') as submitted,
        SUM(status = 'under_review') as under_review,
        SUM(status = 'approved') as approved,
        SUM(status = 'rejected') as rejected,
        SUM(status = 'completed') as completed
      FROM claims
    `);
    return rows[0];
  }
}

module.exports = new ClaimRepository();
