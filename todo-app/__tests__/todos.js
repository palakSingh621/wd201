const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(response) {
  var $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
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

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
    const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const setCompletionStatus = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ completed: true, _csrf: csrfToken });
    const parsedUpdateResponse = JSON.parse(setCompletionStatus.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Marks a todo with the given ID as incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
    const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const setCompletionStatus = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ completed: false, _csrf: csrfToken });
    const parsedUpdateResponse = JSON.parse(setCompletionStatus.text);
    expect(parsedUpdateResponse.completed).toBe(false);
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
  //   const response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);

  //   expect(parsedResponse.length).toBe(4);
  //   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  // });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy groceries",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTasks.length;
    const latestTodo = parsedGroupedResponse.dueTodayTasks[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const deleteResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken });
    expect(deleteResponse.statusCode).toBe(200);
    const parsedDeleteResponse = JSON.parse(deleteResponse.text);
    const todoID = parsedDeleteResponse.id;

    expect(parsedDeleteResponse.success).toBe(true);

    const allTodosResponse = await agent.get("/todos");
    const parsedAllTodosResponse = JSON.parse(allTodosResponse.text);

    const todoStillExists = parsedAllTodosResponse.find(
      (todo) => todo.id === todoID,
    );
    expect(todoStillExists).toBeUndefined();
  });
});
