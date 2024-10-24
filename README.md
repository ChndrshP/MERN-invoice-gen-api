# MERN Backend Setup

This guide will help you set up the backend for a MERN (MongoDB, Express, React, Node.js) stack project.

## Prerequisites

- Node.js and npm installed
- MongoDB installed and running

## Installation

1. **Clone the repository:**
    ```bash
    git clone [<repository-url>](https://github.com/ChndrshP/MERN-invoice-gen-api.git)
    cd MERN-invoice-gen-api
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Set up environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=5000
    MONGO_URI=<your-mongodb-uri>
    ```

## Running the Server

1. **Start the development server:**
    ```bash
    npm run dev
    ```

2. **Start the production server:**
    ```bash
    npm start
    ```

## Project Structure

```
/backend
  ├── config
  ├── controllers
  ├── models
  ├── routes
  ├── middleware
  ├── .env
  ├── server.js
  └── package.json
```

## License

This project is licensed under the MIT License.
