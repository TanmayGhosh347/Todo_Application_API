/* create a table with name todo in the todoApplication.db file using the CLI . 

*
* sql command
    CREATE TABLE todo(id INTEGER , todo TEXT , priority TEXT , status TEXT);
    INSERT INTO todo (id, todo , priority , status )
    Values (1, "Learn HTML" , "HIGH" , "TO DO"),
    (2 , "Learn JS" , "MEDIUM" , "DONE"),
    (3 , "Learn CSS" , "LOW" , "DONE"),
    (4 , "Play CHESS" , "LOW" , "DONE")
    SELECT * FROM todo ;
*/

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
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
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// 1 API Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority  = '${priority}' ;`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND priority  = '${priority}' ;`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND status  = '${status}' ;`;
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// 2 API Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * FROM todo WHERE 
    id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// 3  API Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const postTodoQuery = `
  INSERT INTO 
  todo ( id , todo , priority , status )
  VALUES (${id},'${todo}','${priority}' , '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// 4 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
    SELECT * FROM todo WHERE 
    id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo SET todo ='${todo}',
    priority ='${priority}',
    status ='${status}'
    WHERE id = ${todoId}; `;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// 5 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM 
    todo WHERE
    id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
