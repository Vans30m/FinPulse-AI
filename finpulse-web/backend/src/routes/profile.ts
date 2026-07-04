import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Profile stub' }));
export default router;
