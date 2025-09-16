import { Request, Response } from 'express';
import { UseCase, IOpenAIKey } from '../models/useCase.model';
import { handleError } from '../utils/errorHandler';
import { connectDB, getCurrentEnvironmentName } from '../config/database';
import { environments } from '../config/environments';

/**
 * Helper function to copy a use case to a specific environment
 */
const copyUseCaseToSingleEnvironment = async (useCaseName: string, targetEnvironment: string, sourceUseCase: any, originalEnv: string) => {
  try {
    // Switch to target environment
    await connectDB(targetEnvironment);
    
    // Check if use case already exists in target environment
    const existingUseCase = await UseCase.findOne({ use_case_name: useCaseName });
    let savedUseCase;
    
    if (existingUseCase) {
      // Update existing use case with new data
      existingUseCase.openai_keys = sourceUseCase.openai_keys;
      // Sort by priority
      existingUseCase.openai_keys.sort((a, b) => a.key_priority - b.key_priority);
      savedUseCase = await existingUseCase.save();
    } else {
      // Create new use case
      const useCaseData = {
        use_case_name: sourceUseCase.use_case_name,
        openai_keys: sourceUseCase.openai_keys
      };
      // Sort by priority
      useCaseData.openai_keys.sort((a: IOpenAIKey, b: IOpenAIKey) => a.key_priority - b.key_priority);
      savedUseCase = await UseCase.create(useCaseData);
    }
    
    return savedUseCase;
  } finally {
    // Switch back to original environment
    await connectDB(originalEnv);
  }
};

/**
 * Get all use cases
 * @route GET /api/use-cases
 */
export const getAllUseCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCases = await UseCase.find();
    
    // Sort keys by priority for each use case
    useCases.forEach(useCase => {
      if (useCase.openai_keys) {
        useCase.openai_keys.sort((a: IOpenAIKey, b: IOpenAIKey) => a.key_priority - b.key_priority);
      }
    });
    
    res.json(useCases);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get a single use case by name
 * @route GET /api/use-cases/:useCaseName
 */
export const getUseCaseByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = await UseCase.findOne({ use_case_name: req.params.useCaseName });
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }
    
    // Sort keys by priority
    if (useCase.openai_keys) {
      useCase.openai_keys.sort((a, b) => a.key_priority - b.key_priority);
    }
    
    res.json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Create a new use case
 * @route POST /api/use-cases
 */
export const createUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new UseCase(req.body);
    await useCase.save();
    res.status(201).json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Update a use case
 * @route PUT /api/use-cases/:useCaseName
 */
export const updateUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = await UseCase.findOneAndUpdate(
      { use_case_name: req.params.useCaseName },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }
    
    res.json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Delete a use case
 * @route DELETE /api/use-cases/:useCaseName
 */
export const deleteUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = await UseCase.findOneAndDelete({ use_case_name: req.params.useCaseName });
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }
    res.json({ message: 'Use case deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Add a key to a use case
 * @route POST /api/use-cases/:useCaseName/keys
 */
export const addKeyToUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key_name, model_name, key_priority } = req.body;
    
    if (!key_name || !model_name || !key_priority) {
      res.status(400).json({ message: 'key_name, model_name, and key_priority are required' });
      return;
    }

    const useCase = await UseCase.findOne({ use_case_name: req.params.useCaseName });
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }

    // Check if key already exists in this use case
    const existingKey = useCase.openai_keys.find(k => k.key_name === key_name && k.model_name === model_name);
    if (existingKey) {
      res.status(400).json({ message: 'Key with this model already exists in use case' });
      return;
    }

    // Add the new key
    useCase.openai_keys.push({ key_name, model_name, key_priority });
    
    // Sort by priority (ascending)
    useCase.openai_keys.sort((a, b) => a.key_priority - b.key_priority);
    
    await useCase.save();
    
    res.json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Remove a key from a use case
 * @route DELETE /api/use-cases/:useCaseName/keys/:keyName/:modelName
 */
export const removeKeyFromUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { useCaseName, keyName, modelName } = req.params;
    
    const useCase = await UseCase.findOne({ use_case_name: useCaseName });
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }

    // Find and remove the key
    const keyIndex = useCase.openai_keys.findIndex(k => k.key_name === keyName && k.model_name === modelName);
    if (keyIndex === -1) {
      res.status(404).json({ message: 'Key not found in use case' });
      return;
    }

    useCase.openai_keys.splice(keyIndex, 1);
    
    // Sort by priority (ascending)
    useCase.openai_keys.sort((a, b) => a.key_priority - b.key_priority);
    
    await useCase.save();
    
    res.json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Update a key in a use case
 * @route PUT /api/use-cases/:useCaseName/keys/:keyName/:modelName
 */
export const updateKeyInUseCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { useCaseName, keyName, modelName } = req.params;
    const { key_priority, new_model_name } = req.body;
    
    const useCase = await UseCase.findOne({ use_case_name: useCaseName });
    if (!useCase) {
      res.status(404).json({ message: 'Use case not found' });
      return;
    }

    // Find the key to update
    const keyIndex = useCase.openai_keys.findIndex(k => k.key_name === keyName && k.model_name === modelName);
    if (keyIndex === -1) {
      res.status(404).json({ message: 'Key not found in use case' });
      return;
    }

    // Update the key
    if (key_priority !== undefined) {
      useCase.openai_keys[keyIndex].key_priority = key_priority;
    }
    if (new_model_name !== undefined) {
      useCase.openai_keys[keyIndex].model_name = new_model_name;
    }

    // Sort by priority (ascending)
    useCase.openai_keys.sort((a, b) => a.key_priority - b.key_priority);

    await useCase.save();
    res.json(useCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Copy a use case to another environment
 * @route POST /api/use-cases/copy/:useCaseName
 */
export const copyUseCaseToEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { useCaseName } = req.params;
    const { targetEnvironment } = req.body;
    
    if (!targetEnvironment) {
      res.status(400).json({ message: 'Target environment is required' });
      return;
    }
    
    // Validate target environment exists
    const validEnvironments = environments.map(env => env.name);
    if (!validEnvironments.includes(targetEnvironment)) {
      res.status(400).json({ message: 'Invalid target environment' });
      return;
    }
    
    // Store original environment
    const originalEnv = getCurrentEnvironmentName();
    
    if (originalEnv === targetEnvironment) {
      res.status(400).json({ message: 'Target environment cannot be the same as source environment' });
      return;
    }
    
    // Get source use case from development environment
    const sourceUseCase = await UseCase.findOne({ use_case_name: useCaseName });
    
    if (!sourceUseCase) {
      res.status(404).json({ 
        message: `Use case '${useCaseName}' not found in development environment. Please ensure the use case exists before attempting to copy.` 
      });
      return;
    }
    
    // Use the helper function to copy the use case
    const copiedUseCase = await copyUseCaseToSingleEnvironment(useCaseName, targetEnvironment, sourceUseCase, originalEnv);
    
    res.status(201).json(copiedUseCase);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Copy a use case to both staging and production environments
 * @route POST /api/use-cases/copy/:useCaseName/both
 */
export const copyUseCaseToBothEnvironments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { useCaseName } = req.params;
    const targetEnvironments = ['staging', 'production'];
    
    // Validate environments exist
    const validEnvironments = environments.map(env => env.name);
    const invalidEnvs = targetEnvironments.filter(env => !validEnvironments.includes(env));
    if (invalidEnvs.length > 0) {
      res.status(500).json({ 
        message: `Invalid environments configured: ${invalidEnvs.join(', ')}` 
      });
      return;
    }
    
    // Store original environment
    const originalEnv = getCurrentEnvironmentName();
    
    // Get source use case from development environment
    const sourceUseCase = await UseCase.findOne({ use_case_name: useCaseName });
    
    if (!sourceUseCase) {
      res.status(404).json({ 
        message: `Use case '${useCaseName}' not found in development environment. Please ensure the use case exists before attempting to copy.` 
      });
      return;
    }
    
    const results: Array<{ environment: string; success: boolean; data?: any; error?: string }> = [];
    
    // Copy to each environment sequentially
    for (const targetEnv of targetEnvironments) {
      try {
        const copiedUseCase = await copyUseCaseToSingleEnvironment(useCaseName, targetEnv, sourceUseCase, originalEnv);
        results.push({ 
          environment: targetEnv, 
          success: true, 
          data: copiedUseCase 
        });
      } catch (error) {
        results.push({ 
          environment: targetEnv, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Determine response based on results
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      res.status(201).json({ 
        message: 'Use case successfully copied to both environments', 
        results 
      });
    } else if (successCount > 0) {
      res.status(207).json({ 
        message: `Use case copied to ${successCount}/${totalCount} environments`, 
        results 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to copy use case to any environment', 
        results 
      });
    }
  } catch (error) {
    handleError(res, error);
  }
}; 