import { Router } from "express";
import { bidController } from "./bid.controller.js";

export const bidRoutes = Router();

bidRoutes.get("/", bidController.list);
bidRoutes.get("/:id", bidController.getById);

