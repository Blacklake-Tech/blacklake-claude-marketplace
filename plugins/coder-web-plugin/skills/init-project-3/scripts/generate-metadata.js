#!/usr/bin/env node

/**
 * 生成 Metadata.ts 文件
 * 根据对象元数据 JSON 生成 TypeScript 代码
 */

const fs = require('fs');
const path = require('path');

// 参数解析
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  params[key] = args[i + 1];
}

const {
  'metadata-json': metadataFile,
  'object-code': objectCode,
  output,
  template = 'custom-object'
} = params;

// 验证参数
if (!metadataFile) {
  console.error('错误: 缺少 --metadata-json 参数');
  process.exit(1);
}

if (!objectCode) {
  console.error('错误: 缺少 --object-code 参数');
  process.exit(1);
}

if (!output) {
  console.error('错误: 缺少 --output 参数');
  process.exit(1);
}

// 读取元数据
let metadata;
try {
  const content = fs.readFileSync(metadataFile, 'utf-8');
  metadata = JSON.parse(content);
} catch (err) {
  console.error(`错误: 无法读取元数据文件: ${err.message}`);
  process.exit(1);
}

/**
 * normalizeField 函数代码（从模板复制）
 */
const normalizeFieldCode = `const normalizeField = (field: any): FieldDTO => {
  return {
    ...field,
    isRequired: field.isRequired === 1 ? true : field.isRequired === 0 ? false : field.isRequired,
    isUnique: field.isUnique === 1 ? true : field.isUnique === 0 ? false : field.isUnique,
    isUsed: field.isUsed === 1 ? true : field.isUsed === 0 ? false : field.isUsed,
    isName: field.isName === 1 ? true : field.isName === 0 ? false : field.isName,
    isRefer: field.isRefer === 1 ? true : field.isRefer === 0 ? false : field.isRefer,
    targetType: field.targetType === null ? undefined : field.targetType,
    reference: field.reference === null ? undefined : field.reference,
    referCode: field.referCode === null ? undefined : field.referCode,
    referName: field.referName === null ? undefined : field.referName,
    referType: field.referType === null ? undefined : field.referType,
    referenceChain: field.referenceChain === null ? undefined : field.referenceChain,
  };
};`;

/**
 * 简化 choiceValues
 * 只保留 choiceCode 和 choiceValue
 */
function simplifyChoiceValues(choiceValues) {
  if (!choiceValues || !Array.isArray(choiceValues)) {
    return choiceValues;
  }
  return choiceValues.map(choice => ({
    choiceCode: choice.choiceCode,
    choiceValue: choice.choiceValue
  }));
}

/**
 * 处理字段数据
 * 保持原始格式,只简化 choiceValues
 */
function processField(field) {
  const processed = { ...field };
  if (processed.choiceValues) {
    processed.choiceValues = simplifyChoiceValues(processed.choiceValues);
  }
  return processed;
}

/**
 * 生成 mockFields 数组
 */
function generateMockFields(fields) {
  const processedFields = fields.map(processField);
  return JSON.stringify(processedFields, null, 2);
}

/**
 * 转换 0/1 为 boolean
 */
function toBool(value) {
  return value === 1 ? true : value === 0 ? false : value;
}

/**
 * 生成 mockSubObjects 数组
 */
function generateMockSubObjects(sonObjects) {
  if (!sonObjects || sonObjects.length === 0) {
    return '[]';
  }

  const subObjects = sonObjects.map(obj => {
    const subObj = {
      objectCode: obj.objectCode,
      objectName: obj.objectName,
      referName: obj.referName,
      referCode: obj.referCode,
      childNecessary: toBool(obj.childNecessary),
      fieldList: []
    };

    if (obj.fieldList && Array.isArray(obj.fieldList)) {
      subObj.fieldList = obj.fieldList.map(field => {
        const subField = {
          id: field.id,
          fieldCode: field.fieldCode,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isRequired: toBool(field.isRequired),
          isName: toBool(field.isName),
          isRefer: toBool(field.isRefer)
        };

        // 可选字段
        if (field.fieldRemind !== undefined) {
          subField.fieldRemind = field.fieldRemind;
        }
        if (field.choiceValues) {
          subField.choiceValues = simplifyChoiceValues(field.choiceValues);
        }
        if (field.datetimeFormat !== undefined) {
          subField.datetimeFormat = field.datetimeFormat;
        }

        return subField;
      });
    }

    return subObj;
  });

  return JSON.stringify(subObjects, null, 2);
}

/**
 * 生成自定义对象的 Metadata.ts
 */
function generateCustomObjectMetadata(metadata, objectCode) {
  const fields = metadata.fields || [];
  const sonObjects = metadata.sonObjects || [];

  if (fields.length === 0) {
    console.error('错误: 字段数组为空');
    process.exit(1);
  }

  const mockFieldsCode = `export let mockFields: FieldDTO[] = ${generateMockFields(fields)}.map(normalizeField);`;
  const mockSubObjectsCode = `export let mockSubObjects: SubObjectDTO[] = ${generateMockSubObjects(sonObjects)};`;

  return `/**
 * 自定义对象 Mock 数据
 * 此文件由 init-project-3 自动生成
 */
import type { FieldDTO, SubObjectDTO } from './types/customObject';

export const DEFAULT_OBJECT_CODE = '${objectCode}';

${normalizeFieldCode}

${mockFieldsCode}

${mockSubObjectsCode}
`;
}

/**
 * 根据模板类型生成 Metadata.ts
 */
function generateMetadata(template, metadata, objectCode) {
  switch (template) {
    case 'custom-object':
      return generateCustomObjectMetadata(metadata, objectCode);
    // 未来扩展: work-order, material, warehouse
    default:
      throw new Error(`未知模板类型: ${template}`);
  }
}

// 主逻辑
try {
  const content = generateMetadata(template, metadata, objectCode);

  // 确保输出目录存在
  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(output, content, 'utf-8');
  console.log(`✅ Metadata.ts 已生成: ${output}`);
  console.log(`   对象 code: ${objectCode}`);
  console.log(`   字段数量: ${metadata.fields?.length || 0}`);
  console.log(`   从对象数量: ${metadata.sonObjects?.length || 0}`);
} catch (err) {
  console.error(`错误: ${err.message}`);
  process.exit(1);
}
