import pool from "../apis/db.js";
import express from 'express';
import { connectSSE } from "../utils/sse.js";

const router = express.Router();

router.get('/:user_id', (req, res) => {
    connectSSE(req.params.user_id, res, req);
});

export default router;
