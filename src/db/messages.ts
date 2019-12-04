import joi from '@hapi/joi';
import db from './connection';
import { makeExecutableSchema } from 'graphql-tools';

const schema = joi.object().keys({
    username: joi
        .string()
        .alphanum()
        .required(),
    subject: joi.string().required(),
    message: joi
        .string()
        .max(500)
        .required(),
    imageUrl: joi.string().uri({
        scheme: [/https?/],
    }),
});

const typeDefs = [
    `
      type Query {
        message(_id: String): Message
        messages: [Message]
        messagesCount: String
      }
      type Message {
        _id: String
        username: String
        subject: String
        message: String
        imageUrl: String
      }
      type Mutation {
        createMessage(username: String, subject: String, message: String, imageUrl: String): Message
      }
      schema {
        query: Query
        mutation: Mutation
      }
    `,
];

interface Message {
    _id: string;
    username: string;
    subject: string;
    message: string;
    imageUrl: string;
}

const messages = db.get('messages');

function getOneById(_id: string): Promise<Message | undefined> {
    return messages.findOne({ _id });
}
function getAll(): Promise<Array<Message>> {
    return messages.find();
}

function countAll() {
    return messages.count();
}

function create(message: any) {
    if (!message.username) message.username = 'Anonymous';

    const result = joi.valid(message, schema);
    if (result.error == null) {
        message.created = new Date();
        return messages.insert(message);
    } else {
        return Promise.reject(result.error);
    }
}

const resolvers = {
    Query: {
        message: async (root: any, { _id }: any) => {
            return await getOneById(_id);
        },
        messages: async () => {
            return await getAll();
        },
        messagesCount: async () => {
            return await countAll();
        },
    },
    Mutation: {
        createMessage: async (root: any, args: any, context: any, info: any) => {
            return await create(args);
        },
    },
};

const graphQLSchema = makeExecutableSchema({ typeDefs, resolvers });

export default {
    create,
    getAll,
    graphQLSchema,
};
