const express = require('express');
const mongodb = require('mongodb');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
// const { authenticate } = require('./auth');

const mongoClient = mongodb.MongoClient;
const dbUrl = process.env.DBURL || 'mongodb://127.0.0.1:27017';
// const dbUrl = 'mongodb://127.0.0.1:27017';
const port = 3000;
const database = 'PasswordReset';
const userCollection = 'data';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json('Password Reset and login');
});

app.get('/allusers', async (req, res) => {
    try {
        let client = await mongoClient.connect(dbUrl);
        let opendb = client.db(database);
        let collection = await opendb.collection(userCollection).find().toArray();
        client.close();
        res.json({
            message: "all users datas are showed here",
            collection
        })
    } catch (error) {
        console.log(error)
        res.json({ message: "something went wrong" })
    }
});

app.post('/register', async (req, res) => {
    try {
        let client = await mongoClient.connect(dbUrl);
        let opendb = client.db(database);
        // let data = await opendb.collection(userCollection)
        // .insertOne({ username: req.body.name, email: req.body.mail, password: req.body.code });
        // client.close();
        // res.json({message:"youe data update",data})
        let already = await opendb.collection(userCollection).findOne({ email: req.body.mail })
        if (!already) {
            let salt = await bcryptjs.genSalt(10);
            let hash = await bcryptjs.hash(req.body.code, salt);
            req.body.code = hash;
            let data = await opendb.collection(userCollection)
                .insertOne({ username: req.body.name, email: req.body.mail, password: req.body.code });
            res.json({ message: "updated", data })
        } else {
            res.json({ message: "you already having an account...please login to continue..." })
        }
        client.close();
    } catch (error) {
        console.log(error);
        res.json({ message: "something went wrong with register" });
    }
});

app.post('/login', async (req, res) => {
    try {
        let client = await mongoClient.connect(dbUrl);
        let db = client.db(database);
        let user = await db.collection(userCollection).findOne({ email: req.body.mail });
        // console.log(user)
        // client.close();
        // res.json({message:"haii"})
        if (user) {
            let result = await bcryptjs.compare(req.body.code, user.password);
            //result is not true
            if (result) {
                JWT.sign({ user }, process.env.PRIVATEKEY, { expiresIn: 30 }, (err, token) => {
                    if (err) {
                        res.json({ message: 'something went wrong in authentication' });
                    } else {
                        res.json({ message: "your token is avail in local", token });
                    }
                });
            } else {
                res.json({ message: 'Access not Allowed' });
            }
        } else {
            res.json({ message: 'User not found' });
        }
    } catch (error) {
        console.log(error);
        res.json({ message: 'Something went wrong' });
    }
});

app.post('/emaillink', async (req, res) => {
    try {
        let client = await mongoClient.connect(dbUrl);
        let db = client.db(database);
        let user = await db.collection(userCollection).findOne({ email: req.body.mail });
        // console.log(user)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        let mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Reset Password',
            text: 'click here to reset password',
            html:
                '<h3>Reset your password Here</h3><a href="https://pass-reset-frontend.netlify.app/reset">Click Here</a>',
        };
        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Email Sent');
            }
        });
        res.json({ message: "mail sent to your targetmail..check it" })
        // client.close();
    } catch (error) {
        console.log(error);
        res.json({ message: 'Something went wrong' });
    }
});

app.put('/reset', async (req, res) => {
    try {
        let client = await mongoClient.connect(dbUrl);
        let db = client.db(database);
        let data = await db.collection(userCollection).findOne({ email: req.body.mail });
        // console.log(data.password)
        let result = await bcryptjs.compare(req.body.code, data.password);
        // console.log(result)
        if (!result) {
            let salt = await bcryptjs.genSalt(10);
            let hash = await bcryptjs.hash(req.body.code, salt);
            // req.body.code = hash;
            await db.collection(userCollection).findOneAndUpdate({ email: req.body.mail }, { $set: { password: hash } });
            let data = await db.collection(userCollection).find().toArray();
            res.json({message:"new password update successfully!!!",data})
        } else {
            res.json({ message: "entered password is same as the existing one" })
        }
        client.close();
        res.json({ message: "password update" })
    } catch (error) {
        console.log(error);
        res.json({ message: 'Something went wrong' });
    }
});

app.listen(process.env.PORT || port, () => console.log(`Server started on port : ${port}`));