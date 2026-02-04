/**
 * @description 自定义对象列表页
 */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { message, Typography, Table, Input, Button, Space, Divider, Popconfirm, DatePicker, Form, Select } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';
import { customObjectApi } from '../../api/customObject';
import { customObjectPagePath } from './constants';
import { mockFields, DEFAULT_OBJECT_CODE } from '../../Metadata';
import type { FieldDTO } from '../../types/customObject';
import '../../components/styles/styles.less';
import { filterListAuth } from '../../components/utils';
import getOperationIcon from '../../components/operationIcon';

const FilterFieldType = {
  text: 1,
  number: 2,
  textArea: 3,
  select: 4,
  multiSelect: 5,
  boolean: 6,
  integer: 7,
  date: 8,
  url: 9,
  reference: 10,
};

const DEFAULT_OBJECT_NAME = '测试对象';

// 合并的工具函数
const formatValue = (value: any, type?: 'time' | 'user'): string => {
  if (type === 'time') {
    if (!value) return '-';
    // 处理毫秒级时间戳（支持数字和字符串）
    let timestamp: number;
    if (typeof value === 'number') {
      timestamp = value;
    } else if (typeof value === 'string') {
      // 如果是字符串，尝试转换为数字
      timestamp = Number(value);
      if (isNaN(timestamp)) {
        // 如果不是数字字符串，尝试直接作为日期字符串解析
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      }
    } else {
      return '-';
    }
    // 验证时间戳是否有效
    if (isNaN(timestamp) || timestamp <= 0) return '-';
    const date = new Date(timestamp);
    // 验证日期是否有效
    if (isNaN(date.getTime())) return '-';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  }
  if (type === 'user') {
    return value?.name || value?.username || (value?.id ? String(value.id) : '-');
  }
  if (!value) return '-';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) {
    return value.map((item: any) => 
      typeof item === 'object' 
        ? (item.mainProperty || item.$primaryValue || item.objectName || item.name || String(item.id || ''))
        : String(item)
    ).filter(Boolean).join(', ') || '-';
  }
  return value.mainProperty || value.$primaryValue || value.objectName || value.name || (value.id ? String(value.id) : '-');
};

export default () => {
  const history = useHistory();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [objectCode] = useState<string>(DEFAULT_OBJECT_CODE);
  const [objectName] = useState<string>(DEFAULT_OBJECT_NAME);
  const [columns, setColumns] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [filterData, setFilterData] = useState<Record<string, any>>({});
  const [quickSearch, setQuickSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [batchLoading, setBatchLoading] = useState('');
  const [fields, setFields] = useState<FieldDTO[]>(mockFields);
  const hasInitColumnsRef = useRef(false);
  const isFirstRef = useRef(true);
  const [filterForm] = Form.useForm();
  const pageTitle = useMemo(() => objectName || objectCode, [objectName, objectCode]);

  // 当 fields 更新时，重新构建列
  useEffect(() => {
    if (fields.length > 0) {
      const nextColumns = buildColumnsFromFields();
      if (nextColumns.length > 0) {
        setColumns(nextColumns);
        hasInitColumnsRef.current = true;
      }
    }
  }, [fields]);

  const buildColumnsFromFields = () => {
    const fieldTypeMap: Record<number, number> = {
      [FilterFieldType.date]: FilterFieldType.date,
      [FilterFieldType.multiSelect]: FilterFieldType.multiSelect,
      [FilterFieldType.select]: FilterFieldType.select,
    };

    // 系统字段代码和名称，需要过滤掉（只保留 fixedColumns 中的系统字段列）
    const SYSTEM_FIELD_CODES = ['creator', 'createdAt', 'operator', 'updatedAt', 'create_time', 'update_time'];
    const SYSTEM_FIELD_NAMES = ['创建人', '创建时间', '更新人', '更新时间'];

    const cols = fields
      .filter((f) => 
        !f.isRefer && 
        !SYSTEM_FIELD_CODES.includes(f.fieldCode) && 
        !SYSTEM_FIELD_NAMES.includes(f.fieldName)
      )
      .map((field) => ({
        title: field.fieldName || field.fieldCode,
        dataIndex: field.fieldCode,
        key: field.fieldCode,
        width: field.fieldType === FilterFieldType.url ? 200 : 150,
        minWidth: 120,
        ellipsis: {
          showTitle: false,
        },
        filterConfig: { type: (field.fieldType && fieldTypeMap[field.fieldType]) || FilterFieldType.text },
        render: (value: any, record: any) => {
          // 日期字段（fieldType === 8）需要格式化时间戳
          const displayValue = field.fieldType === FilterFieldType.date 
            ? formatValue(value, 'time')
            : formatValue(value);
          return field.isName ? (
            <a onClick={() => history.push(customObjectPagePath.detail.replace(':id', String(record.$instanceId)))}>
              {displayValue}
            </a>
          ) : displayValue;
        },
      }));

    const fixedColumns = [
      { title: '创建人', dataIndex: '$creator', key: '$creator', width: 150, minWidth: 120, ellipsis: { showTitle: false }, filterConfig: { type: FilterFieldType.text }, render: (v: any) => formatValue(v, 'user') },
      { 
        title: '创建时间', 
        dataIndex: '$createdAt', 
        key: '$createdAt', 
        width: 180, 
        minWidth: 160,
        ellipsis: { showTitle: false }, 
        filterConfig: { type: FilterFieldType.date }, 
        render: (value: any) => {
          const formatted = formatValue(value, 'time');
          return <span>{formatted}</span>;
        }
      },
      { title: '更新人', dataIndex: '$operator', key: '$operator', width: 150, minWidth: 120, ellipsis: { showTitle: false }, filterConfig: { type: FilterFieldType.text }, render: (v: any) => formatValue(v, 'user') },
      { 
        title: '更新时间', 
        dataIndex: '$updatedAt', 
        key: '$updatedAt', 
        width: 180, 
        minWidth: 160,
        ellipsis: { showTitle: false }, 
        filterConfig: { type: FilterFieldType.date }, 
        render: (value: any) => {
          const formatted = formatValue(value, 'time');
          return <span>{formatted}</span>;
        }
      },
    ];

    return [...cols, ...fixedColumns];
  };

  const requestFn = async (params: any) => {
    try {
      // 调用真实 API 获取列表数据
      const response = await customObjectApi.getList({
        objectCode: DEFAULT_OBJECT_CODE,
        page: params.current || 1,
        size: params.pageSize || 20,
        mainPropertyCondition: params.mainPropertyCondition,
        singleTextCondition: params.singleTextCondition,
        singleChoiceCondition: params.singleChoiceCondition,
        multipleChoiceCondition: params.multipleChoiceCondition,
        boolCondition: params.boolCondition,
        datetimeCondition: params.datetimeCondition,
        integerCondition: params.integerCondition,
        numericCondition: params.numericCondition,
        referenceCondition: params.referenceCondition,
        relateCondition: params.relateCondition,
        relateConditionOr: params.relateConditionOr,
        sorter: params.sorter,
        selectFlag: params.selectFlag,
      });
      
      // 将 API 返回的数据转换为扁平化格式（适配表格）
      let filteredData = (response.list || []).map((item: any) => {
        const flatItem: any = {
          instanceId: item.instanceId,
          $instanceId: item.instanceId,
          objectCode: item.objectCode || DEFAULT_OBJECT_CODE,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          creator: item.creator,
          operator: item.operator,
          $creator: item.creator,
          $createdAt: item.createdAt,
          $operator: item.operator,
          $updatedAt: item.updatedAt,
        };
        
        // 将 fields 数组转换为扁平化字段值
        if (item.fields && Array.isArray(item.fields)) {
          item.fields.forEach((field: any) => {
            if (field.fieldCode && field.fieldValue !== undefined) {
              flatItem[field.fieldCode] = field.fieldValue;
              // 同时保留字段定义信息（用于构建列）
              flatItem[`${field.fieldCode}_field`] = field;
            }
          });
        }
        
        return flatItem;
      });

      // 初始化列
      if (!hasInitColumnsRef.current && filteredData.length > 0) {
        const nextColumns = buildColumnsFromFields();
        if (nextColumns.length > 0) {
          setColumns(nextColumns);
          hasInitColumnsRef.current = true;
        }
      }

      // 返回 API 返回的数据（后端已处理筛选、排序和分页）
      return { 
        data: {
          list: filteredData,
          total: response.total || 0
        }
      };
    } catch (error) {
      message.error('加载列表失败');
      throw error;
    }
  };

  const mainMenu = [
    { title: `新建${pageTitle}`, key: 'create', onClick: () => history.push(customObjectPagePath.create) },
    { title: '导入日志', key: 'importLog', onClick: () => message.info('导入日志：待接入路由/页面') },
    { title: '导出日志', key: 'exportLog', onClick: () => message.info('导出日志：待接入路由/页面') },
    { title: '导出', key: 'export', onClick: () => message.info('导出：待接入 openapi 导出能力') },
    { title: '导入', key: 'import', onClick: () => message.info('导入：待接入 openapi 导入能力') },
  ];

  const batchMenu: any[] = [
    // 批量删除接口尚未设计，暂时不提供批量删除功能
  ];

  const getOperationList = (record: any) => [
    { title: '查看详情', onClick: () => history.push(customObjectPagePath.detail.replace(':id', String(record.$instanceId))) },
    { title: '编辑', onClick: () => history.push(customObjectPagePath.edit.replace(':id', String(record.$instanceId))) },
    { title: '复制', onClick: () => history.push(customObjectPagePath.copy.replace(':id', String(record.$instanceId))) },
    {
      title: '删除',
      popconfirm: { 
        title: '确定要删除吗？', 
        onConfirm: async () => {
          // 添加参数验证
          if (!record?.$instanceId) {
            message.error('缺少实例ID，无法删除');
            return;
          }
          if (!objectCode) {
            message.error('缺少对象编码，无法删除');
            return;
          }
          
          try {
            const instanceId = Number(record.$instanceId);
            if (isNaN(instanceId)) {
              message.error('实例ID格式错误');
              return;
            }
            
            // 根据 API 文档，使用 ids 数组格式
            const response = await customObjectApi.delete({ 
              ids: [instanceId], 
              objectCode: objectCode 
            });
            
            if (response.code === 200) {
              message.success(response.message || '删除成功');
              // 刷新列表
              fetchData();
            } else {
              message.error(response.message || '删除失败');
            }
          } catch (error: any) {
            console.error('删除失败:', error);
            message.error(error?.message || '删除失败');
          }
        }
      },
      onClick: () => {},
    },
  ];

  const fetchData = async () => {
    if (isLoading) return;
    
    // 确保 fields 已初始化
    if (fields.length === 0 && mockFields.length > 0) {
      setFields([...mockFields]);
    }
    
    // 如果列还没有初始化，先初始化列
    if (!hasInitColumnsRef.current && fields.length > 0) {
      const nextColumns = buildColumnsFromFields();
      if (nextColumns.length > 0) {
        setColumns(nextColumns);
        hasInitColumnsRef.current = true;
      }
    }
    
    setIsLoading(true);
    try {
      const queryParams: any = { objectCode, page: pagination.page, size: pagination.size };
      if (quickSearch) queryParams.mainPropertyCondition = quickSearch;
      Object.assign(queryParams, filterData);
      
      const json = await requestFn(queryParams);
      setDataSource(json?.data?.list ?? []);
      setPagination(prev => ({ ...prev, total: json?.data?.total ?? 0 }));
      isFirstRef.current = false;
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFilterQuery = (newQuickSearch: string = '') => {
    setQuickSearch(newQuickSearch);
    setFilterData({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterQuery = (newFilterData: Record<string, any> = {}) => {
    setFilterData(_.omitBy(newFilterData, (v) => _.isUndefined(v) || _.isNull(v) || v === ''));
    setQuickSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    setIsSelectMode(selectedKeys.length > 0);
  }, [selectedKeys]);

  useEffect(() => {
    if (isFirstRef.current) {
      fetchData();
      isFirstRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isFirstRef.current) {
      fetchData();
    }
  }, [pagination.page, pagination.size, quickSearch, filterData]);

  const mergedFilterList = useMemo(() => {
    return columns
      .filter((col: any) => col.filterConfig && col.dataIndex)
      .map((col: any) => ({
        label: col.title || String(col.dataIndex),
        name: String(col.dataIndex),
        type: col.filterConfig.type,
        rules: col.filterConfig.rules,
        props: col.filterConfig.customProps,
      }));
  }, [columns]);

  const tableColumns = useMemo(() => {
    const cols: any[] = [{
      title: '序号',
      key: 'index',
      dataIndex: 'index',
      fixed: 'left' as const,
      width: 80,
      minWidth: 80,
      render: (_: any, __: any, index: number) => (pagination.page - 1) * pagination.size + index + 1,
    }, ...columns, {
      title: '操作',
      key: 'operation',
      dataIndex: 'operation',
      fixed: 'right' as const,
      width: 200,
      minWidth: 180,
      className: 'operation-column',
      render: (_: any, record: any) => {
        const operations = getOperationList(record);
        return (
          <div>
            {operations.map((item: any, idx: number) => {
              if (item.popconfirm) {
                const popconfirmProps = typeof item.popconfirm === 'object' ? item.popconfirm : { title: `确定要${item.title}吗?` };
                return (
                  <Popconfirm
                    key={idx}
                    {...popconfirmProps}
                  >
                    <a style={{ marginRight: 16, color: '#ff4d4f' }}>{item.title}</a>
                  </Popconfirm>
                );
              }
              return (
                <a key={idx} onClick={() => item.onClick?.()} style={{ marginRight: 16 }}>{item.title}</a>
              );
            })}
          </div>
        );
      },
    }];
    return cols;
  }, [columns, pagination]);

  const paginationConfig = useMemo(() => ({
    current: pagination.page,
    pageSize: pagination.size,
    total: pagination.total,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (page: number, pageSize: number) => setPagination(prev => ({ ...prev, page, size: pageSize })),
    onShowSizeChange: (page: number, pageSize: number) => setPagination(prev => ({ ...prev, page, size: pageSize })),
    pageSizeOptions: ['10', '20', '50', '100'],
  }), [pagination]);

  const renderInlineFilter = () => {
    if (!mergedFilterList.length) return null;
    const fieldsPerRow = 3;
    const visibleCount = filterExpanded ? mergedFilterList.length : Math.min(4, mergedFilterList.length);
    const visibleFilters = mergedFilterList.slice(0, visibleCount);
    const hasMore = mergedFilterList.length > 4;

    const getFormItem = (filter: any) => {
      const { type, props } = filter;
      const commonProps = { ...props, style: { width: '100%' }, placeholder: type === FilterFieldType.date ? undefined : '请输入' };
      switch (type) {
        case FilterFieldType.select:
          return <Select {...commonProps} allowClear showSearch placeholder="请选择" />;
        case FilterFieldType.multiSelect:
          return <Select {...commonProps} mode="multiple" allowClear showSearch placeholder="请选择" />;
        case FilterFieldType.date:
          return <DatePicker.RangePicker style={{ width: '100%' }} />;
        default:
          return <Input {...commonProps} />;
      }
    };

    const handleFilterFinish = (values: any) => {
      const filtered: Record<string, any> = {};
      Object.keys(values || {}).forEach((key) => {
        const v = values[key];
        if (v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)) {
          filtered[key] = v;
        }
      });
      handleFilterQuery(filtered);
    };

    const groupedFilters: any[][] = [];
    for (let i = 0; i < visibleFilters.length; i += fieldsPerRow) {
      groupedFilters.push(visibleFilters.slice(i, i + fieldsPerRow));
    }

    return (
      <>
        <div className="bl-listLayout-filter">
          <Form form={filterForm} layout="inline" onFinish={handleFilterFinish} className="bl-listLayout-filterFields">
            {groupedFilters.map((rowFilters, rowIndex) => (
              <div key={rowIndex} className="bl-listLayout-filterRow">
                {rowFilters.map((filter) => (
                  <Form.Item key={filter.name} name={filter.name} label={filter.label} rules={filter.rules} className="bl-listLayout-filterField">
                    {getFormItem(filter)}
                  </Form.Item>
                ))}
              </div>
            ))}
          </Form>
          <div className="bl-listLayout-filterActions">
            <Button onClick={() => { filterForm.resetFields(); handleFilterQuery({}); }}>重置</Button>
            <Button type="primary" onClick={() => filterForm.submit()}>查询</Button>
          </div>
        </div>
        {hasMore && (
          <div className="bl-listLayout-filterToggle">
            <Button type="link" icon={filterExpanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setFilterExpanded(!filterExpanded)}>
              {filterExpanded ? '收起' : `更多(${mergedFilterList.length - visibleCount})`}
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderHeader = () => {
    const handleBatchClick = async (item: any) => {
      setBatchLoading(item.title);
      try {
        await item.onClick?.();
        setSelectedKeys([]);
        setIsSelectMode(false);
        setBatchLoading('');
        fetchData();
      } catch {
        setBatchLoading('');
      }
    };

    const renderBatchButton = (item: any) => {
      const disabled = !!batchLoading || selectedKeys.length === 0;
      const buttonProps = {
        type: 'text' as const,
        style: { paddingLeft: 0, paddingRight: 0 },
        loading: batchLoading === item.title,
        disabled,
        icon: getOperationIcon({ title: item.title, customIcon: item?.icon }),
        children: item.title?.split('').join('  '),
      };
      if (item.popconfirm) {
        const popconfirmProps = typeof item.popconfirm === 'object' ? item.popconfirm : { title: `确定要${item.title}吗?` };
        return (
          <Popconfirm key={item.title} {...popconfirmProps} disabled={disabled} onConfirm={() => handleBatchClick(item)}>
            <Button {...buttonProps} />
          </Popconfirm>
        );
      }
      return <Button key={item.title} {...buttonProps} onClick={() => handleBatchClick(item)} />;
    };

    if (isSelectMode) {
      return (
        <div className="bl-listLayout-head">
          <Space wrap split={<Divider type="vertical" />}>
            <span>已选择{selectedKeys.length}项</span>
            {filterListAuth(batchMenu as any[], []).map(renderBatchButton)}
          </Space>
          <Button type="link" style={{ paddingLeft: 0, paddingRight: 0 }} disabled={!!batchLoading} onClick={() => { setIsSelectMode(false); setSelectedKeys([]); }}>
            清 空
          </Button>
        </div>
      );
    }

    return (
      <div className="bl-listLayout-head">
        <div>
          <Input.Search allowClear placeholder="输入内容，回车快速查询" style={{ width: 240 }} defaultValue={quickSearch} onSearch={handleQuickFilterQuery} />
        </div>
        <div>
          <Space split={<Divider type="vertical" />}>
            {mainMenu.map((menu, idx) => (
              <Button key={menu.key} type={idx === 0 ? 'primary' : 'default'} onClick={menu.onClick}>
                {menu.title}
              </Button>
            ))}
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 0', background: '#fff' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {pageTitle}
        </Typography.Title>
      </div>
      <div className="bl-listLayout" id="bl-list-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderInlineFilter()}
        {renderHeader()}
        <div className="bl-listLayout-body">
          <Table
            columns={tableColumns}
            dataSource={dataSource}
            rowKey="$instanceId"
            loading={isLoading}
            pagination={paginationConfig}
            scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
            }}
          />
        </div>
      </div>
    </div>
  );
};
