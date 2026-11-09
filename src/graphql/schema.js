import path from 'path';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';

const coreSchemas = fileLoader(
  path.join(__dirname, `./search/**/*.graphqls`)
);
const extensionsSchemas = fileLoader(
  path.join(__dirname, `../api/extensions/**/*.graphqls`)
);
const typesArray = coreSchemas.concat(extensionsSchemas)

export default mergeTypes(typesArray, { all: true });
