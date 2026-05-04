import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import vendorsRouter from "./vendors";
import usersRouter from "./users";
import bookingsRouter from "./bookings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vendorsRouter);
router.use(usersRouter);
router.use(bookingsRouter);
router.use(adminRouter);

export default router;
