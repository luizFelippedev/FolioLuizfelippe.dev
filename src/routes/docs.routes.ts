import path from 'node:path';

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const router = Router();

const swaggerFile = path.join(__dirname, '../../docs/swagger.yaml');
const swaggerDocument = YAML.load(swaggerFile);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

export default router;
