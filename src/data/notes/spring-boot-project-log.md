整理一下这段时间做餐饮管理系统时踩过的坑，以及后来比较舒服的写法。

## 分层不要分得太碎

一开始我给每张表都配了 `Controller / Service / ServiceImpl / Mapper / DTO / VO / Convert`，结果一个"修改菜品状态"的功能要改七个文件。后来收敛成：

```java
@RestController
@RequestMapping("/api/dish")
public class DishController {

    private final DishService dishService;

    public DishController(DishService dishService) {
        this.dishService = dishService;
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        dishService.updateStatus(id, request.getStatus());
        return Result.ok();
    }
}
```

规则很简单：**只有真正被复用的逻辑才抽 Service**，其余直接写在应用服务里。少一层，少十次跳转。

## 缓存要能失效

菜单和桌台状态是读多写少的典型场景，用 Redis 缓存收益很大。但第一版我犯了个错误：写操作只更新数据库，忘了删缓存，导致改了价格半天不生效。

```java
@CacheEvict(value = "dish:detail", key = "#id")
public void updateStatus(Long id, Integer status) { ... }
```

后来统一成"写数据库 + 删缓存"，并且给所有缓存键加了门店前缀，避免多门店串数据。

## 索引与慢查询

订单表上千万行之后，`where shop_id = ? and create_time between ? and ?` 变成了全表扫描。加上联合索引立刻回到毫秒级：

```sql
alter table `order`
  add index idx_shop_time (shop_id, create_time);
```

结论是：**别猜，先看执行计划**。

## 前端那边

管理端用 Vue 3。表单是最费时间的部分，后来做了一个统一的 `useForm` 组合式函数，把校验、提交、重置都收进去，页面里就只剩下字段声明。

```ts
const { values, errors, submit, reset } = useForm({
  initial: { name: '', price: 0, categoryId: null },
  rules: {
    name: [{ required: true, message: '请输入菜品名称' }],
    price: [{ min: 0, message: '价格不能为负' }],
  },
  onSubmit: (data) => api.createDish(data),
})
```

## 小结

- 分层以"可读"为准，不以"完整"为准
- 缓存一定要有失效策略，写库删缓存是底线
- 慢查询靠 explain，不靠直觉
- 前端重复的模式就抽出来，不要复制第三次
