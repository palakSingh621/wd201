"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id: id,
          userId,
        },
      });
    }

    setCompletionStatus(isCompleted) {
      return this.update({ completed: isCompleted });
    }

    static async overdue(userId) {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
          userId,
          completed: false,
        },
      });
    }

    static async dueToday(userId) {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: today,
          userId,
          completed: false,
        },
      });
    }

    static async dueLater(userId) {
      const today = new Date().toISOString().slice(0, 10);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: today,
          },
          userId,
          completed: false,
        },
      });
    }

    static async completedItems(userId) {
      return await Todo.findAll({
        where: {
          completed: true,
          userId,
        },
      });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Title cannot be empty",
          },
        },
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Due date cannot be empty",
          },
        },
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
