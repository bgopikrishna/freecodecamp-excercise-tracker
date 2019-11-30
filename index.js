const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(express.urlencoded());

app.use(cors({ optionSuccessStatus: 200 }));

mongoose
    .connect(
        'mongodb+srv://mistborn:fccDatabase@personalcluster-gx87z.mongodb.net/test?retryWrites=true&w=majority'
    )
    .then(() => {
        console.log('Connected to mongoDB');
    })
    .catch(err => {
        console.log('Error mongodb', err);
    });

const userListSchema = new mongoose.Schema({
    username: String
});

const excerciseListSchema = new mongoose.Schema({
    userId: String,
    username: String,
    description: String,
    duration: Number,
    date: String
});

const User = mongoose.model('ETUserList', userListSchema);
const Excerise = mongoose.model('ETexercises', excerciseListSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', (req, res) => {
    const username = req.body.username;
    createUser(username)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            res.send('Error occured');
        });
});

app.post('/api/exercise/add', (req, res) => {
    const exercise = req.body;
    createExcercise(exercise)
        .then(result => {
            const { description, duration, date, username } = result;
            const { userId } = exercise;

            res.send({
                _id: userId,
                description,
                duration,
                date,
                username
            });
        })
        .catch(err => res.send(err.message));
});

app.get('/api/exercise/log', async (req, res) => {
    console.log(req);
    const { userId = null, from = '', to = '', limit = null } = req.query;
    console.log(req.query);
    if (userId) {
        getExcersiceLog(userId, from, to, limit).then(log => {
            res.send(log);
        });
    } else {
        res.send('Unknown id');
    }
});

async function createUser(username) {
    const isUsernameAlreadyTaken = await checkIfUserNameAlreadyExits(username);

    console.log(isUsernameAlreadyTaken);

    if (!isUsernameAlreadyTaken) {
        const user = new User({ username: username });
        const result = await user.save();

        return result;
    } else {
        return 'username already taken';
    }
}

async function getExcersiceLog(userId, from = '', to = '', limit) {
    console.log(arguments);

    let log;

    if (from && to) {
        const fromDate = formatDate(from);
        const toDate = formatDate(to);
        log = await Excerise.find({
            userId: userId,
            date: { $gte: fromDate, $lte: toDate }
        });
    } else if (from) {
        const fromDate = formatDate(from);
        log = await Excerise.find({
            userId: userId,
            date: { $gte: fromDate }
        });
    } else if (to) {
        const toDate = formatDate(to);
        log = await Excerise.find({
            userId: userId,
            date: { $lte: toDate }
        });
    } else {
        log = await Excerise.find({
            userId: userId
        });
    }

    if (limit && parseInt(limit) !== NaN) {
        return log.slice(0, parseInt(limit));
    }
    return log;
}

async function createExcercise(exerciseFromForm) {
    const { userId, description, duration } = exerciseFromForm;
    const date = formatDate(exerciseFromForm.date);
    const user = await getUserName(userId);

    if (user !== null && date !== null) {
        const username = user.username;
        const newExcersice = new Excerise({
            userId: userId,
            description,
            duration,
            date,
            username
        });
        const result = await newExcersice.save();
        return result;
    } else {
        throw Error('unknown id');
    }
}

async function checkUserExists(userId) {
    const userList = await User.find({ _id: userId });
    return userList.length ? true : false;
}

async function checkIfUserNameAlreadyExits(username) {
    const userList = await User.find({ username: username });
    return userList.length ? true : false;
}

async function getUserName(id) {
    const user = await User.find({ _id: id });
    return user.length ? user[0] : null;
}

function formatDate(date = '') {
    let formatedDate = new Date(date);
    if (formatedDate) {
        return formatedDate;
    } else {
        return null;
    }
}

const port = process.env.PORT || 8000;
const listener = app.listen(port, function() {
    console.log('Your app is listening on port ' + listener.address().port);
});
