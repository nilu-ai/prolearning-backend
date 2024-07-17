import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Topic } from "../models/topicModel.js";
import { Chapter } from "../models/chapterModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subjectModel.js";
import { Review } from "../models/reviewModel.js";
import { ObjectId } from "mongodb";

const createTopic = asyncHandler(async (req, res) => {
  const { name, chapterId ,description } = req.body;

  if (!name || !chapterId || !description) {
    throw new ApiError(400, "Name and chapterId are required");
  }
  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  const topic = await Topic.create({ name,description, chapter: chapterId });
  chapter.topics.push(topic._id);
  await chapter.save();
  return res
    .status(201)
    .json(new ApiResponse(201, topic, "Topic created successfully"));
});

const getAllTopics = asyncHandler(async (req, res) => {
  const topics = await Topic.find({}).populate('chapter');

  return res
    .status(200)
    .json(new ApiResponse(200, topics, "Topics fetched successfully"));
});

const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id).populate('chapter','name').populate('RelatedTopic','name').populate('questions','questionText');

  if (!topic) {
    throw new ApiError(404, "Topic not found");
  }
  const chapterId = topic.chapter._id;
  const chapter = await Chapter.findById(chapterId).populate('subject', 'name');
  

  const subject = chapter.subject;
  const standard = await Subject.findById(subject._id).populate('standard', 'name');
  const standards = standard.standard;

  // Add the subject to the topic response
  const topicWithSubject = {
    ...topic.toObject(),
    subject: subject ? { _id: subject._id, name: subject.name ,standard:standards.name } : null
  };

  return res
    .status(200)
    .json(new ApiResponse(200, topicWithSubject, "Topic fetched successfully"));
});

const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, chapterId } = req.body;

  const topic = await Topic.findById(id);

  if (!topic) {
    throw new ApiError(404, "Topic not found");
  }

  if (chapterId) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }
    topic.chapter = chapterId;
  }

  topic.name = name || topic.name;

  const updatedTopic = await topic.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTopic, "Topic updated successfully"));
});

const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id);

  if (!topic) {
    throw new ApiError(404, "Topic not found");
  }

  await topic.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Topic deleted successfully"));
});

const linkTopics = asyncHandler(async (req, res) => {
  const { topicId, relatedTopicId } = req.body;

  if (!topicId || !relatedTopicId) {
    throw new ApiError(400, "Both topicId and relatedTopicId are required");
  }

  const topic = await Topic.findById(topicId);
  const relatedTopic = await Topic.findById(relatedTopicId);

  if (!topic || !relatedTopic) {
    throw new ApiError(404, "Topic or related topic not found");
  }

  if (!topic.RelatedTopic.includes(relatedTopicId)) {
    topic.RelatedTopic.push(relatedTopicId);
    await topic.save();
  }

  // if (!relatedTopic.relatedTopics.includes(topicId)) {
  //   relatedTopic.relatedTopics.push(topicId);
  //   await relatedTopic.save();
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, { topic }, "Topics linked successfully"));
});

const viewcomment = asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  const topicdata = await Topic.findOne({ _id: new ObjectId(id) });
  if (!topicdata) {
    throw new ApiError(404, "No Topic Found");
  }

  console.log(topicdata);
  const reviewdata = await Review.find({
    topic_id: new ObjectId(id),
  }).populate({ path: "createdBy", select: "fullName avatar" });
  return res
    .status(200)
    .json(new ApiResponse(200, { reviewdata }, "reviews comment fetched"));
  

});

const createcomment = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const comment = req.body.comment;
  if (!id || !comment ) {
    throw new ApiError(200, "all feilds are require");
  }
  const topicdata = await Topic.findById(id);
  if (!topicdata) {
    throw new ApiError(404, "No topic Found");
  }
  const comment_data = await Review.create({
    product_id: id,
    review_comment: comment,
    createdBy: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { comment_data }, "reviews fetched"));

});

export {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  linkTopics,
  createcomment,
  viewcomment
};
