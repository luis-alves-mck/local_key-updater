import express from 'express';
import { KeyController } from '../controllers/key.controller';
import { validateKey } from '../middleware/validation';

const router = express.Router();

// Key routes
router.get('/', KeyController.getAllKeys);
router.get('/:id', KeyController.getKeyById);
router.get('/name/:keyName', KeyController.getKeyByName);
router.post('/', validateKey, KeyController.createKey);
router.put('/:keyName', KeyController.updateKey);
router.delete('/:keyName', KeyController.deleteKey);
router.put('/:id/expiration', KeyController.updateExpiration);
router.post('/copy/:keyName/both', KeyController.copyKeyToBothEnvironments);
router.post('/copy/:keyName', KeyController.copyKeyToEnvironment);
router.post('/:keyName/service-account', KeyController.checkServiceAccount);

export default router; 