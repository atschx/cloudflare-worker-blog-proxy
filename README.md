# cloudflare-worker-blog-proxy

Cloudflare Worker 反向代理，用于 `blog.atschx.me` 域名。

## ⚠️ 重要说明

**本仓库仅存储代码，代码上传到 GitHub 不等于已部署上线。**

需要在 Cloudflare 控制台手动创建 Worker 并绑定路由后才会生效。本仓库不包含任何 Cloudflare API 令牌或自动部署配置。

## 功能说明

此 Worker 实现反向代理：

- **代理条件**：当 `hostname === 'blog.atschx.me'` 且 `pathname.startsWith('/cosmic-elements-xbit')` 时
- **代理目标**：将请求代理到 `atschx.github.io`，保留原始路径和参数
- **其他请求**：直接 `fetch(request)` 透传

### startsWith 语义

`pathname.startsWith('/cosmic-elements-xbit')` 会匹配：
- `/cosmic-elements-xbit`
- `/cosmic-elements-xbit/page.html`
- `/cosmic-elements-xbit-other`（也会匹配）

不匹配：
- `/` 或 `/other-path`（透传）
- `/Cosmic-elements-xbit`（大小写敏感）

## 文件说明

- `worker.js` - Cloudflare Worker 主代码
- `test-worker.mjs` - Node.js 单元测试
- `wrangler.toml` - Wrangler 配置文件（建议配置）
- `package.json` - 项目配置

## 本地测试

```bash
node test-worker.mjs
```

## 部署步骤（未执行）

### 前提条件

- Cloudflare 账户有权限管理 `atschx.me` zone
- `blog.atschx.me` 已有 Cloudflare proxied DNS 记录

### 手动部署

**使用 Wrangler CLI：**

```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

**或通过 Cloudflare Dashboard：**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages > Create application > Create Worker
3. 复制 `worker.js` 内容到编辑器
4. Save and Deploy
5. 进入 Triggers > Routes，添加：
   - Route: `blog.atschx.me/*`
   - Zone: `atschx.me`

### 路由绑定

推荐绑定 `blog.atschx.me/*`，让 Worker 代码内部判断是否代理。

## 测试 URL 示例

部署后测试（⚠️ 上游可能返回 404 或重定向）：

```bash
# 应该被代理
curl -I https://blog.atschx.me/cosmic-elements-xbit
curl -I https://blog.atschx.me/cosmic-elements-xbit/page.html

# 应该透传
curl -I https://blog.atschx.me/
curl -I https://blog.atschx.me/other-path
```

## ⚠️ 已知上游限制

**实测（2026-11-24 07:40 PST）**：
- `https://atschx.github.io/cosmic-elements-xbit` 会 301 重定向到 `https://atschx.me/cosmic-elements-xbit`
- 最终返回 404 Not Found
- **本 Worker 不能解决上游内容不存在的问题**
- 部署后不保证内容可以正常访问
- 如需解决，请在上游仓库添加对应内容

## 许可证

MIT License
