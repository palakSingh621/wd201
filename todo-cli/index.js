const { connect } = require("./connectDB.js");
const Todo = require("./todoModel.js");

// eslint-disable-next-line no-unused-vars
const createTodo = async () => {
  try {
    await connect();
    const todo = await Todo.addTask({
      title: "third Task",
      dueDate: new Date(),
      complete: false,
    });
    console.log(`created item with id ${todo.id}`);
  } catch (err) {
    console.error(err);
  }
};

// eslint-disable-next-line no-unused-vars
const countItems = async () => {
  try {
    const totalCount = await Todo.count();
    console.log(`Found ${totalCount} items in the table!`);
  } catch (err) {
    console.error(err);
  }
};

const getAllTodos = async () => {
  try {
    const todos = await Todo.findAll();
    const todoList = todos.map((todo) => todo.displayableString()).join("\n");
    console.log(todoList);
  } catch (err) {
    console.error(err);
  }
};

// eslint-disable-next-line no-unused-vars
const getSingleTodo = async () => {
  try {
    const todos = await Todo.findOne({
      where: {
        complete: false,
      },
      order: [["id", "ASC"]],
    });

    console.log(todos.displayableString());
  } catch (err) {
    console.error(err);
  }
};

// eslint-disable-next-line no-unused-vars
const updateTodo = async (id) => {
  try {
    await Todo.update(
      { complete: true },
      {
        where: {
          id: id,
        },
      },
    );
  } catch (err) {
    console.error(err);
  }
};

// eslint-disable-next-line no-unused-vars
const deleteTodo = async (id) => {
  try {
    const deleteItem = await Todo.destroy({
      where: {
        id: id,
      },
    });

    console.log(`Deleted ${deleteItem} row!`);
  } catch (err) {
    console.error(err);
  }
};

//Anonymous functions: functions that doesn't have a name and are invoked as soon as they are defined
(async () => {
  // await createTodo()
  // await countItems()
  // await getAllTodos(),
  // await getSingleTodo()
  // await updateTodo(4),
  //  await deleteTodo(3)
  await getAllTodos();
})();
