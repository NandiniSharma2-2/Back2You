import React from 'react';

const statusConfig = {
  // Lost item statuses
  active: { label: 'Active', class: 'badge-cyan' },
  matched: { label: 'Matched', class: 'badge-green' },
  recovered: { label: 'Recovered', class: 'badge-green' },
  closed: { label: 'Closed', class: 'badge-gray' },
  archived: { label: 'Archived', class: 'badge-gray' },

  // Found item statuses
  available: { label: 'Available', class: 'badge-cyan' },
  verification_pending: { label: 'Pending Verification', class: 'badge-pink' },
  claimed: { label: 'Claimed', class: 'badge-green' },
  returned: { label: 'Returned', class: 'badge-green' },

  // Claim statuses
  submitted: { label: 'Submitted', class: 'badge-cyan' },
  under_review: { label: 'Under Review', class: 'badge-pink' },
  approved: { label: 'Approved', class: 'badge-green' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  completed: { label: 'Completed', class: 'badge-green' },

  // User statuses
  verified: { label: 'Verified', class: 'badge-green' },
  suspended: { label: 'Suspended', class: 'badge-pink' },
  banned: { label: 'Banned', class: 'badge-danger' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'badge-gray' };
  return <span className={config.class}>{config.label}</span>;
}
