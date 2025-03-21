import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
const app = express();

app.use(
  cors({
     origin:[process.env.CORS_ORIGIN,process.env.CORS_ORIGINN,process.env.CORS_ORIGIN_AZURE],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// import userRouter from "./routes/user.routes.js";
app.get("/",(req,res)=>{
    res.send("hellow")
})


import userRoutes from './routes/userRoutes.js';
import standardRoutes from './routes/standardRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import testRoutes from './routes/testRoutes.js';
// import recommendationRoutes from './routes/recommendationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import physicaltestRoutes from './routes/physicaltestRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import classroomRoutes from './routes/classroomRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import searchRoutes from  './routes/searchRoutes.js'
import planRoutes from  './routes/planRoutes.js'
import genericrouter from "./routes/genericplanRoutes.js";
import superRouter from "./routes/superadminRoutes.js"
// app.use("/api/v1/users", userRouter);
app.use('/api/users', userRoutes);
app.use('/api/standards', standardRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
// app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/physicaltest', physicaltestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/ai',aiRoutes );
app.use('/api/search/',searchRoutes);
app.use('/api/plan/',planRoutes)
app.use('/api/schedular/',genericrouter)
app.use('/api/superadmin/',superRouter)
export { app };
