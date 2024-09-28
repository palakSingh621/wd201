/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Todo } = require("./models");
const BodyParse = require("body-parser");
app.use(BodyParse.json());

app.get("/todos", (request, response) => {
  // response.send('Hello World')
  console.log("Todo List");
});

app.post("/todos", async (request, response) => {
  console.log("Create a list:", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });
    return response.json(todo);
  } catch (error) {
    console.log(error);
    response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsComplete", async (request, response) => {
  console.log("Mark as complete the task by ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updateTodo = await todo.markAsComplete();
    return response.json(updateTodo);
  } catch (error) {
    console.log(error);
    response.status(422).json(error);
  }
});

app.delete("todos/:id/delete", (request, response) => {
  console.log("delete the list by ID:", request.params.id);
});

module.exports = app;
