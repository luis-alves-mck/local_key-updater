#!/usr/bin/env ts-node

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { UseCase } from '../src/models/useCase.model';

interface ImportUseCaseData {
  use_case_name: string;
  openai_keys: Array<{
    key_name: string;
    model_name: string;
    key_priority: number;
  }>;
}

const importUseCases = async () => {
  try {
    console.log('🚀 Starting use cases import...');
    
    // Read the JSON file
    const filePath = path.join(__dirname, 'files', 'use-cases.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found: scripts/files/use-cases.json');
      console.log('💡 Please create the file with an array of use cases in the following format:');
      console.log(`[
  {
    "use_case_name": "example-use-case",
    "openai_keys": [
      {
        "key_name": "example-key",
        "model_name": "gpt-4",
        "key_priority": 1
      }
    ]
  }
]`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let useCasesData: ImportUseCaseData[];

    try {
      useCasesData = JSON.parse(fileContent);
    } catch (error) {
      console.error('❌ Invalid JSON format in use-cases.json');
      process.exit(1);
    }

    if (!Array.isArray(useCasesData)) {
      console.error('❌ JSON file must contain an array of use cases');
      process.exit(1);
    }

    console.log(`📄 Found ${useCasesData.length} use cases to import`);

    // Debug environment variables
    console.log('🔍 Debug - MONGODB_URI_DEV:', process.env.MONGODB_URI_DEV ? 'SET' : 'NOT SET');
    console.log('🔍 Debug - MONGODB_URI_DEV value:', process.env.MONGODB_URI_DEV?.substring(0, 50) + '...');

    // Connect to database (development environment)
    await connectDB('development');
    console.log('✅ Connected to database');

    // Validate and insert use cases
    const results = {
      inserted: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const useCaseData of useCasesData) {
      try {
        // Validate required fields
        if (!useCaseData.use_case_name) {
          results.errors.push(`Missing use_case_name in: ${JSON.stringify(useCaseData)}`);
          continue;
        }

        // Sort keys by priority
        if (useCaseData.openai_keys && useCaseData.openai_keys.length > 0) {
          useCaseData.openai_keys.sort((a, b) => a.key_priority - b.key_priority);
        }

        // Check if use case already exists
        const existingUseCase = await UseCase.findOne({ use_case_name: useCaseData.use_case_name });

        if (existingUseCase) {
          // Update existing use case, preserving model_name from existing keys
          const newKeys = useCaseData.openai_keys || [];
          const mergedKeys = newKeys.map(newKey => {
            const existingKey = existingUseCase.openai_keys.find(
              existing => existing.key_name === newKey.key_name
            );
            return {
              ...newKey,
              model_name: newKey.model_name || existingKey?.model_name
            };
          });
          
          existingUseCase.openai_keys = mergedKeys;
          await existingUseCase.save();
          console.log(`🔄 Updated use case: ${useCaseData.use_case_name} with ${useCaseData.openai_keys?.length || 0} keys`);
          results.updated++;
        } else {
          // Create new use case
          const newUseCase = new UseCase(useCaseData);
          await newUseCase.save();
          console.log(`✅ Inserted use case: ${useCaseData.use_case_name} with ${useCaseData.openai_keys?.length || 0} keys`);
          results.inserted++;
        }
      } catch (error) {
        const errorMsg = `Failed to process ${useCaseData.use_case_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    // Print summary
    console.log('\n📊 Import Summary:');
    console.log(`✅ Inserted: ${results.inserted}`);
    console.log(`🔄 Updated (already existed): ${results.updated}`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n🔍 Error Details:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n🎉 Import completed!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run the import
importUseCases().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});