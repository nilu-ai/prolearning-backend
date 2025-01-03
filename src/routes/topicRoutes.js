import express from 'express';
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,linkTopics,viewcomment,createcomment,addReplyToComment,toggleUpvote,subtoggleUpvote
} from '../controllers/topicController.js';
import { verifyTeacher } from '../middlewares/teacher.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
const router = express.Router();


router.get('/', getAllTopics);
router.get('/:id',getTopicById);

router.post('/',verifyJWT,verifyTeacher,createTopic);
router.put('/:id',verifyJWT,verifyTeacher, updateTopic);
router.delete('/:id',verifyJWT,verifyTeacher, deleteTopic);
router.post('/relatedtopics/',verifyJWT,verifyTeacher,linkTopics );
router.post('/createcomment/:id',verifyJWT,createcomment)
router.get('/viewcomment/:id',viewcomment)
router.post("/:commentId/replies", verifyJWT, addReplyToComment);
router.post("/:reviewId/upvote", verifyJWT, toggleUpvote);
router.post("/:replies_id/subupvote", verifyJWT, subtoggleUpvote);
// router.post('/createcomment/:id',verifyJWT,)
// router.post('/createcomment/:id',verifyJWT,)
export default router;
