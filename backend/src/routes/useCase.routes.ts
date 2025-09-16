import express from 'express';
import {
  getAllUseCases,
  getUseCaseByName,
  createUseCase,
  updateUseCase,
  deleteUseCase,
  addKeyToUseCase,
  removeKeyFromUseCase,
  updateKeyInUseCase,
  copyUseCaseToEnvironment,
  copyUseCaseToBothEnvironments
} from '../controllers/useCase.controller';

const router = express.Router();

// Use case routes
router.get('/', getAllUseCases);
router.get('/:useCaseName', getUseCaseByName);
router.post('/', createUseCase);
router.put('/:useCaseName', updateUseCase);
router.delete('/:useCaseName', deleteUseCase);

// Use case key management routes
router.post('/:useCaseName/keys', addKeyToUseCase);
router.delete('/:useCaseName/keys/:keyName/:modelName', removeKeyFromUseCase);
router.put('/:useCaseName/keys/:keyName/:modelName', updateKeyInUseCase);

// Use case copy routes
router.post('/copy/:useCaseName', copyUseCaseToEnvironment);
router.post('/copy/:useCaseName/both', copyUseCaseToBothEnvironments);

export default router; 