/* eslint-disable no-undef */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const path = require("path");
const { Todo } = require("./models");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("ssh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"])); //secret key should be 32-characters long

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const overdueTasks = await Todo.overdue();
  const dueTodayTasks = await Todo.dueToday();
  const dueLaterTasks = await Todo.dueLater();
  if (request.accepts("html")) {
    response.render("index", {
      overdueTasks,
      dueLaterTasks,
      dueTodayTasks,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdueTasks,
      dueTodayTasks,
      dueLaterTasks,
    });
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
    await Todo.addTodo(request.body);
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
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    response.status(422).send(false);
  }
});

module.exports = app;
