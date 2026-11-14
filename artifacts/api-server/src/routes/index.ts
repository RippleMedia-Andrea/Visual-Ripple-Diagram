import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rippleChatRouter from "./ripple/chat";
import journeysRouter from "./journeys";
import discoveriesRouter from "./discoveries";
import extractRouter from "./ripple/extract";
import accountRouter from "./account";
import courseAccessRouter from "./course-access";
import transcriptionsRouter from "./transcriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(courseAccessRouter);
router.use("/ripple", rippleChatRouter);
router.use("/journeys", journeysRouter);
router.use(discoveriesRouter);
router.use(extractRouter);
router.use(transcriptionsRouter);

export default router;
