import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rippleChatRouter from "./ripple/chat";
import journeysRouter from "./journeys";
import discoveriesRouter from "./discoveries";
import extractRouter from "./ripple/extract";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ripple", rippleChatRouter);
router.use("/journeys", journeysRouter);
router.use(discoveriesRouter);
router.use(extractRouter);

export default router;
