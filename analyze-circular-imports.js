const { init, parse } = require('es-module-lexer');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const rootDirs = ['example_circular'];
const dependencyGraph = new Map();

async function analyzeCodebase() {
  console.log('Initializing es-module-lexer...');
  await init;

  console.log('Gathering files...');
  const files = gatherFiles(rootDirs);
  console.log('Files to analyze:', files);

  for (const file of files) {
    console.log(`Analyzing file: ${file}`);
    const dependencies = extractDependencies(file);
    console.log(`Dependencies for ${file}:`, dependencies);
    dependencyGraph.set(file, dependencies);
  }

  console.log('Built Dependency Graph:', JSON.stringify(Object.fromEntries(dependencyGraph), null, 2));

  console.log('Detecting circular dependencies...');
  const circularPath = findCircularDependencies();
  if (circularPath) {
    console.error('Circular dependency detected:', circularPath.join(' -> '));
  } else {
    console.log('No circular dependencies found.');
  }
}

function gatherFiles(directories) {
  const files = [];
  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...gatherFiles([fullPath]));
        } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      });
    }
  });
  return files;
}

function extractDependencies(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const transpiled = babel.transformSync(content, {
      presets: ['@babel/preset-react'],
    }).code;
  
    const [imports] = parse(transpiled);
  
    return imports
      .map(({ s, e }) => transpiled.slice(s, e))
      .filter((importPath) => importPath.startsWith('.'))
      .map((importPath) => resolveImportPath(filePath, importPath))
      .map((resolvedPath) => path.resolve(resolvedPath))
      .filter(Boolean);
  }

function resolveImportPath(basePath, importPath) {
  const resolvedPath = path.resolve(path.dirname(basePath), importPath);
  const extensions = ['', '.js', '.jsx', '.cjs', '.mjs', '.ts', '.tsx'];

  for (const ext of extensions) {
    const fullPath = `${resolvedPath}${ext}`;
    if (fs.existsSync(fullPath)) return fullPath;
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    for (const ext of extensions) {
      const indexFile = path.join(resolvedPath, `index${ext}`);
      if (fs.existsSync(indexFile)) return indexFile;
    }
  }
  return null;
}

function findCircularDependencies() {
  const visited = new Set();
  const stack = [];

  function normalizeFilePath(file) {
    return file.includes('example_circular') ? 
      file.substring(file.indexOf('example_circular')) : file;
  }

  function dfs(file) {
    const normalizedFile = normalizeFilePath(file);
    const stackIndex = stack.indexOf(normalizedFile);
    
    if (stackIndex !== -1) {
      return stack.slice(stackIndex).concat(normalizedFile);
    }
    
    if (visited.has(normalizedFile)) return null;
    visited.add(normalizedFile);
    stack.push(normalizedFile);

    const dependencies = dependencyGraph.get(normalizedFile) || [];
    for (const dep of dependencies) {
      const normalizedDep = normalizeFilePath(dep);
      const cycle = dfs(normalizedDep);
      if (cycle) return cycle;
    }

    stack.pop();
    return null;
  }

  for (const file of dependencyGraph.keys()) {
    visited.clear();
    stack.length = 0;
    const cycle = dfs(file);
    if (cycle) return cycle;
  }

  return null;
}


analyzeCodebase().catch((err) => console.error('Error analyzing codebase:', err));
