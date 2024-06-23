const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: [
    // 'http://localhost:5173'

      'https://b9a12-tourist.web.app',
    //   'https://b9a11-fitness-client-2c51c.firebaseapp.com'

  ],
  credentials: true,
  optionalSuccessStatus: 200,
}


app.use(cors(corsOptions));
app.use(express.json());
// hBQikgWdU9OJwuf2
// fitness
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw7ggrk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const packageCollection = client.db('tourist').collection('packages')
    const usersCollection = client.db('tourist').collection('user')
    const bookedCollection = client.db('tourist').collection('booked')
    const wishlistCollection = client.db('tourist').collection('wishlist')
    const feedbackCollection = client.db('tourist').collection('feedback')


    // ?JWT:
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '24h'
      });
      res.send({ token });
    })

      // middlewares 
      const verifyToken = (req, res, next) => {
        console.log('inside verify token', req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
        })
      }


    app.get("/package", async (req, res) => {
      const cursor = packageCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
   
// add packages  :--
app.post('/package', async (req, res) => {
  const newItem = req.body;
  console.log(newItem);
  const result = await packageCollection.insertOne(newItem);
  res.send(result)
})


    // wishlist (post) create:
    app.post('/wishlist', async (req, res) => {
      const wishlist = req.body;
      const touristEmail=wishlist.touristEmail
      const tourId=wishlist.tourId
      const isExist = await wishlistCollection.findOne({touristEmail,tourId})
      if(isExist){
        return res.send({message:"already exist",insertedId:null})
      }
      const result = await wishlistCollection.insertOne(wishlist);
      res.send(result)
    })
   
// wishlist get :
    app.get('/mywishlist/:email', async(req,res)=>{
const result =await wishlistCollection.find().toArray();
res.send(result)
    })
    app.get('/mywishlist/:email', async (req, res) => {
      console.log(req.params.email);
      const result = await wishlistCollection.find({touristEmail: req.params.email}).toArray();
      res.send(result)
    })
     // delete from wishlist  :->
     app.delete('/delete/:id', async (req, res) => {
      const result = await wishlistCollection.deleteOne({ _id: new ObjectId(req.params.id) })
      console.log(result);
      res.send(result)
    })





    //  feedback (post) :
    app.post('/feedback', async (req, res) => {
      const value = req.body;
      console.log(value);
      const result = await feedbackCollection.insertOne(value);
      res.send(result)
    })
// get feedback:--
    app.get("/feedback", async (req, res) => {
      const cursor = feedbackCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })




    // app.put("/user",async(req,res)=>{
    // const user =req.body
    // const query = {email:user?.email}
    // // user already exist!:
    // const isExist = await userCollection.findOne(query)
    // if(isExist){
    //   if(user.status==='requested'){
    //     const result = await userCollection.updateOne(query,{$set:{status:user?.status},
    //     })
    //    return res.send(result)
    //   }else{
    //     return res.send(isExist)

    //  }
    // }
    // save a user data in db
    app.put('/user', async (req, res) => {
      const user = req.body

      const query = { email: user?.email }
      // check if user already exists in db
      const isExist = await usersCollection.findOne(query)
      if (isExist) {
        if (user.status === 'requested') {
          // if existing user try to change his role
          const result = await usersCollection.updateOne(query, {
            $set: { status: user?.status },
          })
          return res.send(result)
        } else {
          // if existing user login again
          return res.send(isExist)
        }
      }
      // if(isExist) return res.send(isExist)
      // save user 1st time:
      const options = { upsert: true }

      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      }
      const result = await usersCollection.updateOne(query, updateDoc, options)
      res.send(result)
    }
    )


    // get a user info role by email from db
    app.get('/user/role/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersCollection.findOne({ email })
      res.send(result)
    })
    // get all users data from db
    app.get('/user', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

// details of user :
app.get('/detailsProfile/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await usersCollection.findOne(query)
  console.log(result)
  res.send(result)
})



    // details of package:-->
    app.get('/details/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await packageCollection.findOne(query)
      console.log(result)
      res.send(result)
    })
    // Get all packages from db:change api plaase
    app.get('/packages', async (req, res) => {
      const tourType = req.query.tourType
      console.log(tourType)
      let query = {}
      if (tourType && tourType !== 'null') query = { tourType }
      const result = await packageCollection.find(query).toArray()
      res.send(result)
    })


    // const saveUser = async user =>{
    //   const CurrentUser ={
    //     email:user?.email,
    //     role:'guest',
    //     status:''
    //   }
    //   const {data} = await axios.put("/user")
    //   return data
    // }

    
    // tour guide selection dropdown :
    app.get('/tourGuide', async (req, res) => {
      const result = await usersCollection.aggregate([
        {
          $match: {
            role: 'tourGuide'
          }
        },
        {
          $project: {
            _id: 0,
            name: 1
          }
        }
      ]).toArray()
      console.log(result)
      res.send(result)
    })

//do a user make admin ,button:
app.patch('/user/admin/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc);
  res.send(result);
})

    // tour guide button:
    app.patch('/user/guide/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'tourGuide',
          status: 'verified'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })



    // for booking:
    app.post('/booked', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const touristEmail=booking.touristEmail
      const tourId=booking.tourId
      const isExist = await bookedCollection.findOne({touristEmail,tourId})
      if(isExist){
        return res.send({message:"already booked",insertedId:null})
      }
      const result = await bookedCollection.insertOne(booking);
      res.send(result)
    })
    // get, my booking by email  :-> 

    app.get('/myBook/:email',  async (req, res) => {
      console.log(req.params.email);
      const result = await bookedCollection.find({touristEmail: req.params.email}).toArray();
      res.send(result)
    })
    // get,MEET tour guide list by   :-> 
    app.get('/tourGuideList', async (req, res) => {
      const result = await usersCollection.find({role:"tourGuide"}).toArray();
      res.send(result)
    })



    // delete from booked  :->
    app.delete('/delete/:id', async (req, res) => {
      const result = await bookedCollection.deleteOne({ _id: new ObjectId(req.params.id) })
      console.log(result);
      res.send(result)
    })
// My Assign (tour guide):-->
    app.get('/myAssigned/:displayName', async (req, res) => {
      console.log(req.params.displayName);
      const result = await bookedCollection.find({tourGuide: req.params.displayName}).toArray();
      res.send(result)
    })
// Tour guide accept button:
app.patch('/accept/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      status:'accepted'
    }
  }
  const result = await bookedCollection.updateOne(filter, updatedDoc);
  res.send(result);
})
// Tour guide reject button:
app.patch('/reject/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      status:'rejected'
    }
  }
  const result = await bookedCollection.updateOne(filter, updatedDoc);
  res.send(result);
})




   





    //   await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    //   await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Tourist is running')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
