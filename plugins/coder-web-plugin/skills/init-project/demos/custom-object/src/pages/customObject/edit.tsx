/**
 * @description 自定义对象编辑页
 */
import React, { useState, useEffect, useRef } from 'react';
import { Form, message, Input, InputNumber, DatePicker, Select, Table, Pagination, Empty, Tabs, Badge, Spin, Row, Col, Button, Space, Upload } from 'antd';
import { CloseCircleFilled, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import moment from 'moment';
import _ from 'lodash';
import type { FormInstance } from 'antd';
import type { FieldDTO, SubObjectDTO } from '../../types/customObject';
import { customObjectApi } from '../../api/customObject';
import { customObjectPagePath } from './constants';
import { mockFields, mockSubObjects, DEFAULT_OBJECT_CODE } from '../../Metadata';
import { convertMomentToString, convertMomentToTimestamp, convertFieldValueToMoment, FIELD_TYPE_DATE } from './utils';
import '../../components/styles/DataFormLayout.less';
import '../../components/styles/DetailLayoutContent.less';

const DEFAULT_OBJECT_NAME = '测试对象';
const PAGE_SIZE = 10;

// DataFormLayout 相关常量
const LABEL_WIDTH = 120;
const INPUT_AREA_WIDTH = 440;
const BLOCK_PADDING = 24;
const FORM_LAYOUT_MIN_WIDTH = LABEL_WIDTH + INPUT_AREA_WIDTH + BLOCK_PADDING * 2;
const FORM_LAYOUT_OUTER_PADDING = 24;

// 工具函数
const getRelationDisplayValue = (value: any): string => {
  if (!value || moment.isMoment(value)) return '';
  if (Array.isArray(value) && value.length > 0) {
    const item = value[0];
    if (typeof item === 'object' && item) {
      const fields = item.showFields?.slice(1);
      const main = item.mainProperty || item.label || item.name || '';
      return fields?.length ? `${main} | ${fields.join(' | ')}` : main;
    }
    return String(item);
  }
  if (typeof value === 'object') {
    const fields = value.showFields?.slice(1);
    const main = value.mainProperty || value.label || value.name || '';
    return fields?.length ? `${main} | ${fields.join(' | ')}` : main;
  }
  return String(value || '');
};

const convertRelationFieldValue = (value: any): any => {
  if (!value) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) return value.id || value.value || value;
  if (Array.isArray(value) && value.length > 0) return value.map((item) => (typeof item === 'object' ? item.id || item.value || item : item));
  return value;
};

// URL 验证函数
const validateUrl = (_: any, value: string) => {
  if (!value) return Promise.resolve();
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (urlPattern.test(value)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('请输入有效的URL地址'));
};

// 字段输入组件
const FieldInput: React.FC<{ field: FieldDTO; disabled?: boolean; value?: any; onChange?: (value: any) => void }> = ({ field, disabled, value, onChange }) => {
  const props = { placeholder: `请输入${field.fieldName}`, disabled, allowClear: true };
  
  // 处理文件上传的 onChange
  const handleFileChange = (fileList: UploadFile[]) => {
    const fileIds = fileList
      .filter(file => file.status === 'done' && file.response?.id)
      .map(file => file.response.id);
    onChange?.(fileIds.length > 0 ? fileIds : fileList);
  };

  switch (field.fieldType) {
    case 1: return <Input {...props} value={value} onChange={(e) => onChange?.(e.target.value)} />;
    case 2: return <InputNumber {...props} style={{ width: '100%' }} step={0.01} value={value} onChange={onChange} />;
    case 7: return <InputNumber {...props} style={{ width: '100%' }} precision={0} step={1} value={value} onChange={onChange} />;
    case 3: return <Input.TextArea {...props} rows={4} value={value} onChange={(e) => onChange?.(e.target.value)} />;
    case 4: return <Select {...props} placeholder={`请选择${field.fieldName}`} value={value} onChange={onChange} options={field.choiceValues?.map((cv: any) => ({ label: cv.choiceValue, value: cv.choiceCode })) || []} />;
    case 5: {
      // 处理多选字段的值，过滤掉空值（null、undefined、空字符串）
      let multiValue = value;
      if (Array.isArray(value)) {
        multiValue = value.filter((v: any) => v !== null && v !== undefined && v !== '');
      } else if (value !== null && value !== undefined && value !== '') {
        // 如果不是数组，转换为数组
        multiValue = [value];
      } else {
        multiValue = [];
      }
      return <Select {...props} mode="multiple" placeholder={`请选择${field.fieldName}`} value={multiValue} onChange={onChange} options={field.choiceValues?.map((cv: any) => ({ label: cv.choiceValue, value: cv.choiceCode })) || []} />;
    }
    case 6: return <Select {...props} placeholder={`请选择${field.fieldName}`} value={value} onChange={onChange} options={[{ label: '是', value: true }, { label: '否', value: false }]} />;
    case 8: return <DatePicker {...props} placeholder={`请选择${field.fieldName}`} style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm:ss" value={value} onChange={onChange} />;
    case 9: // 链接
      return (
        <Input
          {...props}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="请输入URL地址，例如：https://example.com"
        />
      );
    case 14: // 附件
      return (
        <Upload
          disabled={disabled}
          fileList={Array.isArray(value) ? value : []}
          onChange={({ fileList }) => handleFileChange(fileList)}
          beforeUpload={() => false}
          multiple
        >
          <Button icon={<UploadOutlined />} disabled={disabled}>
            上传附件
          </Button>
        </Upload>
      );
    case 16: // 图片
      return (
        <Upload
          disabled={disabled}
          fileList={Array.isArray(value) ? value : []}
          onChange={({ fileList }) => handleFileChange(fileList)}
          beforeUpload={(file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error('只能上传图片文件！');
            }
            return false;
          }}
          listType="picture-card"
          accept="image/*"
        >
          {(Array.isArray(value) ? value : []).length < 9 && (
            <div>
              <PictureOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          )}
        </Upload>
      );
    default: return <Input {...props} value={value} onChange={(e) => onChange?.(e.target.value)} />;
  }
};

// 从对象字段输入组件
const SubObjectFieldInput: React.FC<{ field: FieldDTO; fieldNamePath: (string | number)[]; form: FormInstance; isReadOnly: boolean; onFieldChange?: () => void }> = ({ field, fieldNamePath, form, isReadOnly, onFieldChange }) => {
  const fieldType = Number(field.fieldType);
  const commonProps = { 
    name: fieldNamePath, 
    rules: field.isRequired ? [{ required: true, message: `${field.fieldName}必填` }] : [], 
    style: { margin: 0 } 
  };
  const options = field.choiceValues?.map((cv: any) => ({ label: cv.choiceValue, value: cv.choiceCode })) || [];
  const placeholder = fieldType === 4 || fieldType === 5 ? `请选择${field.fieldName}` : `请输入${field.fieldName}`;
  
  if (fieldType === 1) {
    return <Form.Item {...commonProps}><Input placeholder={placeholder} disabled={isReadOnly} onChange={onFieldChange} /></Form.Item>;
  }
  if (fieldType === 2) {
    return <Form.Item {...commonProps}><InputNumber placeholder={placeholder} disabled={isReadOnly} style={{ width: '100%' }} step={0.01} onChange={onFieldChange} /></Form.Item>;
  }
  if (fieldType === 7) {
    return <Form.Item {...commonProps}><InputNumber placeholder={placeholder} disabled={isReadOnly} style={{ width: '100%' }} precision={0} step={1} onChange={onFieldChange} /></Form.Item>;
  }
  if (fieldType === 3) {
    return <Form.Item {...commonProps}><Input.TextArea placeholder={placeholder} disabled={isReadOnly} rows={2} onChange={onFieldChange} /></Form.Item>;
  }
  if (fieldType === 4) {
    return <Form.Item {...commonProps}><Select placeholder={placeholder} disabled={isReadOnly} onChange={onFieldChange} options={options} /></Form.Item>;
  }
  if (fieldType === 5) {
    return <Form.Item {...commonProps}><Select mode="multiple" placeholder={placeholder} disabled={isReadOnly} onChange={onFieldChange} options={options} /></Form.Item>;
  }
  if (fieldType === 8) {
    return <Form.Item {...commonProps} getValueProps={(v) => ({ value: v ? moment(v) : undefined })} normalize={convertMomentToString}><DatePicker placeholder={placeholder} disabled={isReadOnly} showTime style={{ width: '100%' }} onChange={onFieldChange} /></Form.Item>;
  }
  if (fieldType === 9) {
    // 链接类型，添加 URL 验证
    const urlRules = field.isRequired 
      ? [{ required: true, message: `${field.fieldName}必填` }, { validator: validateUrl }]
      : [{ validator: validateUrl }];
    return (
      <Form.Item {...commonProps} rules={urlRules}>
        <Input placeholder="请输入URL地址，例如：https://example.com" disabled={isReadOnly} onChange={onFieldChange} />
      </Form.Item>
    );
  }
  if (fieldType === 14) {
    // 附件类型
    return (
      <Form.Item {...commonProps}>
        <Upload
          disabled={isReadOnly}
          fileList={form.getFieldValue(fieldNamePath) || []}
          onChange={({ fileList }) => {
            form.setFieldValue(fieldNamePath, fileList);
            onFieldChange?.();
          }}
          beforeUpload={() => false}
          multiple
        >
          <Button icon={<UploadOutlined />} disabled={isReadOnly} size="small">
            上传附件
          </Button>
        </Upload>
      </Form.Item>
    );
  }
  if (fieldType === 16) {
    // 图片类型
    return (
      <Form.Item {...commonProps}>
        <Upload
          disabled={isReadOnly}
          fileList={form.getFieldValue(fieldNamePath) || []}
          onChange={({ fileList }) => {
            form.setFieldValue(fieldNamePath, fileList);
            onFieldChange?.();
          }}
          beforeUpload={(file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error('只能上传图片文件！');
            }
            return false;
          }}
          listType="picture-card"
          accept="image/*"
        >
          {(form.getFieldValue(fieldNamePath) || []).length < 9 && (
            <div>
              <PictureOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          )}
        </Upload>
      </Form.Item>
    );
  }
  return <Form.Item {...commonProps} getValueProps={(v) => ({ value: getRelationDisplayValue(v) })} normalize={(v) => { const cv = form.getFieldValue(fieldNamePath); if (cv && typeof cv === 'object' && !Array.isArray(cv)) return { ...cv, label: v, name: v }; if (Array.isArray(cv) && cv.length > 0) { const u = [...cv]; if (u[0]) u[0] = { ...u[0], label: v, name: v }; return u; } return v; }}><Input placeholder={placeholder} disabled={isReadOnly} onChange={onFieldChange} /></Form.Item>;
};

// 添加按钮组件
const AddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ marginTop: 16, textAlign: 'center', border: `1px dashed ${hovered ? '#02B980' : '#d9d9d9'}`, borderRadius: '4px', padding: '12px 0', cursor: 'pointer', backgroundColor: hovered ? '#E6FBF4' : '#fff', transition: 'all 0.3s' }} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span style={{ color: '#000', fontSize: '14px' }}>+ 添加</span>
    </div>
  );
};

// 从对象表格组件
const SubObjectTable: React.FC<{ form: FormInstance; subObject: SubObjectDTO; namePath: (string | number)[]; mainInstanceId: number }> = ({ form, subObject, namePath, mainInstanceId }) => {
  const [page, setPage] = useState(1);
  const formValue = Form.useWatch(namePath, form);
  const tableData = Array.isArray(formValue) ? formValue : [];

  useEffect(() => {
    if (!mainInstanceId) return;
    const fv = form.getFieldValue(namePath);
    if (!Array.isArray(fv) || fv.length === 0) {
      customObjectApi.getSubObjectPage({
        mainObjectCode: DEFAULT_OBJECT_CODE,
        mainInstanceId: mainInstanceId,
        sonObjectCode: subObject.objectCode,
        page: 1,
        size: 1000, // 获取所有数据
      })
        .then((response) => {
          // 将 API 返回的数据转换为表单格式
          const instances = (response.list || []).map((item: any) => {
            const formData: any = { $instanceId: item.instanceId, fieldIsTouch: false };
            // 将 fields 数组转换为扁平化对象
            if (item.fields && Array.isArray(item.fields)) {
              item.fields.forEach((field: any) => {
                if (field.fieldCode && field.fieldValue !== undefined) {
                  // 日期类型需要转换为 moment
                  // 日期类型需要转换为 moment（支持时间戳、字符串等格式）
                  if (field.fieldType === 8 && field.fieldValue) {
                    formData[field.fieldCode] = convertFieldValueToMoment(field.fieldValue);
                  } else {
                    formData[field.fieldCode] = field.fieldValue;
                  }
                }
              });
            }
            return formData;
          });
          
          if (instances.length > 0) {
            const formUpdate: any = {};
            const idx = namePath[1] as number;
            const existing = form.getFieldValue('sonObjects') || [];
            formUpdate.sonObjects = [...existing];
            while (formUpdate.sonObjects.length <= idx) formUpdate.sonObjects.push({});
            formUpdate.sonObjects[idx] = { ...formUpdate.sonObjects[idx], instances };
            formUpdate[`sonObjects.${idx}.objectCode`] = subObject.objectCode;
            form.setFieldsValue(formUpdate);
            setPage(1);
          }
        })
        .catch((error) => {
          console.error('获取从对象数据失败:', error);
          message.error('加载从对象数据失败');
        });
    }
  }, [mainInstanceId, subObject.objectCode]);

  const updateFormValue = (instances: any[]) => {
    const formUpdate: any = {};
    const idx = namePath[1] as number;
    const existing = form.getFieldValue('sonObjects') || [];
    formUpdate.sonObjects = [...existing];
    while (formUpdate.sonObjects.length <= idx) formUpdate.sonObjects.push({});
    formUpdate.sonObjects[idx] = { ...formUpdate.sonObjects[idx], instances };
    form.setFieldsValue(formUpdate);
  };

  const getRealIndex = (idx: number) => (page - 1) * PAGE_SIZE + idx;

  const handleAdd = () => {
    const newInstance: any = { fieldIsTouch: true };
    subObject.fieldList.forEach((f) => { if (f.defaultValue !== undefined) newInstance[f.fieldCode] = f.defaultValue; });
    const newValue = [...tableData, newInstance];
    updateFormValue(newValue);
    setPage(Math.ceil(newValue.length / PAGE_SIZE));
  };

  const handleDelete = (idx: number) => {
    const realIdx = getRealIndex(idx);
    if (realIdx < 0 || realIdx >= tableData.length) { message.warning('无法删除该行'); return; }
    const instance = tableData[realIdx];
    const newValue = tableData.filter((_: any, i: number) => i !== realIdx);
    if (instance?.$instanceId) {
      const deletePath = `sonDeleteList.${namePath[1]}.instanceIds`;
      const deleteList = form.getFieldValue(deletePath) || [];
      form.setFieldsValue({ 
        [deletePath]: [...deleteList, instance.$instanceId], 
        [`sonDeleteList.${namePath[1]}.objectCode`]: subObject.objectCode 
      });
    }
    updateFormValue(newValue);
  };

  const handleCopy = (idx: number) => {
    const realIdx = getRealIndex(idx);
    if (realIdx < 0 || realIdx >= tableData.length) { message.warning('无法复制该行'); return; }
    const source = tableData[realIdx];
    const instance: any = { fieldIsTouch: true };
    Object.keys(source).forEach((key) => { 
      if (key !== '$instanceId') instance[key] = moment.isMoment(source[key]) ? source[key].clone() : source[key]; 
    });
    const newValue = [...tableData, instance];
    updateFormValue(newValue);
    setPage(Math.ceil(newValue.length / PAGE_SIZE));
  };

  const markFieldTouched = (record: any, idx: number) => {
    if (record?.$instanceId) {
      const realIdx = getRealIndex(idx);
      const current = [...tableData];
      if (current[realIdx]) { 
        current[realIdx].fieldIsTouch = true; 
        updateFormValue(current);
      }
    }
  };

  const SYSTEM_FIELDS = ['creator', 'createdAt', 'operator', 'updatedAt', '创建人', '创建时间', '更新人', '更新时间'];
  const columns: any[] = [
    { title: '', width: 50, fixed: 'left' as const, render: (_: any, __: any, idx: number) => <CloseCircleFilled style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }} onClick={() => handleDelete(idx)} /> },
    ...(subObject.fieldList || [])
      .filter((f) => !f.isRefer && !SYSTEM_FIELDS.includes(f.fieldCode) && !SYSTEM_FIELDS.includes(f.fieldName))
      .map((f) => ({
        title: f.isRequired ? (
          <span>
            <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
            {f.fieldName}
          </span>
        ) : f.fieldName,
        dataIndex: f.fieldCode,
        width: 200,
        render: (_: any, record: any, index: number) => {
          const realIdx = (page - 1) * PAGE_SIZE + index;
          return <SubObjectFieldInput field={f} fieldNamePath={[...namePath, realIdx, f.fieldCode]} form={form} isReadOnly={false} onFieldChange={() => markFieldTouched(record, index)} />;
        },
      })),
    { title: '操作', width: 80, fixed: 'right' as const, render: (_: any, __: any, idx: number) => <a href="#" onClick={(e) => { e.preventDefault(); handleCopy(idx); }} style={{ color: '#02B980' }}>复制</a> },
  ];

  const paginatedData = tableData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div>
      <Form.Item name={namePath} rules={subObject.childNecessary ? [{ validator: (_: any, v: any[]) => (!v || v.length === 0 ? Promise.reject(new Error(`${subObject.objectName}至少需要一条数据`)) : Promise.resolve()) }] : []} initialValue={tableData.length > 0 ? tableData : []}>
        <Table columns={columns} dataSource={paginatedData.length > 0 ? paginatedData : []} rowKey={(r, i) => (r?.$instanceId ? `saved-${r.$instanceId}` : `new-${(page - 1) * PAGE_SIZE + (i ?? 0)}`)} pagination={false} scroll={{ y: 400, x: 'max-content' }} locale={{ emptyText: <div style={{ border: '1px dashed #d9d9d9', borderRadius: '4px', padding: '40px 20px', backgroundColor: '#fafafa' }}><Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> }} bordered={false} />
      </Form.Item>
      <AddButton onClick={handleAdd} />
      {tableData.length > 0 && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}><Pagination current={page} pageSize={PAGE_SIZE} total={tableData.length} showTotal={(t) => `共${t}条`} onChange={setPage} showSizeChanger={false} /></div>}
    </div>
  );
};

// 从对象标签页组件
const SubObjectTabs: React.FC<{ form: FormInstance; subObjectList: SubObjectDTO[]; mainInstanceId: number }> = ({ form, subObjectList, mainInstanceId }) => {
  const [activeKey, setActiveKey] = useState(subObjectList.length > 0 ? `0_${subObjectList[0].objectCode}` : undefined);
  if (!subObjectList?.length) return null;
  return (
    <Tabs activeKey={activeKey} onChange={setActiveKey} type="card">
      {subObjectList.map((so, idx) => (
        <Tabs.TabPane tab={<Badge dot={false} offset={[0, 5]}>{so.objectName}</Badge>} key={`${idx}_${so.objectCode}`}>
          <SubObjectTable form={form} subObject={so} namePath={['sonObjects', idx, 'instances']} mainInstanceId={mainInstanceId} />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

// 主组件
export default () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [metadataReady, setMetadataReady] = useState(false);
  const [fields, setFields] = useState<FieldDTO[]>(mockFields);
  const [subObjects, setSubObjects] = useState<SubObjectDTO[]>(mockSubObjects);
  const instanceId = params.id ? Number(params.id) : undefined;

  const SYSTEM_FIELDS = ['creator', 'createdAt', 'operator', 'updatedAt', '创建人', '创建时间', '更新人', '更新时间'];

  // 初始化字段和从对象
  useEffect(() => {
    setFields([...mockFields]);
    setSubObjects([...mockSubObjects]);
    setMetadataReady(true);
  }, []);

  useEffect(() => {
    if (!instanceId) { setDataLoading(false); return; }
    setDataLoading(true);
    customObjectApi.getDetail({
      instanceId: String(instanceId),
      objectCode: DEFAULT_OBJECT_CODE,
    })
      .then((detailResponse) => {
        // 将 API 返回的数据转换为表单格式
        const formData: any = {};
        
        // 转换主对象字段
        if (detailResponse.fields && Array.isArray(detailResponse.fields)) {
          detailResponse.fields.forEach((field) => {
            if (field.fieldCode && field.fieldValue !== undefined) {
              // 日期类型需要转换为 moment（支持时间戳、字符串等格式）
              if (field.fieldType === 8 && field.fieldValue) {
                formData[field.fieldCode] = convertFieldValueToMoment(field.fieldValue);
              } else if (field.fieldType === 5) {
                // 多选字段：过滤掉空值
                if (Array.isArray(field.fieldValue)) {
                  formData[field.fieldCode] = field.fieldValue.filter((v: any) => v !== null && v !== undefined && v !== '');
                } else {
                  formData[field.fieldCode] = [];
                }
              } else {
                formData[field.fieldCode] = field.fieldValue;
              }
            }
          });
        }
        
        // 转换从对象数据
        if (detailResponse.sonObjects && Array.isArray(detailResponse.sonObjects)) {
          formData.sonObjects = detailResponse.sonObjects.map((sonObj) => {
            const instances = sonObj.fields ? [{
              $instanceId: sonObj.instanceId,
              fieldIsTouch: false,
              ...sonObj.fields.reduce((acc: any, field: any) => {
                if (field.fieldCode && field.fieldValue !== undefined) {
                  // 日期类型需要转换为 moment（支持时间戳、字符串等格式）
                  if (field.fieldType === 8 && field.fieldValue) {
                    acc[field.fieldCode] = convertFieldValueToMoment(field.fieldValue);
                  } else if (field.fieldType === 5) {
                    // 多选字段：过滤掉空值
                    if (Array.isArray(field.fieldValue)) {
                      acc[field.fieldCode] = field.fieldValue.filter((v: any) => v !== null && v !== undefined && v !== '');
                    } else {
                      acc[field.fieldCode] = [];
                    }
                  } else {
                    acc[field.fieldCode] = field.fieldValue;
                  }
                }
                return acc;
              }, {}),
            }] : [];
            
            return {
              objectCode: sonObj.objectCode,
              instances: instances,
            };
          });
        }
        
        form.setFieldsValue(formData);
      })
      .catch((error) => {
        console.error('加载数据失败:', error);
        message.error('加载数据失败');
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [instanceId, form]);

  const createFieldItem = (field: FieldDTO) => {
    const item: any = {
      label: field.fieldName,
      name: field.fieldCode,
      tooltip: field.fieldRemind,
      required: field.isRequired,
      rules: field.isRequired ? [{ required: true, message: `${field.fieldName}必填` }] : [],
      render: () => <FieldInput field={field} disabled={false} />,
    };
    if (field.fieldType === FIELD_TYPE_DATE) {
      item.getValueProps = (v: any) => ({ value: v ? convertFieldValueToMoment(v) : undefined });
      item.normalize = convertMomentToString;
    }
    if (field.fieldType === 9) {
      // 链接类型，添加 URL 验证
      item.rules = field.isRequired 
        ? [{ required: true, message: `${field.fieldName}必填` }, { validator: validateUrl }]
        : [{ validator: validateUrl }];
    }
    if (field.fieldType === 11) {
      item.getValueProps = (v: any) => ({ value: getRelationDisplayValue(v) });
      item.normalize = (v: any) => {
        const cv = form.getFieldValue(field.fieldCode);
        if (cv && typeof cv === 'object' && !Array.isArray(cv)) return { ...cv, label: v, name: v };
        if (Array.isArray(cv) && cv.length > 0) { const u = [...cv]; if (u[0]) u[0] = { ...u[0], label: v, name: v }; return u; }
        return v;
      };
    }
    return item;
  };

  const processFieldValue = (value: any, fieldType: number) => {
    let fv: any;
    // 日期字段转换为时间戳（毫秒）
    if (fieldType === FIELD_TYPE_DATE) {
      fv = convertMomentToTimestamp(value);
    } else {
      fv = convertMomentToString(value) ?? value;
    }
    if (fieldType === 11) fv = convertRelationFieldValue(fv);
    return fv;
  };

  const handleSubmit = async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      
      // 处理主对象字段
      const fieldsMap: Record<string, any> = {};
      fields.forEach((f) => {
        if (!f.isRefer && values[f.fieldCode] !== undefined) {
          fieldsMap[f.fieldCode] = processFieldValue(values[f.fieldCode], f.fieldType);
        }
      });

      // 处理从对象
      const sonObjects: Array<{ objectCode: string; instanceId?: number; records: Array<{ fields: Record<string, any> }> }> = [];
      values.sonObjects?.forEach((so: any) => {
        if (!so?.instances?.length) return;
        const subObj = subObjects.find((s) => s.objectCode === so.objectCode);
        if (!subObj) return;
        so.instances.forEach((inst: any) => {
          if (inst.$instanceId && !inst.fieldIsTouch) return;
          const ifm: Record<string, any> = {};
          subObj.fieldList?.forEach((f) => {
            if (!f.isRefer && inst[f.fieldCode] !== undefined) {
              ifm[f.fieldCode] = processFieldValue(inst[f.fieldCode], f.fieldType);
            }
          });
          if (Object.keys(ifm).length > 0) {
            sonObjects.push({ 
              objectCode: so.objectCode, 
              ...(inst.$instanceId && { instanceId: inst.$instanceId }), 
              records: [{ fields: ifm }] 
            });
          }
        });
      });

      // 处理删除列表
      const sonDeleteList: Array<{ objectCode?: string; instanceId?: number }> = [];
      if (values.sonDeleteList) {
        Object.values(values.sonDeleteList).forEach((item: any) => {
          item?.instanceIds?.forEach((id: number) => { 
            sonDeleteList.push({ objectCode: item.objectCode, instanceId: id }); 
          });
        });
      }

      const response = await customObjectApi.update({ 
        objectCode: DEFAULT_OBJECT_CODE, 
        instanceId, 
        fields: fieldsMap, 
        ...(sonObjects.length > 0 && { sonObjects }), 
        ...(sonDeleteList.length > 0 && { sonDeleteList }), 
        sync: true 
      });
      
      if (response && (response.code === 200 || response.updateResult === true || (!response.code && !response.message))) {
        message.success(response.message || '更新成功');
        history.push(customObjectPagePath.list);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error?.errorFields ? '请检查表单填写是否正确' : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 响应式列数计算
  const getColumn = () => {
    const windowSize = window.innerWidth;
    if (windowSize >= 1920 || (windowSize <= 1920 && windowSize >= 1440)) return 3;
    if (windowSize >= 1280 && windowSize <= 1440) return 2;
    return 1;
  };

  // 使用 state 来存储列数，以便响应窗口大小变化
  const [overallColumnNum, setOverallColumnNum] = useState(getColumn());
  const overallFormLayout = overallColumnNum === 1 ? 'horizontal' : 'vertical';

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setOverallColumnNum(getColumn());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 渲染单个字段项
  const renderItem = (infoBlock: any, item: any, itemIndex: number) => {
    const { column: blockColumn, align = 'left' } = infoBlock;
    const { render, style, isFullLine, ...formItemProps } = item;
    let colspan: number;

    if (formItemProps.hidden) {
      colspan = 0;
    } else {
      const blockRealColumn = blockColumn === 1 ? blockColumn : overallColumnNum;
      const itemColumn = isFullLine ? 1 : blockRealColumn;
      colspan = 24 / itemColumn;
    }

    let baseWrapperCol: any = {};
    let baseStyle: React.CSSProperties = { justifyContent: align };

    if (!isFullLine) {
      if (overallFormLayout === 'horizontal') {
        baseWrapperCol.flex = `${INPUT_AREA_WIDTH}px`;
      } else {
        baseStyle.width = INPUT_AREA_WIDTH;
      }
    }

    const baseFormItemProps = {
      className: `bl-form-item ${isFullLine ? 'bl-form-item-full-line' : ''}`,
      style: _.assign(baseStyle, style),
      wrapperCol: _.assign(baseWrapperCol, formItemProps.wrapperCol),
    };

    let itemComponents = render ? render(baseFormItemProps) : null;
    if (typeof itemComponents === 'function') {
      itemComponents = itemComponents();
    }

    return (
      <Col span={colspan} key={`formItem_${itemIndex}`}>
        <Form.Item {...formItemProps} {...baseFormItemProps}>
          {itemComponents}
        </Form.Item>
      </Col>
    );
  };

  // 渲染字段项列表
  const renderItems = (infoBlock: any) => {
    const { items = [] } = infoBlock;
    if (items.length === 0) return null;
    return (
      <Row style={{ padding: `${BLOCK_PADDING}px ${BLOCK_PADDING}px 0 ${BLOCK_PADDING}px` }}>
        {items.map((item: any, itemIndex: number) => renderItem(infoBlock, item, itemIndex))}
      </Row>
    );
  };

  // 渲染信息块
  const renderInfoBlock = (infoBlock: any) => {
    const renderTitle = (infoBlock: any) => {
      const { title } = infoBlock;
      if (!title) return null;
      return (
        <div className="bl-descriptionTitle">
          <div className="title-left-part">
            <span className="title-left-border"></span>
            <span className="title-left">{title}</span>
          </div>
        </div>
      );
    };

    return (
      <div key={`${infoBlock.title}_${infoBlock.items?.length}`} style={{ marginTop: 24 }}>
        {renderTitle(infoBlock)}
        {renderItems(infoBlock)}
      </div>
    );
  };

  const info = _.compact([{ 
    title: '基本信息', 
    column: overallColumnNum, // 使用响应式列数
    items: fields.filter((f) => 
      !f.isRefer && 
      !SYSTEM_FIELDS.includes(f.fieldCode) && 
      !SYSTEM_FIELDS.includes(f.fieldName)
    ).map(createFieldItem) 
  }, subObjects.length && instanceId ? { title: '从对象信息', items: [{ isFullLine: true, render: () => <SubObjectTabs form={form} subObjectList={subObjects} mainInstanceId={instanceId} /> }] } : undefined]);

  return (
    <div className="bl-dataFormLayout" style={{ height: '100%' }}>
      <Spin spinning={loading || dataLoading}>
        <div className="data-layout-context">
          {`编辑${DEFAULT_OBJECT_NAME}` && (
            <div className="data-layout-title">
              <Row justify={'space-between'}>
                <Col span={14}>
                  <h2 className="bl-layout-title-text">{`编辑${DEFAULT_OBJECT_NAME}`}</h2>
                </Col>
              </Row>
            </div>
          )}
          {info?.length ? (
            <div style={{ height: '100%', padding: `0px ${FORM_LAYOUT_OUTER_PADDING}px`, overflowY: 'auto' }}>
              <Row wrap={false}>
                <Form
                  form={form}
                  name="dataFormInfo"
                  style={{ width: '100%', minWidth: FORM_LAYOUT_MIN_WIDTH }}
                  labelCol={overallFormLayout === 'horizontal' ? { flex: `${LABEL_WIDTH}px` } : undefined}
                  layout={overallFormLayout}
                >
                  {info.map(renderInfoBlock)}
                </Form>
              </Row>
            </div>
          ) : null}
          <Space align={'center'} size={'large'} style={{ justifyContent: 'center' }} className="data-layout-footer">
            <Button onClick={() => history.goBack()}>取消</Button>
            <Button loading={loading} type={'primary'} onClick={handleSubmit}>确认</Button>
          </Space>
        </div>
      </Spin>
    </div>
  );
};

