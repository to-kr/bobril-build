import * as fs from 'fs';
import * as path from "path"
import * as bb from './index';
import * as pathUtils from "./pathUtils"
import * as processUtils from "./processUtils"
import * as commander from 'commander';
import * as chalk from 'chalk';

class DependenciesChecker {
    missingModules: string[] = [];
    project: bb.IProject;
    isUpdate: boolean;
    constructor(project: bb.IProject) {
        this.project = project;
        this.isUpdate = project.dependenciesUpdate === "upgrade";
    }

    private getModulePath(): string {
        return path.join(this.project.dir, "node_modules");
    }

    private findMissingModulesFromList(dependencies: string[]) {
        for (let i = 0; i < dependencies.length; i++) {
            var moduleName = dependencies[i];
            var moduleDir = path.join(this.getModulePath(), moduleName);
            if (!fs.existsSync(moduleDir)) {
                this.missingModules.push(moduleName);
            }
        }
    }

    private findMissingModules() {
        this.findMissingModulesFromList(this.project.dependencies);
        this.findMissingModulesFromList(this.project.devDependencies);
    };

    private installDependenciesCmd() {
        let doUpdate = this.isUpdate;
        if (this.isUpdate && !this.existsYarnLockFile()) {
            doUpdate = false;
        }
        let installCommand = `yarn ${doUpdate ? "upgrade" : "install"} --flat`;
        let yarnSuccess = false;
        if (doUpdate) {
            console.log("Upgrading dependencies...");
        } else {
            console.log("Installing missing dependencies...");
        }
        yarnSuccess = this.yarnInstalation(yarnSuccess, installCommand);
        if (!yarnSuccess) {
            this.npmInstalation();
        }
        this.findMissingModules();
        if (this.missingModules.length !== 0) {
            installCommand = "yarn install --flat --force";
            yarnSuccess = this.yarnInstalation(yarnSuccess, installCommand);
            if (!yarnSuccess) {
                this.npmInstalation();
            }
        }
        process.stdout.write(chalk.reset("\r"));
    };
    private npmInstalation() {
        let installCommand = "npm " + (this.isUpdate ? "up" : "i");
        if (this.project.npmRegistry) {
            installCommand += " --registry " + this.project.npmRegistry;
        }
        if (!processUtils.runProcess(installCommand)) {
            throw "";
        }
    }
    private yarnInstalation(yarnSuccess, installCommand) {
        yarnSuccess = true;
        if (this.project.npmRegistry) {
            this.createNpmrcFile();
        }
        if (!processUtils.runProcess(installCommand)) {
            yarnSuccess = false;
            console.log("yarn installation failed, the installation will be finished with npm");
        }
        return yarnSuccess;
    }

    public reinstallDependencies() {
        let moduleDirPath = this.getModulePath();
        if (fs.existsSync(moduleDirPath)) {
            console.log("Removing dependencies...");
            if (!pathUtils.recursiveRemoveDirSync(moduleDirPath)) {
                throw "Directory " + moduleDirPath + " can not be removed.";
            }
        }
        this.installDependenciesCmd();
    }

    public installMissingDependencies() {
        this.installDependenciesCmd();
    }

    private createYarnrcFile() {
        let filePath = path.join(this.project.dir, ".yarnrc");
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "registry " + '"' + this.project.npmRegistry + '"', { encoding: 'utf-8' });
        }
    }

    private createNpmrcFile() {
        let filePath = path.join(this.project.dir, ".npmrc");
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "registry =" + this.project.npmRegistry, { encoding: 'utf-8' });
        }
    }

    private existsYarnLockFile() {
        let filePath = path.join(this.project.dir, "yarn.lock");
        return fs.existsSync(filePath);
    }

    private removeYarnLockFile() {
        let filePath = path.join(this.project.dir, "yarn.lock");
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

export function installMissingDependencies(project: bb.IProject): boolean {
    if (project.dependenciesUpdate === "disable") return true;
    try {
        let depChecker = new DependenciesChecker(project);
        depChecker.installMissingDependencies();
    }
    catch (ex) {
        console.error("Failed to install dependencies.");
        return false;
    }
    return true;
}

export function registerCommands(c: commander.IExportedCommand, consumeCommand: Function) {
    c.command("dep")
        .option("-r, --reinstall", "reinstall dependencies")
        .option("-i, --install", "install dependencies")
        .action((c) => {
            consumeCommand();
            let curProjectDir = bb.currentDirectory();
            let project = bb.createProjectFromDir(curProjectDir);
            project.logCallback = (text) => {
                console.log(text);
            };
            if (!bb.refreshProjectFromPackageJson(project, null)) {
                process.exit(1);
            }
            try {
                let depChecker = new DependenciesChecker(project);
                if (c.reinstall) {
                    depChecker.reinstallDependencies();
                    return;
                }
                if (c.install) {
                    depChecker.installMissingDependencies();
                    return;
                }
            }
            catch (ex) {
                console.error("Failed to install dependencies.", ex)
                process.exit(1);
            }
        });
}
