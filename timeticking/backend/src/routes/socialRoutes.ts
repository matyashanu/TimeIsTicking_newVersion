import { Router } from 'express';
import {
  searchUsers,
  sendFriendRequest,
  listFriendRequests,
  respondFriendRequest,
  listFriends,
  getFriendCalendar,
  listMessages,
  sendMessage,
  upload
} from '../controllers/socialController.js';
import requireUser from '../middleware/auth.js';

const router = Router();

router.use(requireUser);

router.get('/search', searchUsers);
router.post('/request', sendFriendRequest);
router.get('/requests', listFriendRequests);
router.post('/requests/:id/respond', respondFriendRequest);
router.get('/friends', listFriends);
router.get('/friends/:friendId/calendar', getFriendCalendar);

router.get('/chats/:friendId/messages', listMessages);
router.post('/chats/:friendId/messages', upload.single('file'), sendMessage);

export default router;
