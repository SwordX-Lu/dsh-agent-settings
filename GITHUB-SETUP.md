# 把插件发布到 GitHub（新手步骤）

目标：把 `plugins/dsh-agent-settings/` 变成一个 GitHub 仓库，
然后向 awesome-dsh-plugin 提 PR，让它出现在 dsh-market 的市场列表里。

你不需要会 git。下面每一步都写了「点哪里」或「粘贴什么」。

---

## 第 1 步：在 GitHub 上建一个空仓库

1. 打开 https://github.com/new
2. **Repository name** 填 `dsh-agent-settings`
3. 选 **Public**（私有仓库无法被市场和其他人安装）
4. **不要**勾选 "Add a README file"、".gitignore"、"license"
   —— 勾了会让后面推送冲突
5. 点绿色 **Create repository**

建好后页面会显示一串命令。**先不管它**，按下面走。

---

## 第 2 步：在这台机器上认证 GitHub

推荐用 **Personal Access Token（PAT）**，比配 SSH 密钥简单。

1. 打开 https://github.com/settings/tokens?type=beta
2. 点 **Generate new token**
3. **Token name** 填 `dsh-push`
4. **Expiration** 选 30 天（够用，过期再建）
5. **Repository access** 选 **Only select repositories** → 选刚建的 `dsh-agent-settings`
6. **Permissions** → **Repository permissions** → 找到 **Contents**，改成 **Read and write**
7. 拉到底点 **Generate token**
8. **立刻复制那串 `github_pat_...`**（关掉页面就再也看不到了）

然后回到终端，**不要**把 token 贴进任何文件，直接执行（把 `你的用户名` 和 token 换掉）：

```bash
cd /home/kali/Documents/deepseek-harness/default-workspace/plugins/dsh-agent-settings
git init -b main
git add -A
git commit -m "feat: agent settings bundle"
git remote add origin https://github.com/你的用户名/dsh-agent-settings.git
git push -u origin main
```

执行 `git push` 时它会问：
- **Username**：填你的 GitHub 用户名
- **Password**：粘贴那串 `github_pat_...`（输入时屏幕不显示字符，正常）

成功后仓库里就有代码了。

> 如果 git 报「Author identity unknown」，先执行这两行（换成你的邮箱）：
> ```bash
> git config --local user.name "你的用户名"
> git config --local user.email "你的邮箱"
> ```
> 再重新 `git commit`。

---

## 第 3 步：给仓库加 topic

打开 `https://github.com/你的用户名/dsh-agent-settings`，
右侧 **About** 那一栏点齿轮 ⚙️ → **Topics** 填 `dsh-plugin` → 保存。

这是收录的硬性要求之一。

---

## 第 4 步：验证它真的能装

在终端执行（会装到一个临时 profile，不影响你现在用的）：

```bash
dsh plugin --profile gh-test add github:你的用户名/dsh-agent-settings
```

看到 `+ dsh-agent-settings` 就成了。验证完可以删掉临时 profile：

```bash
rm -rf ~/.dsh/profiles/gh-test
```

---

## 第 5 步：提 PR 让 dsh-market 收录

1. 打开 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin
2. 右上角 **Fork** → **Create fork**
3. 在你 fork 出来的仓库里，打开 `data/plugins/` 目录
4. 点 **Add file** → **Create new file**
5. 文件名填：`你的用户名__dsh-agent-settings.yml`
   （两个下划线，不是斜杠）
6. 内容粘贴：

```yaml
url: https://github.com/你的用户名/dsh-agent-settings
name: 你的用户名/dsh-agent-settings
category: tools
description:
  en: 'Agent Settings: manage reusable sub-agent profiles in the sidebar, each with a when-to-use description and its own provider/model route, and let the agent start the matching one as a subagent.'
  zh: '智能体设置：在侧边栏管理可复用的子智能体档案，为每个档案写明适用场景与所用提供方/模型，任务中由智能体按场景自动拉起对应的子智能体。'
icon: https://raw.githubusercontent.com/你的用户名/dsh-agent-settings/main/assets/icon-180.png
```

7. 拉到底点 **Commit changes**
8. 回到仓库首页，点 **Contribute** → **Open pull request**
9. 标题填 `Add 你的用户名/dsh-agent-settings`，正文可以简单写一句这个插件做什么
10. 点 **Create pull request**

---

## 之后会发生什么

- CI 会自动检查：manifest 是否有 `dsh.bundle`、仓库是否满 1 天、YAML 格式、README 能否重新生成
- 维护者会读一遍代码，核对描述是否属实（比如描述里说「4 个工具」，就得真有 4 个）
- 合并后，dsh-market 的市场列表里就会出现「智能体设置」
- 条目编号：`name` 必须是 `dsh-agent-settings`（与 package.json 一致），否则市场装不上

## 注意事项

- 官方说明：从源码安装会走构建授权流程。本插件没有构建步骤、没有依赖，
  所以安装时不需要额外批准任何 build 脚本。
- 我没有你的 GitHub 账号，第 2 步和第 5 步必须你本人做。
  第 2 步做完把仓库地址发我，我可以帮你核对条目文件、跑一遍安装验证。
