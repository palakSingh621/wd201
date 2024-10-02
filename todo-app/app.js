/* eslint-disable no-undef */
const express = require("express");
const app = express();
const path = require("path");
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const allTodos = await Todo.getTodos();
  const overdueTasks = await Todo.overdue();
  const dueTodayTasks = await Todo.dueToday();
  const dueLaterTasks = await Todo.dueLater();

  if (request.accepts("html")) {
    response.render("index", {
      allTodos,
      overdueTasks: overdueTasks,
      dueLaterTasks: dueLaterTasks,
      dueTodayTasks: dueTodayTasks,
    });
  } else {
    response.json(allTodos);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/todos", async function (request, response) {
  console.log("Processing list of all Todos ...");
  try {
    // Query the database to get the list of all Todos
    const todos = await Todo.findAll();

    // Respond with all Todos
    response.send(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    response.status(500).send("Error fetching todos");
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    // eslint-disable-next-line no-unused-vars
    const todo = await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    // Delete the Todo with the specified ID
    const result = await Todo.destroy({
      where: {
        id: request.params.id,
      },
    });

    // If `result` is 1, it means the Todo was deleted, otherwise it was not found
    if (result === 1) {
      response.send(true);
    } else {
      response.send(false);
    }
  } catch (error) {
    console.error("Error deleting todo:", error);
    response.status(500).send(false);
  }
});

module.exports = app;
