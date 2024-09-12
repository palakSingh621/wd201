const todoList = () => {
  const all = [];

  const formattedDate = (d) => {
    return d.toISOString().split("T")[0];
  };

  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    return all.filter((todo) => todo.dueDate < formattedDate(new Date()));
  };

  const dueToday = () => {
    return all.filter((todo) => todo.dueDate === formattedDate(new Date()));
  };

  const dueLater = () => {
    return all.filter((todo) => todo.dueDate > formattedDate(new Date()));
  };

  const toDisplayableList = (list) => {
    return list
      .map((todo) => {
        const status = todo.completed ? "[x]" : "[ ]";
        const viewDate =
          todo.dueDate === formattedDate(new Date()) ? "" : todo.dueDate;
        return `${status} ${todo.title} ${viewDate}`.trim();
      })
      .join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;
