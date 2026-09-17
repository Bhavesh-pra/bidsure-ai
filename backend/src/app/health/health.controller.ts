import type { Request, Response } from "express";
import { config } from "../../config/env.js";
import type { ApiResponse, HealthData } from "../../shared/types/api.types.js";

export const healthController = {
  getHealth: (req: Request, res: Response): void => {
    const responsePayload: ApiResponse<HealthData> = {
      success: true,
      data: {
        status: "ok",
        service: config.serviceName,
        version: config.version,
      },
      requestId: req.requestId,
    };

    res.status(200).json(responsePayload);
  },
};
