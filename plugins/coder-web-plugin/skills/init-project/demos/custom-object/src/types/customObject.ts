/**
 * 自定义对象相关类型定义
 */

// 字段类型枚举
export enum FieldType {
  text = 1, // 单行文本
  number = 2, // 数值
  textArea = 3, // 多行文本
  select = 4, // 单选
  multiSelect = 5, // 多选
  boolean = 6, // 布尔值
  integer = 7, // 整数
  date = 8, // 日期时间
  url = 9, // 链接
  reference = 10, // 引用字段
  relation = 11, // 关联关系
  appendix = 14, // 附件
  picture = 16, // 图片（实际值是 16）
}

// 字段定义
export interface FieldDTO {
  id?: number;
  fieldCode: string;
  fieldName: string;
  fieldType: FieldType;
  fieldRemind?: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isName?: boolean; // 是否主属性
  isRefer?: boolean; // 是否引用字段
  targetType?: number; // 引用目标类型
  referenceChain?: string; // 引用链
  defaultValue?: any;
  [key: string]: any;
}

// 从对象定义
export interface SubObjectDTO {
  objectCode: string;
  objectName: string;
  referName: string; // 从对象关联名称
  referCode: string;
  childNecessary?: boolean; // 是否必填
  fieldList: FieldDTO[];
  [key: string]: any;
}

// 字段值
export interface FieldValueDTO {
  fieldCode: string;
  fieldId?: number; // 字段ID(编号和ID至少传一个)
  fieldType: FieldType;
  fieldValue: any; // 字段值
  id?: number;
  targetType?: number; // 关联类型,1/N
  isNumberRuleActuallyConfig?: boolean;
  choiceValues?: Array<{
    choiceCode?: string;
    choiceValue?: string;
    [key: string]: any;
  }>; // 被选中的选项值项(单选/多选)
  datetimeFormat?: string; // 日期格式
  fieldCategory?: number; // 字段类型, 1自定义字段 2预置字段
  isName?: number; // 是否为主属性
  isRefer?: number; // 是否是引用字段
  isUnique?: number; // 是否唯一
  [key: string]: any;
}

// 从对象值
export interface SubObjectValueDTO {
  objectCode: string;
  instanceId?: number;
  fields: FieldValueDTO[];
}

// 自定义对象实例数据（根据接口返回结构）
export interface CustomObjectEntityDTO {
  instanceId?: number; // 自定义对象实例id
  objectCode?: string; // 对象编码
  objectCategory?: number; // 对象类型, 1自定义对象 2预置对象
  bizType?: string; // 业务类型
  bizTypeName?: string; // 业务类型名称
  createdAt?: number; // 创建时间（时间戳）
  fields?: FieldValueDTO[]; // 字段值列表
  sonObjects?: SubObjectValueDTO[]; // 从对象列表（可能为空数组）
  sonObjectCategory?: Array<{
    objectCode: string; // 对象编码
    objectName: string; // 对象名称
    referCode: string; // 对象列表CODE
    referName: string; // 对象列表名称
    fields?: ListItemField[]; // 字段定义列表
  }>; // 从对象类别（定义信息）
  creator?: UserInfoVO; // 创建者
  operator?: UserInfoVO; // 操作者
  [key: string]: any;
}

// 创建者/操作者信息
export interface UserInfoVO {
  id?: number;
  name?: string;
  code?: string;
  username?: string;
  avatarUrl?: string;
  desc?: string;
}

// 字段权限管理
export interface FieldPermission {
  [key: string]: any;
}

// 选项值项（单选/多选）
export interface ChoiceValue {
  [key: string]: any;
}

// 列表项中的字段信息（与FieldValueDTO类似但结构略有不同）
export interface ListItemField {
  fieldId?: number; // 字段ID
  fieldCode?: string; // 字段编号（编号和ID至少传一个）
  fieldName?: string; // 字段名称
  fieldType?: number; // 字段类型：1单行文本2数值3多行文本4单选5多选6布尔值7整数8日期时间9链接11关联关系12从关系13主从关系
  fieldCategory?: number; // 字段类型：1自定义字段2预置字段
  fieldValue?: any; // 字段值
  isName?: number; // 是否为主属性（0否1是）
  isRefer?: number; // 是否是引用字段（0否1是）
  targetType?: number; // 关联类型：1/N
  datetimeFormat?: string; // 日期格式
  choiceValues?: ChoiceValue[]; // 被选中的选项值项(单选/多选)
  [key: string]: any;
}

// 自定义对象列表项（根据API文档定义）
export interface CustomObjectListItem {
  instanceId: number; // 自定义对象实例id（必填）
  objectCode?: string; // 对象编码
  createdAt?: number; // 创建时间（时间戳）
  updatedAt?: number; // 更新时间（时间戳）
  creator?: UserInfoVO; // 创建者
  operator?: UserInfoVO; // 操作者
  fields?: ListItemField[]; // 字段信息
  fieldPermission?: FieldPermission; // 字段权限管理
  needCheck?: number; // 确认相关标识
  // 为了兼容现有代码，保留 $instanceId 作为 instanceId 的别名
  $instanceId?: number;
  [key: string]: any;
}

// 操作代码枚举
export enum OperationCode {
  add = 'add',
  edit = 'edit',
  remove = 'remove',
  view = 'view',
  detail = 'detail',
  copy = 'copy',
}

