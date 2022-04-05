const { getRepoList, getTagList } = require("./http");
const ora = require("ora");
const inquirer = require("inquirer");
const util = require("util");
const downloadGitRepo = require("download-git-repo");
const path = require("path");
const chalk = require("chalk");
const figlet = require("figlet");

// 添加加载动画
async function wrapLoading(fn, message, ...args) {
    // 使用 ora 初始化，传入提示信息 message
    const spinner = ora(message);
    // 开始加载动画
    spinner.start();

    try {
        // 执行传入方法 fn
        const result = await fn(...args);
        // 状态为修改为成功
        spinner.succeed();
        return result;
    } catch (error) {
        // 状态为修改为失败
        spinner.fail("Request failed, refetch ...");
    }
}

class Generator {
    constructor(name, targetDir) {
        // 目录名称
        this.name = name;
        // 创建位置
        this.targetDir = targetDir;
        this.downloadGitRepo = util.promisify(downloadGitRepo);
    }

    async getRepo() {
        // 1）从远程拉取模板数据
        const repoList = await wrapLoading(getRepoList, "waiting fetch template");
        if (!repoList) return;

        // 过滤我们需要的模板名称
        const repos = repoList.map((item) => item.name);

        // 2）用户选择自己新下载的模板名称
        const { repo } = await inquirer.prompt({
            name: "repo",
            type: "list",
            choices: repos,
            message: "Please choose a template to create project",
        });

        // 3）return 用户选择的名称
        return repo;
    }

    async getTag(repo) {
        const tags = await wrapLoading(getTagList, "waiting fetch tag", repo);
        if (!tags) return;
        const tagsList = tags.map((item) => item.name);

        const { tag } = await inquirer.prompt({
            name: "tag",
            type: "list",
            choices: tagsList,
            message: "please choice a tag to create project",
        });
        return tag;
    }

    async download(repo, tag) {
            const requestUrl = `zhurong-cli/${repo}${tag ? "#" + tag : ""}`;

            await wrapLoading(
                this.downloadGitRepo,
                "waiting download template",
                requestUrl,
                path.resolve(process.cwd(), this.targetDir)
            );
        }
        // 核心创建逻辑
    async create() {
        // 1）获取模板名称
        const repo = await this.getRepo();

        const tag = await this.getTag(repo);

        await this.download(repo, tag);
        // 4）模板使用提示
        console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`);
        console.log(`\r\n  cd ${chalk.cyan(this.name)}`);
        console.log("  npm run dev\r\n");
    }
}

module.exports = Generator;