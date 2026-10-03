我做工具箱的时候给自己定了一条规矩：**每个工具只做一件事，并且不联网**。

## 工具应该有多小

以 JSON 格式化为例，需要的能力其实只有四个：

```ts
const format = (input: string, indent = 2) => JSON.stringify(JSON.parse(input), null, indent)
const minify = (input: string) => JSON.stringify(JSON.parse(input))
const validate = (input: string) => {
  try {
    JSON.parse(input)
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, message: (error as Error).message }
  }
}
```

页面只需要一个输入框、三个按钮和一块输出区。没有登录、没有历史记录、没有云同步——**这些功能的价值都低于它们带来的心理负担**。

## 输入不出浏览器

所有工具的输入都留在本机：

- JSON、Base64、正则、时间戳：纯字符串处理
- 颜色转换：纯计算
- 图片压缩：Canvas 本地重绘，连上传都没有

只有 GitHub 数据那一块会发请求，而且只读公开仓库信息。

## 统一的操作范式

八个工具用同一套骨架，学会一个就会用全部：

```
┌──────────────────────────────┐
│ Input                        │
│                              │
└──────────────────────────────┘
   [ 主操作 ] [ 次要操作 ] [ 复制 ]
┌──────────────────────────────┐
│ Output                       │
└──────────────────────────────┘
```

## 一个小坚持

错误提示要说人话。JSON 解析失败时，除了原始报错，我还会显示位置：

```ts
const position = /position (\d+)/.exec(message)?.[1]
```

能直接告诉用户"第 42 个字符附近有问题"，就不要只丢一句 `Unexpected token`。
