
const express = require("express");
const app = express();

app.use(express.json());

let dishes = [];
let nextId = 1;

const PORT = process.env.PORT || 8080;

const categories = [
    "Starter",
    "MainCourse",
    "Dessert",
    "Beverage",
    "Snack"
];

function validateDish(body, partial = false) {
    const fields = [
        "dishName",
        "restaurant",
        "category",
        "price",
        "calories",
        "isVegetarian"
    ];

    const allowed = new Set(fields);

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return "Request body must be a JSON object";
    }

    for (const key of Object.keys(body)) {
        if (!allowed.has(key) && key !== "id") {
            continue;
        }

        if (key === "id") {
            return "ID cannot be supplied or changed";
        }
    }

    const keysToCheck = partial
        ? Object.keys(body)
        : fields;

    for (const key of keysToCheck) {
        if (!fields.includes(key)) continue;

        if (!Object.prototype.hasOwnProperty.call(body, key)) {
            return `Missing field: ${key}`;
        }

        const value = body[key];

        if (key === "dishName") {
            if (
                typeof value !== "string" ||
                value.trim().length < 3 ||
                value.trim().length > 60
            ) return "dishName must be 3-60 characters";
        }

        if (key === "restaurant") {
            if (
                typeof value !== "string" ||
                value.trim().length < 2 ||
                value.trim().length > 40
            ) return "restaurant must be 2-40 characters";
        }

        if (key === "category" && !categories.includes(value)) {
            return "Invalid category";
        }

        if (
            key === "price" &&
            (typeof value !== "number" ||
             !Number.isFinite(value) ||
             value <= 0 ||
             value > 5000)
        ) return "price must be greater than 0 and at most 5000";

        if (
            key === "calories" &&
            (!Number.isInteger(value) ||
             value < 0 ||
             value > 5000)
        ) return "calories must be an integer from 0 to 5000";

        if (
            key === "isVegetarian" &&
            typeof value !== "boolean"
        ) return "isVegetarian must be true or false";
    }

    if (partial && keysToCheck.length === 0) {
        return "Provide at least one field to update";
    }

    return null;
}

function cleanDish(body) {
    const dish = { ...body };

    for (const key of ["dishName", "restaurant"]) {
        if (typeof dish[key] === "string") {
            dish[key] = dish[key].trim();
        }
    }

    return dish;
}

app.get("/", (req, res) => {
    res.json({ message: "Restaurant Menu API is running" });
});

// Create a dish
app.post("/api/dishes", (req, res) => {
    const error = validateDish(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    const dish = {
        id: nextId++,
        ...cleanDish(req.body)
    };

    dishes.push(dish);

    res.status(201).json(dish);
});


app.get("/api/dishes", (req, res) => {
    const {
        page = "1",
        limit = "10",
        category,
        isVegetarian,
        minPrice,
        maxPrice,
        search,
        sort,
        order = "asc"
    } = req.query;

    // Validate pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (
        !/^[1-9]\d*$/.test(String(page)) ||
        !/^[1-9]\d*$/.test(String(limit)) ||
        !Number.isSafeInteger(pageNum) ||
        !Number.isSafeInteger(limitNum) ||
        limitNum > 50
    ) {
        return res.status(400).json({
            error: "Invalid page or limit"
        });
    }

    // Validate category
    if (
        category !== undefined &&
        (typeof category !== "string" ||
         !categories.includes(category))
    ) {
        return res.status(400).json({
            error: "Invalid category"
        });
    }

    // Validate vegetarian filter
    if (
        isVegetarian !== undefined &&
        isVegetarian !== "true" &&
        isVegetarian !== "false"
    ) {
        return res.status(400).json({
            error: "isVegetarian must be true or false"
        });
    }

    // Validate prices
    for (const value of [minPrice, maxPrice]) {
        if (
            value !== undefined &&
            (typeof value !== "string" ||
             value.trim() === "" ||
             !Number.isFinite(Number(value)) ||
             Number(value) < 0)
        ) {
            return res.status(400).json({
                error: "Invalid price filter"
            });
        }
    }

    // Validate sorting
    const allowedSort = ["dishName", "price", "calories"];

    if (sort !== undefined && !allowedSort.includes(sort)) {
        return res.status(400).json({
            error: "Invalid sort field"
        });
    }

    if (order !== "asc" && order !== "desc") {
        return res.status(400).json({
            error: "order must be asc or desc"
        });
    }

    if (search !== undefined && typeof search !== "string") {
        return res.status(400).json({
            error: "Invalid search value"
        });
    }

    // Start with all dishes
    let result = [...dishes];

    // Filter by category
    if (category !== undefined) {
        result = result.filter(
            dish => dish.category === category
        );
    }

    // Filter by vegetarian status
    if (isVegetarian !== undefined) {
        result = result.filter(
            dish => dish.isVegetarian === (isVegetarian === "true")
        );
    }

    // Filter by minimum price
    if (minPrice !== undefined) {
        result = result.filter(
            dish => dish.price >= Number(minPrice)
        );
    }

    // Filter by maximum price
    if (maxPrice !== undefined) {
        result = result.filter(
            dish => dish.price <= Number(maxPrice)
        );
    }

    // Search dish name and restaurant
    if (search && search.trim() !== "") {
        const term = search.trim().toLowerCase();

        result = result.filter(dish =>
            dish.dishName.toLowerCase().includes(term) ||
            dish.restaurant.toLowerCase().includes(term)
        );
    }

    // Sort results
    if (sort !== undefined) {
        const direction = order === "asc" ? 1 : -1;

        result.sort((a, b) => {
            const first = a[sort];
            const second = b[sort];

            if (typeof first === "string") {
                return direction *
                    first.localeCompare(second, undefined, {
                        sensitivity: "base"
                    });
            }

            return direction * (first - second);
        });
    }

    // Calculate totals before pagination
    const total = result.length;
    const totalPages = Math.ceil(total / limitNum);

    // Apply pagination
    const start = (pageNum - 1) * limitNum;
    const data = result.slice(start, start + limitNum);

    res.status(200).json({
        data,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
    });
});


// Get one dish
app.get("/api/dishes/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const dish = dishes.find(item => item.id === id);

    if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
    }

    res.json(dish);
});

// Replace a dish
app.put("/api/dishes/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const index = dishes.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Dish not found" });
    }

    const error = validateDish(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    dishes[index] = {
        id,
        ...cleanDish(req.body)
    };

    res.json(dishes[index]);
});

// Partially update a dish
app.patch("/api/dishes/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const index = dishes.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Dish not found" });
    }

    const error = validateDish(req.body, true);

    if (error) {
        return res.status(400).json({ error });
    }

    const updated = cleanDish(req.body);

    dishes[index] = {
        ...dishes[index],
        ...updated,
        id
    };

    res.json(dishes[index]);
});

// Delete a dish
app.delete("/api/dishes/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const index = dishes.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Dish not found" });
    }

    dishes.splice(index, 1);

    res.status(204).end();
});

// JSON error handler
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    res.status(400).json({ error: "Invalid JSON or request" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
