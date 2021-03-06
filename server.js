const express = require("express");
const path = require("path");
const server = express();
const mongoose = require("mongoose");

// const expressSanitizer = require("express-sanitizer");

// app.use(express.json());
// // mounting express-sanitizer middleware
// app.use(expressSanitizer());

// app.post('/', function(reqest, response, next){
//     // replace an http posted body property with the sanitized string
//     const sanitizedString = reqest.sanitize(reqest.body.propertyToSanitize);
//     // send the respose
//     response.send({ sanitized: sanitizedString });
// });

let db = null;
let scoreSchema = mongoose.Schema({
    _id: String,
    value: Number
});

// Create mongoose schema
let Score = mongoose.model('Score', scoreSchema);

// Connecting to MongoDB
mongoose.connect('mongodb://mongo:27017/snakegame',
    { useNewURLParser: true }
)
    .then((database) => {
        console.log('MongoDB Connected');

        db = database;

    })
    .catch(err => console.log(err));

server.use(express.static("static"));

server.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, './static/homepage.html'));
});

// /play?user=Calista
server.get('/play', (request, response) => {
    let user = request.query.user;
    console.log(user);
    response.sendFile(path.join(__dirname, './static/play.html'));
});

// /score?user=calista&score=20
server.post('/score', (request, response) => {

    // Grab username and score from POST request (provided after user wins game)
    let user = request.query.user;
    let score = request.query.score;

    // Check if the new score is less than the current score
    Score.findOne({ '_id': user }, (err, result) => {
        if (err) throw err;

        // Check if user exsits
        if (result && result.value > score) {
            console.log(result);
            response.sendStatus(200);
            return;
        }
        // Instantiate a new Score objects to save to mongodb (Score was defined above)
        let scoreDoc = new Score({
            _id: user,
            value: score
        });

        // Save the score to mongodb (find if any exist and update or create if does not exist already)
        Score.findOneAndUpdate(
            // Search on primary key "_id", this is the unique identifier for the data, here we use "user"
            { '_id': user },
            // Pass in the score object we just created as the data to upsert with
            scoreDoc,
            // Upsert is short-hand update or insert (update if exists, insert if not)
            { upsert: true },
            (err) => {
                if (err) throw err;
                // This callback will run after we've upserted the data into mongodb
                // Once we've done this, send a response back to the user
                console.log("Score Saved!");
                console.log(user + ": " + score);
                response.sendStatus(201);
            });
    });
});

server.get('/scores', (reqest, response) => {
    // Get the top 10 scores from mongodb
    Score.find().sort([['value', 'descending']]).limit(10).exec((err, scores) => {
        if (err) throw err;
        console.log(scores);
        response.json(scores);
    });
});

// 1. user finishes snake game
// 2. POST request is sent through this server with the score and username
// /score?u=calista&s=10 (score will be in URL parameters OR body)
// 3. Sever gets
// server.post("/score", ...)
// You've acheived this point when you can print a username and a score
// 4. Add the username and score PAIR to a database
// Easiest database to start with is MongoDB

// A database is a big excel sheet
// col | username | score
// 0   | calista  | 10,000
// 1   | jacob    | 100

server.listen(3000, () => {
    console.log("Listening on http://localhost:3000/")
});