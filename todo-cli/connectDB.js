const Sequalize = require("sequelize");

const database = "todo_db";
const username = "postgres";
const password = "palak";

const sequelize = new Sequalize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
  logging: false,
});

// sequelize.authenticate().then(() => {
//     console.log("Connection has been established successfully.");
//   })
//   .catch((error) => {
//     console.error("Unable to connect to the database:", error);
//   });

const connect = async () => {
  return sequelize.authenticate();
};

module.exports = {
  sequelize,
  connect,
};
