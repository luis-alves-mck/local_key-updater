import { Request, Response } from 'express';
import { Key } from '../models/key.model';
import { UseCase } from '../models/useCase.model';
import { handleError } from '../utils/errorHandler';
import { connectDB, getCurrentEnvironmentName } from '../config/database';
import { environments } from '../config/environments';

/**
 * Helper function to copy a key to a specific environment
 */
const copyKeyToSingleEnvironment = async (keyName: string, targetEnvironment: string, sourceKey: any, useCasesWithKey: any[], originalEnv: string) => {
  try {
    // Switch to target environment
    await connectDB(targetEnvironment);

    // Check if key already exists in target environment
    const existingKey = await Key.findOne({ key_name: keyName });
    let savedKey;

    if (existingKey) {
      // Update existing key with new data
      const sourceKeyObj = sourceKey.toObject();
      savedKey = await Key.findOneAndUpdate(
        { key_name: keyName },
        {
          key_secrets_data: sourceKeyObj.key_secrets_data,
          available_models: sourceKeyObj.available_models,
          is_work_with_embeddings: sourceKeyObj.is_work_with_embeddings,
          expires_at: sourceKeyObj.expires_at,
          environment: targetEnvironment,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create a new key in the target environment
      const sourceKeyObj = sourceKey.toObject();
      const newKey = new Key({
        key_name: sourceKeyObj.key_name,
        key_secrets_data: sourceKeyObj.key_secrets_data,
        available_models: sourceKeyObj.available_models,
        is_work_with_embeddings: sourceKeyObj.is_work_with_embeddings,
        expires_at: sourceKeyObj.expires_at,
        environment: targetEnvironment,
        created_at: new Date(),
        updated_at: new Date()
      });

      savedKey = await newKey.save();
    }

    if (!savedKey) {
      throw new Error('Failed to save key');
    }

    // Handle use cases in target environment
    for (const useCase of useCasesWithKey) {
      const existingUseCase = await UseCase.findOne({
        use_case_name: useCase.use_case_name
      });

      if (existingUseCase) {
        // Update existing use case with new key
        const keyInfo = useCase.openai_keys.find((k: any) => k.key_name === keyName);
        if (keyInfo) {
          await UseCase.updateOne(
            { _id: existingUseCase._id },
            { 
              $addToSet: { 
                openai_keys: {
                  key_name: keyName,
                  model_name: keyInfo.model_name,
                  key_priority: keyInfo.key_priority
                }
              }
            }
          );
        }
      } else {
        // Create new use case with key
        const newUseCase = new UseCase({
          use_case_name: useCase.use_case_name,
          openai_keys: useCase.openai_keys.filter((k: any) => k.key_name === keyName).map((k: any) => ({
            key_name: keyName,
            model_name: k.model_name,
            key_priority: k.key_priority
          }))
        });
        await newUseCase.save();
      }
    }

    const keyObj = savedKey.toObject();
    if (keyObj.key_secrets_data) {
      keyObj.key_secrets_data.api_key = savedKey.getMaskedValue();
    }

    // Switch back to original environment
    await connectDB(originalEnv);

    return keyObj;
  } catch (error) {
    // Ensure we switch back to original environment even if there's an error
    try {
      await connectDB(originalEnv);
    } catch (envError) {
      console.error('Failed to switch back to original environment:', envError);
    }
    throw error;
  }
};

export const KeyController = {
  /**
   * Get all keys
   * @route GET /api/keys
   */
  getAllKeys: async (req: Request, res: Response): Promise<void> => {
    try {
      const keys = await Key.find();
      const maskedKeys = keys.map(key => {
        const keyObj = key.toObject();
        // Ensure key_secrets_data exists before trying to set api_key
        if (keyObj.key_secrets_data) {
          keyObj.key_secrets_data.api_key = key.getMaskedValue();
        }
        return keyObj;
      });
      res.json(maskedKeys);
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Get a key by ID
   * @route GET /api/keys/:id
   */
  getKeyById: async (req: Request, res: Response): Promise<void> => {
    try {
      const key = await Key.findById(req.params.id);
      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }
      // Return the full key object without masking for editing
      res.json(key.toObject());
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Get a single key by name
   * @route GET /api/keys/:keyName
   */
  getKeyByName: async (req: Request, res: Response): Promise<void> => {
    try {
      const key = await Key.findOne({ key_name: req.params.keyName });
      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }
      const keyObj = key.toObject();
      if (keyObj.key_secrets_data) {
        keyObj.key_secrets_data.api_key = key.getMaskedValue();
      }
      res.json(keyObj);
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Update a key
   * @route PUT /api/keys/:keyName
   */
  updateKey: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(req.params)
      const key = await Key.findOneAndUpdate(
        { key_name: req.params.keyName },
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }
      
      const keyObj = key.toObject();
      if (keyObj.key_secrets_data) {
        keyObj.key_secrets_data.api_key = key.getMaskedValue();
      }
      res.json(keyObj);
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Create a new key
   * @route POST /api/keys
   */
  createKey: async (req: Request, res: Response): Promise<void> => {
    try {
      const key = new Key(req.body);
      await key.save();
      const keyObj = key.toObject();
      if (keyObj.key_secrets_data) {
        keyObj.key_secrets_data.api_key = key.getMaskedValue();
      }
      res.status(201).json(keyObj);
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Delete a key
   * @route DELETE /api/keys/:keyName
   */
  deleteKey: async (req: Request, res: Response): Promise<void> => {
    try {
      const key = await Key.findOneAndDelete({ key_name: req.params.keyName });
      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }
      res.json({ message: 'Key deleted successfully' });
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Update key expiration date
   * @route PUT /api/keys/:id/expiration
   */
  updateExpiration: async (req: Request, res: Response): Promise<void> => {
    try {
      const { days } = req.body;
      if (!days || typeof days !== 'number' || days < 0) {
        res.status(400).json({ message: 'Invalid number of days' });
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const key = await Key.findByIdAndUpdate(
        req.params.id,
        { expires_at: expirationDate },
        { new: true }
      );

      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }

      const keyObj = key.toObject();
      if (keyObj.key_secrets_data) {
        keyObj.key_secrets_data.api_key = key.getMaskedValue();
      }
      res.json(keyObj);
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Copy a key to another environment
   * @route POST /api/keys/copy/:keyName
   */
  copyKeyToEnvironment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyName } = req.params;
      const { targetEnvironment } = req.body;

      if (!targetEnvironment) {
        res.status(400).json({ message: 'Target environment is required' });
        return;
      }

      // Validate target environment exists
      const validEnvironments = environments.map(env => env.name);
      if (!validEnvironments.includes(targetEnvironment)) {
        res.status(400).json({ 
          message: `Invalid target environment. Valid options: ${validEnvironments.join(', ')}` 
        });
        return;
      }

      // Validate we're in development environment
      const originalEnv = getCurrentEnvironmentName();
      if (originalEnv !== 'development') {
        res.status(403).json({ 
          message: `Copy operation not allowed. Currently connected to '${originalEnv}' environment. Keys can only be copied from development environment.` 
        });
        return;
      }

      // Get all data we need from development environment
      const [sourceKey, useCasesWithKey] = await Promise.all([
        Key.findOne({ key_name: keyName }),
        UseCase.find({ 'openai_keys.key_name': keyName })
      ]);

      if (!sourceKey) {
        res.status(404).json({ 
          message: `Key '${keyName}' not found in development environment. Please ensure the key exists before attempting to copy.` 
        });
        return;
      }

      // Use the helper function to copy the key
      const keyObj = await copyKeyToSingleEnvironment(keyName, targetEnvironment, sourceKey, useCasesWithKey, originalEnv);
      
      res.status(201).json(keyObj);
    } catch (error) {      
      handleError(res, error);
    }
  },

  /**
   * Copy a key to both staging and production environments
   * @route POST /api/keys/copy/:keyName/both
   */
  copyKeyToBothEnvironments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyName } = req.params;
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
      const results = [];

      // Validate we're in development environment
      const originalEnv = getCurrentEnvironmentName();
      if (originalEnv !== 'development') {
        res.status(403).json({ 
          message: `Copy operation not allowed. Currently connected to '${originalEnv}' environment. Keys can only be copied from development environment.` 
        });
        return;
      }

      // Get all data we need from development environment
      const [sourceKey, useCasesWithKey] = await Promise.all([
        Key.findOne({ key_name: keyName }),
        UseCase.find({ 'openai_keys.key_name': keyName })
      ]);

      if (!sourceKey) {
        res.status(404).json({ 
          message: `Key '${keyName}' not found in development environment. Please ensure the key exists before attempting to copy.` 
        });
        return;
      }

      // Copy to each environment sequentially
      for (const targetEnv of targetEnvironments) {
        try {
          const keyObj = await copyKeyToSingleEnvironment(keyName, targetEnv, sourceKey, useCasesWithKey, originalEnv);
          results.push({ 
            environment: targetEnv, 
            success: true, 
            data: keyObj 
          });
        } catch (error) {
          results.push({ 
            environment: targetEnv, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        res.status(201).json({ 
          message: 'Key successfully copied to both environments', 
          results 
        });
      } else if (successCount > 0) {
        res.status(207).json({ 
          message: `Key copied to ${successCount}/${totalCount} environments`, 
          results 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to copy key to any environment', 
          results 
        });
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  /**
   * Check service account credentials
   * @route POST /api/keys/:keyName/service-account
   */
  checkServiceAccount: async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyName } = req.params;
      
      // Get the key from database
      const key = await Key.findOne({ key_name: keyName });
      if (!key) {
        res.status(404).json({ message: 'Key not found' });
        return;
      }

      // Extract instance ID from api_base_url
      const extractInstanceId = (apiBaseUrl: string): string => {
        let url = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
        
        // Remove /v1 suffix if present
        if (url.endsWith('/v1')) {
          url = url.slice(0, -3);
        }
        
        const segments = url.split('/');
        return segments[segments.length - 1];
      };

      const instanceId = extractInstanceId(key.key_secrets_data.api_base_url);
      const authToken = key.key_secrets_data.api_key;

      console.log(instanceId)

      // Make the external API call
      const response = await fetch('https://service-account.prod.ai-gateway.quantumblack.com/api/service-account-credentials', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Instance-Id': instanceId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          if (errorText.trim()) {
            errorMessage = errorText;
          }
        }
        
        res.status(response.status).json({ error: errorMessage });
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  }
};

export default KeyController; 