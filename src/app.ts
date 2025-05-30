import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./docs/swagger.json";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Sample route
app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
