# 液体散装化学品船运费计算系统

专业的液体散装化学品船运费计算与费率管理平台。

## 功能特性

- 🚢 **运费计算** - 基于线性内插法的精确费率计算
- 📊 **费率表管理** - 多船东、多航线的阶梯费率维护
- 🏗️ **基础数据管理** - 船东、港口信息的增删改查
- 📝 **计算历史** - 完整的运费计算记录与导出
- 👥 **用户管理** - 角色权限控制（管理员/操作员）
- 🔐 **安全认证** - JWT 令牌认证与密码加密存储

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS 4
- **后端**: Express 4 + tRPC 11
- **数据库**: SQLite (via libsql + Drizzle ORM)
- **测试**: Vitest

## 快速开始

```bash
# 安装依赖
pnpm install

# 初始化数据库并导入种子数据
pnpm db:seed

# 启动后端 API 服务器
pnpm dev

# 启动前端开发服务器（另一个终端）
pnpm dev:client

# 运行测试
pnpm test
```

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 操作员 | operator | user123 |

## 项目结构

```
├── client/          # React 前端应用
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── components/ # 公共组件
│   │   └── lib/     # 工具库 (tRPC client)
│   └── index.html
├── server/          # Express 后端
│   ├── db/          # 数据库 schema 与种子数据
│   ├── trpc/        # tRPC 路由与中间件
│   └── index.ts     # 服务器入口
├── shared/          # 前后端共享类型
└── tests/           # 单元测试
```

## 核心算法

系统使用**线性内插法**计算费率：

$$r = r_1 + \frac{(q - q_1) \times (r_2 - r_1)}{q_2 - q_1}$$

支持以下场景：
- ✅ 精确匹配节点值
- ✅ 线性内插计算
- ✅ 低于最低节点（使用最低费率）
- ✅ 高于最高节点（使用最高费率）

## License

MIT
