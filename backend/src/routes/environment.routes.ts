import express from 'express';
import { environments } from '../config/environments';
import { connectDB, getCurrentConnection, getCurrentEnvironmentName } from '../config/database';

const router = express.Router();

// Get all available environments
router.get('/', (req, res) => {
  res.json(environments.map(env => ({
    name: env.name,
    displayName: env.displayName
  })));
});

// Get current environment
router.get('/current', (req, res) => {
  const connection = getCurrentConnection();
  if (!connection) {
    res.status(500).json({ message: 'No active database connection' });
    return;
  }

  const currentEnvName = getCurrentEnvironmentName();
  const currentEnv = environments.find(env => env.name === currentEnvName);

  if (!currentEnv) {
    res.status(500).json({ message: 'Could not determine current environment' });
    return;
  }

  res.json({
    name: currentEnv.name,
    displayName: currentEnv.displayName
  });
});

// Switch to a different environment
router.post('/switch/:environmentName', async (req, res) => {
  try {
    const { environmentName } = req.params;
    await connectDB(environmentName);
    res.json({ message: `Switched to ${environmentName} environment successfully` });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to switch environment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 