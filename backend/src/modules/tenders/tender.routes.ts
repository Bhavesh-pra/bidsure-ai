import { Router } from "express";
import { tenderController } from "./tender.controller.js";

export const tenderRoutes = Router();

tenderRoutes.get("/", tenderController.list);
tenderRoutes.post("/", tenderController.create);
tenderRoutes.get("/:id", tenderController.getById);

