#!/bin/bash

# PHRApp Test Files Cleanup Script
# This script safely removes all test files, test configurations, and test dependencies
# from the React Native + TypeScript project without touching production code.

set -e  # Exit on any error

echo "🧹 Starting PHRApp test cleanup..."

# Step 1: Remove __tests__ directories and their contents
echo "📁 Removing __tests__ directories..."
find . -name "__tests__" -type d -not -path "./node_modules/*" -not -path "./functions/node_modules/*" | while read dir; do
    echo "  Removing: $dir"
    rm -rf "$dir"
done

# Step 2: Remove individual test and spec files
echo "🔍 Removing *.test.* and *.spec.* files..."
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" \
    -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" -o -name "*.spec.jsx" \) \
    -not -path "./node_modules/*" -not -path "./functions/node_modules/*" | while read file; do
    echo "  Removing: $file"
    rm -f "$file"
done

# Step 3: Remove Jest configuration files
echo "⚙️ Removing Jest configuration files..."
if [ -f "jest.config.js" ]; then
    echo "  Removing: jest.config.js"
    rm -f "jest.config.js"
fi
if [ -f "jest.config.json" ]; then
    echo "  Removing: jest.config.json"  
    rm -f "jest.config.json"
fi

# Step 4: Clean up package.json - Remove test scripts
echo "📦 Cleaning package.json test scripts..."
if [ -f "package.json" ]; then
    # Create backup
    cp package.json package.json.backup
    
    # Remove test scripts using Node.js for better JSON handling
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Remove test scripts
        if (pkg.scripts) {
            delete pkg.scripts.test;
            delete pkg.scripts['test:watch'];
            delete pkg.scripts['test:ci'];
            delete pkg.scripts['test:coverage'];
            delete pkg.scripts['test:debug'];
        }
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ Removed test scripts from package.json');
    "
fi

# Step 5: Remove test dependencies from package.json
echo "📦 Removing test dependencies from package.json..."
if [ -f "package.json" ]; then
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // List of test-related dependencies to remove
        const testDeps = [
            '@testing-library/jest-native',
            '@testing-library/react-native', 
            '@types/jest',
            'babel-jest',
            'jest',
            'jest-environment-jsdom',
            'jest-environment-node',
            'react-test-renderer',
            'ts-jest',
            '@testing-library/jest-dom',
            '@testing-library/user-event'
        ];
        
        let removed = [];
        
        // Remove from devDependencies
        if (pkg.devDependencies) {
            testDeps.forEach(dep => {
                if (pkg.devDependencies[dep]) {
                    delete pkg.devDependencies[dep];
                    removed.push(dep);
                }
            });
        }
        
        // Remove from dependencies (in case any are there)
        if (pkg.dependencies) {
            testDeps.forEach(dep => {
                if (pkg.dependencies[dep]) {
                    delete pkg.dependencies[dep];
                    removed.push(dep);
                }
            });
        }
        
        // Remove jest configuration from package.json
        delete pkg.jest;
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ Removed test dependencies: ' + removed.join(', '));
    "
fi

# Step 6: Remove test-related imports from source files
echo "🔍 Scanning source files for test imports..."
find ./src -name "*.ts" -o -name "*.tsx" | while read file; do
    # Check if file contains test-related imports
    if grep -q "from.*jest\|from.*@testing-library\|from.*\.\./.*__tests__\|import.*jest\|import.*@testing-library" "$file" 2>/dev/null; then
        echo "  ⚠️  Found test imports in: $file"
        echo "    Please manually review and remove test imports from this file"
    fi
done

# Step 7: Clean up babel.config.js if it has jest-specific configuration
echo "⚙️ Checking babel.config.js for jest configuration..."
if [ -f "babel.config.js" ]; then
    if grep -q "jest\|test" "babel.config.js" 2>/dev/null; then
        echo "  ⚠️  babel.config.js contains jest/test configuration"
        echo "    Please manually review babel.config.js and remove jest-specific settings"
    fi
fi

# Step 8: Verification
echo "🔍 Verification - Checking for remaining test files..."
remaining_tests=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" -type d 2>/dev/null | grep -v node_modules | wc -l)
if [ "$remaining_tests" -gt 0 ]; then
    echo "  ⚠️  Found $remaining_tests remaining test files/directories:"
    find . -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" -type d 2>/dev/null | grep -v node_modules
else
    echo "  ✅ No test files found"
fi

echo ""
echo "🎉 Test cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to update dependencies"
echo "2. Review any files mentioned above for manual cleanup"
echo "3. Test that your app still builds and runs correctly"
echo "4. Commit the changes: git add . && git commit -m 'Remove all test files and dependencies'"
echo ""
echo "📄 A backup of package.json was created as package.json.backup"