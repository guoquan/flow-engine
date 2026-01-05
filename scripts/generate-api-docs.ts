import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import * as fs from 'fs';
import * as path from 'path';
import { SaySchema, ThinkSchema, PlayActionSchema } from '../src/schemas/actions.js';

// 1. Registry setup
const registry = new OpenAPIRegistry();

// 2. Register schemas as components
registry.register('Say', SaySchema);
registry.register('Think', ThinkSchema);
registry.register('PlayAction', PlayActionSchema);

// 3. Define the virtual API endpoints (mapped to our Behavior API)
registry.registerPath({
  method: 'post',
  path: '/behavior/say',
  summary: 'Make the avatar speak',
  request: {
    body: {
      content: {
        'application/json': { schema: SaySchema },
      },
    },
  },
  responses: {
    200: { description: 'Success' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/behavior/think',
  summary: 'Make the avatar enter thinking state',
  request: {
    body: {
      content: {
        'application/json': { schema: ThinkSchema },
      },
    },
  },
  responses: {
    200: { description: 'Success' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/behavior/play_action',
  summary: 'Trigger an animation action',
  request: {
    body: {
      content: {
        'application/json': { schema: PlayActionSchema },
      },
    },
  },
  responses: {
    200: { description: 'Success' },
  },
});

// 4. Generate OpenAPI JSON
const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiDoc = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    version: '0.1.10',
    title: 'Flow Engine Behavior API',
    description: 'Interactive reference for Flow Engine avatar control actions.',
  },
  servers: [{ url: 'http://localhost:5173' }], // Base URL for testing in playground
});

// 5. Output results
const outDir = path.join(process.cwd(), 'dist-docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Write openapi.json
fs.writeFileSync(
  path.join(outDir, 'openapi.json'),
  JSON.stringify(openApiDoc, null, 2)
);

// 6. Generate a standalone HTML viewer using Scalar
const html = `
<!doctype html>
<html>
  <head>
    <title>Flow Engine API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="./openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);

console.log('✅ Visual API Documentation generated in ./dist-docs/');
