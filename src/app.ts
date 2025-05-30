import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./docs/swagger.json";
import identifyRouter from "./routes/identify.route";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/api", identifyRouter);

app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.get("/", (_, res) => {
  res.send("API is running...");
});

export default app;
