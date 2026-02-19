
try {
    require('./src/server.js');
    console.log("Server file required successfully."); // If server.js is written as a module, this prints.
    // If server.js runs as a script, it just runs.
} catch (e) {
    console.error("Error requiring server file:", e);
}
