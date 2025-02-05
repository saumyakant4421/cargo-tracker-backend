const express = require("express");
const Shipment = require("../models/shipment");
const axios = require("axios");  // Import axios to make API calls
const router = express.Router();

// Function to get lat/lng from OpenCage API
async function getLatLng(location) {
  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: location,         
        key: "OPEN_CAGE_API_KEY",  // Replace with your OpenCage API key
      },
    });

    const data = response.data;
    if (data.results.length > 0) {
      return {
        lat: data.results[0].geometry.lat,
        lng: data.results[0].geometry.lng,
      };
    }
    return { lat: 0, lng: 0 };  // Return default values if no results
  } catch (error) {
    console.error("Error in geocoding:", error);
    return { lat: 0, lng: 0 };  // Return default values on error
  }
}

// Route to get all shipments
router.get("/shipments", async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shipments", error });
  }
});

// Route to get a specific shipment by ID
router.get("/shipment/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shipment", error });
  }
});

// Route to create a new shipment
router.post("/shipment", async (req, res) => {
  const { containerId, route, currentLocation, eta } = req.body;

  // Get lat/lng for the current location
  const locationCoords = await getLatLng(currentLocation);

  // Create a new shipment with lat/lng for currentLocation
  const newShipment = new Shipment({
    containerId,
    route,
    currentLocation: locationCoords,  // Save lat/lng as currentLocation
    eta,
  });

  try {
    await newShipment.save();
    res.status(201).json(newShipment);
  } catch (error) {
    res.status(500).json({ message: "Error saving shipment", error });
  }
});

// Route to update the current location of a shipment
router.post("/shipment/:id/update-location", async (req, res) => {
  const { currentLocation } = req.body;

  // Get lat/lng for the updated current location
  const locationCoords = await getLatLng(currentLocation);

  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { currentLocation: locationCoords },  // Update with lat/lng
      { new: true }
    );
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: "Error updating location", error });
  }
});

// Route to get the ETA of a shipment
router.get("/shipment/:id/eta", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.json({ eta: shipment.eta });
  } catch (error) {
    res.status(500).json({ message: "Error fetching ETA", error });
  }
});

module.exports = router;
