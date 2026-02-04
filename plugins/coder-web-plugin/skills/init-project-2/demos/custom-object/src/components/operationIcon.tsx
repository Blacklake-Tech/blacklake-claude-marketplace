import React from 'react';
import _ from 'lodash';
import { EditOutlined, DeleteOutlined, ReloadOutlined, DownOutlined, QuestionCircleOutlined, PlusOutlined, CopyOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ImportOutlined, ExportOutlined, FileTextOutlined } from '@ant-design/icons';

interface OperationIconProps {
  /** 操作名称 */
  title: string;
  /** 自定义图标 */
  customIcon?: React.ReactNode | string;
}

const baseOperations: Array<{ baseTitle: string; icon: React.ReactNode }> = [
  { baseTitle: '新建', icon: <PlusOutlined /> },
  { baseTitle: '编辑', icon: <EditOutlined /> },
  { baseTitle: '删除', icon: <DeleteOutlined /> },
  { baseTitle: '复制', icon: <CopyOutlined /> },
  { baseTitle: '查看', icon: <EyeOutlined /> },
  { baseTitle: '启用', icon: <CheckCircleOutlined /> },
  { baseTitle: '停用', icon: <CloseCircleOutlined /> },
  { baseTitle: '导入', icon: <ImportOutlined /> },
  { baseTitle: '导出', icon: <ExportOutlined /> },
  { baseTitle: '操作记录', icon: <FileTextOutlined /> },
  { baseTitle: '刷新', icon: <ReloadOutlined /> },
];

const getOperationIcon = (props: OperationIconProps) => {
  const { title, customIcon } = props;

  const renderCustomIcon = (customIcon?: React.ReactNode | string) => {
    // 如果是 React 元素，直接返回
    if (React.isValidElement(customIcon)) {
      return customIcon;
    }
    // 如果是字符串，尝试映射
    if (typeof customIcon === 'string') {
      if (customIcon === 'iconbianji') return <EditOutlined />;
      if (customIcon === 'iconshanchu') return <DeleteOutlined />;
      if (customIcon === 'iconshuaxin') return <ReloadOutlined />;
      return null;
    }
    return customIcon;
  };

  // 如果提供了自定义图标，优先使用
  if (customIcon) {
    return renderCustomIcon(customIcon);
  }

  // 根据标题匹配图标
  let matchedIcon = null;
  _.forEach(baseOperations, ({ baseTitle, icon }) => {
    if (_.includes(title, baseTitle)) {
      matchedIcon = icon;
      return false; // 找到匹配后停止
    }
  });

  return matchedIcon;
};

export default getOperationIcon;

