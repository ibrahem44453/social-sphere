
import express, { type Express } from "express";
import cors from "cors";
import { logger } from "./lib/logger";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";
import followsRouter from "./routes/follows";
import notificationsRouter from "./routes/notifications";
import feedRouter from "./routes/feed";
import searchRouter from "./routes/search";
import aiRouter from "./routes/ai";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount each router directly at its full path to avoid Express 5 sub-router
// path-stripping issues.
app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/follows", followsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/feed", feedRouter);
app.use("/api/search", searchRouter);
app.use("/api/ai", aiRouter);

export default app;

