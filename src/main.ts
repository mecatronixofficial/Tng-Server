import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const port = Number(process.env.PORT) || 4000;
  const env = process.env.NODE_ENV || "development";
  const host = process.env.HOST || `http://localhost:${port}`;

  /* ── Security ─────────────────────────────────────────────── */

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  /* ── CORS ─────────────────────────────────────────────────── */

  const origins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  /* ── Global prefix ────────────────────────────────────────── */

  app.setGlobalPrefix("api/v1");

  /* ── Validation ───────────────────────────────────────────── */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /* ── Exception filter ─────────────────────────────────────── */

  app.useGlobalFilters(new AllExceptionsFilter());

  /* ── Health check ─────────────────────────────────────────── */

  app.getHttpAdapter().get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env,
    });
  });

  /* ── Swagger ──────────────────────────────────────────────── */

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Textile API")
    .setDescription("Public catalogue + admin CRUD")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("public", "Public APIs")
    .addTag("admin", "Admin APIs")
    .addTag("auth", "Authentication")
    .build();

  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  /* ── Start ────────────────────────────────────────────────── */

  await app.listen(port);

  const line = "─".repeat(52);

  const pad = (label: string, value: string) =>
    `  ${label.padEnd(14)}${value}`;

  console.log(`
\x1b[36m┌${line}┐
│         Textile — API Server               │
└${line}┘\x1b[0m

${pad("Environment", `\x1b[33m${env}\x1b[0m`)}
${pad("API Base", `\x1b[32m${host}/api/v1\x1b[0m`)}
${pad("Health", `\x1b[32m${host}/health\x1b[0m`)}
${pad("Swagger", `\x1b[32m${host}/api/docs\x1b[0m`)}
${pad("Port", `\x1b[37m${port}\x1b[0m`)}
${pad("PID", `\x1b[37m${process.pid}\x1b[0m`)}
${pad("Node", `\x1b[37m${process.version}\x1b[0m`)}
${pad("Started", `\x1b[37m${new Date().toLocaleString()}\x1b[0m`)}

\x1b[36m${"─".repeat(54)}\x1b[0m
`);
}

bootstrap();
