const express = require('express');
const app=express()
const cors = require('cors');
const jwt =require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000

app.use(cors())
app.use(express.json())


require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldrxrdq.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // const userCollection = client.db("meal-system").collection('users');
    const mealCollection = client.db("meal-system").collection('addMeal');

    //add meal
    app.post('/addMeal', async(req, res) =>{
      const newMeal = req.body
      newMeal.date = new Date()
      newMeal.likes = newMeal.likes || 0
      newMeal.reviews = newMeal.reviews || 0

      const result = await mealCollection.insertOne(newMeal)
      res.send(result)
    })

    //all meals
    app.get('/allMeals', async(req, res) =>{
      const result = await mealCollection.find().toArray()
      res.send(result)
    })

    //meal deatils
    app.get('/mealDetails/_id', async(req, res) =>{
      const mealId = req.params._id
      const query = { _id : new ObjectId(mealId)}
      const result = await mealCollection.findOne(query)
      console.log(result)
      res.send(result)
    })

    // //auth related
    // app.post('/jwt', async(req, res) =>{
    //     const user = req.body
    //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'})
    //     // console.log('tik ttok token',token)
    //     res.send({ token })
    // })

    // const verifyToken = (req, res, next)=>{
    //     // console.log('inside',req.headers.authorization)
    //     if(!req.headers.authorization){
    //         return res.status(401).send({message: 'forbidden'})
    //     }

    //     const token = req.headers.authorization.split(' ')[1]
    //     jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err, decoded) =>{
    //          if(err){
    //           return res.status(401).send({message: 'forbidden'})
    //          }
    //          req.decoded = decoded
    //          next()
    //     })
    // }
    // //users related
    // app.get('/users', verifyToken, async(req, res) =>{
    //     // console.log('head',req.headers)
    //     const result=await userCollection.find().toArray()
    //     res.send(result)
    // })


    // app.post('/users', async(req, res) => {
    //     const user = req.body
    //     const query ={email: user.email}
    //     const existingUser =await userCollection.findOne(query)
    //     if(existingUser){
    //         return res.send({message: 'User already exists', insertedId: null})
    //     }
    //     const result=await userCollection.insertOne(user)
    //     res.send(result)
    // })


    // app.get('/users/admin/:email', verifyToken, async(req,res) =>{
    //   const email =req.params.email
    //   console.log(email);
    //   if(email !== req.decoded.email){
    //     return res.status(403).send({message: 'unauthorized'})
    //   }

    //   const query = {email : email}
    //   const user = await userCollection.findOne(query)
    //   //  console.log('1d',user)
    //   let admin = false;
    //   if(user){
    //     admin = user?.role == "admin"
    //   }
    //   // console.log('2d',user)
    //   console.log(admin);
    //   res.send({admin})

    // })
    
    // //make admin role
    // app.patch('/users/admin/:id', async(req, res) =>{
    //      const id = req.params.id
    //      const filter = { _id: new ObjectId(id)}
    //      const updatedDoc ={
    //         $set:{
    //             role: 'admin'
    //         }
    //      }
    //      const result =await userCollection.updateOne(filter, updatedDoc)
    //      res.send(result)
    // })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hostel manager is sitting')
})

app.listen(port, () => {
    console.log(`Hostel manager is sitting on port: ${port}`)
})