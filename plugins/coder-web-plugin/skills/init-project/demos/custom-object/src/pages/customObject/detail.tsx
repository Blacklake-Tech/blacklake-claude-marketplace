/**
 * @description 自定义对象详情页（只读）
 * 包含所有逻辑，不依赖 hooks 和 components
 */
import React, { useState, useEffect } from 'react';
import { Form, message, Table, Pagination, Empty, Tabs, Badge, Spin, Row, Col, Image, Space } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import moment from 'moment';
import _ from 'lodash';
import type { FormInstance } from 'antd';
import type { FieldDTO, SubObjectDTO } from '../../types/customObject';
import { customObjectPagePath } from './constants';
import { mockFields, mockSubObjects, DEFAULT_OBJECT_CODE } from '../../Metadata';
import { customObjectApi } from '../../api/customObject';
import { formatFieldValueForDisplay, convertFieldValueToMoment, FIELD_TYPE_DATE } from './utils';
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

// ==================== 工具函数 ====================
const getRelationDisplayValue = (field: FieldDTO, value: any): string => {
  if (!value || moment.isMoment(value)) return formatFieldValueForDisplay(field, value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
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
  return formatFieldValueForDisplay(field, value);
};

// ==================== 字段显示组件 ====================
const FieldDisplay: React.FC<{ field: FieldDTO; form: FormInstance; originalLabel: string }> = ({ field, form, originalLabel }) => {
  const fieldValue = Form.useWatch(field.fieldCode, form);
  const fieldType = Number(field.fieldType);
  const isRequired = field.isRequired;
  
  // 渲染标签（必填字段的*为红色）
  const renderLabel = () => {
    if (isRequired && originalLabel.startsWith('*')) {
      return (
        <span style={{ color: 'rgba(0, 0, 0, 0.45)', marginRight: '8px' }}>
          <span style={{ color: '#ff4d4f' }}>*</span>
          {originalLabel.substring(1)}:
        </span>
      );
    }
    return <span style={{ color: 'rgba(0, 0, 0, 0.45)', marginRight: '8px' }}>{originalLabel}:</span>;
  };
  
  // 附件字段：显示为可点击的附件列表（参考 bf-main-3 实现）
  if (fieldType === 14) {
    let attachmentList: any[] = [];
    if (Array.isArray(fieldValue)) {
      attachmentList = fieldValue;
    } else if (fieldValue) {
      attachmentList = [fieldValue];
    }
    
    // 标准化附件数据格式
    const normalizedAttachments = attachmentList.map((att: any) => {
      // 支持 bf-main-3 格式：{ id, url, mainProperty }
      // 支持 aicoder 格式：{ uid, name, url }
      return {
        id: att.id || att.uid,
        url: att.url || att.fileUri,
        name: att.mainProperty || att.name || '附件',
      };
    }).filter((att) => att.id || att.url); // 过滤掉没有 id 或 url 的项
    
    return (
      <div style={{ minHeight: '32px', display: 'flex', flexDirection: 'column', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', lineHeight: '22px' }}>
        {renderLabel()}
        {normalizedAttachments.length > 0 ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {normalizedAttachments.map((att: any, index: number) => (
              <a
                key={att.id || index}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'rgb(2, 185, 128)', display: 'block' }}
                download={att.name}
              >
                {att.name}
              </a>
            ))}
          </Space>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 链接字段：显示为可点击的链接
  if (fieldType === 9) {
    const url = fieldValue || '';
    return (
      <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', lineHeight: '22px' }}>
        {renderLabel()}
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(2, 185, 128)' }}>
            {url}
          </a>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 图片字段：显示为可预览的图片（参考 bf-main-3 实现）
  if (fieldType === 16) {
    // 处理图片字段值，支持多种数据格式
    let imageList: any[] = [];
    if (Array.isArray(fieldValue)) {
      imageList = fieldValue;
    } else if (fieldValue) {
      imageList = [fieldValue];
    }
    
    // 标准化图片数据格式，兼容不同的数据结构
    const normalizedImages = imageList.map((img: any) => {
      // 支持 bf-main-3 格式：{ id, url, mainProperty }
      // 支持 aicoder 格式：{ uid, name, url, thumbUrl }
      return {
        id: img.id || img.uid,
        url: img.url || img.thumbUrl,
        name: img.mainProperty || img.name || `图片`,
      };
    }).filter((img) => img.url); // 过滤掉没有 url 的项
    
    return (
      <div style={{ minHeight: '32px', display: 'flex', flexDirection: 'column', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', lineHeight: '22px' }}>
        {renderLabel()}
        {normalizedImages.length > 0 ? (
          <Image.PreviewGroup>
            <Space style={{ flexWrap: 'wrap' }}>
              {normalizedImages.map((img: any, index: number) => (
                <Image
                  key={img.id || index}
                  width={100}
                  height={100}
                  src={img.url}
                  alt={img.name || `图片${index + 1}`}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 其他字段：使用默认显示
  const displayValue = fieldType === 11 
    ? getRelationDisplayValue(field, fieldValue)
    : formatFieldValueForDisplay(field, fieldValue);
  
  return (
    <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px', lineHeight: '22px' }}>
      {renderLabel()}
      <span>{displayValue}</span>
    </div>
  );
};

const SubObjectFieldDisplay: React.FC<{ field: FieldDTO; fieldNamePath: (string | number)[]; form: FormInstance }> = ({ field, fieldNamePath, form }) => {
  const fieldValue = Form.useWatch(fieldNamePath, form);
  const fieldType = Number(field.fieldType);
  
  // 附件字段：显示为可点击的附件列表
  if (fieldType === 14) {
    let attachmentList: any[] = [];
    if (Array.isArray(fieldValue)) {
      attachmentList = fieldValue;
    } else if (fieldValue) {
      attachmentList = [fieldValue];
    }
    
    // 标准化附件数据格式
    const normalizedAttachments = attachmentList.map((att: any) => {
      return {
        id: att.id || att.uid,
        url: att.url || att.fileUri,
        name: att.mainProperty || att.name || '附件',
      };
    }).filter((att) => att.id || att.url);
    
    return (
      <div style={{ minHeight: '32px', display: 'flex', flexDirection: 'column' }}>
        {normalizedAttachments.length > 0 ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {normalizedAttachments.map((att: any, index: number) => (
              <a
                key={att.id || index}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'rgb(2, 185, 128)', display: 'block' }}
                download={att.name}
              >
                {att.name}
              </a>
            ))}
          </Space>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 链接字段：显示为可点击的链接
  if (fieldType === 9) {
    const url = fieldValue || '';
    return (
      <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center' }}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(2, 185, 128)' }}>
            {url}
          </a>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 图片字段：显示为可预览的图片（参考 bf-main-3 实现）
  if (fieldType === 16) {
    // 处理图片字段值，支持多种数据格式
    let imageList: any[] = [];
    if (Array.isArray(fieldValue)) {
      imageList = fieldValue;
    } else if (fieldValue) {
      imageList = [fieldValue];
    }
    
    // 标准化图片数据格式，兼容不同的数据结构
    const normalizedImages = imageList.map((img: any) => {
      // 支持 bf-main-3 格式：{ id, url, mainProperty }
      // 支持 aicoder 格式：{ uid, name, url, thumbUrl }
      return {
        id: img.id || img.uid,
        url: img.url || img.thumbUrl,
        name: img.mainProperty || img.name || `图片`,
      };
    }).filter((img) => img.url); // 过滤掉没有 url 的项
    
    return (
      <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center' }}>
        {normalizedImages.length > 0 ? (
          <Image.PreviewGroup>
            <Space style={{ flexWrap: 'wrap' }}>
              {normalizedImages.map((img: any, index: number) => (
                <Image
                  key={img.id || index}
                  width={60}
                  height={60}
                  src={img.url}
                  alt={img.name || `图片${index + 1}`}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }
  
  // 其他字段：使用默认显示
  const displayValue = fieldType === 11 
    ? getRelationDisplayValue(field, fieldValue)
    : formatFieldValueForDisplay(field, fieldValue);
  
  return <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center' }}>{displayValue}</div>;
};

// ==================== 从对象表格组件 ====================
const SubObjectTable: React.FC<{ form: FormInstance; subObject: SubObjectDTO; namePath: (string | number)[]; mainInstanceId: number }> = ({ form, subObject, namePath, mainInstanceId }) => {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const formValue = Form.useWatch(namePath, form);
  const tableData = Array.isArray(formValue) ? formValue : [];

  useEffect(() => {
    if (!mainInstanceId) return;
    setLoading(true);
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
          const formData: any = { $instanceId: item.instanceId };
          // 将 fields 数组转换为扁平化对象
          if (item.fields && Array.isArray(item.fields)) {
            item.fields.forEach((field: any) => {
              if (field.fieldCode && field.fieldValue !== undefined) {
                // 日期类型需要转换为 moment
                if (field.fieldType === 8 && field.fieldValue) {
                  formData[field.fieldCode] = moment(field.fieldValue);
                } else {
                  formData[field.fieldCode] = field.fieldValue;
                }
              }
            });
          }
          return formData;
        });
        form.setFieldsValue({ [namePath.join('.')]: instances });
        if (instances.length > 0) {
          setPage(Math.ceil(instances.length / PAGE_SIZE));
        }
      })
      .catch((error) => {
        console.error('获取从对象数据失败:', error);
        message.error('加载从对象数据失败');
        form.setFieldsValue({ [namePath.join('.')]: [] });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mainInstanceId, subObject.objectCode]);

  const fieldListToUse = subObject.fieldList || [];
  const SYSTEM_FIELD_CODES = ['creator', 'createdAt', 'operator', 'updatedAt'];
  const SYSTEM_FIELD_NAMES = ['创建人', '创建时间', '更新人', '更新时间'];

  const columns = fieldListToUse
    .filter((field) => !field.isRefer && !SYSTEM_FIELD_CODES.includes(field.fieldCode) && !SYSTEM_FIELD_NAMES.includes(field.fieldName))
    .map((field) => ({
      title: field.isRequired ? (
        <span>
          <span style={{ color: '#ff4d4f' }}>*</span> {field.fieldName}
        </span>
      ) : field.fieldName,
      dataIndex: field.fieldCode,
      width: 200,
      render: (_: any, record: any, index: number) => {
        const realIndex = (page - 1) * PAGE_SIZE + index;
        return (
          <SubObjectFieldDisplay
            field={field}
            fieldNamePath={[...namePath, realIndex, field.fieldCode]}
            form={form}
          />
        );
      },
    }));

  const paginatedData = tableData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <Form.Item name={namePath} initialValue={tableData.length > 0 ? tableData : []}>
        <Table
          columns={columns}
          dataSource={paginatedData.length > 0 ? paginatedData : []}
          rowKey={(record, index) => {
            const realIndex = (page - 1) * PAGE_SIZE + (index ?? 0);
            return record?.$instanceId ? `saved-${record.$instanceId}` : `new-${realIndex}`;
          }}
          pagination={false}
          scroll={{ y: 400, x: 'max-content' }}
          loading={loading}
          locale={{
            emptyText: (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: '4px', padding: '40px 20px', backgroundColor: '#fafafa' }}>
                <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ),
          }}
          bordered={false}
        />
      </Form.Item>
      {tableData.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={tableData.length}
            showTotal={(total) => `共${total}条`}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

// ==================== 从对象标签页组件 ====================
const SubObjectTabs: React.FC<{ form: FormInstance; subObjectList: SubObjectDTO[]; mainInstanceId: number }> = ({ form, subObjectList, mainInstanceId }) => {
  const [activeKey, setActiveKey] = useState(subObjectList.length > 0 ? `0_${subObjectList[0].objectCode}` : undefined);
  if (!subObjectList?.length) return null;

  return (
    <Tabs activeKey={activeKey} onChange={setActiveKey} type="card">
      {subObjectList.map((subObject, index) => (
        <Tabs.TabPane tab={<Badge dot={false} offset={[0, 5]}>{subObject.objectName}</Badge>} key={`${index}_${subObject.objectCode}`}>
          <SubObjectTable form={form} subObject={subObject} namePath={['sonObjects', index, 'instances']} mainInstanceId={mainInstanceId} />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

// ==================== 主组件 ====================
export default () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const params = useParams<{ id: string }>();
  const [objectCode] = useState<string>(DEFAULT_OBJECT_CODE);
  const [objectName] = useState<string>(DEFAULT_OBJECT_NAME);
  const [dataLoading, setDataLoading] = useState(true);
  const [metadataReady, setMetadataReady] = useState(false);
  const [fields, setFields] = useState<FieldDTO[]>(mockFields);
  const [subObjects, setSubObjects] = useState<SubObjectDTO[]>(mockSubObjects);
  const instanceId = params.id ? Number(params.id) : undefined;

  // 初始化字段和从对象
  useEffect(() => {
    setFields([...mockFields]);
    setSubObjects([...mockSubObjects]);
    setMetadataReady(true);
  }, []);

  // 加载数据
  useEffect(() => {
    if (!instanceId) {
      setDataLoading(false);
      return;
    }
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
              ...sonObj.fields.reduce((acc: any, field: any) => {
                if (field.fieldCode && field.fieldValue !== undefined) {
                  // 日期类型需要转换为 moment（支持时间戳、字符串等格式）
                  if (field.fieldType === 8 && field.fieldValue) {
                    acc[field.fieldCode] = convertFieldValueToMoment(field.fieldValue);
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

  // 构建表单配置（只读）
  const createFieldItem = (field: FieldDTO) => {
    const originalLabel = field.isRequired ? `*${field.fieldName}` : field.fieldName;
    return {
      label: '',
      name: field.fieldCode,
      render: () => <FieldDisplay field={field} form={form} originalLabel={originalLabel} />,
    };
  };

  const SYSTEM_FIELD_CODES = ['creator', 'createdAt', 'operator', 'updatedAt'];
  const SYSTEM_FIELD_NAMES = ['创建人', '创建时间', '更新人', '更新时间'];

  const onCancel = () => history.goBack();

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

  const baseInfo = {
    title: '基本信息',
    column: overallColumnNum, // 使用响应式列数
    items: fields.filter((field) => 
      !field.isRefer && 
      !SYSTEM_FIELD_CODES.includes(field.fieldCode) && 
      !SYSTEM_FIELD_NAMES.includes(field.fieldName)
    ).map((field) => createFieldItem(field)),
  };

  const subObjectInfo = subObjects.length && instanceId
    ? {
        title: '从对象信息',
        items: [
          {
            isFullLine: true,
            render: () => (
              <SubObjectTabs
                form={form}
                subObjectList={subObjects}
                mainInstanceId={instanceId}
              />
            ),
          },
        ],
      }
    : undefined;

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

  const info = _.compact([baseInfo, subObjectInfo]);

  return (
    <div className="bl-dataFormLayout" style={{ height: '100%' }}>
      <Spin spinning={dataLoading}>
        <div className="data-layout-context">
          {`${objectName}详情` && (
            <div className="data-layout-title">
              <Row justify={'space-between'}>
                <Col span={14}>
                  <h2 className="bl-layout-title-text">{`${objectName}详情`}</h2>
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
                  disabled={true}
                >
                  {info.map(renderInfoBlock)}
                </Form>
              </Row>
            </div>
          ) : null}
        </div>
      </Spin>
    </div>
  );
};
