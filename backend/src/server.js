import app from "./app.js";
import connectDB from "./config/db.js";
import createSuperAdmin from "./config/superAdmin.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await createSuperAdmin();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();