export interface Environment {
  name: string;
  mongodbUri: string;
  displayName: string;
  certificateName: string;
}

export const environments: Environment[] = [
  {
    name: 'development',
    mongodbUri: process.env.MONGODB_URI_DEV || '',
    displayName: 'Development',
    certificateName: 'X509-cert-alpha-global.pem'
  },
  {
    name: 'staging',
    mongodbUri: process.env.MONGODB_URI_STAGING || '',
    displayName: 'Beta',
    certificateName: 'pepi_beta_global.pem'
  },
  {
    name: 'production',
    mongodbUri: process.env.MONGODB_URI_PROD || '',
    displayName: 'Production',
    certificateName: 'pepi_prod_global.pem'
  }
];

export const getEnvironmentByName = (name: string): Environment | undefined => {
  return environments.find(env => env.name === name);
}; 