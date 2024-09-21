// models/todo.js
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params);
    }
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      const overdueTasks = await Todo.overdue();
      const overdueList = overdueTasks
        .map((todo) => todo.displayableString())
        .join("\n");
      console.log(overdueList);
      console.log("\n");

      console.log("Due Today");
      const dueTodayTasks = await Todo.dueToday();
      const dueTodayList = dueTodayTasks
        .map((todo) => todo.displayableString())
        .join("\n");
      console.log(dueTodayList);
      console.log("\n");

      console.log("Due Later");
      const dueLaterTasks = await Todo.dueLater();
      const dueLaterList = dueLaterTasks
        .map((todo) => todo.displayableString())
        .join("\n");
      console.log(dueLaterList);
    }

    static async overdue() {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: today, // Less than today's date
          },
        },
      });
    }

    static async dueToday() {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: today,
        },
      });
    }

    static async dueLater() {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: today,
          },
        },
      });
    }

    static async markAsComplete(id) {
      const todo = await Todo.findByPk(id);
      if (todo) {
        todo.completed = true;
        await todo.save();
      }
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      let viewDate =
        this.dueDate == new Date().toISOString().slice(0, 10)
          ? ""
          : this.dueDate;
      return `${this.id}. ${checkbox} ${this.title} ${viewDate}`.trim();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
