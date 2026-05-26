import adminClient from '../adminClient.js';

export const createRemovalRequest = ({ targetUserId, reason }) =>
  adminClient
    .post('/api/admin/removal-requests', {
      targetUserId: Number(targetUserId),
      reason: String(reason).trim(),
    })
    .then((r) => r.data.data);

export const listRemovalRequests = (status) => {
  const params = status ? { status } : {};
  return adminClient
    .get('/api/admin/removal-requests', { params })
    .then((r) => r.data.data);
};

export const approveRemovalRequest = (id, note) =>
  adminClient
    .patch(`/api/admin/removal-requests/${Number(id)}/approve`, {
      note: note ? String(note).trim() : undefined,
    })
    .then((r) => r.data.data);

export const denyRemovalRequest = (id, note) =>
  adminClient
    .patch(`/api/admin/removal-requests/${Number(id)}/deny`, {
      note: note ? String(note).trim() : undefined,
    })
    .then((r) => r.data.data);
