import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rippleChatRouter from "./ripple/chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ripple", rippleChatRouter);

export default router;
