/* eslint-disable no-unused-vars */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const user = require("../models/user");

let server, agent;

function extractCsrfToken(response) {
  var $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  // let res = await agent.get("/signup");
  // let csrfToken = extractCsrfToken(res);
  //   res = await agent.post("/users").send({
  //     firstName: "Test",
  //     secondName: "User A",
  //     email: username,
  //     password: password,
  //     _csrf: csrfToken,
  //   });
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up test", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      secondName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);

    const todosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    // expect(todosResponse.text).toBeDefined();
    if (todosResponse.status === 302) {
      console.error("Redirected to:", todosResponse.headers.location);
    }
  });

  test("Sign out test", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    expect(csrfToken).toBeDefined();
    let response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");

    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    expect(csrfToken).toBeDefined();
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    if (groupedTodosResponse.text) {
      const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      const todoID = parsedGroupedResponse.dueLaterTasks[0].id;
      //testing for false to true
      const setCompletionStatus = await agent
        .put(`/todos/${todoID}`)
        .send({ completed: true, _csrf: csrfToken });
      const parsedUpdateResponse = JSON.parse(setCompletionStatus.text);
      expect(parsedUpdateResponse.completed).toBe(true);

      //testing for true to false
      const setCompletionStatus2 = await agent
        .put(`/todos/${todoID}`)
        .send({ completed: false, _csrf: csrfToken });
      const parsedUpdateResponse2 = JSON.parse(setCompletionStatus2.text);
      expect(parsedUpdateResponse2.completed).toBe(false);
    } else {
      // console.error("Full response object:", groupedTodosResponse);
      console.error("Response status:", groupedTodosResponse.status);
      // console.error("Response text:", groupedTodosResponse.text);
    }
  });

  // test("Fetches all todos in the database using /todos endpoint", async () => {
  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   let response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);

  //   expect(parsedResponse.length).toBe(4);
  //   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  // });

  test("Deletes a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    expect(csrfToken).toBeDefined();
    await agent.post("/todos").send({
      title: "Buy groceries",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const todoResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    if (todoResponse.text) {
      const parsedMixedResponse = JSON.parse(todoResponse.text);
      const todoID = parsedMixedResponse.dueLaterTasks[0].id;

      const deleteResponse = await agent
        .delete(`/todos/${todoID}`)
        .send({ _csrf: csrfToken });
      expect(deleteResponse.statusCode).toBe(200);
      const parsedDeleteResponse = JSON.parse(deleteResponse.text);
      expect(parsedDeleteResponse.success).toBe(true);
    } else {
      //   console.error("Full response object:", todoResponse);
      console.error("Response status:", todoResponse.status);
      //   console.error("Response text:", todoResponse.text);
    }
  });

  test("check cross-accessing someone else's todo", async () => {
    let agent = request.agent(server);

    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Demo Todo",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const todoResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    if (todoResponse.text) {
      const parsedMixedResponse = JSON.parse(todoResponse.text);
      const todoID = parsedMixedResponse.dueLaterTasks[0].id;

      await agent.get("/signout");

      res = await agent.get("/signup");
      csrfToken = extractCsrfToken(res);

      await agent.post("/users").send({
        firstName: "Test",
        lastName: "User 2",
        email: "user2@test.com",
        password: "password",
        _csrf: csrfToken,
      });

      await login(agent, "user2@test.com", "password");

      const setCompletionResponse = await agent
        .put(`/todos/${todoID}`)
        .send({ completed: true, _csrf: csrfToken });
      expect(setCompletionResponse.statusCode).toBe(403);
      // Try to delete the todo
      const deleteResponse = await agent
        .delete(`/todos/${todoID}`)
        .send({ _csrf: csrfToken });
      expect(deleteResponse.statusCode).toBe(403);
    } else {
      //   console.error("Full response object:", todoResponse);
      console.error("Response status:", todoResponse.status);
      //   console.error("Response text:", todoResponse.text);
    }
  });
});
