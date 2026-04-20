import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAuthMiddleware } from "./middleware/auth.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createAuthRepository } from "./repositories/authRepository.js";
import { createCasesRepository } from "./repositories/casesRepository.js";
import { createRecordsRepository } from "./repositories/recordsRepository.js";
import { createDocumentsRepository } from "./repositories/documentsRepository.js";
import { createProceduresRepository } from "./repositories/proceduresRepository.js";
import { createMeetingsRepository } from "./repositories/meetingsRepository.js";
import { createAdminRepository } from "./repositories/adminRepository.js";
import { createAuditRepository } from "./repositories/auditRepository.js";
import { createAuthService } from "./services/authService.js";
import { createCasesService } from "./services/casesService.js";
import { createRecordsService } from "./services/recordsService.js";
import { createDocumentsService } from "./services/documentsService.js";
import { createProceduresService } from "./services/proceduresService.js";
import { createMeetingsService } from "./services/meetingsService.js";
import { createAdminService } from "./services/adminService.js";
import { createAssistantService } from "./services/assistantService.js";
import { createAuthController } from "./controllers/authController.js";
import { createCasesController } from "./controllers/casesController.js";
import { createRecordsController } from "./controllers/recordsController.js";
import { createDocumentsController } from "./controllers/documentsController.js";
import { createProceduresController } from "./controllers/proceduresController.js";
import { createMeetingsController } from "./controllers/meetingsController.js";
import { createAdminController } from "./controllers/adminController.js";
import { createAssistantController } from "./controllers/assistantController.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createCasesRouter } from "./routes/cases.routes.js";
import { createRecordsRouter } from "./routes/records.routes.js";
import { createDocumentsRouter } from "./routes/documents.routes.js";
import { createProceduresRouter } from "./routes/procedures.routes.js";
import { createMeetingsRouter } from "./routes/meetings.routes.js";
import { createAdminRouter } from "./routes/admin.routes.js";
import { createAssistantRouter } from "./routes/assistant.routes.js";
import { createStorageClient } from "./storage/FileStorageFactory.js";
import { resolveRuntimePaths } from "./config/runtimePaths.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WWWROOT = path.resolve(__dirname, "../wwwroot");

export function createApp({
  db,
  jwtSecret,
  staticRoot = DEFAULT_WWWROOT,
  uploadRoot,
  storageType = "local",
  azureConnectionString,
  azureContainerName
}) {
  const app = express();
  app.use(express.json());
  app.use(apiLogger);
  const effectiveUploadRoot = uploadRoot || resolveRuntimePaths(process.env).uploadRoot;


  // Initialize storage client
  let storage;
  try {
    storage = createStorageClient({
      storageType,
      uploadRoot: effectiveUploadRoot,
      azureConnectionString,
      azureContainerName
    });

    if (storageType === "azure") {
      logger.info("Azure Blob storage initialized", {
        container: azureContainerName,
        connectionStringConfigured: Boolean(azureConnectionString)
      });
    } else {
      logger.info("Local file storage initialized", { uploadRoot: effectiveUploadRoot });
    }
  } catch (err) {
    logger.error("Storage initialization failed", { error: err.message });
    throw err;
  }

  const authRepository = createAuthRepository(db);
  const authMiddleware = createAuthMiddleware({ jwtSecret, authRepository });

  const auditRepository = createAuditRepository(db);
  const casesRepository = createCasesRepository(db);
  const recordsRepository = createRecordsRepository(db);
  const documentsRepository = createDocumentsRepository(db);
  const proceduresRepository = createProceduresRepository(db);
  const meetingsRepository = createMeetingsRepository(db);
  const adminRepository = createAdminRepository(db);

  const authService = createAuthService({ authRepository, auditRepository, jwtSecret });
  const casesService = createCasesService({ casesRepository, auditRepository });
  const recordsService = createRecordsService({ recordsRepository, auditRepository });
  const documentsService = createDocumentsService({ documentsRepository, auditRepository, storage });
  const proceduresService = createProceduresService({ proceduresRepository, auditRepository });
  const meetingsService = createMeetingsService({ meetingsRepository, auditRepository });
  const adminService = createAdminService({ adminRepository, auditRepository });
  const assistantService = createAssistantService({
    documentsRepository,
    proceduresRepository,
    adminRepository,
    auditRepository
  });

  const authController = createAuthController(authService);
  const casesController = createCasesController(casesService);
  const recordsController = createRecordsController(recordsService);
  const documentsController = createDocumentsController(documentsService, storage);
  const proceduresController = createProceduresController(proceduresService);
  const meetingsController = createMeetingsController(meetingsService);
  const adminController = createAdminController(adminService);
  const assistantController = createAssistantController(assistantService);

  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  app.use("/api/auth", createAuthRouter({ authController, authMiddleware }));
  app.use("/api/cases", createCasesRouter({ casesController, authMiddleware }));
  app.use("/api/records", createRecordsRouter({ recordsController, authMiddleware }));
  app.use("/api/documents", createDocumentsRouter({
    documentsController,
    authMiddleware,
    storage
  }));
  app.use("/api/procedures", createProceduresRouter({ proceduresController, authMiddleware }));
  app.use("/api/meetings", createMeetingsRouter({ meetingsController, authMiddleware }));
  app.use("/api/admin", createAdminRouter({ adminController, authMiddleware }));
  app.use("/api/assistant", createAssistantRouter({ assistantController, authMiddleware }));

  // Diagnostic endpoint to check storage configuration
  app.get("/api/diagnostics/storage", (req, res) => {
    const diagnostics = {
      storageType: storage.getStorageType(),
      timestamp: new Date().toISOString(),
      environment: {
        STORAGE_TYPE: process.env.STORAGE_TYPE ? "(set)" : "(not set)",
        AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING ? "(set)" : "(not set)",
        AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME || "(not set)",
        NODE_ENV: process.env.NODE_ENV || "production"
      }
    };

    // Add Azure-specific info if using Azure storage
    if (storage.getStorageType() === "azure" && typeof storage.getStorageInfo === "function") {
      try {
        storage.getStorageInfo().then(info => {
          diagnostics.azure = info;
          res.json(diagnostics);
        }).catch(err => {
          diagnostics.azure = { error: err.message };
          res.json(diagnostics);
        });
      } catch (err) {
        res.json(diagnostics);
      }
    } else {
      res.json(diagnostics);
    }
  });

  const indexPath = path.join(staticRoot, "index.html");
  if (fs.existsSync(indexPath)) {
    app.use(express.static(staticRoot));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(indexPath);
    });
  }

  app.use(errorHandler);
  return app;
}
