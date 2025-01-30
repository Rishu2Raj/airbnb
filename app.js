const express = require("express");
const app = express();
const mongoose = require("mongoose");
const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderLust';
const Listing = require("./models/listings/listing.js");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(__dirname + '/public'));

//database connection
main()
    .then(() => {
        console.log("connected to DB!")
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.get("/testListing", async (req, res) => {
    let sampleListing = new Listing({
        title: "Home",
        description: "Sweet home",
        price: 1250,
        location: "Bandra Mumabai",
        Country: "India",
    })

    await sampleListing.save().then(() => {
        console.log("sample was saved.")
    })

    res.send("sucessfull listing");
})

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);

    if (error) {
        throw new ExpressError(400, error);
    }else {
        next();
    }
}

// Index Route
app.get("/listing", wrapAsync(async (req, res) => {
    let listings = await Listing.find();
    // console.log(listings);
    res.render("listing/index.ejs", { listings })
}));

//create Route
app.get("/listing/new", (req, res) => {
    res.render("listing/new.ejs");
})

//Show Route
app.get("/listing/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    // console.log(listing);
    res.render("listing/show.ejs", { listing })
}))

//New Route
app.post("/listing", validateListing, wrapAsync(async (req, res, next) => {
    // let newListing = req.body.listing;
    // console.log(newListing);

    
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listing");
}))

//Update Route
app.get("/listing/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/edit.ejs", { listing });
}))

app.put("/listing/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listing/${id}`);
}))

//Delete Route
app.delete("/listing/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listing")
}))

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
})

//error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", {message})
    // res.status(statusCode).send(message);
})

app.listen(8080, () => {
    console.log("app is connected")
})