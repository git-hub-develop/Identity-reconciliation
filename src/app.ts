import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./docs/swagger.json";
import identifyRouter from "./routes/identify.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/api", identifyRouter);

// Sample route
app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.get("/", (_, res) => {
  res.send("API is running...");
});

const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`Server running on ${serverUrl}`);
});
