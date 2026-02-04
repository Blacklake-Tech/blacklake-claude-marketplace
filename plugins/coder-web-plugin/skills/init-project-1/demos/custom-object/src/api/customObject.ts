import api from './index';
import type {
  PaginationResponse,
  DetailParams,
  DeleteParams,
} from '../types';
import type {
  FieldDTO,
  SubObjectDTO,
  CustomObjectEntityDTO,
  CustomObjectListItem,
} from '../types/customObject';
import { customObjectMockApi } from './customObjectMock';
import { getMockMode } from '../utils/mockMode';

/**
 * 获取当前是否使用 Mock 数据
 * 动态读取 localStorage 中的配置
 */
const getUseMock = (): boolean => {
  return getMockMode();
};

// 自定义对象列表查询参数（根据 openapi 文档）
export interface CustomObjectListParams {
  objectCode: string; // 必填：自定义对象编码
  page?: number; // 可选：请求页，示例：1
  size?: number; // 可选：每页大小，默认：20
  mainPropertyCondition?: string; // 可选：主属性搜索条件（快捷搜索）
  singleTextCondition?: Array<{
    fieldCode: string;
    fieldValue: string;
  }>; // 可选：单行文本搜索条件
  singleChoiceCondition?: Array<{
    fieldCode: string;
    fieldValue: string;
  }>; // 可选：单选搜索条件
  multipleChoiceCondition?: Array<{
    fieldCode: string;
    fieldValue: string[];
  }>; // 可选：多选搜索条件
  boolCondition?: Array<{
    fieldCode: string;
    fieldValue: boolean;
  }>; // 可选：布尔搜索条件
  datetimeCondition?: Array<{
    fieldCode: string;
    fieldValue: [string, string]; // [min, max]
  }>; // 可选：日期搜索条件
  integerCondition?: Array<{
    fieldCode: string;
    fieldValue: number;
  }>; // 可选：整数搜索条件
  numericCondition?: Array<{
    fieldCode: string;
    fieldValue: { min?: number; max?: number };
  }>; // 可选：数字搜索条件
  referenceCondition?: Array<{
    fieldCode: string;
    fieldValue: any;
  }>; // 可选：引用搜索条件
  relateCondition?: Array<{
    fieldCode: string;
    fieldValue: number[];
  }>; // 可选：关联搜索条件（AND）
  relateConditionOr?: Array<{
    fieldCode: string;
    fieldValue: number[];
  }>; // 可选：关联搜索条件（OR）
  sorter?: Array<{
    fieldCode: string;
    order: 'asc' | 'desc';
  }>; // 可选：排序列表
  selectFlag?: number; // 可选：筛选标识，1全选0不全选，默认0
  [key: string]: any; // 允许其他参数
}

// 自定义对象列表响应
// 注意：后端返回格式为 { code: number, data: { list: [], total: number, page: number }, message: string }
// 经过 request.ts 拦截器处理后，返回的是 data 部分，即 { list: [], total: number, page: number }
export interface CustomObjectListResponse {
  list: CustomObjectListItem[]; // 列表数据（必填）
  total: number; // 总条数（必填）
  page?: number; // 当前页（可选）
}

// 创建自定义对象请求（已废弃，保留用于 mock）
export interface CreateCustomObjectRequest {
  objectCode: string;
  fields: Array<{
    fieldCode: string;
    fieldType: number;
    fieldValue: any;
    id?: number;
    targetType?: number;
    isNumberRuleActuallyConfig?: boolean;
  }>;
  sonObjects?: Array<{
    objectCode: string;
    instanceId?: number;
    fields: Array<{
      fieldCode: string;
      fieldType: number;
      fieldValue: any;
      id?: number;
      targetType?: number;
    }>;
  }>;
  instanceId?: number; // 编辑时需要
  sonDeleteList?: Array<{
    objectCode: string;
    instanceIds: number[];
  }>; // 编辑时删除的从对象
}

// 更新接口请求参数（根据 update_new_api_field_guide.md）
export interface UpdateCustomObjectRequest {
  objectCode: string; // 对象编码（必填）
  instanceId: number; // 实例ID（必填）
  fields: Record<string, any>; // 字段键值对 Map<String, Object>，key 是 fieldCode，value 是字段值（必填）
  sonObjects?: Array<{
    objectCode: string; // 对象编码（必填）
    instanceId?: number; // 实例ID（更新时需要）
    records: Array<{
      fields: Record<string, any>; // 子对象字段键值对，同样是 Map 格式
    }>;
  }>; // 自定义对象从对象列表（可选）
  sonDeleteList?: Array<{
    objectCode?: string; // 对象编号（可选）
    instanceId?: number; // 对象实例id（可选）
  }>; // 从对象实例删除列表（可选）
  sync?: boolean; // 是否同步刷新数据（可选，默认 true）
}

// 更新接口响应
export interface UpdateCustomObjectResponse {
  code: number; // 状态码（必填）
  message: string; // 返回信息（必填）
  data?: {
    updateResult?: boolean; // 更新结果（可选）
    fieldPermission?: Record<string, any>; // 字段权限管理（可选）
    needCheck?: number; // 是否需要二次确认（可选）
  };
  updateResult?: boolean; // 更新结果（可选）
  fieldPermission?: Record<string, any>; // 字段权限管理（可选）
  needCheck?: number; // 是否需要二次确认（可选）
  subCode?: string; // 错误码（可选）
}

// 新建自定义对象实例请求（根据 openapi 文档）
export interface CreateNewCustomObjectRequest {
  fields: Record<string, any>; // 自定义对象字段列表（object，键值对，key 是 fieldCode，value 是字段值）
  objectCode: string; // 对象编码（必填）
  records: Array<{
    fields: Record<string, any>; // 字段键值对（object，key 是 fieldCode，value 是字段值）
  }>; // 自定义对象字段列表（必填）
  sonObjects?: Array<{
    objectCode: string; // 对象编码
    records?: Array<{
      fields: Record<string, any>; // 字段键值对
    }>;
  }>; // 自定义对象从对象列表（可选）
  sync?: boolean; // 是否同步刷新数据（可选）
}

// 新建自定义对象实例响应
export interface CreateNewCustomObjectResponse {
  code: number; // 状态码（必填）
  message: string; // 返回信息（必填）
  data?: {
    insertedId?: number; // 插入后的实例ID（可选）
    fieldPermission?: Record<string, any>; // 字段权限管理（可选）
  };
  insertedId?: number; // 插入后的实例ID（可选）
  fieldPermission?: Record<string, any>; // 字段权限管理（可选）
  needCheck?: number; // 是否需要二次确认（可选）
  subCode?: string; // 错误码（可选）
}

// 删除自定义对象实例请求（根据 openapi 文档）
export interface DeleteCustomObjectRequest {
  ids?: number[]; // 要删除的实例id列表，和mainFieldValues任选一个，都传以ids为准，一次不超过100（可选）
  mainFieldValues?: string[]; // 要删除的实例主属性列表，和ids任选一个，都传以ids为准，一次不超过100（可选）
  objectCode: string; // 对象编号（必填）
  // 兼容旧格式
  instanceId?: number; // 兼容旧格式，会转换为 ids 数组
  mainFieldValue?: string; // 兼容旧格式，会转换为 mainFieldValues 数组
}

// 删除自定义对象实例响应
export interface DeleteCustomObjectResponse {
  code: number; // 状态码（必填）
  message: string; // 返回信息（必填）
  data?: number; // 数据（可选）
  fieldPermission?: {
    encoding?: string; // 编码（可选）
    noAccess?: string[]; // 无权限字段列表（可选）
    readonly?: string[]; // 只读字段列表（可选）
  }; // 字段权限管理（可选）
  needCheck?: number; // 是否需要二次确认（可选）
  subCode?: string; // 错误码（可选）
}

// 复制自定义对象实例请求（根据 openapi 文档）
export interface CopyCustomObjectRequest {
  instanceId?: number; // 实例ID（可选）
  objectCode?: string; // 对象编码（可选）
}

// 复制自定义对象实例响应
export interface CopyCustomObjectResponse {
  code: number; // 状态码（必填）
  message: string; // 返回信息（必填）
  data?: {
    insertedId?: number; // 实例ID（可选）
    fieldPermission?: {
      encoding?: string; // 编码（可选）
      noAccess?: string[]; // 无权限字段列表（可选）
      readonly?: string[]; // 只读字段列表（可选）
    }; // 字段权限管理（可选）
  };
  insertedId?: number; // 实例ID（可选）
  fieldPermission?: {
    encoding?: string; // 编码（可选）
    noAccess?: string[]; // 无权限字段列表（可选）
    readonly?: string[]; // 只读字段列表（可选）
  }; // 字段权限管理（可选）
  needCheck?: number; // 是否需要二次确认（可选）
  subCode?: string; // 错误码（可选）
}


/**
 * 自定义对象 API
 */
export const customObjectApi = {
  // 获取列表（使用 openapi 接口）
  // 接口路径：/custom-object/open/v1/custom_object/list
  // 请求方式：POST
  // 请求参数：objectCode (必填) + 其他可选查询参数
  // 返回数据：{ list: CustomObjectListItem[], total: number, page?: number }
  getList: (params: CustomObjectListParams): Promise<CustomObjectListResponse> => {
    if (getUseMock()) {
      return customObjectMockApi.getList(params);
    }
    // 使用 openapi 路径：/custom-object/open/v1/custom_object/list
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    return api.post('/custom-object/open/v1/custom_object/list', params);
  },

  // 获取详情
  getDetail: (params: DetailParams): Promise<CustomObjectEntityDTO> => {
    if (getUseMock()) {
      return customObjectMockApi.getDetail(params);
    }
    return api.post('/custom-object/open/v1/custom_object/detail', {
      instanceId: Number(params.instanceId),
      objectCode: params.objectCode,
    });
  },

  // 更新
  // 接口路径：/custom-object/open/v1/custom_object/update_new
  // 请求方式：POST
  // 请求参数：根据 UpdateCustomObjectRequest 接口定义
  // 返回数据：UpdateCustomObjectResponse
  // 注意：响应拦截器会返回 data.data，所以需要特殊处理以返回完整响应
  update: (data: UpdateCustomObjectRequest): Promise<UpdateCustomObjectResponse> => {
    if (getUseMock()) {
      // Mock 数据暂时返回成功
      return Promise.resolve({
        code: 200,
        message: '成功',
        updateResult: true,
      });
    }
    // 使用 openapi 路径：/custom-object/open/v1/custom_object/update_new
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 响应拦截器会返回 data.data，但我们需要完整的响应对象，所以需要特殊处理
    return api.post('/custom-object/open/v1/custom_object/update_new', data).then((response: any) => {
      // 如果响应拦截器返回的是 data.data（即 { updateResult: true }），需要包装成完整响应
      if (response && typeof response === 'object' && 'updateResult' in response && !('code' in response)) {
        return {
          code: 200,
          message: '成功',
          ...response,
        };
      }
      // 如果已经是完整响应，直接返回
      return response;
    });
  },

  // 复制自定义对象实例（使用 openapi 接口）
  // 接口路径：/custom-object/open/v1/custom_object/copy
  // 请求方式：POST
  // 请求参数：根据 CopyCustomObjectRequest 接口定义
  // 返回数据：CopyCustomObjectResponse
  // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
  copy: (data: CopyCustomObjectRequest): Promise<CopyCustomObjectResponse> => {
    if (getUseMock()) {
      // Mock 数据暂时返回成功
      return Promise.resolve({
        code: 200,
        message: '成功',
        insertedId: Math.floor(Math.random() * 10000),
      });
    }
    // 使用 openapi 路径：/custom-object/open/v1/custom_object/copy
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 响应拦截器会返回 data.data，但我们需要完整的响应对象，所以需要特殊处理
    return api.post('/custom-object/open/v1/custom_object/copy', data).then((response: any) => {
      // 如果响应拦截器返回的是 data.data（即 { insertedId: number }），需要包装成完整响应
      if (response && typeof response === 'object' && 'insertedId' in response && !('code' in response)) {
        return {
          code: 200,
          message: '成功',
          ...response,
        };
      }
      // 如果已经是完整响应，直接返回
      return response;
    });
  },

  // 新建自定义对象实例（使用 openapi 接口）
  // 接口路径：/custom-object/open/v1/custom_object/create_new
  // 请求方式：POST
  // 请求参数：根据 CreateNewCustomObjectRequest 接口定义
  // 返回数据：CreateNewCustomObjectResponse
  // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
  createNew: (data: CreateNewCustomObjectRequest): Promise<CreateNewCustomObjectResponse> => {
    if (getUseMock()) {
      // Mock 数据暂时返回成功
      return Promise.resolve({
        code: 200,
        message: '成功',
        insertedId: Math.floor(Math.random() * 10000),
      });
    }
    // 使用 openapi 路径：/custom-object/open/v1/custom_object/create_new
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 响应拦截器会返回 data.data，但我们需要完整的响应对象，所以需要特殊处理
    return api.post('/custom-object/open/v1/custom_object/create_new', data).then((response: any) => {
      // 如果响应拦截器返回的是 data.data（即 { insertedId: number }），需要包装成完整响应
      if (response && typeof response === 'object' && 'insertedId' in response && !('code' in response)) {
        return {
          code: 200,
          message: '成功',
          ...response,
        };
      }
      // 如果已经是完整响应，直接返回
      return response;
    });
  },

  // 删除自定义对象实例（使用 openapi 接口）
  // 接口路径：/custom-object/open/v1/custom_object/delete
  // 请求方式：POST
  // 请求参数：根据 DeleteCustomObjectRequest 接口定义
  // 返回数据：DeleteCustomObjectResponse
  // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
  delete: (params: DeleteParams | DeleteCustomObjectRequest): Promise<DeleteCustomObjectResponse> => {
    if (getUseMock()) {
      // Mock 数据暂时返回成功
      return Promise.resolve({
        code: 200,
        message: '成功',
      });
    }
    // 构建请求数据，根据 API 文档要求使用 ids 或 mainFieldValues
    const requestData: DeleteCustomObjectRequest = {
      objectCode: params.objectCode,
    };
    
    // 优先处理 ids（如果传入的是旧的 DeleteParams 格式，ids 是 string[]）
    // 或者新的 DeleteCustomObjectRequest 格式，ids 是 number[]
    if ('ids' in params && Array.isArray(params.ids) && params.ids.length > 0) {
      // 将 string[] 或 number[] 转换为 number[]
      requestData.ids = params.ids.map(id => typeof id === 'string' ? Number(id) : id).filter(id => !isNaN(id) && id > 0);
    }
    
    // 兼容旧格式：如果传入的是 instanceId（单个），转换为 ids 数组
    if (!requestData.ids && 'instanceId' in params && params.instanceId !== undefined) {
      const instanceId = typeof params.instanceId === 'string' ? Number(params.instanceId) : params.instanceId;
      if (!isNaN(instanceId) && instanceId > 0) {
        requestData.ids = [instanceId];
      }
    }
    
    // 处理 mainFieldValues
    if ('mainFieldValues' in params && Array.isArray(params.mainFieldValues) && params.mainFieldValues.length > 0) {
      requestData.mainFieldValues = params.mainFieldValues.filter(v => v && v.trim());
    }
    
    // 兼容旧格式：如果传入的是 mainFieldValue（单个），转换为 mainFieldValues 数组
    if (!requestData.mainFieldValues && 'mainFieldValue' in params && params.mainFieldValue) {
      requestData.mainFieldValues = [params.mainFieldValue];
    }
    
    // 验证：至少需要 ids 或 mainFieldValues 之一
    if (!requestData.ids && !requestData.mainFieldValues) {
      return Promise.reject(new Error('必须提供 ids 或 mainFieldValues 之一'));
    }
    
    // 使用 openapi 路径：/custom-object/open/v1/custom_object/delete
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 响应拦截器会返回 data.data，但我们需要完整的响应对象，所以需要特殊处理
    return api.post('/custom-object/open/v1/custom_object/delete', requestData).then((response: any) => {
      // 如果响应拦截器返回的是 data.data（即 number），需要包装成完整响应
      if (typeof response === 'number') {
        return {
          code: 200,
          message: '成功',
          data: response,
        };
      }
      // 如果响应拦截器返回的是 data.data（即 { data: number }），需要包装成完整响应
      if (response && typeof response === 'object' && 'data' in response && !('code' in response)) {
        return {
          code: 200,
          message: '成功',
          ...response,
        };
      }
      // 如果已经是完整响应，直接返回
      return response;
    });
  },

  // 获取从对象分页数据（编辑时加载已有从对象）
  // 接口路径：/custom-object/open/v2/custom_object/page_son_object
  // 请求方式：POST
  getSubObjectPage: (params: {
    mainObjectCode: string; // 主对象编码
    mainInstanceId: number; // 自定义对象实例id
    sonObjectCode: string; // 从对象编码
    page?: number; // 请求页，默认 1
    size?: number; // 每页大小，默认 20
    sorter?: Array<{
      field: string; // 排序字段
      order: 'asc' | 'desc'; // 排序规律，asc 升序 desc 降序，默认 asc
    }>; // 排序列表，顺序表示排序顺序
    selectFlag?: number; // 筛选标识，1全选0不全选，默认为0
    includeFormulaField?: boolean; // 是否包含公式字段
  }): Promise<PaginationResponse<any>> => {
    if (getUseMock()) {
      return customObjectMockApi.getSubObjectPage({
        mainObjectCode: params.mainObjectCode,
        mainInstanceId: params.mainInstanceId,
        sonObjectCode: params.sonObjectCode,
        page: params.page ?? 1,
        size: params.size ?? 20,
      });
    }
    // 使用 openapi 路径：/custom-object/open/v2/custom_object/page_son_object
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 路径中包含 /open/v2/，会被请求拦截器识别为 openapi 路径并添加路由前缀
    return api.post('/custom-object/open/v2/custom_object/page_son_object', {
      mainObjectCode: params.mainObjectCode,
      mainInstanceId: params.mainInstanceId,
      sonObjectCode: params.sonObjectCode,
      page: params.page ?? 1,
      size: params.size ?? 20,
      ...(params.sorter && { sorter: params.sorter }),
      ...(params.selectFlag !== undefined && { selectFlag: params.selectFlag }),
      ...(params.includeFormulaField !== undefined && { includeFormulaField: params.includeFormulaField }),
    });
  },

  // 查询指定对象下的自定义字段信息
  // 接口路径：/metadata/open/v1/custom_field/list_by_obj_id_or_code
  // 请求方式：POST
  // 请求参数：objectCode 或 objectId
  getFieldsByObjectCodeOrId: (params: {
    objectCode?: string; // 对象code
    objectId?: number; // 对象id，与对象编号同时存在时以id为准
  }): Promise<{ data: FieldDTO[] }> => {
    if (getUseMock()) {
      // Mock API 返回格式为 { list: FieldDTO[] }，需要转换为 { data: FieldDTO[] }
      return customObjectMockApi.getFields(params.objectCode || '').then((res) => ({
        data: res.list || [],
      }));
    }
    // 使用 openapi 路径：/metadata/open/v1/custom_field/list_by_obj_id_or_code
    // 注意：access_token 通过请求拦截器自动添加到请求头 X-AUTH 中
    // 路径中包含 /open/v1/，会被请求拦截器识别为 openapi 路径并添加路由前缀
    // 响应拦截器可能返回 data.data（数组）或 data，需要统一处理
    return api.post('/metadata/open/v1/custom_field/list_by_obj_id_or_code', params).then((response: any) => {
      // 如果响应已经是数组，直接返回 { data: response }
      if (Array.isArray(response)) {
        return { data: response };
      }
      // 如果响应是 { data: FieldDTO[] }，直接返回
      if (response && response.data && Array.isArray(response.data)) {
        return response;
      }
      // 如果响应是 { list: FieldDTO[] }，转换为 { data: FieldDTO[] }
      if (response && response.list && Array.isArray(response.list)) {
        return { data: response.list };
      }
      // 默认返回空数组
      console.warn('[getFieldsByObjectCodeOrId] 未知的响应格式:', response);
      return { data: [] };
    });
  },
};
