import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname since your project uses ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CDN assets prevent blank UI screens on Vercel's serverless environment
const SWAGGER_CDN_CSS =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css";
const SWAGGER_CDN_JS = [
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
];

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gbemileke Tradomedical Hospital API",
      version: "1.0.0",
      description: "Centralized backend API documentation for managing Gbemileke Tradomedical Hospital systems, including authentications, patients, practitioners, and clinical operations.",
    },
    servers: [ 
      {
        url: "https://gbemileke-backend.vercel.app",
        description: "Vercel Deployment",
      },
       {
        url: "http://localhost:5002",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Input your JWT token to access protected hospital endpoints. Example: 'Bearer eyJhbGciOi...'",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Internal Server Error" },
            error: { type: "object", nullable: true }
          }
        },
        Address: {
          type: "object",
          properties: {
            street: { type: "string", example: "123 Medical Way" },
            city: { type: "string", example: "Lagos" },
            state: { type: "string", example: "Lagos" },
            zipCode: { type: "string", example: "100001" },
            country: { type: "string", example: "Nigeria" },
          },
        },
      },
    },
  },
  // FIX: Force paths to use safe absolute pathing patterns for Windows
  apis: ["src/routes/*.ts", "src/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  // Mount the UI interface
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // FIX: Changed from res.send to res.json for structural stability
  app.get("/docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCssUrl: SWAGGER_CDN_CSS,
      customJs: SWAGGER_CDN_JS,
    })
  );

  console.log("🏥 Gbemileke Hospital Docs active at: http://localhost:5002/docs");
}