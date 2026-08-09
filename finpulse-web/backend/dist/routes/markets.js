import express from 'express';
const marketsRoutes = express.Router();
marketsRoutes.get('/', (_req, res) => {
    res.json([]);
});
export default marketsRoutes;
