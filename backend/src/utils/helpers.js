const crypto = require('crypto');

function generateToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

function paginate(page = 1, limit = 10) {
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 10, 100);
  const offset = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, offset };
}

function paginateResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  const weights = {
    category: 30,
    location: 25,
    date: 20,
    brand: 15,
    color: 10,
  };

  // Category match
  if (lostItem.category_id === foundItem.category_id) {
    score += weights.category;
  }

  // Location proximity (simple string match for now)
  if (lostItem.location && foundItem.location) {
    const lostLoc = lostItem.location.toLowerCase();
    const foundLoc = foundItem.location.toLowerCase();
    if (lostLoc === foundLoc) {
      score += weights.location;
    } else if (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
      score += weights.location * 0.6;
    }
  }

  // Date proximity (within 7 days)
  if (lostItem.date_lost && foundItem.date_found) {
    const dateLost = new Date(lostItem.date_lost);
    const dateFound = new Date(foundItem.date_found);
    const daysDiff = Math.abs((dateFound - dateLost) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 1) score += weights.date;
    else if (daysDiff <= 3) score += weights.date * 0.7;
    else if (daysDiff <= 7) score += weights.date * 0.4;
  }

  // Brand match
  if (lostItem.brand && foundItem.brand) {
    if (lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
      score += weights.brand;
    }
  }

  // Color match
  if (lostItem.color && foundItem.color) {
    if (lostItem.color.toLowerCase() === foundItem.color.toLowerCase()) {
      score += weights.color;
    }
  }

  // Keyword matching from description
  if (lostItem.description && foundItem.description) {
    const lostWords = lostItem.description.toLowerCase().split(/\s+/);
    const foundWords = foundItem.description.toLowerCase().split(/\s+/);
    const commonWords = lostWords.filter(word => 
      word.length > 3 && foundWords.includes(word)
    );
    const keywordScore = Math.min((commonWords.length / lostWords.length) * 20, 20);
    score += keywordScore;
  }

  return Math.round(Math.min(score, 100));
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

module.exports = {
  generateToken,
  generateOTP,
  paginate,
  paginateResponse,
  sanitizeUser,
  calculateMatchScore,
  slugify,
  formatDate,
};
