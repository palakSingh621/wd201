const todoList = require("../todo");
const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();

describe("Test of TodoList Suite", () => {
  beforeAll(() => {
    add({
      title: "test item",
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    });
  });

  test("should add new todo", () => {
    const listCount = all.length;
    add({
      title: "test item 2",
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    expect(all.length).toBe(listCount + 1);
  }),
    test("should mark todo as complete", () => {
      expect(all[0].completed).toBe(false);
      markAsComplete(0);
      expect(all[0].completed).toBe(true);
    }),
    test("Should retrieve overdue items", () => {
      const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .slice(0, 10);
      add({
        title: "overdue item",
        completed: false,
        dueDate: yesterday,
      });
      const overdueItems = overdue();
      expect(overdueItems.length).toBe(1);
      expect(overdueItems[0].title).toBe("overdue item");
    }),
    test("Should retrieve dueToday items", () => {
      const today = new Date().toISOString().slice(0, 10);
      add({
        title: "due today item",
        completed: false,
        dueDate: today,
      });
      const dueTodayItems = dueToday();
      expect(dueTodayItems.length).toBeGreaterThan(0);
      expect(
        dueTodayItems.some((items) => items.title === "due today item"),
      ).toBe(true);
    }),
    test("Should retrieve dueLater items", () => {
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .slice(0, 10);
      add({
        title: "due later item",
        completed: false,
        dueDate: tomorrow,
      });
      const dueLaterItems = dueLater();
      expect(dueLaterItems.length).toBeGreaterThan(0);
      expect(
        dueLaterItems.some((items) => items.title === "due later item"),
      ).toBe(true);
    });
});
