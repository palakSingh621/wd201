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

app.set("views", path.join(__dirname, "views"));
app.use(flash());

app.use(bodyParser.json());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("ssh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"])); //secret key should be 32-characters long
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "my-super-secret-key-276187642387462749",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
    sameSite: "Strict",
    resave: true,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

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
        // eslint-disable-next-line no-unused-vars
        .catch((error) => {
          return done(null, false, { message: "User does not exists" });
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

app.set("view engine", "ejs");

//render index.ejs with csrfToken
app.get("/", async (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  return response.render("index", {
    title: "Todo Manager",
    csrfToken: request.csrfToken(),
  });
});

//sign up
app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

//login
app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
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

//signout
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

//calling models
const { Todo, User } = require("./models");

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
          title: "Todo Manager",
          overdueTasks,
          dueTodayTasks,
          dueLaterTasks,
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

// creating users
app.post("/users", async (request, response) => {
  try {
    if (request.body.password.trim() === "") {
      request.flash("error", "Password cannot be empty");
      return response.redirect("/signup");
    }
    if (request.body.password.length < 8) {
      request.flash("error", "Password length should be minimum 8");
      return response.redirect("/signup");
    }
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
      request.flash("error", messages);
    } else if (error.name === "SequelizeUniqueConstraintError") {
      request.flash("error", "Email already exists");
    } else {
      request.flash("error", "Something went wrong while creating the todo");
    }
    return response.redirect("/signup");
  }
});

//insert a todo item
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.error("Incoming request data:", request.body);
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
        request.flash("error", messages);
      } else {
        request.flash("error", "Something went wrong while creating the todo");
      }
      return response.redirect("/todos");
    }
  },
);

//update todo completed status
app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const todo = await Todo.findOne({
      where: {
        id: request.params.id,
        userId: request.user.id,
      },
    });
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed,
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      response.status(422).json(error);
    }
  },
);

//delete a todo
app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const data = await Todo.remove(request.params.id, request.user.id);
      if (data == 1) {
        return response.send(true);
      } else {
        return response.send(false);
      }
    } catch (error) {
      console.log(error);
      response.status(422).send(false);
    }
  },
);

module.exports = app;
