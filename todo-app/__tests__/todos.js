const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(response) {
  var $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
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

    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
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
      expect(parsedGroupedResponse.dueTodayTasks).toBeDefined();
      const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
      const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];
      expect(latestTodo).toBeDefined();
      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);
      const setCompletionStatus = await agent
        .put(`/todos/${latestTodo.id}`)
        .send({ completed: true, _csrf: csrfToken });
      const parsedUpdateResponse = JSON.parse(setCompletionStatus.text);
      expect(parsedUpdateResponse.completed).toBe(true);
    } else {
      console.error("Empty response received:", groupedTodosResponse);
    }
  });

  test("Marks a todo as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    if (groupedTodosResponse.text) {
      const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      expect(parsedGroupedResponse.dueTodayTasks).toBeDefined();
      const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
      const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];
      expect(latestTodo).toBeDefined();
      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);
      const setCompletionStatus = await agent
        .put(`/todos/${latestTodo.id}`)
        .send({ completed: false, _csrf: csrfToken });
      const parsedUpdateResponse = JSON.parse(setCompletionStatus.text);
      expect(parsedUpdateResponse.completed).toBe(false);
    } else {
      console.error("Empty response received:", groupedTodosResponse);
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
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy groceries",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    if (groupedTodosResponse.text) {
      const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      expect(parsedGroupedResponse.dueTodayTasks).toBeDefined();
      const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
      const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];
      expect(latestTodo).toBeDefined();
      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);
      const deleteResponse = await agent
        .delete(`/todos/${latestTodo.id}`)
        .send({ _csrf: csrfToken });
      expect(deleteResponse.statusCode).toBe(200);
    } else {
      console.error("Empty response received:", groupedTodosResponse);
    }
  });
});
