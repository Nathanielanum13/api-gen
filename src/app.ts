import "./config/env";
import express, { Application } from "express";
import router from "./router";
import helmet from "helmet";
import morgan from "morgan";
const logger = require("./utils/log/logger");
const fs = require("fs");

const app: Application = express();

// Third Party Plugins and Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(morgan("[\x1B[34m:method\x1B[39m] - [:status] [::] :date[iso] [::] Route - (:url) [::] Duration - :response-time milliseconds"));

app.use(router);

app.listen(process.env.API_GEN_PORT || 8000, () => {
  logger.info(
    `Application running in ${process.env.API_GEN_ENVIRONMENT} environment on port ${process.env.API_GEN_PORT}`
  );
});
