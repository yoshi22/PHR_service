#!/bin/bash

# PHRApp Enhanced Test Cleanup Script
# Comprehensive removal of all test files, configurations, and dependencies
# This script safely removes all test-related content without touching production code

set -e  # Exit on any error

echo "🧹 Starting ENHANCED PHRApp test cleanup..."
echo "📍 Working directory: $(pwd)"

# Create a backup directory with timestamp
BACKUP_DIR="./test-cleanup-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Created backup directory: $BACKUP_DIR"

# Step 1: Backup critical files before modification
echo "📋 Creating backups of critical files..."
[ -f "package.json" ] && cp "package.json" "$BACKUP_DIR/package.json.backup"
[ -f "babel.config.js" ] && cp "babel.config.js" "$BACKUP_DIR/babel.config.js.backup"
[ -f "config/babel.config.js" ] && cp "config/babel.config.js" "$BACKUP_DIR/babel.config.js.config.backup"
[ -f "tsconfig.json" ] && cp "tsconfig.json" "$BACKUP_DIR/tsconfig.json.backup"

# Step 2: Remove __tests__ directories (more comprehensive patterns)
echo "📁 Removing __tests__ directories..."
find . -name "__tests__" -type d \
    -not -path "./node_modules/*" \
    -not -path "./functions/node_modules/*" \
    -not -path "./ios/Pods/*" \
    -not -path "./android/.gradle/*" \
    -not -path "./.git/*" | while read dir; do
    echo "  🗑️  Removing directory: $dir"
    rm -rf "$dir"
done

# Step 3: Remove test and spec files (comprehensive file patterns)
echo "🔍 Removing test and spec files..."
find . -type f \( \
    -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" \
    -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" -o -name "*.spec.jsx" \
    -o -name "*Test.ts" -o -name "*Test.tsx" -o -name "*Test.js" -o -name "*Test.jsx" \
    -o -name "*Spec.ts" -o -name "*Spec.tsx" -o -name "*Spec.js" -o -name "*Spec.jsx" \
    -o -name "*.tests.ts" -o -name "*.tests.tsx" -o -name "*.tests.js" -o -name "*.tests.jsx" \
    \) \
    -not -path "./node_modules/*" \
    -not -path "./functions/node_modules/*" \
    -not -path "./ios/Pods/*" \
    -not -path "./android/.gradle/*" \
    -not -path "./.git/*" | while read file; do
    echo "  🗑️  Removing file: $file"
    rm -f "$file"
done

# Step 4: Remove test directories with various names
echo "📂 Removing various test directories..."
find . -type d \( \
    -name "tests" -o -name "test" -o -name "testing" \
    -o -name "__test__" -o -name "__testing__" \
    -o -name "spec" -o -name "specs" \
    \) \
    -not -path "./node_modules/*" \
    -not -path "./functions/node_modules/*" \
    -not -path "./ios/Pods/*" \
    -not -path "./android/.gradle/*" \
    -not -path "./.git/*" | while read dir; do
    echo "  🗑️  Removing test directory: $dir"
    rm -rf "$dir"
done

# Step 5: Remove Jest and test configuration files
echo "⚙️ Removing test configuration files..."
for config_file in \
    "jest.config.js" "jest.config.json" "jest.config.ts" \
    "jest.setup.js" "jest.setup.ts" \
    "setupTests.js" "setupTests.ts" \
    "test.config.js" "test.config.json" \
    "vitest.config.js" "vitest.config.ts" \
    ".jestrc" ".jestrc.json" ".jestrc.js"; do
    if [ -f "$config_file" ]; then
        echo "  🗑️  Removing: $config_file"
        rm -f "$config_file"
    fi
done

# Step 6: Clean package.json - Remove test scripts and dependencies
echo "📦 Cleaning package.json..."
if [ -f "package.json" ]; then
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let changes = [];
        
        // Remove test scripts
        if (pkg.scripts) {
            const testScripts = [
                'test', 'test:watch', 'test:ci', 'test:coverage', 'test:debug',
                'test:unit', 'test:integration', 'test:e2e', 'tests',
                'jest', 'jest:watch', 'jest:coverage',
                'vitest', 'spec', 'specs'
            ];
            
            testScripts.forEach(script => {
                if (pkg.scripts[script]) {
                    delete pkg.scripts[script];
                    changes.push('Removed script: ' + script);
                }
            });
        }
        
        // Remove test dependencies
        const testDeps = [
            // Jest ecosystem
            'jest', '@types/jest', 'babel-jest', 'ts-jest', 'jest-environment-jsdom',
            'jest-environment-node', 'jest-canvas-mock', 'jest-serializer-vue',
            'jest-transform-stub', 'jest-watch-typeahead',
            
            // Testing Library ecosystem  
            '@testing-library/jest-native', '@testing-library/react-native',
            '@testing-library/jest-dom', '@testing-library/user-event',
            '@testing-library/react', '@testing-library/react-hooks',
            
            // React Testing
            'react-test-renderer', 'enzyme', 'enzyme-adapter-react-16',
            'enzyme-adapter-react-17', 'enzyme-to-json',
            
            // Other test frameworks
            'vitest', 'mocha', 'chai', 'sinon', 'ava', 'tape',
            'jasmine', 'karma', 'karma-chrome-launcher', 'karma-webpack',
            
            // Test utilities
            'jsdom', 'happy-dom', 'puppeteer', 'playwright',
            'selenium-webdriver', '@playwright/test',
            
            // Mock libraries
            'mock-fs', 'nock', 'sinon', 'jest-mock',
            
            // Coverage tools
            'nyc', 'c8', 'istanbul', 'babel-plugin-istanbul'
        ];
        
        ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
            if (pkg[depType]) {
                testDeps.forEach(dep => {
                    if (pkg[depType][dep]) {
                        delete pkg[depType][dep];
                        changes.push('Removed ' + depType + ': ' + dep);
                    }
                });
            }
        });
        
        // Remove jest configuration from package.json
        if (pkg.jest) {
            delete pkg.jest;
            changes.push('Removed jest configuration');
        }
        
        // Remove other test configurations
        ['vitest', 'ava', 'mocha'].forEach(config => {
            if (pkg[config]) {
                delete pkg[config];
                changes.push('Removed ' + config + ' configuration');
            }
        });
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        
        if (changes.length > 0) {
            console.log('✅ Package.json changes:');
            changes.forEach(change => console.log('   - ' + change));
        } else {
            console.log('✅ No test dependencies found in package.json');
        }
    "
fi

# Step 7: Clean babel.config.js files of test-specific configuration
echo "⚙️ Cleaning babel configuration files..."
for babel_file in "babel.config.js" "config/babel.config.js" ".babelrc" ".babelrc.js"; do
    if [ -f "$babel_file" ]; then
        if grep -q "jest\|test\|@testing-library" "$babel_file" 2>/dev/null; then
            echo "  ⚠️  $babel_file contains test configuration"
            echo "    Creating backup and cleaning..."
            cp "$babel_file" "$BACKUP_DIR/$(basename $babel_file).original"
            
            # Remove jest-specific presets and plugins
            node -e "
                const fs = require('fs');
                let content = fs.readFileSync('$babel_file', 'utf8');
                
                // Remove common jest-related babel configurations
                content = content.replace(/['\"]jest['\"]\\s*:[^,}]+[,]?/g, '');
                content = content.replace(/['\"]@testing-library[^'\"]*['\"]\\s*:[^,}]+[,]?/g, '');
                content = content.replace(/test\\s*:\\s*{[^}]*}/g, '');
                
                fs.writeFileSync('$babel_file', content);
                console.log('  ✅ Cleaned: $babel_file');
            " 2>/dev/null || echo "  ⚠️  Manual review needed for: $babel_file"
        fi
    fi
done

# Step 8: Scan and report test imports in source files
echo "🔍 Scanning source files for test imports..."
test_imports_found=false
find ./src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    if grep -l "from.*jest\|from.*@testing-library\|from.*vitest\|from.*mocha\|from.*chai\|import.*jest\|import.*@testing-library\|describe\\(\|it\\(\|test\\(\|expect\\(" "$file" 2>/dev/null; then
        echo "  ⚠️  Test imports/syntax found in: $file"
        grep -n "from.*jest\|from.*@testing-library\|from.*vitest\|import.*jest\|import.*@testing-library\|describe\\(\|it\\(\|test\\(\|expect\\(" "$file" 2>/dev/null | head -3
        test_imports_found=true
    fi
done

# Step 9: Remove TypeScript test-specific configuration
echo "⚙️ Cleaning TypeScript configuration..."
for ts_file in "tsconfig.json" "tsconfig.test.json"; do
    if [ -f "$ts_file" ]; then
        if grep -q "jest\|@types/jest" "$ts_file" 2>/dev/null; then
            echo "  ⚠️  $ts_file contains jest types"
            node -e "
                const fs = require('fs');
                const content = fs.readFileSync('$ts_file', 'utf8');
                const config = JSON.parse(content);
                
                if (config.compilerOptions && config.compilerOptions.types) {
                    config.compilerOptions.types = config.compilerOptions.types.filter(
                        type => !type.includes('jest') && !type.includes('testing-library')
                    );
                    if (config.compilerOptions.types.length === 0) {
                        delete config.compilerOptions.types;
                    }
                }
                
                fs.writeFileSync('$ts_file', JSON.stringify(config, null, 2) + '\n');
                console.log('  ✅ Cleaned jest types from: $ts_file');
            " 2>/dev/null || echo "  ⚠️  Manual review needed for: $ts_file"
        fi
    fi
done

# Step 10: Remove old test cleanup scripts (except this one)
echo "🧹 Removing old cleanup scripts..."
find . -name "cleanup-tests.js" -o -name "cleanup-tests.sh" -not -name "cleanup-tests-enhanced.sh" | while read script; do
    echo "  🗑️  Removing old cleanup script: $script"
    rm -f "$script"
done

# Step 11: Final verification
echo "🔍 Final verification..."
remaining_files=()

# Check for remaining test files
while IFS= read -r -d '' file; do
    remaining_files+=("$file")
done < <(find . \( \
    -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" -type d \
    -o -name "tests" -type d -o -name "test" -type d \
    \) \
    -not -path "./node_modules/*" \
    -not -path "./functions/node_modules/*" \
    -not -path "./ios/Pods/*" \
    -not -path "./android/.gradle/*" \
    -not -path "./.git/*" \
    -print0 2>/dev/null)

if [ ${#remaining_files[@]} -gt 0 ]; then
    echo "  ⚠️  Found ${#remaining_files[@]} remaining test files/directories:"
    printf '    %s\n' "${remaining_files[@]}"
else
    echo "  ✅ No test files found in project code"
fi

# Check package.json for any remaining test-related content
if [ -f "package.json" ]; then
    if grep -q "jest\|@testing-library\|vitest\|mocha\|chai" package.json 2>/dev/null; then
        echo "  ⚠️  package.json still contains test-related content"
        grep -n "jest\|@testing-library\|vitest\|mocha\|chai" package.json | head -5
    else
        echo "  ✅ package.json is clean of test dependencies"
    fi
fi

echo ""
echo "🎉 ENHANCED test cleanup completed!"
echo ""
echo "📊 Summary:"
echo "   💾 Backups created in: $BACKUP_DIR"
echo "   🗑️  Removed test files, directories, and configurations"
echo "   📦 Cleaned package.json dependencies and scripts"
echo "   ⚙️  Cleaned babel and TypeScript configurations"
echo ""
echo "⏭️  Next steps:"
echo "1. 🔍 Review any files mentioned above for manual cleanup"
echo "2. 📦 Run 'npm install' to update dependencies"
echo "3. 🏗️  Test that your app still builds: 'npm run ios' or 'npm run android'"
echo "4. 💾 Commit changes: git add . && git commit -m 'Remove all test files and dependencies'"
echo "5. 🗑️  Clean up backup directory when satisfied: rm -rf $BACKUP_DIR"
echo ""
echo "✅ Cleanup complete!"