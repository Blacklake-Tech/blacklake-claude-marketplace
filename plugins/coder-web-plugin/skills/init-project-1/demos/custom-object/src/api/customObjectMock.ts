/**
 * 自定义对象 Mock 数据
 */
import type {
  FieldDTO,
  SubObjectDTO,
  CustomObjectEntityDTO,
  CustomObjectListItem,
  ChoiceValue,
} from '../types/customObject';
import type {
  CustomObjectListResponse,
  CreateCustomObjectRequest,
  UpdateCustomObjectRequest,
  UpdateCustomObjectResponse,
} from './customObject';

// Mock API 响应类型
interface GetFieldsResponse {
  list: FieldDTO[];
}

interface GetSubObjectsResponse {
  list: SubObjectDTO[];
}

// Mock 字段定义 - 增强版，包含更多字段类型
// 导出以便在 mock 模式下直接使用，避免 API 调用
export const mockFields: FieldDTO[] = [
  {
    id: 1,
    fieldCode: 'code',
    fieldName: '编号',
    fieldType: 1, // 单行文本
    isRequired: true,
    isName: true, // 主属性
    isRefer: false,
    fieldRemind: '请输入唯一编号',
  },
  {
    id: 2,
    fieldCode: 'name',
    fieldName: '名称',
    fieldType: 1, // 单行文本
    isRequired: true,
    isName: false,
    isRefer: false,
    fieldRemind: '请输入对象名称',
  },
  {
    id: 3,
    fieldCode: 'description',
    fieldName: '描述',
    fieldType: 3, // 多行文本
    isRequired: false,
    isName: false,
    isRefer: false,
    fieldRemind: '请输入详细描述信息',
  },
  {
    id: 4,
    fieldCode: 'status',
    fieldName: '状态',
    fieldType: 4, // 单选
    isRequired: true,
    isName: false,
    isRefer: false,
    choiceValues: [
      { choiceCode: 'active', choiceValue: '启用' },
      { choiceCode: 'inactive', choiceValue: '禁用' },
      { choiceCode: 'pending', choiceValue: '待审核' },
    ],
  },
  {
    id: 5,
    fieldCode: 'tags',
    fieldName: '标签',
    fieldType: 5, // 多选
    isRequired: false,
    isName: false,
    isRefer: false,
    choiceValues: [
      { choiceCode: 'tag1', choiceValue: '重要' },
      { choiceCode: 'tag2', choiceValue: '紧急' },
      { choiceCode: 'tag3', choiceValue: '普通' },
      { choiceCode: 'tag4', choiceValue: '测试' },
    ],
  },
  {
    id: 6,
    fieldCode: 'is_active',
    fieldName: '是否启用',
    fieldType: 6, // 布尔值
    isRequired: false,
    isName: false,
    isRefer: false,
    defaultValue: true,
  },
  {
    id: 7,
    fieldCode: 'quantity',
    fieldName: '数量',
    fieldType: 7, // 整数
    isRequired: false,
    isName: false,
    isRefer: false,
    fieldRemind: '请输入整数',
  },
  {
    id: 8,
    fieldCode: 'price',
    fieldName: '价格',
    fieldType: 2, // 数值
    isRequired: false,
    isName: false,
    isRefer: false,
    fieldRemind: '请输入价格，支持小数',
  },
  {
    id: 9,
    fieldCode: 'create_time',
    fieldName: '创建时间',
    fieldType: 8, // 日期时间
    isRequired: false,
    isName: false,
    isRefer: false,
    datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    id: 10,
    fieldCode: 'website',
    fieldName: '网站链接',
    fieldType: 9, // 链接
    isRequired: false,
    isName: false,
    isRefer: false,
    fieldRemind: '请输入有效的URL地址',
  },
];

// Mock 从对象定义 - 增强版
// 导出以便在 mock 模式下直接使用，避免 API 调用
export const mockSubObjects: SubObjectDTO[] = [
  {
    objectCode: 'SubObject__c',
    objectName: '从对象',
    referName: '自定义对象从对象',
    referCode: 'sub_object',
    childNecessary: false,
    fieldList: [
      {
        id: 101,
        fieldCode: 'sub_code',
        fieldName: '从对象编号',
        fieldType: 1, // 单行文本
        isRequired: true,
        isName: true, // 主属性
        isRefer: false,
        fieldRemind: '请输入从对象编号',
      },
      {
        id: 102,
        fieldCode: 'sub_name',
        fieldName: '从对象名称',
        fieldType: 1, // 单行文本
        isRequired: true,
        isName: false,
        isRefer: false,
      },
      {
        id: 103,
        fieldCode: 'sub_description',
        fieldName: '从对象描述',
        fieldType: 3, // 多行文本
        isRequired: false,
        isName: false,
        isRefer: false,
      },
      {
        id: 104,
        fieldCode: 'sub_status',
        fieldName: '从对象状态',
        fieldType: 4, // 单选
        isRequired: false,
        isName: false,
        isRefer: false,
        choiceValues: [
          { choiceCode: 'new', choiceValue: '新建' },
          { choiceCode: 'processing', choiceValue: '处理中' },
          { choiceCode: 'completed', choiceValue: '已完成' },
        ],
      },
      {
        id: 105,
        fieldCode: 'sub_amount',
        fieldName: '金额',
        fieldType: 2, // 数值
        isRequired: false,
        isName: false,
        isRefer: false,
      },
      {
        id: 106,
        fieldCode: 'sub_date',
        fieldName: '日期',
        fieldType: 8, // 日期时间
        isRequired: false,
        isName: false,
        isRefer: false,
        datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    ],
  },
];

// Mock 列表数据 - 增强版，符合接口输出格式（使用 fields 数组）
const mockListData: CustomObjectListItem[] = [];
const statusOptions = ['启用', '禁用', '待审核'];
const tagsOptions = ['重要', '紧急', '普通', '测试'];

for (let i = 1; i <= 50; i++) {
  const date = new Date(2025, 0, (i % 28) + 1, 10 + (i % 8), (i * 5) % 60);
  const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);
  
  // 根据字段定义构建 fields 数组，符合 ListItemField 格式
  const fields = mockFields.map((field) => {
    let fieldValue: any;
    
    // 根据字段类型设置对应的值
    switch (field.fieldCode) {
      case 'code':
        fieldValue = `CODE${String(i).padStart(6, '0')}`;
        break;
      case 'name':
        fieldValue = `测试对象名称_${i}`;
        break;
      case 'description':
        fieldValue = `这是第${i}个测试对象的描述信息，用于测试多行文本字段的显示效果。`;
        break;
      case 'status':
        fieldValue = statusOptions[i % 3];
        break;
      case 'tags':
        fieldValue = tagsOptions.slice(0, (i % 3) + 1);
        break;
      case 'is_active':
        fieldValue = i % 2 === 0;
        break;
      case 'quantity':
        fieldValue = i * 10;
        break;
      case 'price':
        fieldValue = i * 12.5;
        break;
      case 'create_time':
        fieldValue = dateStr;
        break;
      case 'website':
        fieldValue = `https://example.com/item/${i}`;
        break;
      default:
        fieldValue = null;
    }
    
    // 构建符合 ListItemField 格式的字段对象
    const listItemField: any = {
      fieldId: field.id,
      fieldCode: field.fieldCode,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      fieldCategory: 1, // 1自定义字段 2预置字段
      fieldValue: fieldValue,
      isName: field.isName ? 1 : 0,
      isRefer: field.isRefer ? 1 : 0,
    };
    
    // 添加日期格式
    if (field.datetimeFormat) {
      listItemField.datetimeFormat = field.datetimeFormat;
    }
    
    // 添加选项值（单选/多选）
    if (field.choiceValues && (field.fieldType === 4 || field.fieldType === 5)) {
      // 根据当前值筛选出被选中的选项
      const selectedChoices = field.choiceValues.filter((choice: ChoiceValue) => {
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(choice.choiceValue);
        }
        return fieldValue === choice.choiceValue;
      });
      if (selectedChoices.length > 0) {
        listItemField.choiceValues = selectedChoices;
      }
    }
    
    return listItemField;
  });
  
  mockListData.push({
    instanceId: i,
    $instanceId: i,
    objectCode: 'cust_object113__c',
    createdAt: date.getTime(),
    updatedAt: date.getTime(),
    fields: fields, // 使用 fields 数组格式
    creator: {
      id: (i % 5) + 1,
      name: `用户${(i % 5) + 1}`,
      username: `user${(i % 5) + 1}`,
    },
    operator: {
      id: (i % 5) + 1,
      name: `操作员${(i % 5) + 1}`,
      username: `operator${(i % 5) + 1}`,
    },
  });
}

// Mock 详情数据 - 增强版
const mockDetailData: CustomObjectEntityDTO = {
  instanceId: 1,
  id: 1,
  objectCode: 'cust_object113__c',
  objectCategory: 1,
  bizType: 'test',
  bizTypeName: '测试业务类型',
  createdAt: new Date('2025-01-15 10:00:00').getTime(),
  fields: [
    {
      fieldCode: 'code',
      fieldName: '编号',
      fieldType: 1,
      fieldValue: 'CODE000001',
      isRequired: true,
      isName: 1,
      isRefer: 0,
    },
    {
      fieldCode: 'name',
      fieldName: '名称',
      fieldType: 1,
      fieldValue: '测试对象名称_1',
      isRequired: true,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'description',
      fieldName: '描述',
      fieldType: 3,
      fieldValue: '这是第一个测试对象的详细描述信息，用于测试多行文本字段的显示效果。包含了一些示例内容来说明字段的使用场景。',
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'status',
      fieldName: '状态',
      fieldType: 4,
      fieldValue: '启用',
      isRequired: 1,
      isName: 0,
      isRefer: 0,
      choiceValues: [
        { choiceCode: 'active', choiceValue: '启用' },
      ],
    },
    {
      fieldCode: 'tags',
      fieldName: '标签',
      fieldType: 5,
      fieldValue: ['重要', '紧急'],
      isRequired: 0,
      isName: 0,
      isRefer: 0,
      choiceValues: [
        { choiceCode: 'tag1', choiceValue: '重要' },
        { choiceCode: 'tag2', choiceValue: '紧急' },
      ],
    },
    {
      fieldCode: 'is_active',
      fieldName: '是否启用',
      fieldType: 6,
      fieldValue: true,
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'quantity',
      fieldName: '数量',
      fieldType: 7,
      fieldValue: 10,
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'price',
      fieldName: '价格',
      fieldType: 2,
      fieldValue: 125.50,
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'create_time',
      fieldName: '创建时间',
      fieldType: 8,
      fieldValue: '2025-01-15 10:00:00',
      datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
    {
      fieldCode: 'website',
      fieldName: '网站链接',
      fieldType: 9,
      fieldValue: 'https://example.com/item/1',
      isRequired: 0,
      isName: 0,
      isRefer: 0,
    },
  ],
  sonObjects: [
    {
      objectCode: 'SubObject__c',
      instanceId: 1,
      fields: [
        {
          fieldCode: 'sub_code',
          fieldType: 1,
          fieldValue: 'SUB001',
        },
        {
          fieldCode: 'sub_name',
          fieldType: 1,
          fieldValue: '从对象名称_1',
        },
        {
          fieldCode: 'sub_description',
          fieldType: 3,
          fieldValue: '这是第一个从对象的描述信息。',
        },
        {
          fieldCode: 'sub_status',
          fieldType: 4,
          fieldValue: '新建',
          choiceValues: [
            { choiceCode: 'new', choiceValue: '新建' },
          ],
        },
        {
          fieldCode: 'sub_amount',
          fieldType: 2,
          fieldValue: 99.99,
        },
        {
          fieldCode: 'sub_date',
          fieldType: 8,
          fieldValue: '2025-01-15 10:00:00',
          datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
        },
      ],
    },
    {
      objectCode: 'SubObject__c',
      instanceId: 2,
      fields: [
        {
          fieldCode: 'sub_code',
          fieldType: 1,
          fieldValue: 'SUB002',
        },
        {
          fieldCode: 'sub_name',
          fieldType: 1,
          fieldValue: '从对象名称_2',
        },
        {
          fieldCode: 'sub_description',
          fieldType: 3,
          fieldValue: '这是第二个从对象的描述信息。',
        },
        {
          fieldCode: 'sub_status',
          fieldType: 4,
          fieldValue: '处理中',
          choiceValues: [
            { choiceCode: 'processing', choiceValue: '处理中' },
          ],
        },
        {
          fieldCode: 'sub_amount',
          fieldType: 2,
          fieldValue: 199.99,
        },
        {
          fieldCode: 'sub_date',
          fieldType: 8,
          fieldValue: '2025-01-16 14:30:00',
          datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
        },
      ],
    },
  ],
  sonObjectCategory: [
    {
      objectCode: 'SubObject__c',
      objectName: '从对象',
      referCode: 'sub_object',
      referName: '自定义对象从对象',
      fields: (mockSubObjects[0]?.fieldList || []).map((field) => ({
        fieldId: field.id,
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        fieldCategory: 1,
        isName: field.isName ? 1 : 0,
        isRefer: field.isRefer ? 1 : 0,
        targetType: field.targetType,
        datetimeFormat: field.datetimeFormat,
        choiceValues: field.choiceValues,
      })),
    },
  ],
  creator: {
    id: 1,
    name: '管理员',
    username: 'admin',
    code: 'admin',
  },
  operator: {
    id: 1,
    name: '管理员',
    username: 'admin',
    code: 'admin',
  },
  createTime: '2025-01-15 10:00:00',
  updateTime: '2025-01-15 10:00:00',
};

/**
 * Mock API 实现
 */
export const customObjectMockApi = {
  // 获取字段列表
  getFields: (objectCode: string): Promise<GetFieldsResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 如果是从对象的 objectCode，返回从对象的字段定义
        if (objectCode === 'SubObject__c' || objectCode === 'sub_object') {
          const subObject = mockSubObjects.find((so) => so.objectCode === objectCode || so.referCode === objectCode);
          resolve({ list: subObject?.fieldList || [] });
        } else {
          // 否则返回主对象的字段定义
          resolve({ list: mockFields });
        }
      }, 300);
    });
  },

  // 获取从对象定义
  getSubObjects: (objectCode: string): Promise<GetSubObjectsResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ list: mockSubObjects });
      }, 300);
    });
  },

  // 获取列表
  getList: (params: any): Promise<CustomObjectListResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, size = 20, mainPropertyCondition } = params;
        let filteredData = [...mockListData];

        // 辅助函数：从 fields 数组中获取字段值
        const getFieldValue = (item: CustomObjectListItem, fieldCode: string): any => {
          const field = item.fields?.find((f) => f.fieldCode === fieldCode);
          return field?.fieldValue;
        };

        // 辅助函数：获取主属性值（用于主属性搜索）
        const getMainPropertyValue = (item: CustomObjectListItem): string => {
          // 查找 isName 为 1 的字段（主属性）
          const mainField = item.fields?.find((f) => f.isName === 1);
          if (mainField?.fieldValue) {
            return String(mainField.fieldValue);
          }
          // 如果没有主属性字段，使用 instanceId
          return String(item.instanceId);
        };

        // 主属性搜索过滤
        if (mainPropertyCondition) {
          filteredData = filteredData.filter((item) => {
            const mainPropertyValue = getMainPropertyValue(item);
            return (
              mainPropertyValue.includes(mainPropertyCondition) ||
              String(item.instanceId).includes(mainPropertyCondition)
            );
          });
        }

        // 单行文本搜索条件
        if (params.singleTextCondition && Array.isArray(params.singleTextCondition)) {
          params.singleTextCondition.forEach((condition: any) => {
            filteredData = filteredData.filter((item: any) => {
              const fieldValue = getFieldValue(item, condition.fieldCode);
              return fieldValue && String(fieldValue).includes(condition.fieldValue);
            });
          });
        }

        // 单选搜索条件
        if (params.singleChoiceCondition && Array.isArray(params.singleChoiceCondition)) {
          params.singleChoiceCondition.forEach((condition: any) => {
            filteredData = filteredData.filter((item: any) => {
              const fieldValue = getFieldValue(item, condition.fieldCode);
              return fieldValue === condition.fieldValue;
            });
          });
        }

        // 布尔搜索条件
        if (params.boolCondition && Array.isArray(params.boolCondition)) {
          params.boolCondition.forEach((condition: any) => {
            filteredData = filteredData.filter((item: any) => {
              const fieldValue = getFieldValue(item, condition.fieldCode);
              return fieldValue === condition.fieldValue;
            });
          });
        }

        // 排序
        if (params.sorter && Array.isArray(params.sorter) && params.sorter.length > 0) {
          filteredData.sort((a: any, b: any) => {
            for (const sorter of params.sorter) {
              const aVal = getFieldValue(a, sorter.fieldCode);
              const bVal = getFieldValue(b, sorter.fieldCode);
              if (aVal !== bVal) {
                const order = sorter.order === 'desc' ? -1 : 1;
                return aVal > bVal ? order : -order;
              }
            }
            return 0;
          });
        }

        // 分页
        const start = (page - 1) * size;
        const end = start + size;
        const list = filteredData.slice(start, end);

        resolve({
          list,
          total: filteredData.length,
          page,
        });
      }, 500);
    });
  },

  // 获取详情
  getDetail: (params: { instanceId: string; objectCode: string }): Promise<CustomObjectEntityDTO> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const instanceId = Number(params.instanceId);
        const listItem = mockListData.find((item) => item.$instanceId === instanceId);

        if (listItem && listItem.fields) {
          // 将 ListItemField 格式转换为 FieldValueDTO 格式（详情接口格式）
          const fields = listItem.fields.map((field) => {
            // 查找对应的字段定义以获取更多信息
            const fieldDef = mockFields.find((f) => f.fieldCode === field.fieldCode);
            
            return {
              fieldCode: field.fieldCode || '',
              fieldName: field.fieldName || '',
              fieldType: field.fieldType || 1,
              fieldValue: field.fieldValue,
              isRequired: fieldDef?.isRequired ? 1 : 0,
              isName: field.isName || 0,
              isRefer: field.isRefer || 0,
              datetimeFormat: field.datetimeFormat,
              choiceValues: field.choiceValues,
            };
          });

          // 根据列表项构建详情数据
          resolve({
            ...mockDetailData,
            instanceId,
            id: instanceId,
            createdAt: listItem.createdAt || Date.now(),
            fields: fields,
            // 添加从对象数据
            sonObjects: [
              {
                objectCode: 'SubObject__c',
                instanceId: instanceId * 100 + 1,
                fields: [
                  {
                    fieldCode: 'sub_code',
                    fieldType: 1,
                    fieldValue: `SUB${String(instanceId).padStart(3, '0')}_1`,
                  },
                  {
                    fieldCode: 'sub_name',
                    fieldType: 1,
                    fieldValue: `从对象名称_${instanceId}_1`,
                  },
                  {
                    fieldCode: 'sub_description',
                    fieldType: 3,
                    fieldValue: `这是第${instanceId}个主对象的第1个从对象的描述信息。`,
                  },
                  {
                    fieldCode: 'sub_status',
                    fieldType: 4,
                    fieldValue: '新建',
                    choiceValues: [
                      { choiceCode: 'new', choiceValue: '新建' },
                    ],
                  },
                  {
                    fieldCode: 'sub_amount',
                    fieldType: 2,
                    fieldValue: (instanceId * 99.99).toFixed(2),
                  },
                  {
                    fieldCode: 'sub_date',
                    fieldType: 8,
                    fieldValue: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
                  },
                ],
              },
              {
                objectCode: 'SubObject__c',
                instanceId: instanceId * 100 + 2,
                fields: [
                  {
                    fieldCode: 'sub_code',
                    fieldType: 1,
                    fieldValue: `SUB${String(instanceId).padStart(3, '0')}_2`,
                  },
                  {
                    fieldCode: 'sub_name',
                    fieldType: 1,
                    fieldValue: `从对象名称_${instanceId}_2`,
                  },
                  {
                    fieldCode: 'sub_description',
                    fieldType: 3,
                    fieldValue: `这是第${instanceId}个主对象的第2个从对象的描述信息。`,
                  },
                  {
                    fieldCode: 'sub_status',
                    fieldType: 4,
                    fieldValue: '处理中',
                    choiceValues: [
                      { choiceCode: 'processing', choiceValue: '处理中' },
                    ],
                  },
                  {
                    fieldCode: 'sub_amount',
                    fieldType: 2,
                    fieldValue: ((instanceId + 1) * 99.99).toFixed(2),
                  },
                  {
                    fieldCode: 'sub_date',
                    fieldType: 8,
                    fieldValue: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
                  },
                ],
              },
            ],
            sonObjectCategory: mockDetailData.sonObjectCategory,
            creator: listItem.creator || mockDetailData.creator,
            operator: listItem.operator || mockDetailData.operator,
          });
        } else {
          resolve(mockDetailData);
        }
      }, 500);
    });
  },

  // 创建
  create: (data: CreateCustomObjectRequest): Promise<{ id: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('创建数据:', data);
        resolve({ id: Date.now() });
      }, 1000);
    });
  },

  // 更新
  update: (data: UpdateCustomObjectRequest): Promise<UpdateCustomObjectResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('更新数据:', data);
        resolve({
          code: 200,
          message: '更新成功',
          updateResult: true,
        });
      }, 1000);
    });
  },

  // 复制创建
  copyCreate: (data: CreateCustomObjectRequest): Promise<{ id: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('复制创建数据:', data);
        resolve({ id: Date.now() });
      }, 1000);
    });
  },

  // 删除
  delete: (params: { ids: string[]; objectCode: string }): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('删除数据:', params);
        resolve();
      }, 500);
    });
  },

  // 获取从对象分页数据
  getSubObjectPage: (params: {
    mainObjectCode: string;
    mainInstanceId: number;
    sonObjectCode: string;
    page: number;
    size: number;
  }): Promise<{ list: any[]; total: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟从对象数据 - 增强版
        const instances = [];
        const subStatusOptions = ['新建', '处理中', '已完成'];
        for (let i = 1; i <= Math.min(10, params.size || 20); i++) {
          const subDate = new Date(2025, 0, (i % 28) + 1, 10 + (i % 8), (i * 5) % 60);
          instances.push({
            instanceId: params.mainInstanceId * 100 + i,
            fields: [
              {
                fieldCode: 'sub_code',
                fieldValue: `SUB${String(i).padStart(3, '0')}`,
              },
              {
                fieldCode: 'sub_name',
                fieldValue: `从对象名称_${i}`,
              },
              {
                fieldCode: 'sub_description',
                fieldValue: `这是第${i}个从对象的描述信息，用于测试从对象的数据展示。`,
              },
              {
                fieldCode: 'sub_status',
                fieldValue: subStatusOptions[i % 3],
              },
              {
                fieldCode: 'sub_amount',
                fieldValue: (i * 99.99).toFixed(2),
              },
              {
                fieldCode: 'sub_date',
                fieldValue: subDate.toISOString().replace('T', ' ').substring(0, 19),
              },
            ],
          });
        }

        resolve({
          list: instances,
          total: instances.length,
        });
      }, 500);
    });
  },
};

