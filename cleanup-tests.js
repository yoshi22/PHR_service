#!/usr/bin/env node

/**
 * PHRApp Test Files Cleanup Script (Node.js version)
 * 
 * This script safely removes all test files, configurations, and dependencies
 * from the React Native + TypeScript project without touching production code.
 * 
 * Features:
 * - Removes __tests__ directories
 * - Removes *.test.* and *.spec.* files  
 * - Cleans package.json of test scripts and dependencies
 * - Removes Jest configuration files
 * - Scans for test imports in source files
 * - Creates backups before making changes
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd();
const BACKUP_SUFFIX = '.backup';

// Test-related dependencies to remove
const TEST_DEPENDENCIES = [
    '@testing-library/jest-native',
    '@testing-library/react-native',
    '@testing-library/jest-dom', 
    '@testing-library/user-event',
    '@types/jest',
    'babel-jest',
    'jest',
    'jest-environment-jsdom',
    'jest-environment-node',
    'react-test-renderer',
    'ts-jest'
];

// Test script names to remove
const TEST_SCRIPTS = [
    'test',
    'test:watch', 
    'test:ci',
    'test:coverage',
    'test:debug'
];

// Utility functions
function log(message, level = 'info') {
    const prefix = {
        info: '📝',
        success: '✅', 
        warning: '⚠️',
        error: '❌'
    }[level] || '📝';
    
    console.log(`${prefix} ${message}`);
}

function findFiles(dir, patterns, exclude = []) {
    const results = [];
    
    function walkDir(currentDir) {
        if (exclude.some(ex => currentDir.includes(ex))) return;
        
        try {
            const files = fs.readdirSync(currentDir);
            
            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    walkDir(filePath);
                } else {
                    // Check if file matches any pattern
                    if (patterns.some(pattern => {
                        if (typeof pattern === 'string') {
                            return file === pattern;
                        } else if (pattern instanceof RegExp) {
                            return pattern.test(file);
                        }
                        return false;
                    })) {
                        results.push(filePath);
                    }
                }
            }
        } catch (err) {
            // Skip directories we can't read
        }
    }
    
    walkDir(dir);
    return results;
}

function findDirectories(dir, name, exclude = []) {
    const results = [];
    
    function walkDir(currentDir) {
        if (exclude.some(ex => currentDir.includes(ex))) return;
        
        try {
            const files = fs.readdirSync(currentDir);
            
            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    if (file === name) {
                        results.push(filePath);
                    } else {
                        walkDir(filePath);
                    }
                }
            }
        } catch (err) {
            // Skip directories we can't read
        }
    }
    
    walkDir(dir);
    return results;
}

function removeDirectory(dirPath) {
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        return true;
    } catch (err) {
        log(`Failed to remove directory ${dirPath}: ${err.message}`, 'error');
        return false;
    }
}

function removeFile(filePath) {
    try {
        fs.unlinkSync(filePath);
        return true;
    } catch (err) {
        log(`Failed to remove file ${filePath}: ${err.message}`, 'error');
        return false;
    }
}

// Main cleanup functions
function step1_RemoveTestDirectories() {
    log('Step 1: Removing __tests__ directories...');
    
    const testDirs = findDirectories(PROJECT_ROOT, '__tests__', ['node_modules', 'functions/node_modules']);
    
    if (testDirs.length === 0) {
        log('No __tests__ directories found');
        return;
    }
    
    let removed = 0;
    testDirs.forEach(dir => {
        log(`  Removing: ${dir}`);
        if (removeDirectory(dir)) removed++;
    });
    
    log(`Removed ${removed} __tests__ directories`, 'success');
}

function step2_RemoveTestFiles() {
    log('Step 2: Removing test and spec files...');
    
    const testPatterns = [
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/
    ];
    
    const testFiles = findFiles(PROJECT_ROOT, testPatterns, ['node_modules', 'functions/node_modules']);
    
    if (testFiles.length === 0) {
        log('No test files found');
        return;
    }
    
    let removed = 0;
    testFiles.forEach(file => {
        log(`  Removing: ${file}`);
        if (removeFile(file)) removed++;
    });
    
    log(`Removed ${removed} test files`, 'success');
}

function step3_RemoveJestConfig() {
    log('Step 3: Removing Jest configuration files...');
    
    const configFiles = ['jest.config.js', 'jest.config.json', 'jest.config.ts'];
    let removed = 0;
    
    configFiles.forEach(configFile => {
        const filePath = path.join(PROJECT_ROOT, configFile);
        if (fs.existsSync(filePath)) {
            log(`  Removing: ${configFile}`);
            if (removeFile(filePath)) removed++;
        }
    });
    
    if (removed === 0) {
        log('No Jest configuration files found');
    } else {
        log(`Removed ${removed} Jest configuration files`, 'success');
    }
}

function step4_CleanPackageJson() {
    log('Step 4: Cleaning package.json...');
    
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        log('package.json not found', 'warning');
        return;
    }
    
    // Create backup
    const backupPath = packageJsonPath + BACKUP_SUFFIX;
    fs.copyFileSync(packageJsonPath, backupPath);
    log(`Created backup: ${backupPath}`);
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let changes = [];
    
    // Remove test scripts
    if (packageJson.scripts) {
        TEST_SCRIPTS.forEach(script => {
            if (packageJson.scripts[script]) {
                delete packageJson.scripts[script];
                changes.push(`script: ${script}`);
            }
        });
    }
    
    // Remove test dependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
        if (packageJson[depType]) {
            TEST_DEPENDENCIES.forEach(dep => {
                if (packageJson[depType][dep]) {
                    delete packageJson[depType][dep];
                    changes.push(`${depType}: ${dep}`);
                }
            });
        }
    });
    
    // Remove jest configuration
    if (packageJson.jest) {
        delete packageJson.jest;
        changes.push('jest configuration');
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    if (changes.length > 0) {
        log(`Removed from package.json: ${changes.join(', ')}`, 'success');
    } else {
        log('No test-related entries found in package.json');
    }
}

function step5_ScanForTestImports() {
    log('Step 5: Scanning for test imports in source files...');
    
    const sourceFiles = findFiles(path.join(PROJECT_ROOT, 'src'), [/\.(ts|tsx)$/]);
    const testImportPatterns = [
        /from\s+['"].*jest.*['"]/,
        /from\s+['"].*@testing-library.*['"]/,
        /from\s+['"].*\.\./.*__tests__.*['"]/,
        /import\s+.*jest/,
        /import\s+.*@testing-library/
    ];
    
    let filesWithTestImports = [];
    
    sourceFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            if (testImportPatterns.some(pattern => pattern.test(content))) {
                filesWithTestImports.push(file);
            }
        } catch (err) {
            // Skip files we can't read
        }
    });
    
    if (filesWithTestImports.length > 0) {
        log('Found test imports in the following files:', 'warning');
        filesWithTestImports.forEach(file => {
            log(`  ${file}`, 'warning');
        });
        log('Please manually review and remove test imports from these files', 'warning');
    } else {
        log('No test imports found in source files', 'success');
    }
}

function step6_VerifyCleanup() {
    log('Step 6: Verifying cleanup...');
    
    const remainingTestDirs = findDirectories(PROJECT_ROOT, '__tests__', ['node_modules']);
    const remainingTestFiles = findFiles(PROJECT_ROOT, [/\.(test|spec)\.(ts|tsx|js|jsx)$/], ['node_modules']);
    
    if (remainingTestDirs.length === 0 && remainingTestFiles.length === 0) {
        log('All test files and directories removed successfully', 'success');
    } else {
        log('Some test files/directories remain:', 'warning');
        [...remainingTestDirs, ...remainingTestFiles].forEach(item => {
            log(`  ${item}`, 'warning');
        });
    }
}

// Main execution
function main() {
    log('🧹 Starting PHRApp test cleanup...\n');
    
    try {
        step1_RemoveTestDirectories();
        console.log();
        
        step2_RemoveTestFiles();
        console.log();
        
        step3_RemoveJestConfig();
        console.log();
        
        step4_CleanPackageJson();
        console.log();
        
        step5_ScanForTestImports();
        console.log();
        
        step6_VerifyCleanup();
        console.log();
        
        log('🎉 Test cleanup completed!', 'success');
        console.log('\nNext steps:');
        console.log('1. Run "npm install" to update dependencies');
        console.log('2. Review any files mentioned above for manual cleanup');
        console.log('3. Test that your app still builds and runs correctly');
        console.log('4. Commit the changes: git add . && git commit -m "Remove all test files and dependencies"');
        console.log(`\n📄 A backup of package.json was created as package.json${BACKUP_SUFFIX}`);
        
    } catch (error) {
        log(`Cleanup failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    main,
    TEST_DEPENDENCIES,
    TEST_SCRIPTS
};