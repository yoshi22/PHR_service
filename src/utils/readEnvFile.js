// Simple script to read .env.local directly
const fs = require('fs');
const path = require('path');

try {
  // Get the current directory
  const currentDir = process.cwd();
  console.log(`Current directory: ${currentDir}`);
  
  // Path to .env.local
  const envPath = path.join(currentDir, '.env.local');
  
  // Check if file exists
  const fileExists = fs.existsSync(envPath);
  console.log(`.env.local exists: ${fileExists}`);
  
  if (fileExists) {
    // Read file content
    const content = fs.readFileSync(envPath, 'utf8');
    
    // Split by lines and mask values
    const lines = content.split('\n').map(line => {
      if (line.trim() === '' || line.startsWith('#')) {
        return line;
      }
      
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0];
        // Mask sensitive values like API keys and passwords
        return `${key}=***MASKED***`;
      }
      
      return line;
    });
    
    console.log('File content (with sensitive values masked):');
    console.log(lines.join('\n'));
    
    // Count variables
    const envVars = lines.filter(line => 
      line.includes('=') && 
      !line.startsWith('#') && 
      line.trim() !== ''
    );
    
    console.log(`\nFound ${envVars.length} environment variables`);
  }
} catch (error) {
  console.error('Error reading .env.local file:', error);
}
