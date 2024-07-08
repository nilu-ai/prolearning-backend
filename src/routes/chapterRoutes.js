import express from 'express';
import {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
} from '../controllers/chapterController.js';
import { createChapterTest,submitChapterTestResult } from '../controllers/chapterTestController.js';
import { verifyTeacher } from '../middlewares/teacher.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
const router = express.Router();


router.get('/', getAllChapters);
router.get('/:id', getChapterById);

router.post('/',verifyJWT,verifyTeacher ,createChapter);
router.put('/:id',verifyJWT,verifyTeacher, updateChapter);
router.delete('/:id',verifyJWT,verifyTeacher, deleteChapter);
// chapter wise test 
router.post('/chapter-tests', verifyJWT, createChapterTest);
router.post('/chapter-tests/results', verifyJWT, submitChapterTestResult);



export default router;
