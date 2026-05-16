import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import postsRouter from "./posts";
import followsRouter from "./follows";
import notificationsRouter from "./notifications";
import feedRouter from "./feed";
import searchRouter from "./search";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/posts", postsRouter);
router.use("/follows", followsRouter);
router.use("/notifications", notificationsRouter);
router.use("/feed", feedRouter);
router.use("/search", searchRouter);

export default router;
