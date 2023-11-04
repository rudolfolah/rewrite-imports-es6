const fs = require('fs');
const path = require('path');
const recast = require('recast');
const glob = require('glob');

// The component to replace and its new path
const SPECIFIC_COMPONENT = 'CoolFeature';
const NEW_PATH = 'features/cool_feature/CoolFeature';

// Use glob to find all JavaScript and TypeScript files
const files = glob.sync('./example/**/*.{js,jsx,ts,tsx}', { ignore: 'node_modules/**' });

// Function to process each file
const processFile = (file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const ast = recast.parse(content, {
    parser: require("recast/parsers/babel")
  });

  let hasModifications = false;
  recast.types.visit(ast, {
    visitImportDeclaration(path) {
      const { node } = path;
      console.log(`Found import for components in ${file}: ${node.specifiers}`);
      const specifiers = node.specifiers.filter(
        specifier => specifier.type === 'ImportSpecifier' && specifier.imported.name === SPECIFIC_COMPONENT
      );

      if (specifiers.length > 0) {
        const newSpecifiers = node.specifiers.filter(
          specifier => specifier.type === 'ImportSpecifier' && specifier.imported.name !== SPECIFIC_COMPONENT
        );
        const importWithoutRemovedSpecifier = recast.types.builders.importDeclaration(
          newSpecifiers,
          recast.types.builders.literal(node.source.value)
        );
        const importSeparately = recast.types.builders.importDeclaration(
          [recast.types.builders.importDefaultSpecifier(recast.types.builders.identifier(SPECIFIC_COMPONENT))],
          recast.types.builders.literal(NEW_PATH)
        );
        path.replace(importWithoutRemovedSpecifier);
        path.insertAfter(importSeparately);
        hasModifications = true;
      }
      return false;
    }
  });

  if (hasModifications) {
    const newContent = recast.print(ast).code;
    const updatedFile = path.join(path.dirname(file), `${path.basename(file, path.extname(file))}-updated${path.extname(file)}`);
    fs.writeFileSync(updatedFile, newContent, 'utf-8');
    console.log(`Updated imports for ${SPECIFIC_COMPONENT} in ${file}, wrote to ${updatedFile}`);
  }
};

// Process each file
files.forEach(processFile);

console.log('Import replacement complete for specified component.');
