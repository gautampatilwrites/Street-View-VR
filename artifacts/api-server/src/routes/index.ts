import { Router, type IRouter } from "express";
import healthRouter from "./health";
import streetviewRouter from "./streetview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(streetviewRouter);

export default router;
