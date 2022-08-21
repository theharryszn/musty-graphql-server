require("dotenv/config")

const { ApolloServer, gql } = require('apollo-server');
const { isEmail } = require("class-validator");
const moment = require("moment");
const Comment = require("./models/Comment");
const Post = require("./models/Post");
const Topic = require("./models/Topic");
const User = require("./models/User");

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # Type User
  type User {
    id: ID!
    name: String!
    email: String!
    pronoun: String
    joined: String
    followers: [String]
    following: [String]
  }

  # Type Post
  type Post {
    id: ID!
    caption: String!
    postedByID: String!
    datePosted: String!
    topic: Topic
  }

  # Type Comment
  type Comment {
    id: ID!
    comment: String!
    commentedByID: String!
    postID: String!
  }

  # Type Topic
  type Topic {
    id: ID!
    title: String
  }

  type PostQuery {
    post: Post!,
    postedBy: User
    comments: [Comment]
    topic: Topic
  }

  type ProfileQuery {
    user: User!
    posts: [PostQuery]
  }

  type TopicQuery {
    topic: Topic!
    posts: [PostQuery]
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    users: [User]
    posts: [PostQuery]
    profile(id: ID!): ProfileQuery
    post(id: ID!): PostQuery
    topic(id: ID!): TopicQuery
    topics: [TopicQuery]
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!, pronoun: String): User
    createPost(caption: String!, postedByID: ID!, topicID: ID!): PostQuery
    createComment(comment: String!, commentedByID: ID!, postID: ID!): Comment
    login(email: String!, password: String!): User
    follow(id: ID!, followerID: ID!): Boolean
  }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        users: async () => await User.find(),
        posts: async () => {
            const posts = await Post.find();

            return posts.map(async (post) => {
                const postedBy = await User.findById(post.postedByID);

                const comments = await Comment.find({
                    postID: post.id
                });

                const topic = await Topic.findById(post.topicID);

                return {
                    post: post,
                    postedBy,
                    comments,
                    topic
                }
            })

        },
        profile: async (_, args) => {
            const user = await User.findById(args.id);
            const posts = (await Post.find({
                postedByID: args.id
            })).map(async post => {
                const postedBy = await User.findById(post.postedByID);

                const comments = await Comment.find({
                    postID: post.id
                });
                const topic = await Topic.findById(post.topicID);
                return {
                    post: post,
                    postedBy,
                    comments,
                    topic
                }
            } );

            return {
                user,
                posts
            }
        },
        post: async (_, args) => {
            const post = await Post.findById(args.id);
            const postedBy = await User.findById(post.postedByID);
            const comments = await Comment.find({
                postID: args.id
            });
            const topic = await Topic.findById(post.topicID);
            return {
                post,
                postedBy,
                comments,
                topic
            }
        },
        topic: async (_, args) => {
            const topic = await Topic.findById(args.id);
            const posts = (await Post.find({
                topicID: args.id
            })).map(async post => {
                const postedBy = await User.findById(post.postedByID);

                const comments = await Comment.find({
                    postID: post.id
                });

                return {
                    post: post,
                    postedBy,
                    comments,
                }
            } );

            
            return {
                topic,
                posts
            }
        },
        topics: async () => {
            const topics = await Topic.find();
            return topics.map(async (topic) => {
                 const posts = (await Post.find({
                postedByID: topic.id
            })).map(async post => {
                const postedBy = await User.findById(post.postedByID);

                const comments = await Comment.find({
                    postID: post.id
                });

                return {
                    post: post,
                    postedBy,
                    comments,
                }
            } );
                return {
                    topic,
                    posts
                }
            })
        }
    },
    Mutation: {
        createUser: async (_, args) => {

            if (!isEmail(args.email)) {
                throw new Error("Invalid email");
            }

            const checkIfUserExits = await User.findOne({
                email: args.email
            });

            if (checkIfUserExits) {
                throw new Error("User already exists");
            }

            const user = new User({
                name: args.name,
                email: args.email,
                password: args.password,
                pronoun: args.pronoun,
                dateJoined: new Date(),
                joined: moment(new Date()).format("MMM YYYY"),
                followers: [],
                following: []
            });

            await user.save();
            return user;
        },
        createPost: async (_, args) => {
            const post = new Post({
                caption: args.caption,
                postedByID: args.postedByID,
                topicID: args.topicID,
                datePosted: moment(new Date()).format("MMM ddd YYYY")
            });

            await post.save();

            const postedBy = await User.findById(post.postedByID);

            const comments = await Comment.find({
                postID: post.id
            });

            const topic = await Topic.findById(post.topicID);

            return {
                post: post,
                postedBy,
                comments,
                topic
            }
        },
        createComment: async (_, args) => {
            const comment = new Comment({
                comment: args.comment,
                commentedByID: args.commentedByID,
                postID: args.postID
            });

            await comment.save();
            return comment;
        },
        login: async (_, args) => {

            if (!isEmail(args.email)) {
                throw new Error("Invalid email");
            }

            const user = await User.findOne({
                email: args.email
            });

            if (!user) {
                throw new Error("User not found");
            }

            const isPasswordMatch = user.password === args.password;

            if (!isPasswordMatch) {
                throw new Error("Password is incorrect");
            }

            return user;
        },
        follow: async (_, args) => {
            const user = await User.findById(args.id);
            const follower = await User.findById(args.followerID);
            if (!user || !follower) {
                throw new Error("User not found");
            }
            user.followers.push(follower.id);
            await user.save();
            return true;
        }
    }
};

(async () => {
    const mongoose = require('mongoose');

    await mongoose.connect(process.env.MONGO_URI, {
        dbName: "musty"
    });

    const {
        ApolloServerPluginLandingPageLocalDefault
    } = require('apollo-server-core');
        
    // The ApolloServer constructor requires two parameters: your schema
    // definition and your set of resolvers.
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        csrfPrevention: true,
        cache: 'bounded',
        cors: true,
        /**
         * What's up with this embed: true option?
         * These are our recommended settings for using AS;
         * they aren't the defaults in AS3 for backwards-compatibility reasons but
         * will be the defaults in AS4. For production environments, use
         * ApolloServerPluginLandingPageProductionDefault instead.
        **/
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({ embed: true }),
        ],
    });
    
    // The `listen` method launches a web server.
    server.listen().then(({ url }) => {
        console.log(`🚀  Server ready at ${url}`);
    });

})();