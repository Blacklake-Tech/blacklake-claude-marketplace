/**
 * 业务服务
 * 包含工单服务和报工服务
 */

// ==================== 工单服务 ====================

/**
 * 工单服务
 * 处理工单相关的API请求
 */
class WorkOrderService {
    constructor() {
        this.api = apiService;
    }

    /**
     * 获取工单列表
     * @param {Object} params - 查询参数
     * @param {string} params.search - 搜索关键词（工单编号模糊查询）
     * @param {string} params.exactWorkOrderCode - 工单编号精确查询
     * @param {number} params.page - 页码
     * @param {number} params.pageSize - 每页数量
     * @param {Array<number>} params.workOrderStatusList - 工单业务状态列表
     * @param {number} params.pauseFlag - 是否暂停 0未暂停 1已暂停
     * @returns {Promise<Object>}
     */
    async getWorkOrderList(params = {}) {
        try {
            console.log('从服务器获取工单列表', params);
            
            // 构建请求体，根据API文档格式
            const requestBody = {
                page: params.page || 1,
                size: params.pageSize || 50
            };
            
            // 如果有搜索关键词，使用模糊查询
            if (params.search) {
                requestBody.workOrderCode = params.search.trim();
            }
            
            // 如果有精确查询
            if (params.exactWorkOrderCode) {
                requestBody.exactWorkOrderCode = params.exactWorkOrderCode.trim();
            }
            
            // 工单状态筛选
            if (params.workOrderStatusList && Array.isArray(params.workOrderStatusList)) {
                requestBody.workOrderStatusList = params.workOrderStatusList;
            }
            
            // 暂停状态筛选
            if (params.pauseFlag !== undefined) {
                requestBody.pauseFlag = params.pauseFlag;
            }
            
            // 调用API接口（POST方法）
            const response = await this.api.post('/openapi/domain/web/v1/route/med/open/v2/work_order/base/_list', requestBody);

            // 处理响应数据
            const result = this.processWorkOrderListResponse(response);

            return result;
            
        } catch (error) {
            console.error('获取工单列表失败:', error);
            
            // 如果是网络错误，返回模拟数据
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                console.log('网络错误，返回模拟工单数据');
                return this.getMockWorkOrderList(params);
            }
            
            throw error;
        }
    }


    /**
     * 处理工单列表响应数据
     * @param {Object} response - API响应
     * @returns {Object}
     */
    processWorkOrderListResponse(response) {
        // 根据API文档，响应格式：{ code, message, data: { list, page, total } }
        if (response.code === 200 || response.code === 0) {
            const data = response.data;
            
            if (!data || !data.list) {
                throw new Error('响应数据格式错误：缺少data或list字段');
            }
            
            return {
                workOrders: data.list.map(item => {
                    // 提取物料信息
                    const materialInfo = item.materialInfo || {};
                    const materialBaseInfo = materialInfo.baseInfo || {};
                    
                    // 提取数量信息（BaseAmountDisplay对象）
                    const qualifiedAmount = item.qualifiedHoldAmount || {};
                    const disqualifiedAmount = item.disqualifiedHoldAmount || {};
                    const totalAmount = item.totalHoldAmount || {};
                    
                    return {
                        id: item.workOrderCode || item.workOrderId?.toString() || '',
                        workOrderId: item.workOrderId,
                        workOrderCode: item.workOrderCode,
                        name: materialBaseInfo.name || materialInfo.name || item.workOrderCode,
                        status: item.workOrderStatus?.code || 'active',
                        // 物料信息（保留完整结构）
                        materialInfo: item.materialInfo, // 保留完整的materialInfo对象
                        materialId: materialBaseInfo.id || materialInfo.id,
                        materialName: materialBaseInfo.name || materialInfo.name,
                        materialCode: materialBaseInfo.code || materialInfo.code,
                        // 数量信息
                        qualifiedQuantity: qualifiedAmount.amount || 0,
                        qualifiedQuantityDisplay: qualifiedAmount.amountDisplay || '0',
                        disqualifiedQuantity: disqualifiedAmount.amount || 0,
                        disqualifiedQuantityDisplay: disqualifiedAmount.amountDisplay || '0',
                        totalQuantity: totalAmount.amount || 0,
                        totalQuantityDisplay: totalAmount.amountDisplay || '0',
                        // 时间信息
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        plannedStartTime: item.plannedStartTime,
                        plannedEndTime: item.plannedEndTime,
                        // 其他信息
                        pauseFlag: item.pauseFlag,
                        workOrderStatus: item.workOrderStatus,
                        workOrderType: item.workOrderType
                    };
                }),
                total: data.total || 0,
                page: data.page || 1,
                pageSize: data.size || 50
            };
        } else {
            throw new Error(response.message || `获取工单列表失败 (code: ${response.code})`);
        }
    }


    /**
     * 获取模拟工单列表（用于离线模式或测试）
     * @param {Object} params - 查询参数
     * @returns {Object}
     */
    getMockWorkOrderList(params = {}) {
        const mockData = [
            {
                id: 'cyy-SOP',
                name: '测试工单-SOP',
                status: 'active',
                materialId: 'M001',
                materialName: '物料1-工序a-10',
                materialCode: 'wuliao1-gongxua-10'
            },
            {
                id: 'cyy-chengliangrenwu',
                name: '测试工单-成量任务',
                status: 'active',
                materialId: 'M002',
                materialName: '物料2-工序b-20',
                materialCode: 'wuliao2-gongxub-20'
            },
            {
                id: 'gd2510300131-',
                name: '工单2510300131',
                status: 'active',
                materialId: 'M003',
                materialName: '物料3-工序c-30',
                materialCode: 'wuliao3-gongxuc-30'
            },
            {
                id: 'gd2510270130-',
                name: '工单2510270130',
                status: 'active',
                materialId: 'M004',
                materialName: '物料4-工序d-40',
                materialCode: 'wuliao4-gongxud-40'
            },
            {
                id: 'gd2510210129-',
                name: '工单2510210129',
                status: 'active',
                materialId: 'M005',
                materialName: '物料5-工序e-50',
                materialCode: 'wuliao5-gongxue-50'
            },
            {
                id: 'gd2509020128-',
                name: '工单2509020128',
                status: 'active',
                materialId: 'M006',
                materialName: '物料6-工序f-60',
                materialCode: 'wuliao6-gongxuf-60'
            },
            {
                id: 'gd2509010126-',
                name: '工单2509010126',
                status: 'active',
                materialId: 'M007',
                materialName: '物料7-工序g-70',
                materialCode: 'wuliao7-gongxug-70'
            },
            {
                id: 'gd2509010125-',
                name: '工单2509010125',
                status: 'active',
                materialId: 'M008',
                materialName: '物料8-工序h-80',
                materialCode: 'wuliao8-gongxuh-80'
            },
            {
                id: 'gd2508260124-',
                name: '工单2508260124',
                status: 'active',
                materialId: 'M009',
                materialName: '物料9-工序i-90',
                materialCode: 'wuliao9-gongxui-90'
            },
            {
                id: 'gd2507210123-',
                name: '工单2507210123',
                status: 'active',
                materialId: 'M010',
                materialName: '物料10-工序j-100',
                materialCode: 'wuliao10-gongxuj-100'
            }
        ];

        // 应用搜索过滤
        let filteredData = mockData;
        if (params.search) {
            const searchTerm = params.search.toLowerCase();
            filteredData = mockData.filter(item => 
                item.id.toLowerCase().includes(searchTerm) ||
                item.name.toLowerCase().includes(searchTerm)
            );
        }

        return {
            workOrders: filteredData,
            total: filteredData.length,
            page: params.page || 1,
            pageSize: params.pageSize || 50
        };
    }


    /**
     * 预加载工单数据
     */
    async preloadWorkOrders() {
        try {
            console.log('预加载工单数据...');
            await this.getWorkOrderList({ pageSize: 100 });
        } catch (error) {
            console.error('预加载工单数据失败:', error);
        }
    }
}

// 创建全局工单服务实例
const workOrderService = new WorkOrderService();

// ==================== 报工服务 ====================

/**
 * 报工服务
 * 处理报工相关的API请求
 */
class ReportService {
    constructor() {
        this.api = apiService;
    }

    /**
     * 获取报工必填参数
     * 从接口获取报工所需的必填参数（如taskId、progressReportMaterial等）
     * @param {Object} params - 查询参数
     * @param {string|number} params.workOrderId - 工单ID
     * @param {string|number} params.materialId - 物料ID
     * @returns {Promise<Object>} 返回必填参数对象
     */
    async getReportRequiredParams(params) {
        try {
            console.log('获取报工必填参数:', params);
            
            const { workOrderId, materialId } = params;
            
            if (!workOrderId ) {
                throw new Error('工单ID获取失败');
            }

            const taskListRequest = {
                page: 1,
                size: 10,
                workOrderIdList: [workOrderId]
            };
            
            const taskListResponse = await this.api.post('/openapi/domain/web/v1/route/mfg/open/v1/produce_task/_list', taskListRequest);
            
            if (taskListResponse.code !== 200 || !taskListResponse.data || !taskListResponse.data.list || taskListResponse.data.list.length === 0) {
                throw new Error('未找到对应的生产任务');
            }
            
            // 取第一个任务（通常一个工单对应一个主任务）
            const task = taskListResponse.data.list[0];
            const taskId = task.taskId;
            const executorIds = (task.executorList || []).map(item => item.id); // 只取执行人id数组
            
            if (!taskId) {
                throw new Error('生产任务中未找到任务ID');
            }
            
            // 2. 通过生产任务ID获取报工物料列表
            console.log('获取报工物料列表...');
            const materialListRequest = {
                taskId: taskId
            };
            
            const materialListResponse = await this.api.post('/openapi/domain/web/v1/route/mfg/open/v1/progress_report/_list_progress_report_materials', materialListRequest);
            
            if (materialListResponse.code !== 200 || !materialListResponse.data || !materialListResponse.data.outputMaterials || materialListResponse.data.outputMaterials.length === 0) {
                throw new Error('未找到报工物料信息');
            }
            
            // 获取报工物料列表
            const outputMaterials = materialListResponse.data.outputMaterials;
            
            // 优先选择主产出物料（mainFlag为true），否则选择第一个
            let selectedMaterial = outputMaterials.find(m => m.mainFlag === true) || outputMaterials[0];
            
            if (!selectedMaterial) {
                throw new Error('未找到可报工的物料');
            }
            
            // 从报工物料中提取报工关系信息
            const progressReportKey = selectedMaterial.progressReportKey;
            
            if (!progressReportKey) {
                throw new Error('报工物料中未找到报工关系信息');
            }
            
            // 3. 构建progressReportMaterial对象
            const progressReportMaterial = {
                lineId: progressReportKey.lineId,
                materialId: progressReportKey.materialId || selectedMaterial.materialInfo?.baseInfo?.id || materialId,
                reportProcessId: progressReportKey.reportProcessId
            };
            
            // 验证必填字段
            if (!progressReportMaterial.lineId) {
                throw new Error('无法获取物料行ID');
            }
            if (!progressReportMaterial.materialId) {
                throw new Error('无法获取物料ID');
            }
            if (!progressReportMaterial.reportProcessId) {
                throw new Error('无法获取报工工序ID');
            }
            
            // 4. 返回必填参数
            const requiredParams = {
                taskId: taskId,
                progressReportMaterial: progressReportMaterial,
                // 额外信息，可能用于构建报工参数
                materialInfo: selectedMaterial.materialInfo,
                outputMaterialUnit: selectedMaterial.outputMaterialUnit, // 报工单位信息
                lineId: progressReportMaterial.lineId,
                reportProcessId: progressReportMaterial.reportProcessId,
                executorIds: executorIds, // 执行人列表
                // 报工物料的其他信息
                reportType: selectedMaterial.reportType || [], // 可报工方式
                mainFlag: selectedMaterial.mainFlag, // 是否为主产出
                warehousingFlag: selectedMaterial.warehousingFlag, // 是否入库
                autoWarehousingFlag: selectedMaterial.autoWarehousingFlag // 是否自动入库
            };
            
            console.log('成功获取报工必填参数:', requiredParams);
            return requiredParams;
            
        } catch (error) {
            console.error('获取报工必填参数失败:', error);
            throw error;
        }
    }

    /**
     * 构建报工请求参数
     * 将必填参数和表单数据合并，构建完整的报工请求参数
     * @param {Object} requiredParams - 从接口获取的必填参数
     * @param {Object} formData - 表单数据
     * @param {Object} formData.workOrderId - 工单ID
     * @param {Object} formData.materialId - 物料ID
     * @param {number} formData.quantity - 报工数量
     * @param {number} formData.auxiliaryQuantity - 辅助数量
     * @param {number} formData.qcStatus - 质量状态（1：合格 2：让步合格 3：代检 4：不合格）
     * @param {number} formData.reportType - 报工方式（1：扫码报工-合格 2：记录报工-合格 3：扫码报工-不合格 4：记录报工-不合格 5：打码报工-合格 6：打码报工-不合格）
     * @param {Array<number>} formData.executorIds - 执行人ID列表
     * @returns {Object} 完整的报工请求参数
     * @note storageLocationId 已预置为 1716848012872791
     */
    buildReportRequestParams(requiredParams, formData) {
        // 从必填参数中获取基础信息
        const {
            taskId,                    // 生产任务ID（必填）
            progressReportMaterial,     // 报工物料对象（必填）
            reportProcessId,            // 报工工序ID
            lineId,                     // 物料行ID
            outputMaterialUnit,         // 报工单位信息
            executorIds                  // 执行人ID列表
        } = requiredParams;

        // 获取报工单位ID（从outputMaterialUnit中获取）
        const reportUnitId = outputMaterialUnit?.id;
        if (!reportUnitId) {
            throw new Error('无法获取报工单位ID');
        }

        // 构建报工请求参数
        const requestParams = {
            // 必填字段
            taskId: taskId,
            progressReportMaterial: progressReportMaterial || {
                materialId: formData.materialId,
                lineId: lineId,
                reportProcessId: reportProcessId
            },
            qcStatus: formData.qcStatus || 1, // 默认合格
            reportType: formData.reportType || 2, // 默认记录报工-合格
            
            // 报工详情（必填）
            progressReportItems: [{
                executorIds: executorIds ,
                progressReportMaterialItems: [{
                    reportAmount: formData.quantity,
                    reportUnitId: reportUnitId, // 必填：报工单位ID
                    remark: formData.remark || undefined,
                    // auxAmount1: formData.auxiliaryQuantity || undefined,
                    // auxUnitId1: formData.auxUnitId1 || undefined
                }]
            }],

            // 可选字段
            storageLocationId: 1716848012872791,// 预置仓位 Id，不可修改
            reportStartTime: formData.reportStartTime ? new Date(formData.reportStartTime).getTime() : undefined,
            reportEndTime: formData.reportEndTime ? new Date(formData.reportEndTime).getTime() : undefined,
            actualExecutorIds: executorIds || [],
            actualEquipmentIds: formData.equipmentIds || [],
            workHour: formData.workHour,
            workHourUnit: formData.workHourUnit ,
            qcDefectReasonIds: formData.qcDefectReasonIds || [] // 不良原因（质量状态为不合格时）
        };

        // 移除undefined字段
        Object.keys(requestParams).forEach(key => {
            if (requestParams[key] === undefined) {
                delete requestParams[key];
            }
        });

        // 递归移除嵌套对象中的undefined字段
        const cleanUndefined = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => cleanUndefined(item));
            } else if (obj && typeof obj === 'object') {
                const cleaned = {};
                Object.keys(obj).forEach(key => {
                    if (obj[key] !== undefined) {
                        cleaned[key] = cleanUndefined(obj[key]);
                    }
                });
                return cleaned;
            }
            return obj;
        };

        return cleanUndefined(requestParams);
    }

    /**
     * 提交报工
     * @param {Object} reportData - 报工数据
     * @param {string|number} reportData.workOrderId - 工单ID
     * @param {string|number} reportData.workOrderCode - 工单编号
     * @param {string|number} reportData.materialId - 物料ID
     * @param {number} reportData.quantity - 数量
     * @param {number} reportData.auxiliaryQuantity - 辅助数量
     * @param {number} reportData.qcStatus - 质量状态（1：合格 2：让步合格 3：代检 4：不合格）
     * @param {number} reportData.reportType - 报工方式（1-6）
     * @param {Array<number>} reportData.executorIds - 执行人ID列表
     * @param {number} reportData.reportUnitId - 报工单位ID
     * @param {number} reportData.auxUnitId1 - 辅助单位1 ID
     * @returns {Promise<Object>}
     */
    async submitReport(reportData) {
        try {
            // 验证报工数据
            this.validateReportData(reportData);

            // 1. 获取报工必填参数
            const requiredParams = await this.getReportRequiredParams({
                workOrderId: reportData.workOrderId,
                materialId: reportData.materialId
            });

            // 2. 构建完整的报工请求参数
            const requestParams = this.buildReportRequestParams(requiredParams, reportData);

            console.log('提交报工请求参数:', requestParams);

            // 3. 调用批量报工接口
            const response = await this.api.post('/openapi/domain/web/v1/route/mfg/open/v1/progress_report/_progress_report', requestParams);
            
            // 4. 处理响应
            const result = this.processReportResponse(response);

            console.log('报工提交成功:', result);

            return result;

        } catch (error) {
            console.error('报工提交失败:', error);
            showToast(error.message || '报工提交失败', 'error');
            throw error;
        }
    }


    /**
     * 验证报工数据
     * @param {Object} data - 报工数据
     */
    validateReportData(data) {
        const errors = [];

        if (!data.workOrderId) {
            errors.push('工单ID不能为空');
        }

        if (!data.quantity || data.quantity <= 0) {
            errors.push('数量必须大于0');
        }

        if (!data.auxiliaryQuantity || data.auxiliaryQuantity <= 0) {
            errors.push('辅助数量必须大于0');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    /**
     * 处理报工响应
     * 根据批量报工接口文档，响应格式：{ code, message, data: { messageTraceId, progressReportRecordIds } }
     * @param {Object} response - API响应
     * @returns {Object}
     */
    processReportResponse(response) {
        // 根据批量报工接口文档，响应格式：{ code, message, data: { messageTraceId, progressReportRecordIds } }
        if (response.code === 200 || response.code === 0) {
            const data = response.data || {};
            
            return {
                success: true,
                messageTraceId: data.messageTraceId,
                progressReportRecordIds: data.progressReportRecordIds || [],
                message: response.message || '报工提交成功',
                reportTime: new Date().toISOString()
            };
        } else {
            throw new Error(response.message || `报工提交失败 (code: ${response.code})`);
        }
    }

    /**
     * 根据生产任务查询报工记录列表
     * @param {Object} params - 查询参数
     * @param {number|Array<number>} params.taskId - 生产任务ID或ID列表（可选）
     * @param {number|Array<number>} params.workOrderId - 工单ID或ID列表（可选）
     * @param {number} params.reportTimeFrom - 报工时间From(闭区间)，时间戳（可选）
     * @param {number} params.reportTimeTo - 报工时间To(开区间)，时间戳（可选）
     * @param {number} params.page - 请求页，默认1（可选）
     * @param {number} params.size - 每页大小，默认200（可选）
     * @param {Array<number>} params.processIdList - 工序ID列表（可选）
     * @param {Array<number>} params.executorIdList - 可执行人ID列表（可选）
     * @param {Array<number>} params.qcStatusList - 质量状态列表（可选）
     * @param {Array<Object>} params.sorter - 排序条件列表（可选），列表顺序表示排序顺序
     * @param {string} params.sorter[].field - 排序字段，如 "reportTime", "taskCode" 等
     * @param {string} params.sorter[].order - 排序规律，默认 "asc"，"asc" 升序 "desc" 降序
     * @returns {Promise<Object>} 返回报工记录列表（分页响应）
     * @returns {boolean} returns.success - 是否成功
     * @returns {Array<Object>} returns.records - 报工记录数组，每个记录包含以下字段：
     * @returns {number} returns.records[].id - 报工记录详情id（必填）
     * @returns {number} returns.records[].lineId - 物料行id（必填）
     * @returns {number} returns.records[].reportRecordId - 报工记录id（必填）
     * @returns {number} returns.records[].taskId - 生产任务Id（必填）
     * @returns {string} returns.records[].taskCode - 生产任务编号（必填）
     * @returns {number} returns.records[].workOrderId - 工单Id（必填）
     * @returns {string} returns.records[].workOrderCode - 工单编号（必填）
     * @returns {number} returns.records[].processId - 工序Id（必填）
     * @returns {string} returns.records[].processCode - 工序编号（必填）
     * @returns {string} returns.records[].processName - 工序名称（必填）
     * @returns {number} returns.records[].mainMaterialId - 工单物料id（必填）
     * @returns {string} returns.records[].mainMaterialCode - 工单物料编号（必填）
     * @returns {string} returns.records[].mainMaterialName - 工单物料名称（必填）
     * @returns {Object} returns.records[].materialInfo - 报工物料信息（必填），包含 baseInfo（物料基本信息）、attribute（物料属性信息）等
     * @returns {Object} returns.records[].reportBaseAmount - 报工数量1对应数量对象（必填），包含 amount（数量）和 unit（单位信息）
     * @returns {Object} returns.records[].reportBaseAmountDisplay - 报工数量1对应数量对象-无科学技术法（必填），包含 amount、amountDisplay、unitCode、unitId、unitName
     * @returns {number} returns.records[].reportTime - 报工时间，时间戳（必填）
     * @returns {Object} returns.records[].reporter - 报工人员（必填），包含 id、code、name、username、avatarUrl
     * @returns {Array<Object>} returns.records[].producers - 生产人员（必填），数组元素包含 id、code、name、username、avatarUrl
     * @returns {Object} returns.records[].qcStatus - 质量状态（必填），包含 code（枚举code）和 message（枚举信息）
     * @returns {Object} returns.records[].workHourUnit - 工时单位（必填），包含 code 和 message
     * @returns {number} returns.records[].startTime - 报工开始时间，时间戳（可选）
     * @returns {number} returns.records[].endTime - 报工结束时间，时间戳（可选）
     * @returns {number} returns.records[].workHour - 工时（可选）
     * @returns {string} returns.records[].batchNo - 批次号（可选）
     * @returns {number} returns.records[].batchNoId - 批次号Id（可选）
     * @returns {string} returns.records[].flowCardCode - 流转卡编号（可选）
     * @returns {string} returns.records[].qrCode - 标示码（可选）
     * @returns {string} returns.records[].reportRecordCode - 报工记录编号（可选）
     * @returns {string} returns.records[].remark - 备注（可选）
     * @returns {number} returns.records[].autoWarehousingFlag - 是否自动入库标识 0-否 1-是（可选）
     * @returns {Array<Object>} returns.records[].equipments - 设备列表（可选），数组元素包含 id、code、name
     * @returns {Array<Object>} returns.records[].executors - 计划执行人（可选），数组元素包含 id、code、name、username、avatarUrl
     * @returns {Array<Object>} returns.records[].produceDepartments - 生产部门列表（可选），数组元素包含 id、code、name
     * @returns {Array<Object>} returns.records[].customFields - 自定义字段（可选），数组元素包含 fieldCode、fieldName、fieldValue 等
     * @returns {Array<Object>} returns.records[].qcDefectReasons - 不良原因（可选），数组元素包含 id、name
     * @returns {Array<string>} returns.records[].salesOrderCode - 订单编号（可选）
     * @returns {Array<number>} returns.records[].pictureIds - 图片ids（可选）
     * @returns {Object} returns.records[].reportAuxBaseAmount1 - 报工数量2对应数量对象（可选），包含 amount 和 unit
     * @returns {number} returns.records[].updatedAt - 更新时间，时间戳（可选）
     * @returns {number} returns.total - 总条数
     * @returns {number} returns.page - 当前页
     * @returns {number} returns.size - 每页大小
     * @returns {string} returns.message - 返回消息
     */
    async getReportRecordsByTask(params) {
        try {
            const { 
                taskId, 
                workOrderId, 
                reportTimeFrom, 
                reportTimeTo,
                page = 1,
                size = 200,
                processIdList,
                executorIdList,
                qcStatusList,
                sorter
            } = params;
            
            // 构建请求参数
            const requestParams = {
                page: parseInt(page),
                size: parseInt(size)
            };
            
            // 添加排序参数（如果未提供，默认按报工时间降序）
            if (sorter && Array.isArray(sorter) && sorter.length > 0) {
                // 使用用户提供的排序条件
                requestParams.sorter = sorter.map(item => ({
                    field: item.field,
                    order: item.order 
                }));
            } else {
                // 默认按报工时间降序排序
                requestParams.sorter = [{
                    field: 'reportTime',
                    order: 'desc'
                }];
            }
            
            // 添加任务ID列表（支持单个或数组）
            if (taskId) {
                requestParams.taskIds = Array.isArray(taskId) ? taskId.map(id => parseInt(id)) : [parseInt(taskId)];
            }
            
            // 添加工单ID列表（支持单个或数组）
            if (workOrderId) {
                requestParams.workOrderIdList = Array.isArray(workOrderId) 
                    ? workOrderId.map(id => parseInt(id)) 
                    : [parseInt(workOrderId)];
            }
            
            // 添加报工时间范围
            if (reportTimeFrom) {
                requestParams.reportTimeFrom = parseInt(reportTimeFrom);
            }
            if (reportTimeTo) {
                requestParams.reportTimeTo = parseInt(reportTimeTo);
            }
            
            // 添加其他可选参数
            if (processIdList && processIdList.length > 0) {
                requestParams.processIdList = processIdList.map(id => parseInt(id));
            }
            if (executorIdList && executorIdList.length > 0) {
                requestParams.executorIdList = executorIdList.map(id => parseInt(id));
            }
            if (qcStatusList && qcStatusList.length > 0) {
                requestParams.qcStatusList = qcStatusList.map(status => parseInt(status));
            }
            
            // 验证至少有一个查询条件
            if (!requestParams.taskIds && !requestParams.workOrderIdList) {
                throw new Error('必须提供 taskId 或 workOrderId 中的至少一个');
            }
            
            console.log('查询报工记录，参数:', requestParams);
            
            // 调用报工记录列表接口
            const response = await this.api.post('/openapi/domain/web/v1/route/mfg/open/v1/progress_report/_list', requestParams);
            
            // 处理响应
            if (response.code !== 200 && response.code !== 0) {
                throw new Error(response.message || `查询报工记录失败 (code: ${response.code})`);
            }
            
            // 响应格式：{ code, message, data: { list, page, total } }
            // data.list 是报工记录数组，每个记录包含以下主要字段：
            // - 必填字段：id, lineId, reportRecordId, taskId, taskCode, workOrderId, workOrderCode,
            //   processId, processCode, processName, mainMaterialId, mainMaterialCode, mainMaterialName,
            //   materialInfo, reportBaseAmount, reportBaseAmountDisplay, reportTime, reporter, producers, qcStatus, workHourUnit
            // - 可选字段：startTime, endTime, workHour, batchNo, flowCardCode, qrCode, remark,
            //   equipments, executors, customFields, qcDefectReasons 等
            const data = response.data || {};
            const reportRecords = data.list || [];
            const total = data.total || 0;
            const currentPage = data.page || page;
            
            console.log(`查询到 ${reportRecords.length} 条报工记录，共 ${total} 条`);
            
            return {
                success: true,
                records: reportRecords, // 报工记录数组，详细字段说明见函数 JSDoc 注释
                total: total,
                page: currentPage,
                size: size,
                message: response.message || '查询成功'
            };
            
        } catch (error) {
            console.error('查询报工记录失败:', error);
            throw error;
        }
    }

}

// 创建全局报工服务实例
const reportService = new ReportService();

