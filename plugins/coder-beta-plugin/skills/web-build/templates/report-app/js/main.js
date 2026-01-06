/**
 * 主应用逻辑
 * 管理页面状态、组件交互和业务流程
 */

class MainApp {
    constructor() {
        // 应用状态
        this.state = {
            currentView: 'empty', // empty, material, form
            selectedWorkOrder: null,
            materialData: null,
            formData: null,
            isLoading: false
        };

        // 组件实例
        this.components = {};
        
        // 初始化应用
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化报工应用...');
            
            // 等待认证服务初始化完成
            if (authService && !authService.isAuthenticated()) {
                await this.waitForAuth();
            }

            // 初始化组件
            this.initComponents();
            
            // 绑定事件
            this.bindEvents();
            
            // 预加载数据
            this.preloadData();
            
            console.log('报工应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            showToast('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 等待认证完成
     */
    async waitForAuth() {
        let retries = 0;
        const maxRetries = 10;
        
        while (!authService.isAuthenticated() && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
        }
        
        if (!authService.isAuthenticated()) {
            console.warn('认证超时，继续使用离线模式');
        }
    }

    /**
     * 初始化组件
     */
    initComponents() {
        // 初始化顶部导航栏
        this.components.headerNav = new HeaderNav();
        
        // 初始化工单选择器
        this.components.workOrderSelector = new WorkOrderSelector(() => {
            this.showWorkOrderDropdown();
        });
        
        // 初始化工单下拉菜单
        this.components.workOrderDropdown = new WorkOrderDropdown(
            (workOrder) => this.onWorkOrderSelected(workOrder),
            () => this.onWorkOrderDropdownClosed()
        );
        
        // 初始化物料信息组件
        this.components.materialInfo = new MaterialInfo();
        
        // 初始化报工表单组件
        this.components.reportForm = new ReportForm();
        
        console.log('组件初始化完成');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 提交按钮事件
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.handleSubmit();
            });
        }

        // 网络状态变化事件
        window.addEventListener('online', () => {
            console.log('网络已连接');
            showToast('网络已连接', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('网络已断开');
            showToast('网络已断开，将使用离线模式', 'warning');
        });

        console.log('事件绑定完成');
    }

    /**
     * 预加载数据
     */
    async preloadData() {
        try {
            // 预加载工单数据
            if (workOrderService) {
                await workOrderService.preloadWorkOrders();
            }
            
        } catch (error) {
            console.error('预加载数据失败:', error);
        }
    }

    /**
     * 显示工单下拉菜单
     */
    async showWorkOrderDropdown() {
        try {
            this.setLoading(true);
            
            // 获取工单列表
            const workOrderData = await workOrderService.getWorkOrderList();
            
            // 设置工单数据到下拉菜单
            this.components.workOrderDropdown.setWorkOrders(workOrderData.workOrders);
            
            // 显示下拉菜单
            this.components.workOrderDropdown.show();
            
            // 更新选择器箭头状态
            this.components.workOrderSelector.toggleArrow(true);
            
        } catch (error) {
            console.error('加载工单列表失败:', error);
            showToast('加载工单列表失败', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 工单选择事件处理
     * @param {Object} workOrder - 选中的工单
     */
    async onWorkOrderSelected(workOrder) {
        try {
            console.log('选择工单:', workOrder);
            
            this.setLoading(true);
            
            // 更新状态
            this.state.selectedWorkOrder = workOrder;
            
            // 更新工单选择器显示
            this.components.workOrderSelector.updateSelected(workOrder);
            
            // 从工单数据中提取物料信息（工单数据中已包含materialInfo）
            const materialData = this.extractMaterialDataFromWorkOrder(workOrder);
            this.state.materialData = materialData;
            
            // 切换到物料和表单视图
            this.switchToMaterialView();
            
            // 初始化表单数据
            this.initializeFormData();
            
        } catch (error) {
            console.error('处理工单选择失败:', error);
            showToast('处理工单选择失败', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 从工单数据中提取物料信息
     * @param {Object} workOrder - 工单对象
     * @returns {Object} 物料数据
     */
    extractMaterialDataFromWorkOrder(workOrder) {
        // 从materialInfo中提取详细信息
        const materialInfo = workOrder.materialInfo || {};
        const materialBaseInfo = materialInfo.baseInfo || {};
        
        // 提取单位转换关系
        const conversions = materialInfo.conversions || [];
        let unit = '个';
        let auxiliaryUnit = '公斤';
        
        if (conversions.length > 0) {
            const firstConversion = conversions[0];
            unit = firstConversion.fromUnitName || '个';
            auxiliaryUnit = firstConversion.toUnitName || '公斤';
        }
        
        return {
            workOrderId: workOrder.workOrderId || workOrder.id,
            workOrderCode: workOrder.workOrderCode || workOrder.id,
            materialId: workOrder.materialId || materialBaseInfo.id,
            materialName: workOrder.materialName || materialBaseInfo.name || '',
            materialCode: workOrder.materialCode || materialBaseInfo.code || '',
            materialSpec: materialBaseInfo.specification || '',
            unit: unit,
            auxiliaryUnit: auxiliaryUnit,
            conversions: conversions,
            // 数量信息
            qualifiedCount: workOrder.qualifiedQuantity || 0,
            qualifiedCountDisplay: workOrder.qualifiedQuantityDisplay || '0',
            defectiveCount: workOrder.disqualifiedQuantity || 0,
            defectiveCountDisplay: workOrder.disqualifiedQuantityDisplay || '0',
            pendingCount: Math.max(0, (workOrder.totalQuantity || 0) - (workOrder.qualifiedQuantity || 0) - (workOrder.disqualifiedQuantity || 0)),
            totalCount: workOrder.totalQuantity,
            unitId: materialInfo?.unit?.id
        };
    }

    /**
     * 工单下拉菜单关闭事件处理
     */
    onWorkOrderDropdownClosed() {
        // 更新选择器箭头状态
        this.components.workOrderSelector.toggleArrow(false);
    }

    /**
     * 切换到物料视图
     */
    switchToMaterialView() {
        // 隐藏空状态
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
        
        // 显示物料信息
        this.components.materialInfo.show(this.state.materialData);
        
        // 显示报工表单
        this.components.reportForm.show();
        
        // 显示提交按钮
        const submitSection = document.getElementById('submit-section');
        if (submitSection) {
            submitSection.classList.remove('hidden');
        }
        
        // 更新状态
        this.state.currentView = 'material';

        this.components.reportForm.setAuxName({ auxName: this.state.materialData.unit });
    }

    /**
     * 切换到空状态视图
     */
    switchToEmptyView() {
        // 显示空状态
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
        
        // 隐藏物料信息
        this.components.materialInfo.hide();
        
        // 隐藏报工表单
        this.components.reportForm.hide();
        
        // 隐藏提交按钮
        const submitSection = document.getElementById('submit-section');
        if (submitSection) {
            submitSection.classList.add('hidden');
        }
        
        // 重置状态
        this.state.currentView = 'empty';
        this.state.selectedWorkOrder = null;
        this.state.materialData = null;
        this.state.formData = null;
        
        // 重置工单选择器
        this.components.workOrderSelector.updateSelected(null);
        
        console.log('切换到空状态视图');
    }

    /**
     * 初始化表单数据
     */
    initializeFormData() {
        // 直接从 HTML 读取值，不设置默认值
        const formData = this.components.reportForm.getData();
        this.state.formData = formData;
    }

    /**
     * 处理提交事件
     */
    async handleSubmit() {
        try {
            // 验证表单
            const validation = this.components.reportForm.validate();
            if (!validation.isValid) {
                const errorMessage = Object.values(validation.errors)[0];
                showToast(errorMessage, 'error');
                return;
            }
            // 获取表单数据
            const formData = this.components.reportForm.getData();
            console.log('表单数据:', formData);
            // 构建报工数据
            const reportData = {
                workOrderId: this.state.selectedWorkOrder.workOrderId, // 使用数字类型的工单ID
                workOrderCode: this.state.selectedWorkOrder.workOrderCode, // 同时传递工单编号作为备用
                materialId: this.state.materialData.materialId,
                quantity: formData.quantity,
                auxiliaryQuantity: formData.auxiliaryQuantity,
                remark: formData.remark,
                workHour: formData.workingHours,
                workHourUnit: 2,
                auxUnitId1: this.state.materialData.unitId,
                reportStartTime: formData.reportStartTime,
                reportEndTime: formData.reportEndTimeInput
            };

            console.log('提交报工数据:', reportData);
            
            // this.setLoading(true);
            GlobalLoading.show('提交中...');
            
            // 提交报工
            const result = await reportService.submitReport(reportData);
            
            console.log('报工提交结果:', result);
            
            if (result.success) {
                // 提交成功，重置表单
                this.handleSubmitSuccess(result);
            } else {
                throw new Error(result.message || '提交失败');
            }
            
        } catch (error) {
            console.error('提交报工失败:', error);
            showToast(error.message || '提交失败', 'error');
        } finally {
            // this.setLoading(false);
            GlobalLoading.hide();
        }
    }

    /**
     * 处理提交成功
     * @param {Object} result - 提交结果
     */
    handleSubmitSuccess(result) {
        // 显示成功消息
        showToast('报工提交成功', 'success');
        
        // 重置表单
        this.components.reportForm.reset();
        
        // 重新初始化表单数据
        this.initializeFormData();
    }

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        this.state.isLoading = loading;
        
        // 更新提交按钮状态
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? '提交中...' : '提交';
        }
        
        // 可以添加全局加载指示器
        if (loading) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = '';
        }
    }


    /**
     * 重置应用状态
     */
    reset() {
        this.switchToEmptyView();
        this.components.workOrderDropdown.reset();
        console.log('应用状态已重置');
    }

    /**
     * 获取应用状态
     * @returns {Object}
     */
    getState() {
        return deepClone(this.state);
    }

    /**
     * 销毁应用
     */
    destroy() {
        // 清理事件监听器
        // 清理组件
        // 清理定时器等
        console.log('应用已销毁');
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化应用...');
    
    // 创建全局应用实例
    window.MainApp = new MainApp();
    
    // 开发模式下暴露服务到全局
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.authService = authService;
        window.apiService = apiService;
        window.workOrderService = workOrderService;
        window.reportService = reportService;
        console.log('开发模式：服务已暴露到全局');
    }
});
