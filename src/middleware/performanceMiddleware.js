const performanceMiddleware = (req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;

    console.log("\n============================");
    console.log(`Route: ${req.method} ${req.originalUrl}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response Time: ${duration.toFixed(2)} ms`);
    console.log("============================\n");
  });

  next();
};

module.exports = performanceMiddleware;