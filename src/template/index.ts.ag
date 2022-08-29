import express, { Router } from "express";
import createApi from "../controller/createApi";
import healthCheck from "../controller/healthCheck";
const router: Router = express.Router()

router.get('/', healthCheck)
router.post('/create-api', createApi)

export default router