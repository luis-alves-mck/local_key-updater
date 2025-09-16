import mongoose from "mongoose";
const fs = require('fs');
const path = require('path');
import { Environment, getEnvironmentByName } from './environments';

let currentConnection: mongoose.Connection | null = null;
let currentEnvironmentName: string = 'development';

/**
 * Connect to MongoDB database for a specific environment
 */
export const connectDB = async (environmentName: string = 'development'): Promise<void> => {
  try {
    const environment = getEnvironmentByName(environmentName);
    if (!environment) {
      throw new Error(`Environment ${environmentName} not found`);
    }

    if (!environment.mongodbUri) {
      throw new Error(`MongoDB URI not configured for environment ${environmentName}`);
    }

    // If there's an existing connection, close it
    if (currentConnection) {
      await currentConnection.close();
    }

    const clientOptions = {
      dbName: "pepi",
      tlsCertificateKeyFile: path.resolve('./../../certificates', environment.certificateName),
    };

    const conn = await mongoose.connect(environment.mongodbUri, clientOptions);
    currentConnection = conn.connection;
    currentEnvironmentName = environmentName;
    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log(`MongoDB Connected to ${environment.displayName}: ${conn.connection.host}`);

    // Global middleware to intercept all save operations (DISABLED FOR PRODUCTION)
    // mongoose.plugin(schema => {
    //   schema.pre('save', function(next) {
    //     console.log('MOCK SAVE:', this);
    //     // Skip the actual save operation
    //     this.$locals.skipSave = true;
    //     next(new Error('Save prevented for debugging'));
    //     // Or just log and continue without error
    //     // next();
    //   });
    // });
  } catch (error) {
    console.error(
      `Error connecting to DB: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
};

/**
 * Get the current database connection
 */
export const getCurrentConnection = (): mongoose.Connection | null => {
  return currentConnection;
};

/**
 * Get the current environment name
 */
export const getCurrentEnvironmentName = (): string => {
  return currentEnvironmentName;
};
