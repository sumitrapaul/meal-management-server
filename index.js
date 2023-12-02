const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldrxrdq.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("meal-system").collection("users");
    const mealCollection = client.db("meal-system").collection("addMeal");
    const membershipCollection = client.db("meal-system").collection("member");
    const UpcomingMealCollection = client
      .db("meal-system")
      .collection("addToUpcoming");

   

    // //auth related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      // console.log('tik ttok token',token)
      res.send({ token });
    });
     

    //middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside',req.headers.authorization)
      if(!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized" });
      }

      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) {
          return res.status(401).send({ message: "unauthorized" });
        }
        req.decoded = decoded;
        next();
      });
    };
   

    //admin verification
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin) {
        return res.status(401).send({ message: "forbidden" });
      }

      next();
    };

    // //users related 2
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      // console.log('head',req.headers)
      const result = await userCollection.find().toArray();
      console.log(result)
      res.send(result);
    });

    //1
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //3
    app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })


    //profile

    app.get('/users/:email',verifyToken, async(req, res) =>{
      const email = req.params.email;
      console.log(email)
      const query = { email: email };
      console.log(query)
      const result = await userCollection.find(query).toArray();
      console.log(result)
      res.send(result);
    })


     //make admin role 4
    app.patch("/users/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    

    //admin email check
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if(email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role == "admin";
      }

      res.send({ admin });
    });


     //add meal create
     app.post("/addMeal", verifyToken, verifyAdmin, async (req, res) => {
      const newMeal = req.body;
      newMeal.date = new Date();
      newMeal.likes = newMeal.likes || 0;
      newMeal.reviews = newMeal.reviews || 0;

      const result = await mealCollection.insertOne(newMeal);
      res.send(result);
    });
    //add upcoming  meal create
    app.post("/addToUpcoming", async (req, res) => {
      const newUpcomingMeal = req.body;
      newUpcomingMeal.date = new Date();
      newUpcomingMeal.likes = newUpcomingMeal.likes || 0;
      newUpcomingMeal.reviews = newUpcomingMeal.reviews || 0;

      const result = await UpcomingMealCollection.insertOne(newUpcomingMeal);
      res.send(result);
    });

    //all meals read
    app.get("/allMeals", async (req, res) => {
      const result = await mealCollection.find().toArray();
      res.send(result);
    });
    //upcoming meals read
    app.get("/addToUpcoming", async (req, res) => {
      const result = await UpcomingMealCollection.find().toArray();
      res.send(result);
    });

   
    //meal deatils
    app.get("/mealDetails/_id", async (req, res) => {
      const mealId = req.params._id;
      const query = { _id: new ObjectId(mealId) };
      const result = await mealCollection.findOne(query);
      console.log(result);
      res.send(result);
    });


    app.get('/allMeals/:id', async(req, res) =>{
      const id = req.params.id;
      const query ={ _id : new ObjectId(id)}
      const result = await mealCollection.findOne(query)

      res.send(result)
    })
    

    //meals update
    app.patch("/allMeals/:id", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const id = req.params.id
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: item.title,
          category: item.category,
          ingredients: item.ingredients,
          price: item.price,
          image: item.image,
        },
      };
      const result = await mealCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


     //all meals delete
     app.delete("/allMeals/:id", verifyToken, verifyAdmin, async(req, res) =>{
      console.log('delete route')
      const id = req.params.id;
      console.log(id)
      const query = { _id : new ObjectId(id)}
      const result = await mealCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })


    //member ship create
    app.post("/members", async (req, res) => {
      const newMember = req.body;
      const result = await membershipCollection.insertOne(newMember);
      res.send(result);
    });

      //membership read
      app.get("/members", async (req, res) => {
        const result = await membershipCollection.find().toArray();
        
        res.send(result);
      });


   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hostel manager is sitting");
});

app.listen(port, () => {
  console.log(`Hostel manager is sitting on port: ${port}`);
});
