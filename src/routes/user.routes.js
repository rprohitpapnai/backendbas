import {Router} from 'express';
import { registeruser } from '../controllers/user.controller.js';
import {upload} from "../middlewares/upload.middleware.js";
const router = Router ()

router.route("/register").post(
    upload.fields([
        {name:"name",maxCount:1},
        {name:"coverImage",maxCount:1},
    ]),
    registeruser)




export default router
