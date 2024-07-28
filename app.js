const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const validator = require("validator");
const path = require("path");
require("dotenv").config();

const mongoose = require("mongoose");
const mongoURL = process.env.MONGO_URL;
mongoose.connect(mongoURL);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs"); //tell the app which is generated using express to use EJS as its view engine.
app.set("views", path.join(__dirname, 'views')); // Set the views directory

const quizSchema = new mongoose.Schema({
  title: String,
  options: [String],
  answer: String,
});

const Quiz = mongoose.model("Quiz", quizSchema);

const answerSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Name is required"],
    maxLength: 30,
  },
  userEmail: {
    type: String,
    lowercase: true,
    required: [true, "Email address is requied"],
    validate: [validator.isEmail, "invalid email"],
  },
  userAnswer: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
      selectedOption: { type: String, required: true },
    },
  ],
  userScore: String,
});

const answerModel = mongoose.model("Answer", answerSchema);

app.get("/", function (req, res) {
  //this is used when user do back it reload the page or removes the data saved that user enters
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);

  Quiz.find({})
    .then(function (foundQuiz) {
      if (foundQuiz) {
        // console.log(foundQuiz);
        res.render("quiz", { quizz: foundQuiz });
      } else {
        res.send("Nothing to send please add the Questions");
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const ans = req.body.Quiz;
  console.log(req.body);
  //here we use req.body so enter title or content in body option(postman) in x-www-forn-urlencoded
  const newTitle = req.body.title;
  const newOption = req.body.option;
  const newAnswer = req.body.ans;

  const newQuiz = new Quiz({
    title: newTitle,
    options: newOption,
    answer: newAnswer,
  });

  // saving the item in database also check for errors
  newQuiz
    .save()
    .then(function (result) {
      // console.log(result);
      res.send(result);
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/submitQuiz/:data", function (req, res) {
  const [userName, score] = req.params.data.split("-");
  res.render("submitQuiz", { name: userName, marks: score });
});

app.post("/submitQuiz", async function (req, res) {
  const newUser = req.body.userName;
  const newEmail = req.body.userEmail;
  const quizAnswers = req.body;
  const answers = [];
  console.log(quizAnswers);

  for (let questionKeyId in quizAnswers) {
    if (mongoose.Types.ObjectId.isValid(questionKeyId)) {
      answers.push({
        question: questionKeyId,
        userChoiceAnswer: quizAnswers[questionKeyId],
      });
    }
  }

  let count = 0;

  for (let answer of answers) {
    try {
      const result = await Quiz.findOne({ _id: answer.question });
      if (result.answer === answer.userChoiceAnswer) {
        count++;
      }
    } catch (err) {
      console.log(err);
    }
  }

  const newAnswer = new answerModel({
    userName: newUser,
    userEmail: newEmail,
    userAnswer: answers.map((answer) => ({
      questionId: answer.question,
      selectedOption: answer.userChoiceAnswer,
    })),
    userScore: count,
  });

  console.log(newAnswer.userScore);
  console.log(newAnswer);
  newAnswer
    .save()
    .then(function (result) {
      console.log(result);
    })
    .catch(function (err) {
      console.log(err);
    });
  // res.render("submitQuiz", { name: newUser, marks: count });
  res.redirect(`/submitQuiz/${newUser}-${count}`);
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log(`Server is running on port http://localhost:${3000}`);
});

//middleware-- request response cycle
// it starts with the incoming request executing all the middleware funnctions ib the middleware stack(all the middelware function) step by step and finally sending the response to finish the cycle
