/**
 * 通用代码
 * 包含工具函数和UI组件
 */

// ==================== 工具函数 ====================

/**
 * 从URL查询参数中获取指定参数的值
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值或null
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 显示Toast消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
 * @param {number} duration - 显示时长（毫秒），默认3000
 */
function showToast(message, type = 'info', duration = 3000) {
    // 创建toast容器（如果不存在）
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }

    // 创建toast元素
    const toast = document.createElement('div');
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }[type] || 'bg-blue-500';

    toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
    toast.textContent = message;

    // 添加到容器
    toastContainer.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 验证表单字段
 * @param {Object} data - 表单数据
 * @param {Object} rules - 验证规则
 * @returns {Object} 验证结果 {isValid: boolean, errors: Object}
 */
function validateForm(data, rules) {
    const errors = {};
    let isValid = true;

    for (const field in rules) {
        const value = data[field];
        const rule = rules[field];

        // 必填验证
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors[field] = rule.message || `${field}是必填项`;
            isValid = false;
            continue;
        }

        // 数字验证
        if (rule.type === 'number' && value !== undefined && value !== '') {
            const num = Number(value);
            if (isNaN(num)) {
                errors[field] = `${field}必须是数字`;
                isValid = false;
                continue;
            }

            if (rule.min !== undefined && num < rule.min) {
                errors[field] = `${field}不能小于${rule.min}`;
                isValid = false;
                continue;
            }

            if (rule.max !== undefined && num > rule.max) {
                errors[field] = `${field}不能大于${rule.max}`;
                isValid = false;
                continue;
            }
        }

        // 字符串长度验证
        if (rule.type === 'string' && value) {
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = `${field}长度不能少于${rule.minLength}个字符`;
                isValid = false;
                continue;
            }

            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${field}长度不能超过${rule.maxLength}个字符`;
                isValid = false;
                continue;
            }
        }
    }

    return { isValid, errors };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }

    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }

    return obj;
}

// ==================== UI组件 ====================

/**
 * 顶部导航栏组件
 */
class HeaderNav {
    constructor() {
        this.element = document.getElementById('header-nav');
        this.backBtn = document.getElementById('back-btn');
        this.init();
    }

    /**
     * 初始化导航栏事件
     */
    init() {
        this.backBtn.addEventListener('click', () => {
            // 返回上一页或关闭页面
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        });
    }
}

/**
 * 工单选择器组件
 */
class WorkOrderSelector {
    constructor(onSelect) {
        this.element = document.getElementById('work-order-selector');
        this.selectedText = document.getElementById('selected-work-order-text');
        this.dropdownArrow = document.getElementById('dropdown-arrow');
        this.scanBtn = document.getElementById('scan-btn');
        this.onSelect = onSelect;
        this.selectedWorkOrder = null;
        this.init();
    }

    /**
     * 初始化选择器事件
     */
    init() {
        // 点击选择器展开下拉菜单
        this.element.addEventListener('click', (e) => {
            // 如果点击的是扫码按钮，不展开下拉菜单
            if (e.target.closest('#scan-btn')) {
                return;
            }
            this.onSelect();
        });

        // 扫码按钮事件
        this.scanBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleScan();
        });
    }

    /**
     * 处理扫码功能
     */
    handleScan() {
        showToast('扫码功能开发中...', 'info');
        // TODO: 实现扫码功能
    }

    /**
     * 更新选中的工单显示
     * @param {Object} workOrder - 工单对象
     */
    updateSelected(workOrder) {
        this.selectedWorkOrder = workOrder;
        if (workOrder) {
            this.selectedText.textContent = workOrder.id;
            this.selectedText.className = 'text-gray-800 ml-2 font-medium';
        } else {
            this.selectedText.textContent = '请选择';
            this.selectedText.className = 'text-gray-500 ml-2';
        }
    }

    /**
     * 切换下拉箭头状态
     * @param {boolean} expanded - 是否展开
     */
    toggleArrow(expanded) {
        if (expanded) {
            this.dropdownArrow.classList.add('rotate');
        } else {
            this.dropdownArrow.classList.remove('rotate');
        }
    }
}

/**
 * 工单下拉菜单组件
 */
class WorkOrderDropdown {
    constructor(onConfirm, onClose) {
        this.element = document.getElementById('work-order-dropdown');
        this.closeBtn = document.getElementById('close-dropdown');
        this.searchInput = document.getElementById('search-input');
        this.workOrderList = document.getElementById('work-order-list');
        this.selectAllCheckbox = document.getElementById('select-all');
        this.selectedCount = document.getElementById('selected-count');
        this.confirmBtn = document.getElementById('confirm-selection');
        
        this.onConfirm = onConfirm;
        this.onClose = onClose;
        this.workOrders = [];
        this.filteredWorkOrders = [];
        this.selectedWorkOrders = new Set();
        
        this.init();
    }

    /**
     * 初始化下拉菜单事件
     */
    init() {
        // 关闭按钮事件
        this.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // 点击背景关闭
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        // 搜索功能
        this.searchInput.addEventListener('input', debounce((e) => {
            this.filterWorkOrders(e.target.value);
        }, 300));

        // 全选功能
        this.selectAllCheckbox.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // 确定按钮事件
        this.confirmBtn.addEventListener('click', () => {
            this.confirmSelection();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    /**
     * 显示下拉菜单
     */
    show() {
        this.element.classList.remove('hidden');
        this.element.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 聚焦搜索框
        setTimeout(() => {
            this.searchInput.focus();
        }, 300);
    }

    /**
     * 隐藏下拉菜单
     */
    hide() {
        this.element.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            this.element.classList.add('hidden');
        }, 300);
        
        this.onClose();
    }

    /**
     * 检查是否可见
     * @returns {boolean}
     */
    isVisible() {
        return !this.element.classList.contains('hidden');
    }

    /**
     * 设置工单数据
     * @param {Array} workOrders - 工单数组
     */
    setWorkOrders(workOrders) {
        this.workOrders = workOrders;
        this.filteredWorkOrders = [...workOrders];
        this.renderWorkOrderList();
    }

    /**
     * 过滤工单
     * @param {string} searchTerm - 搜索关键词
     */
    filterWorkOrders(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredWorkOrders = [...this.workOrders];
        } else {
            this.filteredWorkOrders = this.workOrders.filter(wo => 
                wo.id.toLowerCase().includes(term) ||
                (wo.name && wo.name.toLowerCase().includes(term))
            );
        }
        this.renderWorkOrderList();
    }

    /**
     * 渲染工单列表
     */
    renderWorkOrderList() {
        this.workOrderList.innerHTML = '';
        
        if (this.filteredWorkOrders.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'text-center py-8 text-gray-500';
            emptyDiv.textContent = '没有找到匹配的工单';
            this.workOrderList.appendChild(emptyDiv);
            return;
        }

        this.filteredWorkOrders.forEach(workOrder => {
            const item = this.createWorkOrderItem(workOrder);
            this.workOrderList.appendChild(item);
        });

        this.updateSelectAllState();
    }

    /**
     * 创建工单列表项
     * @param {Object} workOrder - 工单对象
     * @returns {HTMLElement}
     */
    createWorkOrderItem(workOrder) {
        const item = document.createElement('div');
        item.className = 'work-order-item flex items-center space-x-3';
        item.dataset.workOrderId = workOrder.id;

        const isSelected = this.selectedWorkOrders.has(workOrder.id);
        if (isSelected) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <input type="radio" name="work-order" value="${workOrder.id}" 
                   class="checkbox-primary focus:ring-2" ${isSelected ? 'checked' : ''}>
            <span class="flex-1 text-gray-800">${workOrder.id}</span>
        `;

        // 点击事件
        item.addEventListener('click', () => {
            this.selectWorkOrder(workOrder.id);
        });

        return item;
    }

    /**
     * 选择工单
     * @param {string} workOrderId - 工单ID
     */
    selectWorkOrder(workOrderId) {
        // 单选模式：清除之前的选择
        this.selectedWorkOrders.clear();
        this.selectedWorkOrders.add(workOrderId);
        
        // 更新UI
        this.workOrderList.querySelectorAll('.work-order-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            const isSelected = item.dataset.workOrderId === workOrderId;
            
            item.classList.toggle('selected', isSelected);
            radio.checked = isSelected;
        });

        this.updateSelectedCount();
        this.updateConfirmButton();
    }

    /**
     * 切换全选状态
     * @param {boolean} selectAll - 是否全选
     */
    toggleSelectAll(selectAll) {
        if (selectAll) {
            this.filteredWorkOrders.forEach(wo => {
                this.selectedWorkOrders.add(wo.id);
            });
        } else {
            this.selectedWorkOrders.clear();
        }

        this.renderWorkOrderList();
        this.updateSelectedCount();
        this.updateConfirmButton();
    }

    /**
     * 更新全选状态
     */
    updateSelectAllState() {
        const visibleCount = this.filteredWorkOrders.length;
        const selectedVisibleCount = this.filteredWorkOrders.filter(wo => 
            this.selectedWorkOrders.has(wo.id)
        ).length;

        this.selectAllCheckbox.checked = visibleCount > 0 && selectedVisibleCount === visibleCount;
        this.selectAllCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleCount;
    }

    /**
     * 更新选中数量显示
     */
    updateSelectedCount() {
        this.selectedCount.textContent = `已选择${this.selectedWorkOrders.size}个`;
    }

    /**
     * 更新确定按钮状态
     */
    updateConfirmButton() {
        this.confirmBtn.disabled = this.selectedWorkOrders.size === 0;
    }

    /**
     * 确认选择
     */
    confirmSelection() {
        if (this.selectedWorkOrders.size === 0) {
            showToast('请选择工单', 'warning');
            return;
        }

        const selectedIds = Array.from(this.selectedWorkOrders);
        const selectedWorkOrder = this.workOrders.find(wo => wo.id === selectedIds[0]);
        
        this.onConfirm(selectedWorkOrder);
        this.hide();
    }

    /**
     * 重置选择状态
     */
    reset() {
        this.selectedWorkOrders.clear();
        this.searchInput.value = '';
        this.filteredWorkOrders = [...this.workOrders];
        this.renderWorkOrderList();
        this.updateSelectedCount();
        this.updateConfirmButton();
    }
}

/**
 * 物料信息组件
 */
class MaterialInfo {
    constructor() {
        this.element = document.getElementById('material-info');
        this.workOrderId = document.getElementById('selected-work-order-id');
        this.materialName = document.getElementById('material-name');
        this.materialCode = document.getElementById('material-code');
        this.qualifiedCount = document.getElementById('qualified-count');
        this.defectiveCount = document.getElementById('defective-count');
        this.pendingCount = document.getElementById('pending-count');
    }

    /**
     * 显示物料信息
     * @param {Object} data - 物料数据
     */
    show(data) {
        this.workOrderId.textContent = data.workOrderId;
        this.materialName.textContent = data.materialName;
        this.materialCode.textContent = data.materialCode;
        this.qualifiedCount.textContent = data.qualifiedCount || 0;
        this.defectiveCount.textContent = data.defectiveCount || 0;
        this.pendingCount.textContent = data.pendingCount || 0;
        
        this.element.classList.remove('hidden');
    }

    /**
     * 隐藏物料信息
     */
    hide() {
        this.element.classList.add('hidden');
    }
}

/**
 * 报工表单组件
 */
class ReportForm {
    constructor() {
        this.element = document.getElementById('report-form');
        this.quantityInput = document.getElementById('quantity');
        this.auxiliaryQuantityInput = document.getElementById('auxiliary-quantity');
        this.remarkInput = document.getElementById('remark');
        this.workingHoursInput = document.getElementById('working-hours');
        this.reportStartTimeInput = document.getElementById('report-start-time');
        this.reportEndTimeInput = document.getElementById('report-end-time');
        this.auxName = document.getElementById('auxName');
        
        this.init();
    }

    /**
     * 初始化表单事件
     */
    init() {
        // 数字输入验证
        [this.quantityInput, this.auxiliaryQuantityInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    this.validateNumberInput(e.target);
                });
            }
        });

        // 表单字段变化时的验证
        this.getAllInputs().forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            }
        });
    }

    /**
     * 验证数字输入
     * @param {HTMLInputElement} input - 输入元素
     */
    validateNumberInput(input) {
        if (!input) return;
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.classList.add('border-red-500');
            this.showFieldError(input, '请输入有效的数字');
        } else {
            input.classList.remove('border-red-500');
            this.hideFieldError(input);
        }
    }

    /**
     * 验证单个字段
     * @param {HTMLInputElement} input - 输入元素
     */
    validateField(input) {
        if (!input) return false;
        const value = input.value.trim();
        const isRequired = input.previousElementSibling?.querySelector('.text-red-500');
        
        if (isRequired && !value) {
            input.classList.add('border-red-500');
            this.showFieldError(input, '此字段为必填项');
            return false;
        } else {
            input.classList.remove('border-red-500');
            this.hideFieldError(input);
            return true;
        }
    }

    /**
     * 显示字段错误
     * @param {HTMLInputElement} input - 输入元素
     * @param {string} message - 错误消息
     */
    showFieldError(input, message) {
        let errorElement = input.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            // errorElement.className = 'field-error text-red-500 text-sm mt-1';
            errorElement.className = 'field-error text-red-500 text-sm mt-1 w-full';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    /**
     * 隐藏字段错误
     * @param {HTMLInputElement} input - 输入元素
     */
    hideFieldError(input) {
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * 获取所有输入元素
     * @returns {HTMLInputElement[]}
     */
    getAllInputs() {
        return [
            this.quantityInput,
            this.auxiliaryQuantityInput,
            this.remarkInput,
            this.workingHoursInput,
            this.reportStartTimeInput,
            this.reportEndTimeInput,
        ].filter(input => input !== null && input !== undefined);
    }

    /**
     * 获取表单数据
     * @returns {Object}
     */
    getData() {
        return {
            quantity: parseFloat(this.quantityInput?.value) || 0,
            auxiliaryQuantity: parseFloat(this.auxiliaryQuantityInput?.value) || 0,
            remark: this.remarkInput?.value?.trim() || '',
            workingHours: parseFloat(this.workingHoursInput?.value) || 0,
            reportStartTime: this.reportStartTimeInput?.value?.trim() || '',
            reportEndTimeInput: this.reportEndTimeInput?.value?.trim() || '',
        };
    }

    /**
     * 设置表单数据
     * @param {Object} data - 表单数据
     */
    setData(data) {
        if (this.quantityInput) {
            this.quantityInput.value = data.quantity || '';
        }
        if (this.auxiliaryQuantityInput) {
            this.auxiliaryQuantityInput.value = data.auxiliaryQuantity || '';
        }
    }

    setAuxName(data) {
        if (this.auxName) {
            this.auxName.innerText = data.auxName || '公斤';
        }
    }

    /**
     * 验证整个表单
     * @returns {Object} 验证结果
     */
    validate() {
        const data = this.getData();
        const rules = {
            quantity: { required: true, type: 'number', min: 0 },
            auxiliaryQuantity: { required: true, type: 'number', min: 0 }
        };

        return validateForm(data, rules);
    }

    /**
     * 显示表单
     */
    show() {
        this.element.classList.remove('hidden');
    }

    /**
     * 隐藏表单
     */
    hide() {
        this.element.classList.add('hidden');
    }

    /**
     * 重置表单
     */
    reset() {
        this.getAllInputs().forEach(input => {
            input.value = '';
            input.classList.remove('border-red-500');
            this.hideFieldError(input);
        });
    }
}


const GlobalLoading = {
    element: null,
    
    init() {
        if (this.element) return;
        
        this.element = document.createElement('div');
        this.element.id = 'global-loading';
        this.element.innerHTML = `
            <div class="loading-backdrop"></div>
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">加载中...</div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #global-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                display: none;
            }
            .loading-backdrop {
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
            }
            .loading-spinner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            .loading-text {
                color: white;
                font-size: 14px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            body.loading-active {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.element);
    },
    
    show(text = '加载中...') {
        this.init();
        const textElement = this.element.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = text;
        }
        this.element.style.display = 'block';
        document.body.classList.add('loading-active');
    },
    
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            document.body.classList.remove('loading-active');
        }
    }
};