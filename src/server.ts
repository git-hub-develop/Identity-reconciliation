import app from "./app";
const PORT = process.env.PORT || 3000;

const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Server running on ${serverUrl}`);
});
