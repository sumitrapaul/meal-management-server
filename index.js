const express = require('express');
const app=express()
const cors = require('cors');
const jwt =require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000

// app.use(cors())
app.use(cors({
    origin:[
      'http://localhost:5173'
    ],
    credentials:true
  }))
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

    const userCollection = client.db("meal-system").collection('users');

    //auth related
    app.post('/jwt', async(req, res) =>{
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'})
        // console.log(token)
        res.send({ token })
    })

    const verifyToken = (req, res, next)=>{
        console.log(req.headers)
        if(!req.headers.authorization){
            return res.status(401).send({message: 'forbidden'})
        }

        const token = req.headers.authorization.split(' ')[1]
    
        // next()
    }
    //users related
    app.get('/users', verifyToken, async(req, res) =>{
        console.log(req.headers)
        const result=await userCollection.find().toArray()
        res.send(result)
    })


    app.post('/users', async(req, res) => {
        const user = req.body
        const query ={email: user.email}
        const existingUser =await userCollection.findOne(query)
        if(existingUser){
            return res.send({message: 'User already exists', insertedId: null})
        }
        const result=await userCollection.insertOne(user)
        res.send(result)
    })
    
    //make admin role
    app.patch('/users/admin/:id', async(req, res) =>{
         const id = req.params.id
         const filter = { _id: new ObjectId(id)}
         const updatedDoc ={
            $set:{
                role: 'admin'
            }
         }
         const result =await userCollection.updateOne(filter, updatedDoc)
         res.send(result)
    })

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