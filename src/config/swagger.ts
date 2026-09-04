import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname since your project uses ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CDN links prevent blank screen issues in serverless runtimes (Vercel)
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
      description:
        "Centralized backend API documentation for managing Gbemileke Tradomedical Hospital systems, including authentications, patients, practitioners, and clinical operations.",
    },
    // Placing "/" first forces Swagger to target whatever host it is on (Local OR Vercel)
    servers: [
      {
        url: "/",
        description: "Current Host Environment",
      },
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
          description:
            "Input your JWT token to access protected hospital endpoints. Example: 'Bearer eyJhbGciOi...'",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Internal Server Error" },
            error: { type: "object", nullable: true },
          },
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
  // Captures both local TypeScript route files and compiled JS build outputs on Vercel
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "./routes/*.ts"),
    path.join(__dirname, "./routes/*.js"),
    "./src/routes/*.ts",
    "./routes/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  // Serve raw JSON spec
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerSpec);
  });

  // Serve Swagger UI with custom CDN options (fixes Vercel blank page)
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCssUrl: SWAGGER_CDN_CSS,
      customJs: SWAGGER_CDN_JS,
    })
  );

  console.log("🏥 Gbemileke Hospital Docs active at /docs");
}