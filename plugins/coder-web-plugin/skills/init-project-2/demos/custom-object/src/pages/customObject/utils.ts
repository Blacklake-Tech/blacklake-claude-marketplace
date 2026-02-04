/**
 * @description 自定义对象工具函数
 * 适配 mock 数据格式（数据已经是页面需要的格式）
 */
import moment from 'moment';
import type { FieldDTO } from '../../types/customObject';
import { FieldType } from '../../types/customObject';

/**
 * 日期字段类型
 */
export const FIELD_TYPE_DATE = 8;

/**
 * 将字段值转换为 moment 对象（用于表单）
 * 支持 moment 对象、时间戳（数字）、字符串格式
 */
export const convertFieldValueToMoment = (fieldValue: any): moment.Moment | undefined => {
  if (!fieldValue) return undefined;
  if (moment.isMoment(fieldValue)) {
    return fieldValue.isValid() ? fieldValue : undefined;
  }
  // 处理时间戳（数字）
  if (typeof fieldValue === 'number') {
    const momentValue = moment(fieldValue);
    return momentValue.isValid() ? momentValue : undefined;
  }
  // 处理字符串
  if (typeof fieldValue === 'string' && fieldValue.trim()) {
    const momentValue = moment(fieldValue);
    return momentValue.isValid() ? momentValue : undefined;
  }
  return undefined;
};

/**
 * 将 moment 对象转换为字符串（用于提交）
 */
export const convertMomentToString = (value: any): string | undefined => {
  if (moment.isMoment(value)) {
    return value.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : undefined;
  }
  return value;
};

/**
 * 将 moment 对象转换为时间戳（毫秒）（用于提交）
 */
export const convertMomentToTimestamp = (value: any): number | undefined => {
  if (moment.isMoment(value)) {
    return value.isValid() ? value.valueOf() : undefined;
  }
  if (typeof value === 'string' && value.trim()) {
    const momentValue = moment(value);
    return momentValue.isValid() ? momentValue.valueOf() : undefined;
  }
  return value;
};

/**
 * 格式化字段值用于显示
 * 参考 bf-main-3 的实现，支持多种数据格式
 */
export const formatFieldValueForDisplay = (field: FieldDTO, value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  // 日期字段：支持 moment 对象、时间戳（数字）、字符串格式
  if (field.fieldType === FIELD_TYPE_DATE && value) {
    if (moment.isMoment(value)) {
      return value.format('YYYY-MM-DD HH:mm:ss');
    }
    if (typeof value === 'number') {
      // 处理时间戳（毫秒或秒）
      const momentValue = moment(value);
      return momentValue.isValid() ? momentValue.format('YYYY-MM-DD HH:mm:ss') : String(value);
    }
    if (typeof value === 'string') {
      // 尝试解析字符串，如果失败则直接返回
      const momentValue = moment(value);
      return momentValue.isValid() ? momentValue.format('YYYY-MM-DD HH:mm:ss') : value;
    }
  }
  
  // 布尔值
  if (field.fieldType === 6) {
    return value ? '是' : '否';
  }
  
  // 图片字段：在详情页由 FieldDisplay 组件单独处理，这里只做兜底处理
  if (field.fieldType === FieldType.picture) {
    if (Array.isArray(value) && value.length > 0) {
      // 尝试获取文件名
      const names = value.map((img: any) => {
        return img.mainProperty || img.name || '图片';
      });
      return names.join('、');
    }
    return '-';
  }
  
  // 附件字段：显示文件名
  if (field.fieldType === FieldType.appendix) {
    if (Array.isArray(value) && value.length > 0) {
      try {
        return value.map((v: any) => decodeURIComponent(v?.mainProperty || v?.name || '')).join('、');
      } catch (e) {
        return value.map((v: any) => v?.mainProperty || v?.name || '').join('、');
      }
    }
    return '-';
  }
  
  // 处理对象值（引用字段 fieldType = 10 或 11, 或字段值为对象的情况）
  if (value && typeof value === 'object' && !Array.isArray(value) && !moment.isMoment(value)) {
    if (value.$primaryValue) return value.$primaryValue;
    if (value.$title) return value.$title;
    if (value.mainProperty) return value.mainProperty;
    if (value.label) return value.label;
    if (value.name) return value.name;
    if (value.id) return String(value.id);
  }
  
  // 处理数组
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item) => {
      if (item && typeof item === 'object') {
        return item.$primaryValue || item.$title || item.mainProperty || item.label || item.name || String(item.id || item);
      }
      return String(item);
    }).join(', ');
  }
  
  return String(value);
};

/**
 * 克隆 moment 对象（用于复制模式）
 */
export const cloneMomentObjects = (obj: any): any => {
  const cloned: any = {};
  Object.keys(obj).forEach((key) => {
    if (moment.isMoment(obj[key])) {
      cloned[key] = obj[key].clone();
    } else {
      cloned[key] = obj[key];
    }
  });
  return cloned;
};

