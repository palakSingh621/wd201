/* eslint-disable no-undef */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
var csrf = require("tiny-csrf");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(
  session({
    secret: "my-super-secret-key-276187642387462749",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
    resave: true,
    saveUninitialized: true,
  }),
);

app.use(flash());

app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("ssh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"])); //secret key should be 32-characters long
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

//using the login information to check user database
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid email or password!" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    },
  ),
);

//creating session for user
passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

//destroying session for user
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

//creating session
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log("Authentication successful, redirecting to todos");
    response.redirect("/todos");
  },
);

//login
app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

//calling models
const { Todo, User } = require("./models");

//render index.ejs with csrfToken
app.get("/", async (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken(),
  });
});

app.set("views", path.join(__dirname, "views"));

//get todos grouped as overdue, dueToday, dueLate and completed
app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const loggedInUser = request.user.id;
      const overdueTasks = await Todo.overdue(loggedInUser);
      const dueTodayTasks = await Todo.dueToday(loggedInUser);
      const dueLaterTasks = await Todo.dueLater(loggedInUser);
      const completedTasks = await Todo.completedItems(loggedInUser);

      if (request.accepts("html")) {
        response.render("todos", {
          title: "Todo Application",
          overdueTasks,
          dueLaterTasks,
          dueTodayTasks,
          completedTasks,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.setHeader("Content-Type", "application/json");
        response.json({
          overdueTasks,
          dueTodayTasks,
          dueLaterTasks,
          completedTasks,
        });
      }
    } catch (error) {
      console.log("Error fetching todos:", error);
      response.status(500).json({ error: "Error fetching todos" });
    }
  },
);

//sign up
app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

// creating users
app.post("/users", async (request, response) => {
  try {
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

    const user = await User.create({
      firstName: request.body.firstName.trim(),
      secondName: request.body.lastName.trim(),
      email: request.body.email.trim(),
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        request.flash("error", "Error logging in after signup");
        return response.redirect("/signup");
      }
      request.flash("success", "Signup successful !");
      response.redirect("/todos");
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      request.flash("error", messages.join(","));
    } else if (error.name === "SequelizeUniqueConstraintError") {
      request.flash("error", "Email already exists");
    } else {
      request.flash("error", "Error creating user");
    }
    return response.redirect("/signup");
  }
});

//signout
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

//insert a todo item
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Incoming reqiest data:", request.body);
    const completedStatus = request.body.completed ? true : false;
    console.log("completion status:", completedStatus);
    console.log("CSRF Token:", request.csrfToken());
    try {
      await Todo.addTodo({
        title: request.body.title.trim(),
        dueDate: request.body.dueDate.trim(),
        userId: request.user.id,
      });
      request.flash("success", "Todo created successfully!");
      return response.redirect("/todos");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        request.flash("error", messages.join(", "));
      } else {
        request.flash("error", "Something went wrong while creating the todo");
      }
      return response.redirect("/todos");
    }
  },
);

// // get all todos
// app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
//   console.log("Processing list of all Todos ...");
//   try {
//     const todos = await Todo.findAll({
//       where:{
//         userId:request.user.id,
//       }
//     });
//     response.send(todos);
//   } catch (error) {
//     console.error("Error fetching todos:", error);
//     response.status(500).send("Error fetching todos");
//   }
// });

//find todo by id for user
app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findOne({
        where: {
          id: request.params.id,
          userId: request.user.id,
        },
      });
      if (!todo) {
        return response.status(404).json({ error: "Todo not found" });
      }
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

//update todo completed status
app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const todo = await Todo.findOne({
        where: {
          id: request.params.id,
          userId: request.user.id,
        },
      });
      if (!todo) {
        return response.status(404).json({ error: "Todo not found" });
      }
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed,
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

//delete a todo
app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      response.status(422).json(error);
    }
  },
);

module.exports = app;
