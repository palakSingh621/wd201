"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Todos");
    if (!tableDescription.userId) {
      await queryInterface.addColumn("Todos", "userId", {
        type: Sequelize.DataTypes.INTEGER,
      });
    }

    const constraints = await queryInterface.showConstraint("Todos");
    const constraintExists = constraints.some(
      (constraint) =>
        constraint.constraintName.includes("userId") &&
        constraint.constraintType === "FOREIGN KEY",
    );

    if (!constraintExists) {
      await queryInterface.addConstraint("Todos", {
        fields: ["userId"],
        type: "foreign key",
        references: {
          table: "Users",
          field: "id",
        },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Todos", "userId");
    await queryInterface.removeColumn("Todos", "userId");
  },
};
