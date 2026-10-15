# Restaurant Menu REST API

## Project Overview

The Restaurant Menu REST API is a backend application built using Node.js and Express.js. It provides RESTful endpoints to manage restaurant menu items, including retrieving, adding, updating, and deleting items.

This project demonstrates REST API development, HTTP methods, request handling, and basic CRUD operations.

## Technologies Used

- Node.js
- Express.js
- JavaScript
- REST API
- npm

## Features

- Retrieve all menu items
- Retrieve a menu item by ID
- Add a new menu item
- Update an existing menu item
- Delete a menu item
- Handle invalid requests and missing menu items

## Project Structure

```text
restaurant-menu-api/
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

*The structure above is an example. Update it if your project contains additional files.*

## Installation and Setup

### Prerequisites

Install Node.js and npm before running the project.

### 1. Clone the repository

```bash
git clone https://github.com/dheepthi3/restaurant-menu-api.git
```

### 2. Navigate to the project directory

```bash
cd restaurant-menu-api
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
node index.js
```

The API runs on the port configured in `index.js`. If configured for port 8080, the base URL is:

`http://localhost:8080`

## API Endpoints

The following table describes the intended endpoints. Confirm that the paths match your implementation in `index.js`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/menu` | Retrieve all menu items |
| GET | `/menu/:id` | Retrieve a menu item by ID |
| POST | `/menu` | Add a new menu item |
| PUT | `/menu/:id` | Update a menu item |
| DELETE | `/menu/:id` | Delete a menu item |

## Testing

Test the API using Thunder Client, Postman, or another REST API client.

Verify successful requests, invalid IDs, missing fields, and appropriate HTTP status codes.

## Data Storage

Menu items are stored in an in-memory array if implemented that way. Data added or modified during runtime is lost when the server restarts.

## Future Improvements

- Add a database such as MongoDB or PostgreSQL.
- Add input validation and improved error handling.
- Add automated API tests.
- Add authentication and authorization if required.

## Author

Dheepthi

## Repository

https://github.com/dheepthi3/restaurant-menu-api
