# 页面生成规则

本文档定义如何根据 Metadata.ts 中的元数据自动生成业务页面组件。

## 生成的文件结构

```
src/pages/{objectCode}/
├── constants.ts    # 路由和常量定义
├── list.tsx       # 列表页
├── createOrEdit.tsx # 创建/编辑页
└── detail.tsx     # 详情页
```

## 字段类型映射

### fieldType 到 FilterFieldType 映射

| fieldType | 类型名称 | FilterFieldType | 表格列 | 表单组件 |
|-----------|---------|-----------------|--------|---------|
| 1 | 单行文本 | `FilterFieldType.text` | Input | Input |
| 2 | 数值 | `FilterFieldType.number` | InputNumber | InputNumber |
| 3 | 多行文本 | - | Input.TextArea | Input.TextArea |
| 4 | 单选 | `FilterFieldType.select` | Select | Select |
| 5 | 多选 | `FilterFieldType.multiSelect` | Select (multiple) | Select (multiple) |
| 6 | 布尔值 | `FilterFieldType.select` | Switch | Switch |
| 7 | 整数 | `FilterFieldType.number` | InputNumber | InputNumber |
| 8 | 日期时间 | `FilterFieldType.date` | DatePicker | DatePicker |
| 9 | 链接/网址 | `FilterFieldType.text` | Input | Input |
| 10 | 引用字段 | `FilterFieldType.select` | Select | Select |
| 11 | 关联关系 | - | Select | Select |
| 13 | 主从关系 | - | 隐藏 | 隐藏 |
| 14 | 附件 | - | 文本 | Upload |
| 15 | 计算类型 | `FilterFieldType.text` | Input (只读) | Input (只读) |
| 16 | 图片 | - | Image | Upload |

## 常量文件生成 (constants.ts)

```typescript
/**
 * {objectName} 页面路由
 */
export const {objectCode}PagePath = {
  list: '/{kebabCaseObjectName}',
  create: '/{kebabCaseObjectName}/create',
  edit: '/{kebabCaseObjectName}/:id/edit',
  copy: '/{kebabCaseObjectName}/:id/copy',
  detail: '/{kebabCaseObjectName}/:id/detail',
};

/** 对象编码 */
export const OBJECT_CODE = '{objectCode}';
```

## 列表页生成 (list.tsx)

### 核心配置

```typescript
import React, { useState } from 'react';
import { message } from 'antd';
import { RecordListLayout, FilterFieldType } from '@blacklake-web/layout';
import { useHistory } from 'react-router-dom';
import { dataOperateApi } from 'src/api/dataOperate';

import { {objectCode}PagePath, OBJECT_CODE } from './constants';

/**
 * {objectName} 列表页
 */
export default () => {
  const history = useHistory();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 根据字段动态生成列配置
  const columns = [{{columns}}];

  // 请求函数
  const requestFn = (params: any) => {
    return dataOperateApi.getList({
      ...params,
      objectCode: OBJECT_CODE,
    });
  };

  // 主菜单
  const mainMenu = [
    {
      title: '新建',
      key: 'create',
      onClick: () => {
        history.push({objectCode}PagePath.create);
      },
    },
  ];

  // 操作列
  const getOperationList = (record: any) => {
    return [
      {
        title: '查看详情',
        onClick: () => {
          history.push({objectCode}PagePath.detail.replace(':id', String(record.id)));
        },
      },
      {
        title: '编辑',
        onClick: () => {
          history.push({objectCode}PagePath.edit.replace(':id', String(record.id)));
        },
      },
      {
        title: '删除',
        popconfirm: {
          title: '确定要删除吗？',
          onConfirm: async () => {
            try {
              await dataOperateApi.delete({
                ids: [String(record.id)],
                objectCode: OBJECT_CODE,
              });
              message.success('删除成功');
            } catch (error) {
              message.error('删除失败');
            }
          },
        },
      },
    ];
  };

  return (
    <div style={{ height: '100%' }}>
      <RecordListLayout
        columns={columns}
        requestFn={requestFn}
        mainMenu={mainMenu}
        configcacheKey="{objectCode}ListLayout"
        rowKey="id"
        selectedRowKeys={selectedKeys}
        onSelectedRowKeys={(keys) => setSelectedKeys(keys)}
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        useIndex={true}
        useSelectAll={true}
        useQuickFilter={true}
        useFilterGroup={true}
        maxOperationCount={3}
        defaultSearchCount={4}
        getOperationList={getOperationList}
      />
    </div>
  );
};
```

### columns 生成规则

```typescript
const columns = [
  // 主属性字段
  {
    title: '{fieldName}',
    dataIndex: 'main_field',
    width: 200,
    sorter: true,
  },
  // 系统字段 - 创建时间
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    width: 180,
    filterConfig: {
      type: FilterFieldType.date,
    },
  },
  // 自定义字段 - 根据 fieldType 生成
  {
    title: '{fieldName}',
    dataIndex: '{fieldCode}',
    width: 150,
    filterConfig: {
      type: {filterFieldType},
      {customProps}
    },
    {render}
  },
];
```

## 表单页生成 (createOrEdit.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Switch, message } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import { dataOperateApi } from 'src/api/dataOperate';

import { {objectCode}PagePath, OBJECT_CODE } from './constants';

/**
 * {objectName} 创建/编辑页
 */
export default () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      // 编辑时加载数据
      dataOperateApi.getDetail({ id, objectCode: OBJECT_CODE }).then((res) => {
        form.setFieldsValue(res.data);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await dataOperateApi.update({
          ...values,
          id,
          objectCode: OBJECT_CODE,
        });
        message.success('更新成功');
      } else {
        await dataOperateApi.create({
          ...values,
          objectCode: OBJECT_CODE,
        });
        message.success('创建成功');
      }
      history.push({objectCode}PagePath.list);
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
    }
  };

  return (
    <Form form={form} layout="vertical">
      {{formFields}}
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
          <Button onClick={() => history.goBack()}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
```

### formFields 生成规则

```typescript
const formFields = (
  <>
    <Form.Item name="main_field" label="主属性" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="{fieldCode}" label="{fieldName}">
      {{component}}
    </Form.Item>
  </>
);
```

## 详情页生成 (detail.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import { Descriptions, Button, Space } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import { dataOperateApi } from 'src/api/dataOperate';

import { {objectCode}PagePath, OBJECT_CODE } from './constants';

/**
 * {objectName} 详情页
 */
export default () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    dataOperateApi.getDetail({ id, objectCode: OBJECT_CODE }).then((res) => {
      setData(res.data);
    });
  }, [id]);

  return (
    <div>
      <Descriptions title="{objectName}详情" bordered>
        {{detailFields}}
      </Descriptions>
      <div style={{ marginTop: 16 }}>
        <Space>
          <Button type="primary" onClick={() => {
            history.push({objectCode}PagePath.edit.replace(':id', id));
          }}>
            编辑
          </Button>
          <Button onClick={() => history.push({objectCode}PagePath.list)}>
            返回
          </Button>
        </Space>
      </div>
    </div>
  );
};
```

### detailFields 生成规则

```typescript
const detailFields = (
  <>
    <Descriptions.Item label="主属性">{data.main_field}</Descriptions.Item>
    <Descriptions.Item label="{fieldName}">
      {data.{fieldCode}}
    </Descriptions.Item>
  </>
);
```

## 路由注册

在 App.tsx 中注册路由：

```typescript
import { objectCode }PagePath from './pages/{objectCode}/constants';
import PageList from 'src/pages/{objectCode}/list';
import CreateOrEdit from 'src/pages/{objectCode}/createOrEdit';
import Detail from 'src/pages/{objectCode}/detail';

<Switch>
  <Route exact path={objectCodePagePath.list} component={PageList} />
  <Route exact path={objectCodePagePath.create} component={CreateOrEdit} />
  <Route exact path={objectCodePagePath.edit} component={CreateOrEdit} />
  <Route exact path={objectCodePagePath.detail} component={Detail} />
</Switch>
```

## 特殊情况处理

### 1. 布尔值字段

```typescript
// 列表页渲染
render: (value: boolean) => value ? '是' : '否',

// 表单页
<Form.Item name="{fieldCode}" label="{fieldName}" valuePropName="checked">
  <Switch />
</Form.Item>
```

### 2. 单选/多选字段

```typescript
// 需要从 choiceValues 生成 options
const {fieldCode}Options = [
  { label: '{choiceValue}', value: '{choiceCode}' },
];

// 列表页
filterConfig: {
  type: FilterFieldType.select,
  customProps: {
    options: {fieldCode}Options,
  },
},

// 表单页
<Select options={fieldCode}Options mode="multiple" />
```

### 3. 日期时间字段

```typescript
// 列表页
render: (value: number) => value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-',

// 表单页
<DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
```

### 4. 引用字段

```typescript
// 引用字段需要特殊处理 reference
{
  title: '{fieldName}',
  dataIndex: '{fieldCode}',
  render: (value: any, record: any) => record.{fieldCode}_detail?.name || '-',
}
```

## 生成流程

1. 读取 Metadata.ts 中的 fields 和 sonObjects
2. 根据字段类型生成 columns 配置
3. 根据字段类型生成 form 配置
4. 生成 constants.ts
5. 生成 list.tsx
6. 生成 createOrEdit.tsx
7. 生成 detail.tsx
8. 更新 App.tsx 注册路由
