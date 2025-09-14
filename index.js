require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();

const reqLogger = (req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:  ", req.path);
  console.log('Body:  ', req.body || {})
  next();
};


const favoriteSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 3 },
  creator: { type: String, minlength: 3 },
  year: String,
  description: String,
  category: { type: String, required: true },
  tags: [{ type: String }],
  rating: Number,
  status: String,
  notes: String,
}, {timestamps: true});

favoriteSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Fav = mongoose.model("Favorite", favoriteSchema);


console.log("Connecting to", process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });


app.use(express.json());
app.use(express.static("dist"));
app.use(reqLogger);


// Routes
app.get("/api/favs", async (req, res) => {
  try {
    const favs = await Fav.find({});
    res.json(favs);
  } catch (error) {
    next(error);
  }
});
app.post("/api/favs", async (req, res) => {
  try {
    const {
      title,
      creator,
      year,
      description,
      category,
      tags,
      rating,
      status,
      notes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title required" });
    }

    const fav = new Fav({
      title,
      creator,
      year,
      description,
      category,
      tags,
      rating: parseInt(rating),
      status,
      notes,
    });

    const savedFav = await fav.save();
    res.status(201).json(savedFav);
  } catch (error) {
    next(error);
  }
});
app.delete("/api/favs/:id", async (req, res) => {
  try {
    await Fav.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put("/api/favs/:id", async (req, res) => {
  try {
    const {
      title,
      creator,
      year,
      description,
      category,
      tags,
      rating,
      status,
      notes,
    } = req.body;
    
    const updatedFav = await Fav.findByIdAndUpdate(
      req.params.id,
      {
        title,
        creator,
        year,
        description,
        category,
        tags,
        rating: parseInt(rating),
        status,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFav) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json(updatedFav);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: "Something went wrong" });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
