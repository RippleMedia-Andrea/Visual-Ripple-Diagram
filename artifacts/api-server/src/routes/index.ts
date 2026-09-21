import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rippleChatRouter from "./ripple/chat";
import journeysRouter from "./journeys";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ripple", rippleChatRouter);
router.use("/journeys", journeysRouter);

export default router;
