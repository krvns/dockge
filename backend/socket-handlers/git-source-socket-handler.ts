import { SocketHandler } from "../socket-handler";
import { DockgeServer } from "../dockge-server";
import { DockgeSocket, checkLogin } from "../util-server";
import { log } from "../log";
import { R } from "redbean-node";
import childProcessAsync from "promisify-child-process";
import fs from "fs";
import path from "path";

export class GitSourceSocketHandler extends SocketHandler {
    create(socket: DockgeSocket, server: DockgeServer) {
        
        socket.on("addGitSource", async (url: string, stackName: string, branch: string, callback: Function) => {
            try {
                checkLogin(socket);

                const stacksDir = server.stacksDir;
                const stackPath = path.join(stacksDir, stackName);

                if (fs.existsSync(stackPath)) {
                    throw new Error(`Stack directory already exists: ${stackName}`);
                }

                log.info("git", `Cloning ${url} branch ${branch} to ${stackPath}`);
                await childProcessAsync.spawn("git", ["clone", "-b", branch || "main", url, stackPath], {
                    encoding: "utf-8",
                });

                const gitSource = R.dispense("git_source");
                gitSource.stack_name = stackName;
                gitSource.url = url;
                gitSource.branch = branch || "main";
                await R.store(gitSource);

                callback({ ok: true });
            } catch (e: any) {
                log.error("git", `Failed to add git source: ${e.message}`);
                callback({ ok: false, msg: e.message });
            }
        });

        socket.on("deleteGitSource", async (stackName: string, callback: Function) => {
            try {
                checkLogin(socket);
                await R.exec("DELETE FROM git_source WHERE stack_name = ?", [stackName]);
                callback({ ok: true });
            } catch (e: any) {
                log.error("git", `Failed to delete git source: ${e.message}`);
                callback({ ok: false, msg: e.message });
            }
        });

        socket.on("fetchGitSourceStatus", async (stackName: string, callback: Function) => {
            try {
                checkLogin(socket);
                const stacksDir = server.stacksDir;
                const stackPath = path.join(stacksDir, stackName);

                if (!fs.existsSync(stackPath)) {
                    throw new Error("Stack directory does not exist.");
                }

                // Fetch latest from remote
                await childProcessAsync.spawn("git", ["remote", "update"], {
                    cwd: stackPath,
                    encoding: "utf-8",
                });

                // Check status
                const res = await childProcessAsync.spawn("git", ["status", "-uno"], {
                    cwd: stackPath,
                    encoding: "utf-8",
                });

                const output = (res.stdout || "").toString();
                const isBehind = output.includes("Your branch is behind");
                
                callback({ ok: true, isBehind });
            } catch (e: any) {
                log.error("git", `Failed to fetch git source status: ${e.message}`);
                callback({ ok: false, msg: e.message });
            }
        });

        socket.on("pullGitSource", async (stackName: string, callback: Function) => {
            try {
                checkLogin(socket);
                const stacksDir = server.stacksDir;
                const stackPath = path.join(stacksDir, stackName);

                if (!fs.existsSync(stackPath)) {
                    throw new Error("Stack directory does not exist.");
                }

                await childProcessAsync.spawn("git", ["pull"], {
                    cwd: stackPath,
                    encoding: "utf-8",
                });

                callback({ ok: true });
            } catch (e: any) {
                log.error("git", `Failed to pull git source: ${e.message}`);
                callback({ ok: false, msg: e.message });
            }
        });

        socket.on("getGitSources", async (callback: Function) => {
            try {
                checkLogin(socket);
                const sources = await R.findAll("git_source");
                callback({ ok: true, sources });
            } catch (e: any) {
                callback({ ok: false, msg: e.message });
            }
        });
    }
}
