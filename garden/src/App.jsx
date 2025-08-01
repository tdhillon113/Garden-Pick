import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { supabase, TREFLE_TOKEN, fetchFlowers, saveFlower } from "./client.js";
import "./App.css";

function getRandomAttributes() {
  const attributes = [
    "Colorful",
    "Fragrant",
    "Rare",
    "Medicinal",
    "Thorny",
    "Tropical",
  ];
  return [...attributes.sort(() => 0.5 - Math.random()).slice(0, 3)];
}

function extractPlantAttributes(plant) {
  const attributes = [];

  if (plant.specifications?.toxicity === "none") {
    attributes.push("Safe");
  }
  if (
    plant.specifications?.toxicity === "low" ||
    plant.specifications?.toxicity === "moderate" ||
    plant.specifications?.toxicity === "high"
  ) {
    attributes.push("Toxic");
  }

  if (plant.growth?.light && plant.growth.light >= 8) {
    attributes.push("Sun-loving");
  }
  if (plant.growth?.light && plant.growth.light <= 4) {
    attributes.push("Shade-tolerant");
  }

  if (
    plant.growth?.atmospheric_humidity &&
    plant.growth.atmospheric_humidity >= 7
  ) {
    attributes.push("Tropical");
  }

  if (
    plant.growth?.minimum_temperature?.deg_c &&
    plant.growth.minimum_temperature.deg_c <= -20
  ) {
    attributes.push("Hardy");
  }

  if (plant.flower?.color && plant.flower.color.length > 0) {
    attributes.push("Colorful");
  }

  if (plant.duration && plant.duration.includes("perennial")) {
    attributes.push("Perennial");
  }
  if (plant.duration && plant.duration.includes("annual")) {
    attributes.push("Annual");
  }

  if (plant.edible_part && plant.edible_part.length > 0) {
    attributes.push("Edible");
  }

  if (attributes.length === 0) {
    const generalAttributes = [
      "Beautiful",
      "Natural",
      "Garden-worthy",
      "Unique",
      "Lovely",
      "Charming",
    ];
    attributes.push(
      ...generalAttributes.sort(() => 0.5 - Math.random()).slice(0, 2)
    );
  }

  const finalAttributes = [...attributes];
  if (finalAttributes.length < 3) {
    const additionalAttributes = [
      "Ornamental",
      "Decorative",
      "Popular",
      "Classic",
      "Elegant",
    ];
    const needed = 3 - finalAttributes.length;
    finalAttributes.push(...additionalAttributes.slice(0, needed));
  }

  return finalAttributes.slice(0, 3);
}

const FlowerCard = ({ flower }) => {
  const navigate = useNavigate();

  return (
    <div className="card" onClick={() => navigate(`/flower/${flower.id}`)}>
      <img src={flower.image_url} alt={flower.name} />
      <h3>{flower.name}</h3>
      <p className="flowerattributes">
        {Array.isArray(flower.attributes?.botanical_attributes)
          ? flower.attributes.botanical_attributes.join(", ")
          : "No attributes"}
      </p>
    </div>
  );
};

function CreateFlower() {
  const [randomFlower, setRandomFlower] = useState(null);
  const [flowerName, setFlowerName] = useState("");
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRandomFlower = async () => {
    setLoading(true);
    setError("");

    if (!TREFLE_TOKEN) {
      setError(
        "Trefle API token is required. Please add VITE_TREFLE_TOKEN to your .env file."
      );
      setLoading(false);
      return;
    }

    try {
      const corsProxy = "https://api.allorigins.win/raw?url=";
      const apiUrl = `https://trefle.io/api/v1/plants?token=${TREFLE_TOKEN}&filter[complete_data]=true&page_size=20`;
      const proxiedUrl = corsProxy + encodeURIComponent(apiUrl);

      const plantsResp = await fetch(proxiedUrl);

      if (!plantsResp.ok) {
        throw new Error(
          `Failed to fetch plants: ${plantsResp.status} ${plantsResp.statusText}`
        );
      }

      const plantsData = await plantsResp.json();
      const plantsWithImages =
        plantsData.data?.filter((plant) => plant.image_url) || [];

      if (plantsWithImages.length === 0) {
        throw new Error("No plants with images found");
      }

      const randomPlant =
        plantsWithImages[Math.floor(Math.random() * plantsWithImages.length)];

      const detailUrl = `https://trefle.io/api/v1/plants/${randomPlant.id}?token=${TREFLE_TOKEN}`;
      const proxiedDetailUrl = corsProxy + encodeURIComponent(detailUrl);
      const detailResp = await fetch(proxiedDetailUrl);

      if (!detailResp.ok) {
        // If detailed fetch fails, use the basic plant data
        setRandomFlower(randomPlant);
        setFlowerName(randomPlant.common_name || "Unknown Plant");
        setAttributes(getRandomAttributes()); // Fallback to random attributes
        return;
      }

      const detailData = await detailResp.json();
      const detailedPlant = detailData.data;

      const plantAttributes = extractPlantAttributes(detailedPlant);

      setRandomFlower(detailedPlant);
      setFlowerName(detailedPlant.common_name || "Unknown Plant");
      setAttributes(plantAttributes);
    } catch (err) {
      setError(err.message || "Failed to fetch flower from Trefle API");
      console.error("Error fetching flower:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveFlowerData = async () => {
    if (!flowerName.trim()) {
      setError("Please give your flower a name");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const newFlower = {
        name: flowerName.trim(),
        color: null,
        image_url: randomFlower.image_url,
        attributes: {
          botanical_attributes: attributes,
          scientific_name: randomFlower.scientific_name || null,
          trefle_id: randomFlower.id ? String(randomFlower.id) : null,
          common_name: randomFlower.common_name || null,
        },
      };

      const data = await saveFlower(newFlower);
      console.log("Flower saved successfully:", data);

      window.location.href = "/home";
    } catch (err) {
      setError(err.message || "Failed to save flower");
      console.error("Error saving flower:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Create Flower</h2>
      {error && <div className="errormessage">{error}</div>}

      <button onClick={fetchRandomFlower} disabled={loading}>
        Get Random Flower
      </button>

      {!TREFLE_TOKEN && (
        <div className="infomessage">
          <p>
            <strong>Add API token:</strong>
          </p>
          <ol>
            <li>
              Get token from{" "}
              <a
                href="https://trefle.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                trefle.io
              </a>
            </li>
            <li>Add VITE_TREFLE_TOKEN to .env file</li>
            <li>Restart server</li>
          </ol>
        </div>
      )}

      {randomFlower && (
        <div className="preview">
          <img
            src={randomFlower.image_url}
            alt={randomFlower.common_name || "Random flower"}
          />
          <h3>{randomFlower.common_name || "Unknown Flower"}</h3>
          {randomFlower.scientific_name && (
            <p className="scientificname">
              <em>{randomFlower.scientific_name}</em>
            </p>
          )}

          <div className="formgroup">
            <label htmlFor="flowerName">Name:</label>
            <input
              id="flowerName"
              type="text"
              placeholder="Enter flower name"
              value={flowerName}
              onChange={(e) => setFlowerName(e.target.value)}
              disabled={loading}
            />
          </div>

          <p>
            <strong>Attributes:</strong> {attributes.join(", ")}
          </p>
          <button
            onClick={saveFlowerData}
            disabled={loading || !flowerName.trim()}
          >
            Save Flower
          </button>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFlowers = async () => {
      try {
        const data = await fetchFlowers();
        console.log("Fetched flowers:", data);
        setFlowers(data);
      } catch (err) {
        setError(err.message || "Failed to load flowers");
      } finally {
        setLoading(false);
      }
    };

    loadFlowers();
  }, []);

  if (loading)
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="container">
        <div className="errormessage">{error}</div>
      </div>
    );

  return (
    <div className="container">
      <h2>Garden</h2>
      {flowers.length === 0 ? (
        <div className="emptystate">
          <p>No flowers yet!</p>
          <Link to="/" className="createlink">
            Create your first flower
          </Link>
        </div>
      ) : (
        <div className="cardgrid">
          {flowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlowerDetail() {
  const { id } = useParams();
  const [flower, setFlower] = useState(null);
  const [flowerName, setFlowerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlower = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("flowers")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("Flower not found");
        }

        setFlower(data);
        setFlowerName(data.name);
      } catch (err) {
        setError(err.message || "Failed to load flower");
        console.error("Error fetching flower:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlower();
  }, [id]);

  const updateFlower = async () => {
    if (!flowerName.trim()) {
      setError("Flower name cannot be empty");
      return;
    }

    setUpdating(true);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("flowers")
        .update({
          name: flowerName.trim(),
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setFlower((prev) => ({
        ...prev,
        name: flowerName.trim(),
      }));
      alert("Flower updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update flower");
      console.error("Error updating flower:", err);
    } finally {
      setUpdating(false);
    }
  };

  const deleteFlower = async () => {
    setUpdating(true);
    try {
      const { error: deleteError } = await supabase
        .from("flowers")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to delete flower");
      console.error("Error deleting flower:", err);
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="container">
        <div className="errormessage">{error}</div>
      </div>
    );
  if (!flower)
    return (
      <div className="container">
        <p>Flower not found</p>
      </div>
    );

  return (
    <div className="container flowerdetail">
      <button onClick={() => navigate("/home")} className="backbutton">
        Back to Garden
      </button>

      <div className="flowerdetailcontent">
        <img
          src={flower.image_url}
          alt={flower.name}
          className="flowerimage"
        />

        <div className="flower-info">
          <div className="formgroup">
            <label htmlFor="flowerName">Name:</label>
            <input
              id="flowerName"
              value={flowerName}
              onChange={(e) => setFlowerName(e.target.value)}
              disabled={updating}
            />
          </div>

          <button
            onClick={updateFlower}
            disabled={updating || flowerName.trim() === flower.name}
          >
            Update
          </button>

          <div className="attributessection">
            <h3>Info</h3>
            <div className="plantinfo">
              {flower.attributes?.scientific_name && (
                <p>
                  <strong>Scientific Name:</strong>{" "}
                  <em>{flower.attributes.scientific_name}</em>
                </p>
              )}
              {flower.attributes?.botanical_attributes && (
                <div className="attributeslist">
                  <strong>Attributes:</strong>
                  {flower.attributes.botanical_attributes.map((attr, index) => (
                    <span key={index} className="attributetag">
                      {attr}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flowermeta">
            <p>
              <strong>Created:</strong>{" "}
              {new Date(flower.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={deleteFlower}
            className="deletebutton"
            disabled={updating}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <nav>
        <div className="navlinks">
          <Link to="/">Create</Link>
          <Link to="/home">Garden</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<CreateFlower />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/flower/:id" element={<FlowerDetail />} />
      </Routes>
    </Router>
  );
}
