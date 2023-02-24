const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let dbQuery = null;
  let dbResponse = null;

  switch (true) {
    case hasStatusProperty(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status LIKE '${status}'`;
      break;
    case hasPriorityProperty(request.query):
      dbQuery = `SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%' AND
            priority LIKE '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority LIKE '${priority}' AND status LIKE '${status}';`;
      break;
    default:
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  }
  dbResponse = await db.all(dbQuery);
  response.send(dbResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const dbResponse = await db.get(dbQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const dbQuery = `INSERT INTO todo (id,todo,priority,status) VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(dbQuery);
  response.send("Todo Successfully Added");
});

const hasStatusProperty1 = (requestBody) => {
  return (
    requestBody.status !== "" &&
    requestBody.todo === undefined &&
    requestBody.priority === undefined
  );
};
const hasPriorityProperty1 = (requestBody) => {
  return (
    requestBody.status === undefined &&
    requestBody.todo === undefined &&
    requestBody.priority !== ""
  );
};

app.put("/todos/:todoId/", async (request, response) => {
  let dbQuery = null;
  let dbResponse = null;
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;

  switch (true) {
    case hasStatusProperty1(request.body):
      dbQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`;
      dbResponse = await db.run(dbQuery);
      response.send("Status Updated");
      break;
    case hasPriorityProperty1(request.body):
      dbQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`;
      dbResponse = await db.run(dbQuery);
      response.send("Priority Updated");
      break;
    default:
      dbQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`;
      dbResponse = await db.run(dbQuery);
      response.send("Todo Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  const dbResponse = await db.run(dbQuery);
  response.send("Todo Deleted");
});

module.exports = app;
