require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require("body-parser");


//Middle ware
app.use(bodyParser.json())

//Listening Port
app.listen(3000);


app.get('/', (req, res) => {
    res.send('i am inside the home');
})

const postRoute = require('./routes/Requests');
app.use('/api', postRoute)