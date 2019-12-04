import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import messages from './db/messages';
import users from './db/users';
import graphqlHTTP from 'express-graphql';
import dotenv from 'dotenv';
dotenv.config();

const SECRET: string = (process.env.SECRET as string) || 'ilovesaltythings';
const app = express();

app.set('port', process.env.PORT || 3001);
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Behold the MEVN Stack!',
    });
});

app.get('/messages', (req, res) => {
    messages.getAll().then(messages => {
        res.json(messages);
    });
});

app.post('/messages', (req, res) => {
    messages
        .create(req.body)
        .then(message => {
            res.json(message);
        })
        .catch(error => {
            res.status(500);
            res.json(error);
        });
});

app.post('/register', (req, res) => {
    users
        .create(req.body)
        .then(user => {
            const token = jwt.sign({ id: user._id }, SECRET, {
                expiresIn: 86400, // 24h
            });
            res.json({ auth: true, token: token, user: user });
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

app.post('/login', (req, res) => {
    users
        .getByEmail(req.body.email)
        .then(user => {
            if (!user) return res.status(404).send('No user found.');
            const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid) return res.status(401).json({ auth: false, token: null });
            const token = jwt.sign({ id: user._id }, SECRET, {
                expiresIn: 86400, // 24h
            });
            res.json({ auth: true, token: token, user: user });
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

app.use(
    '/api',
    graphqlHTTP({
        schema: messages.graphQLSchema,
        graphiql: true,
    }),
);

export default app;
