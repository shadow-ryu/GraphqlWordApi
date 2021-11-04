import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { graphqlHTTP } from "express-graphql";
import axios from "axios";
import bodyParser from "body-parser";
import { graphql, buildSchema } from "graphql";
import mongoose from "mongoose";

dotenv.config();
const app = express();
const Words = [];

app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;
app.use(cors());
const dbURL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gqyqk.mongodb.net/${process.env.MONGODB_NAME}?retryWrites=true&w=majority`;

const db = mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(
      PORT,
      console.log(
        ` server started and runing on http://localhost:${PORT}  database connceted :)`
      )
    );
  })
  .catch((err) => {
    console.log(err);
  });

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Word{
            _id:ID!
            wordName:String!
            definition:String!
            examples:String
            synonyms:[String]
            Grammer:String
        }
        input WordInput{
            wordName:String!
         
          
        }

          type RootQuery {
              words: [Word!]!
          }
          type RootMutation {
             createWord(wordInput:WordInput):Word
          }
          schema {
              query: RootQuery
              mutation: RootMutation
          }
      `),
    rootValue: {
      words: () => {
        return Words;
        // {

        // },
      },
      createWord: async (args) => {
        console.log(
          process.env.MONGODB_NAME,
          process.env.API_ID,
          process.env.APi_KEY
        );
        const apiresult = await axios.get(
          `https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/${args.wordInput.wordName}?strictMatch=true`,
          {
            headers: {
              app_id: process.env.API_ID,
              app_key: process.env.API_KEY,
            },
          }
        );

        const example =
          apiresult.data?.results[0]?.lexicalEntries[0]?.entries[0]?.senses[0]
            ?.examples[0].text;
        const resultSynonyms =
          apiresult.data?.results[0]?.lexicalEntries[0]?.entries[0]?.senses[1]?.synonyms?.map(
            (p) => p.text
          );

        const word = {
          _id: Math.random().toString(),
          wordName: args.wordInput.wordName,
          definition:
            apiresult.data?.results[0]?.lexicalEntries[0]?.entries[0]?.senses[0]
              ?.definitions[0],
          examples: example,
          Grammer:
            apiresult.data?.results[0]?.lexicalEntries[0]?.lexicalCategory
              ?.text,
          synonyms: resultSynonyms,
        };

        Words.push(word);

        return word;
      },
    },
    graphiql: true,
  })
);
