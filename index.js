const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const { json } = require("express");
const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware for cors policy and accepting json fotmat
app.use(cors());
app.use(json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkswl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // to check that if there is any issue or not
    console.log("connected");
    const database = client.db("end-game-task");
    const services = database.collection("services");
    const testimonials = database.collection("testimonials");
    const appointments = database.collection("appointments");
    const users = database.collection("users");
    const discount = database.collection("discount");

    // get services
    app.get("/services", async (req, res) => {
      const query = services.find({});
      const result = await query.toArray();
      res.send(result);
    });

    // get all services for pagination
    app.get("/allservices", async (req, res) => {
      const cursor = services.find({});
      const count = await cursor.count();
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let allservices;
      // console.log(req.query);
      if (page) {
        allservices = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        allservices = await cursor.toArray();
      }
      res.json({
        count,
        allservices,
      });
    });

    // get specific service
    app.get("/services/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    // get testimonials
    app.get("/testimonials", async (req, res) => {
      const query = testimonials.find({});
      const result = await query.toArray();
      res.send(result);
    });

    // get and verified the discount ammount
    app.get("/discount", async (req, res) => {
      const query = discount.find({});
      const result = await query.toArray();
      res.send(result);
    });

    // book an appointment
    app.post("/appointment", async (req, res) => {
      const appointmentInfo = req.body;
      const result = await appointments.insertOne(appointmentInfo);
      res.send(result);
    });

    // get all appointments
    app.get("/allAppointments", async (req, res) => {
      const query = appointments.find({});
      const result = await query.toArray();
      res.send(result);
    });

    // get specific user appointment
    app.get("/userAppointments", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = appointments.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete appointments from manage appointments
    app.delete("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointments.deleteOne(query);
      res.send(result);
    });

    // delete reviews
    app.delete("/testimonials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await testimonials.deleteOne(query);
      res.send(result);
    });

    // delete discpunt
    app.delete("/discount/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await discount.deleteOne(query);
      res.send(result);
    });

    // send review to database
    app.post("/user/testimonial", async (req, res) => {
      const testimonial = req.body;
      const result = await testimonials.insertOne(testimonial);
      res.send(result);
    });

    // update review to show in the web
    app.put("/testimonials/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { status: "approved" } };
      const result = await testimonials.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // sending user to database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await users.insertOne(user);
      res.send(result);
    });

    // sending google user to database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: user };
      const options = { upsert: true };
      const result = await users.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // add admin role to database
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const admin = await users.findOne({
        email: user.requester,
      });
      if (admin.role === "admin") {
        const filter = { email: user.email };
        const updateDoc = { $set: { role: "admin" } };
        const result = await users.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(401).json({ message: "you do not have permission" });
      }
    });

    // get admin from database
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await users.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
  } finally {
    // client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is a server!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
