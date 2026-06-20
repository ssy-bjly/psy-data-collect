# 心理学实验网页

一个无外部依赖的 Node.js 实验程序，包含手机/网页端实验流程、1-4 循环分配 2×2 分组、填写时长记录和后台数据导出。

## 运行

```powershell
npm start
```

打开：

- 被试入口：http://localhost:3000
- 调试入口：http://localhost:3000/?debug=1
- 后台页面：http://localhost:3000/admin.html?token=admin123

正式部署前建议设置后台令牌：

```powershell
$env:ADMIN_TOKEN="your-secret-token"
npm start
```

## 数据

提交数据保存在 `data/responses.json`。后台导出按钮会下载 Excel 可直接打开的 UTF-8 CSV 文件，包含内部编号、组号、分组条件、提交时间、总时长、每页停留时长和所有问卷/任务答案。

调试入口 `?debug=1` 会提交到 `data/debug-responses.json`，不会进入正式后台导出。

材料阅读页和自然之友浏览页均设置了 15 秒最短停留时间。捐赠金额采用 0-5 元六点选项记录。

导出数据只包含实验总时长，不导出各页面停留时间明细。

## 替换图片

当前商品选择图片是占位图。将正式图片替换为同名文件即可：

- `public/assets/product-regular-cup.svg`
- `public/assets/product-eco-cup.svg`
- `public/assets/product-regular-bag.svg`
- `public/assets/product-eco-bag.svg`

当前商品选择任务使用这四个 JPG 文件名：

- `public/assets/product-regular-food.jpg`
- `public/assets/product-green-food.jpg`
- `public/assets/product-regular-detergent.jpg`
- `public/assets/product-green-detergent.jpg`

如需使用 PNG/JPG，请同步修改 `public/experiment.js` 中 `PRODUCT_SETS` 的图片路径。
