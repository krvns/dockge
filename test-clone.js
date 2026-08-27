const cp = require("promisify-child-process");
async function run() {
    try {
        console.log("Cloning...");
        await cp.spawn("git", ["clone", "https://github.com/louislam/uptime-kuma.git", "/Users/pavkry/Documents/_projects/git/hub/krvns/dockge/uptime-kuma-test"], { encoding: "utf-8" });
        console.log("Success!");
    } catch (e) {
        console.log("Error!", e.message);
        console.log("Stderr:", e.stderr?.toString());
    }
}
run();
