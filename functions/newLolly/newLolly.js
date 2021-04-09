const { ApolloServer, gql } = require("apollo-server-lambda")
const faunadb = require("faunadb")
const axios = require("axios")
q = faunadb.query
require("dotenv").config()
const shortid = require("shortid")

const typeDefs = gql`
  type Query {
    hello: String
    getVCard: [vCard]
    getLollyByLink(link: String): vCard
  }
  type vCard {
    c1: String
    c2: String
    c3: String
    rec: String
    sender: String
    msg: String
    link: String
  }
  type Mutation {
    addVCard(
      c1: String
      c2: String
      c3: String
      rec: String
      sender: String
      msg: String
    ): vCard
  }
`
var client = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET })
// var client = new faunadb.Client({ secret: "fnAEGW5zIPACB6Gp9SLTf8i3gBP3i8cCPKPwDZ1v" });

const resolvers = {
  Query: {
    hello: () => {
      return "Hello, Virtual Lolly...."
    },

    getVCard: async (root, args, context) => {
      try {
        var client = new faunadb.Client({
          secret: process.env.FAUNADB_SERVER_SECRET,
        })
        var result = await client.query(
          q.Map(
            q.Paginate(q.Match(q.Index("link"))),
            q.Lambda("x", q.Get(q.Var("x")))
          )
        )
        let x = []
        result.data.map(curr => {
          x.push(curr.data)
        })
        return x
      } catch (err) {
        console.log("error from function:", err)
      }
    },

    getLollyByLink: async (_, { link }) => {
      console.log(link)
      try {
        const result = await client.query(q.Get(q.Match(q.Index("link"), link)))
        console.log(result)
        return result.data
      } catch (error) {
        return error.toString()
      }
    },
  },

  Mutation: {
    addVCard: async (_, { c1, c2, c3, rec, msg, sender }) => {
      try {
        var client = new faunadb.Client({
          secret: process.env.FAUNADB_SERVER_SECRET,
        })
        console.log("============================")
        console.log(c1, c2, c3, rec, msg, sender)
        console.log("============================")

        const result = await client.query(
          q.Create(q.Collection("Lollies"), {
            data: {
              c1,
              c2,
              c3,
              rec,
              msg,
              sender,
              link: shortid.generate(),
            },
          })
        )

        axios
          .post("https://api.netlify.com/build_hooks/607089c76d56c7199d814e93")
          .then(function (response) {
            console.log(response)
          })
          .catch(function (error) {
            console.error(error)
          })

        return result.data.data
      } catch (err) {
        console.log("error in mutation newLolly=====>>>>>======", err)
      }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

exports.handler = server.createHandler()
