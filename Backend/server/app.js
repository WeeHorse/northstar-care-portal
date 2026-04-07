import express from "express";

import { createAuthMiddleware } from "./middleware/auth.js";
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
import { createAuthController } from "./controllers/authController.js";
import { createCasesController } from "./controllers/casesController.js";
import { createRecordsController } from "./controllers/recordsController.js";
import { createDocumentsController } from "./controllers/documentsController.js";
import { createProceduresController } from "./controllers/proceduresController.js";
import { createMeetingsController } from "./controllers/meetingsController.js";
import { createAdminController } from "./controllers/adminController.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createCasesRouter } from "./routes/cases.routes.js";
import { createRecordsRouter } from "./routes/records.routes.js";
import { createDocumentsRouter } from "./routes/documents.routes.js";
import { createProceduresRouter } from "./routes/procedures.routes.js";
import { createMeetingsRouter } from "./routes/meetings.routes.js";
import { createAdminRouter } from "./routes/admin.routes.js";

export function createApp({ db, jwtSecret }) {
  const app = express();
  app.use(express.json());

  const authMiddleware = createAuthMiddleware(jwtSecret);

  const auditRepository = createAuditRepository(db);
  const authRepository = createAuthRepository(db);
  const casesRepository = createCasesRepository(db);
  const recordsRepository = createRecordsRepository(db);
  const documentsRepository = createDocumentsRepository(db);
  const proceduresRepository = createProceduresRepository(db);
  const meetingsRepository = createMeetingsRepository(db);
  const adminRepository = createAdminRepository(db);

  const authService = createAuthService({ authRepository, auditRepository, jwtSecret });
  const casesService = createCasesService({ casesRepository, auditRepository });
  const recordsService = createRecordsService({ recordsRepository, auditRepository });
  const documentsService = createDocumentsService({ documentsRepository, auditRepository });
  const proceduresService = createProceduresService({ proceduresRepository, auditRepository });
  const meetingsService = createMeetingsService({ meetingsRepository, auditRepository });
  const adminService = createAdminService({ adminRepository, auditRepository });

  const authController = createAuthController(authService);
  const casesController = createCasesController(casesService);
  const recordsController = createRecordsController(recordsService);
  const documentsController = createDocumentsController(documentsService);
  const proceduresController = createProceduresController(proceduresService);
  const meetingsController = createMeetingsController(meetingsService);
  const adminController = createAdminController(adminService);

  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  app.use("/api/auth", createAuthRouter({ authController, authMiddleware }));
  app.use("/api/cases", createCasesRouter({ casesController, authMiddleware }));
  app.use("/api/records", createRecordsRouter({ recordsController, authMiddleware }));
  app.use("/api/documents", createDocumentsRouter({ documentsController, authMiddleware }));
  app.use("/api/procedures", createProceduresRouter({ proceduresController, authMiddleware }));
  app.use("/api/meetings", createMeetingsRouter({ meetingsController, authMiddleware }));
  app.use("/api/admin", createAdminRouter({ adminController, authMiddleware }));

  app.use(errorHandler);
  return app;
}
